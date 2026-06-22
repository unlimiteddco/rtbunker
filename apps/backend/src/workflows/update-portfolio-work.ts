import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  updatePortfolioWorkStep,
  type UpdatePortfolioWorkInput,
} from './steps/update-portfolio-work'

export const updatePortfolioWorkWorkflow = createWorkflow(
  'update-portfolio-work',
  function (input: UpdatePortfolioWorkInput) {
    const work = updatePortfolioWorkStep(input)
    return new WorkflowResponse(work)
  },
)
