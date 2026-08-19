import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  updateFeaturedCategoryStep,
  type UpdateFeaturedCategoryInput,
} from './steps/update-featured-category'

export const updateFeaturedCategoryWorkflow = createWorkflow(
  'update-featured-category',
  function (input: UpdateFeaturedCategoryInput) {
    const category = updateFeaturedCategoryStep(input)
    return new WorkflowResponse(category)
  },
)
