import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { emitEventStep } from '@medusajs/medusa/core-flows'

import {
  addCustomOrderProofStep,
  type AddCustomOrderProofInput,
} from './steps/add-custom-order-proof'

export const addCustomOrderProofWorkflow = createWorkflow(
  'add-custom-order-proof',
  function (input: AddCustomOrderProofInput) {
    const result = addCustomOrderProofStep(input)

    const eventData = transform({ input }, (d) => ({ id: d.input.custom_order_id }))
    emitEventStep({
      eventName: 'custom_order.proof_added',
      data: eventData,
    })

    return new WorkflowResponse(result)
  },
)
