import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import { getStripe } from '../../../../../../lib/stripe'
import { MEMBERSHIPS_MODULE } from '../../../../../../modules/memberships'
import { getBackendTier } from '../../../../../../modules/memberships/tiers'

/**
 * POST /store/customers/me/membership/checkout-session
 *
 * Crea un Stripe Checkout Session en modo suscripción para el plan indicado
 * y devuelve la URL a la que redirigir al cliente. El precio se genera inline
 * (mensual, EUR) — no requiere productos/precios pre-creados en Stripe.
 *
 * El alta real de la `membership` la hace el webhook al recibir
 * `checkout.session.completed` / `customer.subscription.created`.
 */
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

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: 'customer',
    fields: ['id', 'email', 'first_name', 'last_name'],
    filters: { id: customerId },
  })
  const customer = customers[0]
  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Cliente no encontrado')
  }

  const service: any = req.scope.resolve(MEMBERSHIPS_MODULE)
  const stripe = getStripe()

  // Reutiliza el Stripe customer si ya existe una membership previa.
  const existing = await service.listMemberships(
    { customer_id: customerId },
    { take: 1, order: { created_at: 'DESC' } },
  )
  let stripeCustomerId: string | undefined = existing?.[0]?.stripe_customer_id ?? undefined

  // Bloquea si ya hay una suscripción activa.
  const active = (existing as any[])?.find(
    (m) => m.status === 'active' || m.status === 'past_due',
  )
  if (active) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'Ya tienes una suscripción activa. Gestiónala desde tu cuenta.',
    )
  }

  if (!stripeCustomerId) {
    const sc = await stripe.customers.create({
      email: customer.email,
      name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || undefined,
      metadata: { customer_id: customerId },
    })
    stripeCustomerId = sc.id
  }

  const storeUrl = process.env.STOREFRONT_URL ?? 'http://localhost:8000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          product_data: { name: tier.name },
          unit_amount: tier.amount,
          recurring: { interval: 'month' },
        },
      },
    ],
    success_url: `${storeUrl}/es/cuenta/suscripcion?status=success`,
    cancel_url: `${storeUrl}/es/planes?status=cancel`,
    metadata: { customer_id: customerId, tier: tier.id },
    subscription_data: { metadata: { customer_id: customerId, tier: tier.id } },
  })

  return res.json({ url: session.url })
}
