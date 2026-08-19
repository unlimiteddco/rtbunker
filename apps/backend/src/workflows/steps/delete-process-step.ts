import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface DeleteProcessStepInput {
  id: string
}

export const deleteProcessStepStep = createStep(
  'delete-process-step',
  async (input: DeleteProcessStepInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveProcessStep(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ProcessStep ${input.id} not found`,
      )
    }

    await service.deleteProcessSteps(input.id)

    return new StepResponse({ id: input.id }, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    // Restaura el registro borrado (incluyendo su id original).
    await service.createProcessSteps(previous)
  },
)
