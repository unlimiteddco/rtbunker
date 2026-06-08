import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import { moderateReviewStep, type ModerateReviewInput } from './steps/moderate-review'

export const moderateReviewWorkflow = createWorkflow(
  'moderate-review',
  function (input: ModerateReviewInput) {
    const result = moderateReviewStep(input)
    return new WorkflowResponse(result)
  },
)
