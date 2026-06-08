import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { CUSTOM_ORDERS_MODULE } from '../../../../../modules/custom-orders'

/**
 * GET /store/customers/me/custom-orders
 *
 * Lista los pedidos personalizados del customer logueado. Filtra por
 * `customer_email` ya que `order.placed` rellena ese campo en el CustomOrder
 * con el email del Order (que coincide con el customer si está autenticado).
 *
 * Esta ruta está bajo `/store/customers/me/*` → Medusa la protege automáticamente
 * con auth de customer (session o bearer).
 *
 * No expone: magic_token, admin_notes.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id

  // Resolvemos el email del customer para hacer el match.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: 'customer',
    fields: ['id', 'email'],
    filters: { id: customerId },
  })
  const customer = customers[0]
  if (!customer?.email) {
    return res.json({ custom_orders: [] })
  }

  const service: any = req.scope.resolve(CUSTOM_ORDERS_MODULE)
  const orders = await service.listCustomOrders(
    { customer_email: customer.email },
    { order: { created_at: 'DESC' } },
  )

  const safe = (orders as any[]).map((o) => ({
    id: o.id,
    short_id: o.id.slice(-8).toUpperCase(),
    status: o.status,
    shape: o.shape,
    material: o.material,
    size_id: o.size_id,
    width_cm: o.width_cm,
    height_cm: o.height_cm,
    units: o.units,
    unit_price: o.unit_price,
    total_price: o.total_price,
    design_file_url: o.design_file_url,
    design_file_name: o.design_file_name,
    proofs: o.proofs ?? [],
    tracking_number: o.tracking_number,
    tracking_url: o.tracking_url,
    shipping_carrier: o.shipping_carrier,
    order_id: o.order_id,
    created_at: o.created_at,
    updated_at: o.updated_at,
  }))

  return res.json({ custom_orders: safe, count: safe.length })
}
