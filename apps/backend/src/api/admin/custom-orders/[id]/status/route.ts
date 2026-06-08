import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { updateCustomOrderStatusWorkflow } from '../../../../../workflows/update-custom-order-status'
import type { UpdateStatusSchema } from '../../middlewares'

/**
 * POST /admin/custom-orders/:id/status
 * Cambia el estado del pedido. Acepta también admin_notes opcionales.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateStatusSchema>,
  res: MedusaResponse,
) {
  const { id } = req.params

  const { result } = await updateCustomOrderStatusWorkflow(req.scope).run({
    input: { custom_order_id: id!, ...req.validatedBody },
  })

  return res.json({ custom_order: result.custom_order })
}
