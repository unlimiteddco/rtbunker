import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * GET /admin/memberships
 *
 * Lista las suscripciones del RT Bunker Club, enriquecidas con el email/nombre
 * del cliente (membership.customer_id es texto, no hay module-link, así que se
 * resuelve en una 2ª query).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(200, parseInt((req.query.limit as string) ?? '50', 10) || 50)
  const offset = parseInt((req.query.offset as string) ?? '0', 10) || 0
  const status = req.query.status as string | undefined

  const { data: memberships, metadata } = await query.graph({
    entity: 'membership',
    fields: [
      'id',
      'customer_id',
      'tier',
      'status',
      'current_period_end',
      'cancel_at_period_end',
      'credits_balance',
      'credits_renews_at',
      'created_at',
    ],
    ...(status ? { filters: { status } } : {}),
    pagination: { skip: offset, take: limit, order: { created_at: 'DESC' } },
  } as any)

  const ids = [...new Set((memberships as any[]).map((m) => m.customer_id).filter(Boolean))]
  const byId: Record<string, { email?: string; first_name?: string; last_name?: string }> = {}
  if (ids.length > 0) {
    const { data: customers } = await query.graph({
      entity: 'customer',
      fields: ['id', 'email', 'first_name', 'last_name'],
      filters: { id: ids },
    })
    for (const c of customers as any[]) byId[c.id] = c
  }

  const enriched = (memberships as any[]).map((m) => {
    const c = byId[m.customer_id]
    const name = c ? [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || null : null
    return { ...m, customer_email: c?.email ?? null, customer_name: name }
  })

  return res.json({
    memberships: enriched,
    count: metadata?.count ?? enriched.length,
    limit,
    offset,
  })
}
