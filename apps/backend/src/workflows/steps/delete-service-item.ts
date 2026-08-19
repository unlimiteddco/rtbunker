import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface DeleteServiceItemInput {
  id: string
}

export const deleteServiceItemStep = createStep(
  'delete-service-item',
  async (input: DeleteServiceItemInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveServiceItem(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ServiceItem ${input.id} not found`,
      )
    }

    await service.deleteServiceItems(input.id)

    return new StepResponse({ id: input.id }, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    // Restaura el registro borrado (incluyendo su id original).
    await service.createServiceItems(previous)
  },
)
