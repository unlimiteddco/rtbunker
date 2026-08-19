import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface CreateFeaturedCategoryInput {
  category_handle: string
  label?: string | null
  image?: string | null
  rank?: number
  published?: boolean
}

export const createFeaturedCategoryStep = createStep(
  'create-featured-category',
  async (input: CreateFeaturedCategoryInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const category = await service.createFeaturedCategories(input)

    return new StepResponse(category, category.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.deleteFeaturedCategories(id)
  },
)
