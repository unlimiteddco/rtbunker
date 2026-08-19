import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { createServiceItemWorkflow } from '../../../workflows/create-service-item'
import type { CreateServiceItemSchema } from './middlewares'

/**
 * GET /admin/service-items
 * Lista todas las tarjetas de servicio ordenadas por rank (asc).
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
    entity: 'service_item',
    filters,
    ...queryConfig,
  })

  return res.json({
    service_items: data,
    count: metadata?.count ?? data.length,
    limit: req.queryConfig?.pagination?.take,
    offset: req.queryConfig?.pagination?.skip,
  })
}

/**
 * POST /admin/service-items
 * Crea una tarjeta de servicio vía workflow.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreateServiceItemSchema>,
  res: MedusaResponse,
) {
  const { result } = await createServiceItemWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ service_item: result })
}
