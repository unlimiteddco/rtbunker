import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { getStripe } from '../../../../../../lib/stripe'
import { MEMBERSHIPS_MODULE } from '../../../../../../modules/memberships'
import { getBackendTier } from '../../../../../../modules/memberships/tiers'

/**
 * POST /store/customers/me/membership/change-tier
 *
 * Cambia el plan del socio (Bronce/Plata/Gold) cobrando solo la diferencia
 * proporcional de lo que queda del mes (prorrateo nativo de Stripe). No
 * redirige a Stripe: actualiza la suscripción in-place vía la API y el webhook
 * `customer.subscription.updated` resincroniza la membership.
 *
 * CLAVE: se reescribe `metadata.tier` en el update porque el webhook
 * (`upsertFromSubscription`) lee `sub.metadata.tier`; si no, resincronizaría el
 * tier viejo.
 */
/**
 * Devuelve el producto Stripe del tier (reutilizando uno existente vía búsqueda
 * por metadata.tier) o lo crea si no hay. Evita acumular productos huérfanos en
 * cada cambio de plan.
 */
async function getOrCreateTierProduct(
  stripe: ReturnType<typeof getStripe>,
  tierId: string,
  tierName: string,
) {
  try {
    const found = await stripe.products.search({
      query: `active:'true' AND metadata['tier']:'${tierId}'`,
      limit: 1,
    })
    if (found.data[0]) return found.data[0]
  } catch {
    // La búsqueda puede no estar disponible/indexada todavía: caemos al create.
  }
  return stripe.products.create({ name: tierName, metadata: { tier: tierId } })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: 'No autenticado' })
  }

  const tierId = (req.body as { tier_id?: string } | undefined)?.tier_id
  const tier = getBackendTier(tierId ?? '')
  if (!tier) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Plan no válido')
  }

  const service: any = req.scope.resolve(MEMBERSHIPS_MODULE)

  // Suscripción vigente del cliente (activa o con pago pendiente) con sub Stripe.
  const memberships = await service.listMemberships(
    { customer_id: customerId },
    { take: 10, order: { created_at: 'DESC' } },
  )
  const membership = (memberships as any[])?.find(
    (m) =>
      (m.status === 'active' || m.status === 'past_due') && m.stripe_subscription_id,
  )
  if (!membership) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'No tienes una suscripción activa que cambiar.',
    )
  }

  if (tier.id === membership.tier) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Ya tienes este plan')
  }

  const stripe = getStripe()
  const subId = membership.stripe_subscription_id as string
  const sub = await stripe.subscriptions.retrieve(subId)
  const itemId = sub.items.data[0]?.id
  if (!itemId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'No se pudo leer la suscripción actual.',
    )
  }

  // `subscriptions.update` exige un `product` (ID) en `price_data` — no admite
  // `product_data` inline como Checkout. Reutilizamos un único producto Stripe
  // por tier (buscándolo por metadata.tier) para no acumular productos huérfanos
  // en cada cambio de plan; si no existe (o el índice de búsqueda aún no lo
  // tiene), lo creamos.
  const product = await getOrCreateTierProduct(stripe, tier.id, tier.name)

  await stripe.subscriptions.update(subId, {
    items: [
      {
        id: itemId,
        price_data: {
          currency: 'eur',
          product: product.id,
          unit_amount: tier.amount,
          recurring: { interval: 'month' },
        },
      },
    ],
    proration_behavior: 'create_prorations',
    // Merge: preserva cualquier otra clave de metadata de la suscripción y
    // sobreescribe el tier (lo lee el webhook para resincronizar).
    metadata: { ...(sub.metadata ?? {}), customer_id: customerId, tier: tier.id },
    payment_behavior: 'pending_if_incomplete',
  })

  // Upgrade de créditos: si el nuevo plan trae más créditos, sube el saldo al
  // nuevo importe ya. En downgrade NO recortamos (lo ajusta la próxima renovación).
  const currentTier = getBackendTier(membership.tier)
  const currentCredits = currentTier?.credits ?? 0
  if (tier.credits > currentCredits) {
    await service.updateMemberships({ id: membership.id, credits_balance: tier.credits })
  }

  return res.json({ ok: true, tier: tier.id })
}
