import Stripe from 'stripe'

/**
 * Cliente Stripe del backend (clave secreta). Se usa para suscripciones
 * (Checkout Session mode:subscription, Billing Portal, webhooks). El módulo
 * de pagos de Medusa usa su propia instancia para los PaymentIntents de
 * pedidos; esta es independiente y específica del RT Bunker Club.
 */
let client: Stripe | null = null

export function getStripe(): Stripe {
  if (client) return client
  const apiKey = process.env.STRIPE_API_KEY
  if (!apiKey) {
    throw new Error('STRIPE_API_KEY no está configurada')
  }
  client = new Stripe(apiKey)
  return client
}
