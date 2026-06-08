import { cache } from 'react'
import { cookies } from 'next/headers'

import { sdk } from './medusa'
import type { MembershipTierId } from './memberships'

export interface CustomerMembership {
  tier: MembershipTierId
  status: 'incomplete' | 'active' | 'past_due' | 'canceled'
  current_period_end: string | null
  cancel_at_period_end: boolean
  credits_balance: number
  credits_renews_at: string | null
}

/**
 * Membership del cliente logueado (server-side, cookie reenviada como en
 * getCurrentCustomer). Devuelve null si no hay sesión o no tiene suscripción.
 */
export const getMembership = cache(async (): Promise<CustomerMembership | null> => {
  try {
    const c = await cookies()
    const cookieHeader = c.toString()
    const { membership } = await sdk.client.fetch<{ membership: CustomerMembership | null }>(
      '/store/customers/me/membership',
      { headers: { Cookie: cookieHeader, cookie: cookieHeader } as Record<string, string> },
    )
    return membership ?? null
  } catch {
    return null
  }
})

export function isActiveMembership(m: CustomerMembership | null): boolean {
  return Boolean(m && (m.status === 'active' || m.status === 'past_due'))
}
