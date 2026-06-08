import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import { CUSTOM_ORDERS_MODULE } from '../../../../../../modules/custom-orders'

/**
 * GET /store/customers/me/custom-orders/:id
 *
 * Devuelve el detalle de un CustomOrder validando ownership por email del
 * customer logueado.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context.actor_id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: 'customer',
    fields: ['id', 'email'],
    filters: { id: customerId },
  })
  const customer = customers[0]
  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Pedido no encontrado.')
  }

  const service: any = req.scope.resolve(CUSTOM_ORDERS_MODULE)
  const order = await service.retrieveCustomOrder(id).catch(() => null)

  if (!order || order.customer_email !== customer.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Pedido no encontrado.')
  }

  return res.json({
    custom_order: {
      id: order.id,
      short_id: order.id.slice(-8).toUpperCase(),
      status: order.status,
      shape: order.shape,
      material: order.material,
      size_id: order.size_id,
      width_cm: order.width_cm,
      height_cm: order.height_cm,
      units: order.units,
      unit_price: order.unit_price,
      total_price: order.total_price,
      design_file_url: order.design_file_url,
      design_file_name: order.design_file_name,
      customer_notes: order.customer_notes,
      proofs: order.proofs ?? [],
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      shipping_carrier: order.shipping_carrier,
      order_id: order.order_id,
      created_at: order.created_at,
      updated_at: order.updated_at,
      // OJO: NO devolvemos magic_token ni admin_notes.
    },
  })
}
