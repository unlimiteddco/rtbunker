import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  createPortfolioWorkStep,
  type CreatePortfolioWorkInput,
} from './steps/create-portfolio-work'

export const createPortfolioWorkWorkflow = createWorkflow(
  'create-portfolio-work',
  function (input: CreatePortfolioWorkInput) {
    const work = createPortfolioWorkStep(input)
    return new WorkflowResponse(work)
  },
)
