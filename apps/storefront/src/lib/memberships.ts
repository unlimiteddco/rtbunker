/**
 * Definición de los planes de suscripción RT Bunker (Fase D #16).
 *
 * Esta es la fuente de verdad para la UI (página /planes, /cuenta/suscripcion).
 * Los IDs (`bronce`/`plata`/`gold`) deben coincidir con los del módulo
 * `memberships` del backend y con los customer groups / promociones de Medusa.
 *
 * Precios y créditos según brief del cliente:
 *   - Bronce: 10€/mes (valor 40€) · sin créditos · 5% dto.
 *   - Plata:  45€/mes (valor 107€) · 50 créditos · 10% dto.
 *   - Gold:   65€/mes (valor 133€) · 100 créditos · 10% dto.
 */

export type MembershipTierId = 'bronce' | 'plata' | 'gold'

export interface MembershipBenefit {
  /** Texto del beneficio. */
  label: string
  /** Si es el beneficio "estrella" del plan (se resalta). */
  highlight?: boolean
}

export interface MembershipTier {
  id: MembershipTierId
  name: string
  /** Precio mensual en euros. */
  pricePerMonth: number
  /** "Valor" de marketing (lo que costaría suelto) en euros. */
  value: number
  /** Créditos mensuales para pegatinas personalizadas (0 = sin créditos). */
  credits: number
  /** Descuento de socio en todos los pedidos (%). */
  discountPct: number
  /** Acento de color del plan (token tailwind sin prefijo). */
  accent: 'bronce' | 'plata' | 'gold'
  /** Tagline corto. */
  tagline: string
  /** Lista de beneficios mostrados en la tarjeta. */
  benefits: MembershipBenefit[]
  /** Marca visual de "más popular". */
  popular?: boolean
}

const SHARED_BENEFITS: MembershipBenefit[] = [
  { label: 'Envío urgente GRATIS en todos los pedidos', highlight: true },
  { label: 'Impresión el mismo día del pedido' },
  { label: 'Soporte de texto exclusivo' },
]

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'bronce',
    name: 'Bronce',
    pricePerMonth: 10,
    value: 40,
    credits: 0,
    discountPct: 5,
    accent: 'bronce',
    tagline: 'Empieza a ahorrar en cada pedido.',
    benefits: [
      ...SHARED_BENEFITS,
      { label: '5% de descuento en todos los pedidos', highlight: true },
    ],
  },
  {
    id: 'plata',
    name: 'Plata',
    pricePerMonth: 45,
    value: 107,
    credits: 50,
    discountPct: 10,
    accent: 'plata',
    tagline: 'El equilibrio perfecto para creadores.',
    popular: true,
    benefits: [
      { label: '50 créditos/mes para pegatinas personalizadas', highlight: true },
      { label: 'Válidos para pegatinas de 5, 7 y 9 cm · todo tipo de acabado' },
      ...SHARED_BENEFITS,
      { label: '10% de descuento en todos los pedidos', highlight: true },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    pricePerMonth: 65,
    value: 133,
    credits: 100,
    discountPct: 10,
    accent: 'gold',
    tagline: 'Máxima producción para profesionales.',
    benefits: [
      { label: '100 créditos/mes para pegatinas personalizadas', highlight: true },
      { label: 'Válidos para pegatinas de 5, 7 y 9 cm · todo tipo de acabado' },
      ...SHARED_BENEFITS,
      { label: '10% de descuento en todos los pedidos', highlight: true },
    ],
  },
]

export function getTier(id: string): MembershipTier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.id === id)
}

/** Ahorro % respecto al "valor" de marketing. */
export function tierSavingsPct(tier: MembershipTier): number {
  if (!tier.value || tier.value <= tier.pricePerMonth) return 0
  return Math.round((1 - tier.pricePerMonth / tier.value) * 100)
}
