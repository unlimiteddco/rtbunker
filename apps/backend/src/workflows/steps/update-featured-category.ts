import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface UpdateFeaturedCategoryInput {
  id: string
  category_handle?: string
  label?: string | null
  image?: string | null
  rank?: number
  published?: boolean
}

export const updateFeaturedCategoryStep = createStep(
  'update-featured-category',
  async (input: UpdateFeaturedCategoryInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveFeaturedCategory(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `FeaturedCategory ${input.id} not found`,
      )
    }

    const [updated] = await service.updateFeaturedCategories([input])

    return new StepResponse(updated, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.updateFeaturedCategories([previous])
  },
)
