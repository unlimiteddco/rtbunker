import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { PORTFOLIO_MODULE } from '../../modules/portfolio'

export interface DeletePortfolioWorkInput {
  id: string
}

export const deletePortfolioWorkStep = createStep(
  'delete-portfolio-work',
  async (input: DeletePortfolioWorkInput, { container }) => {
    const service: any = container.resolve(PORTFOLIO_MODULE)

    const existing = await service.retrievePortfolioWork(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `PortfolioWork ${input.id} not found`,
      )
    }

    await service.deletePortfolioWorks(input.id)

    return new StepResponse({ id: input.id }, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(PORTFOLIO_MODULE)
    // Restaura el registro borrado (incluyendo su id original).
    await service.createPortfolioWorks(previous)
  },
)
