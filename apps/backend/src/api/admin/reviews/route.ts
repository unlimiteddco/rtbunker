import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

/**
 * GET /admin/reviews
 * Lista paginada de reseñas con filtros (status, product_id, q por email/título).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { q, status, product_id } = req.validatedQuery as {
    q?: string
    status?: string
    product_id?: string
  }

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (product_id) filters.product_id = product_id
  if (q) filters.email = { $ilike: `%${q}%` }

  const { data, metadata } = await query.graph({
    entity: 'review',
    filters,
    ...req.queryConfig,
  })

  return res.json({
    reviews: data,
    count: metadata?.count ?? data.length,
    limit: req.queryConfig?.pagination?.take,
    offset: req.queryConfig?.pagination?.skip,
  })
}
