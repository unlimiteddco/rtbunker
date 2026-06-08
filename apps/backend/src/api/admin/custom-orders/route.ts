import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { createCustomOrderWorkflow } from '../../../workflows/create-custom-order'
import type { CreateCustomOrderSchema } from './middlewares'

/**
 * GET /admin/custom-orders
 * Lista paginada de pedidos custom con filtros opcionales (q, status).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { q, status } = req.validatedQuery as { q?: string; status?: string }

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (q) filters.customer_email = { $ilike: `%${q}%` }

  // Cola de producción: prioritarios (socios) primero, luego los más antiguos.
  const queryConfig = { ...req.queryConfig }
  queryConfig.pagination = {
    ...(queryConfig.pagination ?? {}),
    order: { priority: 'DESC', created_at: 'ASC' },
  }

  const { data, metadata } = await query.graph({
    entity: 'custom_order',
    filters,
    ...queryConfig,
  })

  return res.json({
    custom_orders: data,
    count: metadata?.count ?? data.length,
    limit: req.queryConfig?.pagination?.take,
    offset: req.queryConfig?.pagination?.skip,
  })
}

/**
 * POST /admin/custom-orders
 * Crea un pedido custom manualmente desde admin. Útil para registros que
 * llegan por email/teléfono hasta que el storefront los envíe automáticamente.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreateCustomOrderSchema>,
  res: MedusaResponse,
) {
  const { result } = await createCustomOrderWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ custom_order: result })
}
