import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type Stripe from 'stripe'

import { getStripe } from '../../../lib/stripe'
import { MEMBERSHIPS_MODULE } from '../../../modules/memberships'
import { getBackendTier, isTierId } from '../../../modules/memberships/tiers'

type Status = 'incomplete' | 'active' | 'past_due' | 'canceled'

function mapStatus(stripeStatus: string): Status {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'incomplete'
  }
}

/**
 * POST /webhooks/stripe-subscriptions
 *
 * Sincroniza el ciclo de vida de las suscripciones del RT Bunker Club. Usa el
 * raw body (`bodyParser.preserveRawBody` en middlewares) para verificar la
 * firma de Stripe. En dev, configura `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET` con
 * el secret de `stripe listen`.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const stripe = getStripe()
  const secret =
    process.env.STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers['stripe-signature']

  if (!secret || !sig) {
    return res.status(400).json({ error: 'Webhook no configurado' })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent((req as any).rawBody, sig, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'firma inválida'
    return res.status(400).json({ error: `Webhook signature: ${msg}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          await upsertFromSubscription(req, sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertFromSubscription(req, sub)
        break
      }
      case 'invoice.paid': {
        // Renovación: recarga de créditos al importe del plan.
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as any).subscription as string | null
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertFromSubscription(req, sub, { refillCredits: true })
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[stripe-subscriptions] error procesando', event.type, err)
    // 200 para que Stripe no reintente en bucle ante un error de datos.
    return res.json({ received: true, handled: false })
  }

  return res.json({ received: true })
}

async function upsertFromSubscription(
  req: MedusaRequest,
  sub: Stripe.Subscription,
  opts: { refillCredits?: boolean } = {},
) {
  const customerId = (sub.metadata?.customer_id as string) || ''
  const tierId = (sub.metadata?.tier as string) || ''
  if (!customerId || !isTierId(tierId)) return

  const tier = getBackendTier(tierId)!
  const status = mapStatus(sub.status)
  const periodEnd = (sub as any).current_period_end
    ? new Date((sub as any).current_period_end * 1000)
    : null

  const service: any = req.scope.resolve(MEMBERSHIPS_MODULE)
  const existing = await service.listMemberships({ stripe_subscription_id: sub.id }, { take: 1 })
  const prev = existing?.[0]

  const base = {
    customer_id: customerId,
    tier: tierId,
    status,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
  }

  if (prev) {
    const creditsPatch =
      opts.refillCredits && status === 'active'
        ? { credits_balance: tier.credits, credits_renews_at: periodEnd }
        : {}
    await service.updateMemberships({ id: prev.id, ...base, ...creditsPatch })
  } else {
    await service.createMemberships({
      ...base,
      credits_balance: status === 'active' ? tier.credits : 0,
      credits_renews_at: status === 'active' ? periodEnd : null,
    })
  }

  // Tier "vigente" para beneficios: activo o con pago pendiente (gracia).
  const activeTier = status === 'active' || status === 'past_due' ? tierId : null

  // Espejo en customer.metadata para lecturas rápidas desde el storefront.
  await syncCustomerMetadata(req, customerId, activeTier, status)
  // Pertenencia al customer group del tier → activa la promoción automática.
  await syncCustomerGroup(req, customerId, activeTier)
}

async function syncCustomerGroup(
  req: MedusaRequest,
  customerId: string,
  activeTier: string | null,
) {
  const customerService: any = req.scope.resolve(Modules.CUSTOMER)
  const groups = await customerService.listCustomerGroups({}, { take: 1000 })
  const clubGroups = (groups as any[]).filter((g) => (g.metadata as any)?.membership_tier)

  for (const group of clubGroups) {
    const tierOfGroup = (group.metadata as any).membership_tier
    const pair = { customer_id: customerId, customer_group_id: group.id }
    try {
      if (tierOfGroup === activeTier) {
        await customerService.addCustomerToGroup(pair)
      } else {
        await customerService.removeCustomerFromGroup(pair)
      }
    } catch {
      // Idempotente: añadir si ya está / quitar si no está puede lanzar.
    }
  }
}

async function syncCustomerMetadata(
  req: MedusaRequest,
  customerId: string,
  tier: string | null,
  status: Status,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: 'customer',
    fields: ['id', 'metadata'],
    filters: { id: customerId },
  })
  const current = (customers[0]?.metadata ?? {}) as Record<string, unknown>
  const customerService: any = req.scope.resolve(Modules.CUSTOMER)
  await customerService.updateCustomers(customerId, {
    metadata: {
      ...current,
      membership_tier: tier,
      membership_status: tier ? status : null,
    },
  })
}
