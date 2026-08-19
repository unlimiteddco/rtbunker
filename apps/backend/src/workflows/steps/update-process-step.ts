import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface UpdateProcessStepInput {
  id: string
  title?: string
  description?: string | null
  badge?: string | null
  icon?: string | null
  rank?: number
  published?: boolean
}

export const updateProcessStepStep = createStep(
  'update-process-step',
  async (input: UpdateProcessStepInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveProcessStep(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ProcessStep ${input.id} not found`,
      )
    }

    const [updated] = await service.updateProcessSteps([input])

    return new StepResponse(updated, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.updateProcessSteps([previous])
  },
)
