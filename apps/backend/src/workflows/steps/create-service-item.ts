import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface CreateServiceItemInput {
  eyebrow?: string | null
  title: string
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

export const createServiceItemStep = createStep(
  'create-service-item',
  async (input: CreateServiceItemInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const item = await service.createServiceItems(input)

    return new StepResponse(item, item.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.deleteServiceItems(id)
  },
)
