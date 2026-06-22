import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import { PORTFOLIO_MODULE } from '../../modules/portfolio'

export interface CreatePortfolioWorkInput {
  service_type: string
  title: string
  description?: string | null
  car?: string | null
  materials?: string | null
  date_label?: string | null
  thumbnail?: string | null
  images?: string[] | null
  rank?: number
  published?: boolean
}

export const createPortfolioWorkStep = createStep(
  'create-portfolio-work',
  async (input: CreatePortfolioWorkInput, { container }) => {
    const service: any = container.resolve(PORTFOLIO_MODULE)

    const work = await service.createPortfolioWorks(input)

    return new StepResponse(work, work.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service: any = container.resolve(PORTFOLIO_MODULE)
    await service.deletePortfolioWorks(id)
  },
)
