import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import type { ListStoreProcessStepsSchema } from './middlewares'

/**
 * GET /store/process-steps
 * Lista pública de los pasos del proceso ("Cómo trabajamos"). Solo
 * `published=true`, ordenados por rank (asc). Sustituye al array STEPS
 * hardcodeado en apps/storefront/src/components/services/services-process.tsx.
 *
 * Mapeo para el storefront:
 *   badge → meta
 *   icon  → nombre del icono de lucide-react (mapear string → componente)
 *   rank  → posición; el número "01", "02"… se deriva del índice
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { limit, offset } = req.validatedQuery as unknown as ListStoreProcessStepsSchema

  const take = limit ?? 100
  const skip = offset ?? 0

  const { data, metadata } = await query.graph({
    entity: 'process_step',
    fields: ['id', 'title', 'description', 'badge', 'icon', 'rank'],
    filters: { published: true },
    pagination: { take, skip, order: { rank: 'ASC', created_at: 'ASC' } },
  })

  return res.json({
    process_steps: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}
