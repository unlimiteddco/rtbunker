import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { emitEventStep } from '@medusajs/medusa/core-flows'

import {
  respondToCustomOrderProofStep,
  type RespondToCustomOrderProofInput,
} from './steps/respond-to-custom-order-proof'

export const respondToCustomOrderProofWorkflow = createWorkflow(
  'respond-to-custom-order-proof',
  function (input: RespondToCustomOrderProofInput) {
    const result = respondToCustomOrderProofStep(input)

    const eventData = transform({ result }, (d) => ({
      id: d.result.custom_order.id,
      decision: d.result.decision,
    }))

    emitEventStep({
      eventName: 'custom_order.proof_responded',
      data: eventData,
    })

    return new WorkflowResponse(result)
  },
)
