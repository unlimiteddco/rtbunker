import { loadStripe, type Stripe } from '@stripe/stripe-js'

import { env } from '@/../env'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_KEY)
  }
  return stripePromise
}
