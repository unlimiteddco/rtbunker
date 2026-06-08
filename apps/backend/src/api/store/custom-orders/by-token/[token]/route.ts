import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { CUSTOM_ORDERS_MODULE } from '../../../../../modules/custom-orders'

/**
 * GET /store/custom-orders/by-token/:token
 *
 * Devuelve la info pública del pedido custom (config + mockups) para la
 * página de aprobación del cliente. Sin login. Sin datos sensibles.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { token } = req.params as { token: string }
  if (!token) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Missing token')
  }

  const service: any = req.scope.resolve(CUSTOM_ORDERS_MODULE)
  const matches = await service.listCustomOrders({ magic_token: token })
  const order = matches?.[0]

  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Pedido no encontrado.')
  }

  const proofs = Array.isArray(order.proofs) ? order.proofs : []

  return res.json({
    custom_order: {
      id: order.id,
      short_id: order.id.slice(-8).toUpperCase(),
      customer_name: order.customer_name,
      status: order.status,
      shape: order.shape,
      material: order.material,
      size_id: order.size_id,
      width_cm: order.width_cm,
      height_cm: order.height_cm,
      units: order.units,
      unit_price: order.unit_price,
      total_price: order.total_price,
      customer_notes: order.customer_notes,
      design_file_url: order.design_file_url,
      design_file_name: order.design_file_name,
      proofs,
      created_at: order.created_at,
    },
  })
}
