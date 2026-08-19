import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  createServiceItemStep,
  type CreateServiceItemInput,
} from './steps/create-service-item'

export const createServiceItemWorkflow = createWorkflow(
  'create-service-item',
  function (input: CreateServiceItemInput) {
    const item = createServiceItemStep(input)
    return new WorkflowResponse(item)
  },
)
