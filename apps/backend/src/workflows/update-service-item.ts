import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  updateServiceItemStep,
  type UpdateServiceItemInput,
} from './steps/update-service-item'

export const updateServiceItemWorkflow = createWorkflow(
  'update-service-item',
  function (input: UpdateServiceItemInput) {
    const item = updateServiceItemStep(input)
    return new WorkflowResponse(item)
  },
)
