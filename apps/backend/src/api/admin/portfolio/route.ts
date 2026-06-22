import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { createPortfolioWorkWorkflow } from '../../../workflows/create-portfolio-work'
import type { CreatePortfolioWorkSchema } from './middlewares'

/**
 * GET /admin/portfolio
 * Lista todos los trabajos del portafolio ordenados por rank (asc).
 * Filtros opcionales: service_type, published.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { service_type, published } = req.validatedQuery as {
    service_type?: string
    published?: boolean
  }

  const filters: Record<string, unknown> = {}
  if (service_type) filters.service_type = service_type
  if (typeof published === 'boolean') filters.published = published

  // Orden de la rejilla: rank asc, y a igualdad de rank los más recientes.
  const queryConfig = { ...req.queryConfig }
  queryConfig.pagination = {
    ...(queryConfig.pagination ?? {}),
    order: { rank: 'ASC', created_at: 'DESC' },
  }

  const { data, metadata } = await query.graph({
    entity: 'portfolio_work',
    filters,
    ...queryConfig,
  })

  return res.json({
    portfolio_works: data,
    count: metadata?.count ?? data.length,
    limit: req.queryConfig?.pagination?.take,
    offset: req.queryConfig?.pagination?.skip,
  })
}

/**
 * POST /admin/portfolio
 * Crea un trabajo de portafolio vía workflow.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreatePortfolioWorkSchema>,
  res: MedusaResponse,
) {
  const { result } = await createPortfolioWorkWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ portfolio_work: result })
}
