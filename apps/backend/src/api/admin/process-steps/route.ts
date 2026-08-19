import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { createProcessStepWorkflow } from '../../../workflows/create-process-step'
import type { CreateProcessStepSchema } from './middlewares'

/**
 * GET /admin/process-steps
 * Lista todos los pasos del proceso ordenados por rank (asc).
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
    entity: 'process_step',
    filters,
    ...queryConfig,
  })

  return res.json({
    process_steps: data,
    count: metadata?.count ?? data.length,
    limit: req.queryConfig?.pagination?.take,
    offset: req.queryConfig?.pagination?.skip,
  })
}

/**
 * POST /admin/process-steps
 * Crea un paso del proceso vía workflow.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreateProcessStepSchema>,
  res: MedusaResponse,
) {
  const { result } = await createProcessStepWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ process_step: result })
}
