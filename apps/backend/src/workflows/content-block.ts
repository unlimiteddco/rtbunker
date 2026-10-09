import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  createContentBlockStep,
  deleteContentBlockStep,
  updateContentBlockStep,
  type CreateContentBlockInput,
  type DeleteContentBlockInput,
  type UpdateContentBlockInput,
} from './steps/content-block'

/** Alta, edición y borrado de piezas de contenido (panel "Contenido web"). */

export const createContentBlockWorkflow = createWorkflow(
  'create-content-block',
  function (input: CreateContentBlockInput) {
    const block = createContentBlockStep(input)
    return new WorkflowResponse(block)
  },
)

export const updateContentBlockWorkflow = createWorkflow(
  'update-content-block',
  function (input: UpdateContentBlockInput) {
    const block = updateContentBlockStep(input)
    return new WorkflowResponse(block)
  },
)

export const deleteContentBlockWorkflow = createWorkflow(
  'delete-content-block',
  function (input: DeleteContentBlockInput) {
    const result = deleteContentBlockStep(input)
    return new WorkflowResponse(result)
  },
)
