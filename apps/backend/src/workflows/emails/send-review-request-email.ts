import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { reviewRequestTemplate } from './templates'

export interface SendReviewRequestEmailInput {
  email: string
  customer_name?: string | null
  order_short_id: string
  products: Array<{ title: string; handle: string | null; thumbnail: string | null }>
}

export const sendReviewRequestEmailStep = createStep(
  'send-review-request-email',
  async (input: SendReviewRequestEmailInput, { container }) => {
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const tpl = reviewRequestTemplate({
      customer_name: input.customer_name,
      order_short_id: input.order_short_id,
      storefront_url: process.env.STOREFRONT_URL ?? null,
      products: input.products,
    })

    const result = await notification.createNotifications({
      to: input.email,
      channel: 'email',
      template: 'review.request',
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendReviewRequestEmailWorkflow = createWorkflow(
  'send-review-request-email',
  function (input: SendReviewRequestEmailInput) {
    const result = sendReviewRequestEmailStep(input)
    return new WorkflowResponse(result)
  },
)
