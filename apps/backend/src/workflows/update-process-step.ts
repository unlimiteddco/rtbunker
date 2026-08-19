import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  updateProcessStepStep,
  type UpdateProcessStepInput,
} from './steps/update-process-step'

export const updateProcessStepWorkflow = createWorkflow(
  'update-process-step',
  function (input: UpdateProcessStepInput) {
    const step = updateProcessStepStep(input)
    return new WorkflowResponse(step)
  },
)
