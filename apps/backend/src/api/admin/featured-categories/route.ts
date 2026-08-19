import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { createFeaturedCategoryWorkflow } from '../../../workflows/create-featured-category'
import type { CreateFeaturedCategorySchema } from './middlewares'

/**
 * GET /admin/featured-categories
 * Lista las categorías destacadas de la home ordenadas por rank (asc).
 * Filtro opcional: published.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { published } = req.validatedQuery as { published?: boolean }

  const filters: Record<string, unknown> = {}
  if (typeof published === 'boolean') filters.published = published

  const queryConfig = { ...req.queryConfig }
  queryConfig.pagination = {
    ...(queryConfig.pagination ?? {}),
    order: { rank: 'ASC', created_at: 'ASC' },
  }

  const { data, metadata } = await query.graph({
    entity: 'featured_category',
    filters,
    ...queryConfig,
  })

  return res.json({
    featured_categories: data,
    count: metadata?.count ?? data.length,
    limit: req.queryConfig?.pagination?.take,
    offset: req.queryConfig?.pagination?.skip,
  })
}

/**
 * POST /admin/featured-categories
 * Crea una categoría destacada vía workflow.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreateFeaturedCategorySchema>,
  res: MedusaResponse,
) {
  const { result } = await createFeaturedCategoryWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ featured_category: result })
}
