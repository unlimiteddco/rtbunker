import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import { REVIEWS_MODULE } from '../../modules/reviews'

export interface CreateReviewRequestInput {
  order_id: string
  email: string
}

/**
 * Registra que ya pedimos reseña a un pedido (dedup del scheduled job).
 * El índice único en `order_id` evita duplicados ante una carrera.
 */
export const createReviewRequestStep = createStep(
  'create-review-request',
  async (input: CreateReviewRequestInput, { container }) => {
    const service: any = container.resolve(REVIEWS_MODULE)

    const [created] = await service.createReviewRequests([
      { order_id: input.order_id, email: input.email },
    ])

    return new StepResponse({ id: created.id }, { created_id: created.id as string })
  },
  async (compensationData, { container }) => {
    if (!compensationData?.created_id) return
    const service: any = container.resolve(REVIEWS_MODULE)
    await service.deleteReviewRequests(compensationData.created_id)
  },
)
