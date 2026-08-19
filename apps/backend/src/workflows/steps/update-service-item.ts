import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface UpdateServiceItemInput {
  id: string
  eyebrow?: string | null
  title?: string
  description?: string | null
  bullets?: string[] | null
  cta_label?: string | null
  cta_href?: string | null
  icon?: string | null
  image?: string | null
  featured?: boolean
  rank?: number
  published?: boolean
}

export const updateServiceItemStep = createStep(
  'update-service-item',
  async (input: UpdateServiceItemInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveServiceItem(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ServiceItem ${input.id} not found`,
      )
    }

    const [updated] = await service.updateServiceItems([input])

    return new StepResponse(updated, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.updateServiceItems([previous])
  },
)
