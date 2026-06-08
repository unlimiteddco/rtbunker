import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import { CUSTOM_ORDERS_MODULE } from '../../../../../../../modules/custom-orders'
import { respondToCustomOrderProofWorkflow } from '../../../../../../../workflows/respond-to-custom-order-proof'

/**
 * POST /store/customers/me/custom-orders/:id/response
 * Body: { decision: 'approved'|'changes_requested', notes? }
 *
 * Variante autenticada del endpoint /store/custom-orders/by-token/:token/response.
 * Pensado para el panel de cliente logueado: en vez de magic_token, valida
 * ownership por email del customer.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context.actor_id

  // 1. Resolvemos email del customer logueado
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: 'customer',
    fields: ['id', 'email'],
    filters: { id: customerId },
  })
  const customer = customers[0]
  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Cliente no encontrado.')
  }

  // 2. Verificamos ownership: el CustomOrder debe pertenecer a este email
  const service: any = req.scope.resolve(CUSTOM_ORDERS_MODULE)
  const order = await service.retrieveCustomOrder(id).catch(() => null)
  if (!order || order.customer_email !== customer.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Pedido no encontrado.')
  }

  // 3. Validamos el body manualmente (sin middleware Zod, mínimo)
  const body = (req as any).body as { decision?: string; notes?: string | null } | undefined
  const decision = body?.decision
  if (decision !== 'approved' && decision !== 'changes_requested') {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Decisión inválida.')
  }

  // 4. Ejecutamos el workflow con custom_order_id
  const { result } = await respondToCustomOrderProofWorkflow(req.scope).run({
    input: {
      custom_order_id: id!,
      decision,
      notes: body?.notes ?? null,
    },
  })

  return res.status(201).json({
    status: result.custom_order.status,
    decision: result.decision,
    proof: {
      version: result.proof.version,
      customer_response: result.proof.customer_response,
      customer_response_at: result.proof.customer_response_at,
      customer_response_notes: result.proof.customer_response_notes,
    },
  })
}
