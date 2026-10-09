import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import {
  CONTENT_BLOCK_FIELDS,
  FIXED_COLLECTIONS,
  isContentCollection,
} from '../../../lib/content-blocks'
import { createContentBlockWorkflow } from '../../../workflows/content-block'
import type { CreateContentBlockSchema } from './middlewares'

/**
 * GET /admin/content-blocks?collection=marquee
 * Piezas de una colección (publicadas y ocultas), ordenadas por rank.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const collection = req.query.collection
  if (!isContentCollection(collection)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Falta una colección válida')
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: 'content_block',
    fields: CONTENT_BLOCK_FIELDS,
    filters: { collection },
    pagination: { take: 500, skip: 0, order: { rank: 'ASC', created_at: 'ASC' } },
  })

  return res.json({
    content_blocks: data,
    count: data.length,
    fixed: FIXED_COLLECTIONS.includes(collection),
  })
}

/**
 * POST /admin/content-blocks
 * Crea una pieza en una colección (no permitido en colecciones fijas).
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreateContentBlockSchema>,
  res: MedusaResponse,
) {
  const { result } = await createContentBlockWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ content_block: result })
}
