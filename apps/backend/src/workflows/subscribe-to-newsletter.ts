import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { emitEventStep } from '@medusajs/medusa/core-flows'

import {
  subscribeToNewsletterStep,
  type SubscribeToNewsletterInput,
} from './steps/subscribe-to-newsletter'

export const subscribeToNewsletterWorkflow = createWorkflow(
  'subscribe-to-newsletter',
  function (input: SubscribeToNewsletterInput) {
    const result = subscribeToNewsletterStep(input)

    const eventPayload = transform({ result }, (d) => ({
      id: d.result.subscriber.id,
      email: d.result.subscriber.email,
      coupon_code: d.result.subscriber.coupon_code,
      is_new: d.result.subscriber.is_new,
    }))

    emitEventStep({
      eventName: 'newsletter.subscribed',
      data: eventPayload,
    })

    return new WorkflowResponse(result)
  },
)
