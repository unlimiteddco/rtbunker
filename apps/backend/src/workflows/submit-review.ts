import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import { createReviewStep, type CreateReviewInput } from './steps/create-review'

export const submitReviewWorkflow = createWorkflow(
  'submit-review',
  function (input: CreateReviewInput) {
    const result = createReviewStep(input)
    return new WorkflowResponse(result)
  },
)
