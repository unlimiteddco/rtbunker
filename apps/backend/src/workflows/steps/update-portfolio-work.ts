import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { PORTFOLIO_MODULE } from '../../modules/portfolio'

export interface UpdatePortfolioWorkInput {
  id: string
  service_type?: string
  title?: string
  description?: string | null
  car?: string | null
  materials?: string | null
  date_label?: string | null
  thumbnail?: string | null
  images?: string[] | null
  rank?: number
  published?: boolean
}

export const updatePortfolioWorkStep = createStep(
  'update-portfolio-work',
  async (input: UpdatePortfolioWorkInput, { container }) => {
    const service: any = container.resolve(PORTFOLIO_MODULE)

    const existing = await service.retrievePortfolioWork(input.id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `PortfolioWork ${input.id} not found`,
      )
    }

    const [updated] = await service.updatePortfolioWorks([input])

    return new StepResponse(updated, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(PORTFOLIO_MODULE)
    await service.updatePortfolioWorks([previous])
  },
)
