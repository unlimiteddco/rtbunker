import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  createProcessStepStep,
  type CreateProcessStepInput,
} from './steps/create-process-step'

export const createProcessStepWorkflow = createWorkflow(
  'create-process-step',
  function (input: CreateProcessStepInput) {
    const step = createProcessStepStep(input)
    return new WorkflowResponse(step)
  },
)
