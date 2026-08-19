import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  createFeaturedCategoryStep,
  type CreateFeaturedCategoryInput,
} from './steps/create-featured-category'

export const createFeaturedCategoryWorkflow = createWorkflow(
  'create-featured-category',
  function (input: CreateFeaturedCategoryInput) {
    const category = createFeaturedCategoryStep(input)
    return new WorkflowResponse(category)
  },
)
