import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  deletePortfolioWorkStep,
  type DeletePortfolioWorkInput,
} from './steps/delete-portfolio-work'

export const deletePortfolioWorkWorkflow = createWorkflow(
  'delete-portfolio-work',
  function (input: DeletePortfolioWorkInput) {
    const result = deletePortfolioWorkStep(input)
    return new WorkflowResponse(result)
  },
)
