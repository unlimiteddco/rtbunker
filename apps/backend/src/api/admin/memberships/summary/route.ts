import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { TIERS, type MembershipTierId } from '../../../../modules/memberships/tiers'

/**
 * GET /admin/memberships/summary
 *
 * KPIs agregados del RT Bunker Club para el dashboard. Cuenta las suscripciones
 * activas por tier y calcula el MRR teórico (socios activos × precio del tier).
 *
 * El MRR es estimado: se deriva de los precios de los tiers actuales, no de un
 * histórico real de cobros de Stripe. `TIERS[tier].amount` está en CÉNTIMOS, así
 * que se divide /100 para devolver euros.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: memberships } = await query.graph({
    entity: 'membership',
    fields: ['id', 'tier', 'status'],
    filters: { status: 'active' },
  } as any)

  const byTier: Record<MembershipTierId, number> = { bronce: 0, plata: 0, gold: 0 }
  let activeCount = 0

  for (const m of memberships as { tier?: string }[]) {
    if (m.tier === 'bronce' || m.tier === 'plata' || m.tier === 'gold') {
      byTier[m.tier] += 1
      activeCount += 1
    }
  }

  const mrr =
    (byTier.bronce * TIERS.bronce.amount +
      byTier.plata * TIERS.plata.amount +
      byTier.gold * TIERS.gold.amount) /
    100

  return res.json({
    active_count: activeCount,
    by_tier: byTier,
    mrr,
    arr: mrr * 12,
  })
}
