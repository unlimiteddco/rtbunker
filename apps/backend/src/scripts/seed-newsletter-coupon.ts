import type { ExecArgs } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  Modules,
  PromotionStatus,
  PromotionType,
} from '@medusajs/framework/utils'
import { createPromotionsWorkflow } from '@medusajs/medusa/core-flows'

/**
 * Crea (idempotente) el cupón RTBUNKER10 que se reparte al suscribirse a
 * la newsletter. 10% off en cualquier pedido, sin tope.
 *
 * Uso: `npx medusa exec ./src/scripts/seed-newsletter-coupon.ts`
 */
export default async function seedNewsletterCoupon({ container }: ExecArgs) {
  const logger: any = container.resolve(ContainerRegistrationKeys.LOGGER)
  const promotion: any = container.resolve(Modules.PROMOTION)

  const code = 'RTBUNKER10'

  const existing = await promotion.listPromotions({ code })
  if (existing.length > 0) {
    logger.info(`[seed-coupon] Ya existe (${existing[0].id}). Skip.`)
    return
  }

  const { result } = await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code,
          type: PromotionType.STANDARD,
          status: PromotionStatus.ACTIVE,
          is_automatic: false,
          application_method: {
            type: 'percentage',
            value: 10,
            currency_code: 'eur',
            target_type: 'order',
            allocation: 'across',
          },
          rules: [],
        },
      ],
    },
  })

  logger.info(`[seed-coupon] Creado ${code} (id=${result[0]!.id}). 10% off · ningún límite de uso.`)
}
