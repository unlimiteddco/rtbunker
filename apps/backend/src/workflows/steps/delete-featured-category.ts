import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface DeleteFeaturedCategoryInput {
  id: string
}

export const deleteFeaturedCategoryStep = createStep(
  'delete-featured-category',
  async (input: DeleteFeaturedCategoryInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveFeaturedCategory(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `FeaturedCategory ${input.id} not found`,
      )
    }

    await service.deleteFeaturedCategories(input.id)

    return new StepResponse({ id: input.id }, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    // Restaura el registro borrado (incluyendo su id original).
    await service.createFeaturedCategories(previous)
  },
)
