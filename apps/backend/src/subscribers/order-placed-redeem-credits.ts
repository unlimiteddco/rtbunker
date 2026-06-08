import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { MEMBERSHIPS_MODULE } from '../modules/memberships'

/**
 * Al confirmarse un pedido, descuenta del saldo del socio los créditos
 * canjeados en sus line items (los añadidos con `metadata.paid_with_credits`).
 * Corre en paralelo al subscriber que crea los CustomOrders.
 *
 * La deducción se hace aquí (tras el pago) y no al añadir al carrito, para no
 * "gastar" créditos en carritos abandonados. Se acota a 0 por seguridad.
 */
export default async function orderPlacedRedeemCreditsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: 'order',
    fields: ['id', 'customer_id', 'items.metadata'],
    filters: { id: data.id },
  })
  const order = orders[0]
  if (!order?.customer_id) return

  const items = (order.items ?? []) as Array<{ metadata?: Record<string, unknown> | null }>
  let totalCredits = 0
  for (const it of items) {
    const md = it.metadata ?? {}
    if (md.paid_with_credits === true) {
      totalCredits += Number(md.credits_used ?? 0) || 0
    }
  }
  if (totalCredits <= 0) return

  const memberships: any = container.resolve(MEMBERSHIPS_MODULE)
  const [m] = await memberships.listMemberships(
    { customer_id: order.customer_id },
    { take: 1, order: { created_at: 'DESC' } },
  )
  if (!m) return

  const newBalance = Math.max(0, (m.credits_balance ?? 0) - totalCredits)
  await memberships.updateMemberships({ id: m.id, credits_balance: newBalance })
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
