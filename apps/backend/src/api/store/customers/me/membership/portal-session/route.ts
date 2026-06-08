import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { getStripe } from '../../../../../../lib/stripe'
import { MEMBERSHIPS_MODULE } from '../../../../../../modules/memberships'

/**
 * POST /store/customers/me/membership/portal-session
 *
 * Crea un Stripe Billing Portal Session para que el socio gestione o cancele
 * su suscripción, y devuelve la URL.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: 'No autenticado' })
  }
  const service: any = req.scope.resolve(MEMBERSHIPS_MODULE)

  const rows = await service.listMemberships(
    { customer_id: customerId },
    { take: 1, order: { created_at: 'DESC' } },
  )
  const stripeCustomerId = rows?.[0]?.stripe_customer_id
  if (!stripeCustomerId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'No tienes una suscripción activa')
  }

  const storeUrl = process.env.STOREFRONT_URL ?? 'http://localhost:8000'
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${storeUrl}/es/cuenta/suscripcion`,
  })

  return res.json({ url: session.url })
}
