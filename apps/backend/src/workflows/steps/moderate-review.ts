import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { REVIEWS_MODULE } from '../../modules/reviews'

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export interface ModerateReviewInput {
  review_id: string
  status: ReviewStatus
  admin_response?: string | null
}

/**
 * Aprueba / rechaza una reseña desde el admin. Opcionalmente adjunta una
 * respuesta pública de la tienda (`admin_response`).
 */
export const moderateReviewStep = createStep(
  'moderate-review',
  async (input: ModerateReviewInput, { container }) => {
    const service: any = container.resolve(REVIEWS_MODULE)

    const existing = await service.retrieveReview(input.review_id).catch(() => null)
    if (!existing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Reseña no encontrada.')
    }

    const update: Record<string, unknown> = {
      id: input.review_id,
      status: input.status,
    }
    if (input.admin_response !== undefined) {
      update.admin_response = input.admin_response
    }

    const [updated] = await service.updateReviews([update])

    return new StepResponse(
      { review: updated },
      {
        review_id: input.review_id,
        prev_status: existing.status,
        prev_admin_response: existing.admin_response,
      },
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const service: any = container.resolve(REVIEWS_MODULE)
    await service.updateReviews([
      {
        id: compensationData.review_id,
        status: compensationData.prev_status,
        admin_response: compensationData.prev_admin_response,
      },
    ])
  },
)
