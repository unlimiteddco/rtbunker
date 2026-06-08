import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { MEMBERSHIPS_MODULE } from '../../../../modules/memberships'

/**
 * POST /admin/memberships/:id
 *
 * Ajuste manual de una membresía (soporte): set de `credits_balance` y/o
 * `status`. Para gestión completa de la suscripción de pago se usa Stripe.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = (req.body ?? {}) as { credits_balance?: number; status?: string }
  const service: any = req.scope.resolve(MEMBERSHIPS_MODULE)

  const patch: Record<string, unknown> = { id }
  if (typeof body.credits_balance === 'number' && body.credits_balance >= 0) {
    patch.credits_balance = Math.floor(body.credits_balance)
  }
  if (
    body.status &&
    ['incomplete', 'active', 'past_due', 'canceled'].includes(body.status)
  ) {
    patch.status = body.status
  }
  if (Object.keys(patch).length === 1) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Nada que actualizar')
  }

  const updated = await service.updateMemberships(patch)
  return res.json({ membership: updated })
}
