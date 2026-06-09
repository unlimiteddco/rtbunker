import type { ReactPayPalScriptOptions } from '@paypal/react-paypal-js'

import { env } from '@/../env'

/**
 * Opciones del `<PayPalScriptProvider>`. El SDK de PayPal se carga con el
 * `clientId` público, en EUR, con intent `capture` y la UI en español.
 *
 * Devuelve `null` si no hay `NEXT_PUBLIC_PAYPAL_CLIENT_ID` configurado, lo que
 * permite al checkout caer de forma limpia a "solo Stripe".
 */
export function getPaypalOptions(): ReactPayPalScriptOptions | null {
  const clientId = env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  if (!clientId) {
    return null
  }

  return {
    clientId,
    currency: 'EUR',
    intent: 'capture',
    locale: 'es_ES',
    components: 'buttons',
  }
}

/** `true` si PayPal está configurado en el storefront. */
export function isPaypalEnabled(): boolean {
  return Boolean(env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
}
