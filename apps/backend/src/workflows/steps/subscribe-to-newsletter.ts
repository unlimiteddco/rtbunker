import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import { NEWSLETTER_MODULE } from '../../modules/newsletter'

export interface SubscribeToNewsletterInput {
  email: string
  consent_given: boolean
  coupon_code: string
  source?: string | null
  ip?: string | null
}

export interface SubscribeToNewsletterOutput {
  subscriber: {
    id: string
    email: string
    coupon_code: string | null
    is_new: boolean
  }
}

/**
 * Crea (o actualiza) un suscriptor de la newsletter de forma idempotente.
 * Si el email ya existe, refresca la marca de consentimiento y devuelve
 * `is_new: false` (lo que el workflow usa para evitar reenviar el cupón).
 */
export const subscribeToNewsletterStep = createStep(
  'subscribe-to-newsletter',
  async (input: SubscribeToNewsletterInput, { container }) => {
    const service: any = container.resolve(NEWSLETTER_MODULE)

    const normalizedEmail = input.email.trim().toLowerCase()
    const existing = await service.listNewsletterSubscribers({
      email: normalizedEmail,
    })

    if (existing && existing.length > 0) {
      const sub = existing[0]
      // Si el usuario re-acepta RGPD o nos llega de otra fuente, lo
      // anotamos pero no contamos como nuevo suscriptor.
      const [updated] = await service.updateNewsletterSubscribers([
        {
          id: sub.id,
          consent_given: input.consent_given || sub.consent_given,
          source: input.source ?? sub.source,
        },
      ])
      return new StepResponse(
        {
          subscriber: {
            id: updated.id,
            email: updated.email,
            coupon_code: updated.coupon_code,
            is_new: false,
          },
        } as SubscribeToNewsletterOutput,
        { created_id: null as string | null },
      )
    }

    const [created] = await service.createNewsletterSubscribers([
      {
        email: normalizedEmail,
        consent_given: input.consent_given,
        coupon_code: input.coupon_code,
        source: input.source ?? null,
        ip: input.ip ?? null,
      },
    ])

    return new StepResponse(
      {
        subscriber: {
          id: created.id,
          email: created.email,
          coupon_code: created.coupon_code,
          is_new: true,
        },
      } as SubscribeToNewsletterOutput,
      { created_id: created.id as string | null },
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData?.created_id) return
    const service: any = container.resolve(NEWSLETTER_MODULE)
    await service.deleteNewsletterSubscribers(compensationData.created_id)
  },
)
