import { cache } from 'react'
import { cookies, headers } from 'next/headers'

import { sdk } from './medusa'

/**
 * Resolución de customer en server side. Medusa SDK con `auth.type: 'session'`
 * usa una cookie `connect.sid`/`_medusa_jwt` que solo existe tras login.
 *
 * Reusa el header `cookie` y reenvíalo a la llamada para que el SDK pueda
 * autenticar. Usamos `cache` para que solo se haga una vez por request.
 */
export const getCurrentCustomer = cache(async () => {
  try {
    const c = await cookies()
    const cookieHeader = c.toString()
    const { customer } = await sdk.store.customer.retrieve(
      { fields: 'id,email,first_name,last_name,addresses.*' },
      { Cookie: cookieHeader, cookie: cookieHeader } as Record<string, string>,
    )
    return customer
  } catch {
    return null
  }
})
