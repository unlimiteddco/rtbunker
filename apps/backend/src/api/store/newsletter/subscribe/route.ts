import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError, Modules } from '@medusajs/framework/utils'

import { subscribeToNewsletterWorkflow } from '../../../../workflows/subscribe-to-newsletter'
import type { SubscribeNewsletterSchema } from '../middlewares'

const NEWSLETTER_COUPON_CODE = 'RTBUNKER10'

/**
 * POST /store/newsletter/subscribe
 *
 * Captura un email para la newsletter. Devuelve el código de cupón que se
 * activa al suscribirse — el cliente puede usarlo inmediatamente en checkout
 * y también lo recibe por email (subscriber `newsletter.subscribed`).
 *
 * Idempotente: si el email ya existe se actualiza el consentimiento RGPD
 * sin volver a enviar el email de bienvenida.
 */
export async function POST(
  req: MedusaRequest<SubscribeNewsletterSchema>,
  res: MedusaResponse,
) {
  // Verificar que el cupón existe (sanity check)
  const promotion: any = req.scope.resolve(Modules.PROMOTION)
  const found = await promotion.listPromotions({ code: NEWSLETTER_COUPON_CODE })
  if (!found || found.length === 0) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Cupón ${NEWSLETTER_COUPON_CODE} no existe — corre el seed.`,
    )
  }

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.ip ||
    null

  const { result } = await subscribeToNewsletterWorkflow(req.scope).run({
    input: {
      email: req.validatedBody.email,
      consent_given: req.validatedBody.consent_given,
      coupon_code: NEWSLETTER_COUPON_CODE,
      source: req.validatedBody.source ?? 'popup',
      ip,
    },
  })

  return res.status(201).json({
    subscriber: {
      email: result.subscriber.email,
      is_new: result.subscriber.is_new,
    },
    coupon_code: NEWSLETTER_COUPON_CODE,
  })
}
