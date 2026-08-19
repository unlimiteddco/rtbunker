import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  deleteProcessStepStep,
  type DeleteProcessStepInput,
} from './steps/delete-process-step'

export const deleteProcessStepWorkflow = createWorkflow(
  'delete-process-step',
  function (input: DeleteProcessStepInput) {
    const result = deleteProcessStepStep(input)
    return new WorkflowResponse(result)
  },
)
