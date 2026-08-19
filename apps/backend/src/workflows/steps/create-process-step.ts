import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface CreateProcessStepInput {
  title: string
  description?: string | null
  badge?: string | null
  icon?: string | null
  rank?: number
  published?: boolean
}

export const createProcessStepStep = createStep(
  'create-process-step',
  async (input: CreateProcessStepInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const step = await service.createProcessSteps(input)

    return new StepResponse(step, step.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.deleteProcessSteps(id)
  },
)
