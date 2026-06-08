/**
 * Config de planes RT Bunker Club (backend). Debe coincidir con
 * `apps/storefront/src/lib/memberships.ts`.
 *
 * Los precios se cobran vía Stripe Checkout (mode: subscription) con
 * `price_data` inline mensual — no hace falta crear productos/precios en
 * Stripe a mano. El `lookup` se usa como `metadata.tier` en la suscripción.
 */
export type MembershipTierId = 'bronce' | 'plata' | 'gold'

export interface BackendTier {
  id: MembershipTierId
  name: string
  /** Importe mensual en céntimos (EUR). */
  amount: number
  /** Créditos mensuales para pegatinas personalizadas. */
  credits: number
  /** Descuento de socio en todos los pedidos (%). */
  discountPct: number
}

export const TIERS: Record<MembershipTierId, BackendTier> = {
  bronce: { id: 'bronce', name: 'RT Bunker Club · Bronce', amount: 1000, credits: 0, discountPct: 5 },
  plata: { id: 'plata', name: 'RT Bunker Club · Plata', amount: 4500, credits: 50, discountPct: 10 },
  gold: { id: 'gold', name: 'RT Bunker Club · Gold', amount: 6500, credits: 100, discountPct: 10 },
}

export function isTierId(value: unknown): value is MembershipTierId {
  return value === 'bronce' || value === 'plata' || value === 'gold'
}

export function getBackendTier(id: string): BackendTier | undefined {
  return isTierId(id) ? TIERS[id] : undefined
}
