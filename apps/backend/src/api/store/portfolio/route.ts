import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import type { ListStorePortfolioSchema } from './middlewares'

/**
 * GET /store/portfolio
 * Lista pública de trabajos del portafolio. Solo `published=true`, ordenados
 * por rank (asc). Filtro opcional por service_type. Devuelve únicamente los
 * campos públicos que consume el storefront (src/lib/portfolio.ts).
 *
 * Mapeo de campos para el storefront:
 *   service_type → serviceType
 *   date_label   → date
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { service_type, limit, offset } =
    req.validatedQuery as unknown as ListStorePortfolioSchema

  const filters: Record<string, unknown> = { published: true }
  if (service_type) filters.service_type = service_type

  const take = limit ?? 100
  const skip = offset ?? 0

  const { data, metadata } = await query.graph({
    entity: 'portfolio_work',
    fields: [
      'id',
      'service_type',
      'title',
      'description',
      'car',
      'materials',
      'date_label',
      'thumbnail',
      'images',
      'rank',
    ],
    filters,
    pagination: { take, skip, order: { rank: 'ASC', created_at: 'DESC' } },
  })

  return res.json({
    portfolio_works: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}
