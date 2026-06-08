import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  createCustomOrderStep,
  type CreateCustomOrderInput,
} from './steps/create-custom-order'

export const createCustomOrderWorkflow = createWorkflow(
  'create-custom-order',
  function (input: CreateCustomOrderInput) {
    const order = createCustomOrderStep(input)
    return new WorkflowResponse(order)
  },
)
