import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { emitEventStep } from '@medusajs/medusa/core-flows'

import {
  updateCustomOrderStatusStep,
  type UpdateCustomOrderStatusInput,
} from './steps/update-custom-order-status'

export const updateCustomOrderStatusWorkflow = createWorkflow(
  'update-custom-order-status',
  function (input: UpdateCustomOrderStatusInput) {
    const result = updateCustomOrderStatusStep(input)

    const eventData = transform({ result }, (d) => ({
      id: d.result.custom_order.id,
      from: d.result.previous_status,
      to: d.result.next_status,
    }))

    emitEventStep({
      eventName: 'custom_order.status_changed',
      data: eventData,
    })

    return new WorkflowResponse(result)
  },
)
