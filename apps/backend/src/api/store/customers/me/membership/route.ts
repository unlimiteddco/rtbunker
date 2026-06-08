import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { MEMBERSHIPS_MODULE } from '../../../../../modules/memberships'

/**
 * GET /store/customers/me/membership
 *
 * Devuelve la membership actual del cliente logueado (la más reciente). No
 * expone IDs de Stripe. Si no tiene ninguna, `membership: null`.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: 'No autenticado' })
  }
  const service: any = req.scope.resolve(MEMBERSHIPS_MODULE)

  const rows = await service.listMemberships(
    { customer_id: customerId },
    { take: 1, order: { created_at: 'DESC' } },
  )
  const m = rows?.[0]
  if (!m) {
    return res.json({ membership: null })
  }

  return res.json({
    membership: {
      tier: m.tier,
      status: m.status,
      current_period_end: m.current_period_end,
      cancel_at_period_end: m.cancel_at_period_end,
      credits_balance: m.credits_balance,
      credits_renews_at: m.credits_renews_at,
    },
  })
}
