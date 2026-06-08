import Medusa from '@medusajs/js-sdk'

import { env } from '@/../env'

/**
 * Cliente Medusa SDK. Se reutiliza una única instancia por proceso.
 * En el cliente la URL es la pública, en server side se prefiere la interna
 * (útil cuando backend y storefront viven en la misma red Docker).
 */
export const sdk = new Medusa({
  baseUrl:
    typeof window === 'undefined'
      ? (process.env.MEDUSA_BACKEND_URL ?? env.NEXT_PUBLIC_MEDUSA_BACKEND_URL)
      : env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  publishableKey: env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: { type: 'session' },
})
