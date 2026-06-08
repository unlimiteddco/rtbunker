import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import { createReviewRequestStep } from './steps/create-review-request'
import { sendReviewRequestEmailStep } from './emails/send-review-request-email'

export interface RequestReviewInput {
  order_id: string
  email: string
  customer_name?: string | null
  order_short_id: string
  products: Array<{ title: string; handle: string | null; thumbnail: string | null }>
}

/**
 * Marca el pedido como "reseña pedida" y envía el email. Si el envío falla,
 * la compensación borra la marca para que el job lo reintente al día siguiente.
 */
export const requestReviewWorkflow = createWorkflow(
  'request-review',
  function (input: RequestReviewInput) {
    createReviewRequestStep({ order_id: input.order_id, email: input.email })

    const result = sendReviewRequestEmailStep({
      email: input.email,
      customer_name: input.customer_name,
      order_short_id: input.order_short_id,
      products: input.products,
    })

    return new WorkflowResponse(result)
  },
)
