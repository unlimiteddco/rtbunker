import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  deleteServiceItemStep,
  type DeleteServiceItemInput,
} from './steps/delete-service-item'

export const deleteServiceItemWorkflow = createWorkflow(
  'delete-service-item',
  function (input: DeleteServiceItemInput) {
    const result = deleteServiceItemStep(input)
    return new WorkflowResponse(result)
  },
)
