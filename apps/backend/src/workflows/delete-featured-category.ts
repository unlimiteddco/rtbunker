import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  deleteFeaturedCategoryStep,
  type DeleteFeaturedCategoryInput,
} from './steps/delete-featured-category'

export const deleteFeaturedCategoryWorkflow = createWorkflow(
  'delete-featured-category',
  function (input: DeleteFeaturedCategoryInput) {
    const result = deleteFeaturedCategoryStep(input)
    return new WorkflowResponse(result)
  },
)
