import { model } from '@medusajs/framework/utils'

/**
 * Suscripción de socio (RT Bunker Club). Una fila por suscripción de Stripe.
 *
 * El ciclo de vida lo dirige Stripe vía webhooks:
 *   checkout.session.completed → crea/activa
 *   customer.subscription.updated → sincroniza status / periodo / cancelación
 *   customer.subscription.deleted → canceled
 *   invoice.paid → recarga de créditos mensual (Fase 2)
 *
 * `customer.metadata.membership_tier` se mantiene en paralelo para lecturas
 * rápidas desde el storefront sin cruzar módulos.
 */
const Membership = model
  .define('membership', {
    id: model.id().primaryKey(),
    customer_id: model.text(),
    tier: model.enum(['bronce', 'plata', 'gold']),
    status: model
      .enum(['incomplete', 'active', 'past_due', 'canceled'])
      .default('incomplete'),
    stripe_customer_id: model.text().nullable(),
    stripe_subscription_id: model.text().nullable(),
    current_period_end: model.dateTime().nullable(),
    cancel_at_period_end: model.boolean().default(false),
    /** Saldo de créditos para pegatinas personalizadas (Fase 2). */
    credits_balance: model.number().default(0),
    credits_renews_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ['customer_id'], where: 'deleted_at IS NULL' },
    {
      on: ['stripe_subscription_id'],
      unique: true,
      where: 'stripe_subscription_id IS NOT NULL AND deleted_at IS NULL',
    },
  ])

export default Membership
