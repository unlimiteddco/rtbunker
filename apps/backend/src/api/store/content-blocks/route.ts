import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import { CONTENT_BLOCK_FIELDS, isContentCollection } from '../../../lib/content-blocks'

/**
 * GET /store/content-blocks?collection=marquee
 * Piezas PUBLICADAS de una colección, ordenadas por rank. Si la colección está
 * vacía, el storefront usa su contenido por defecto.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const collection = req.query.collection
  if (!isContentCollection(collection)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Falta una colección válida')
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: 'content_block',
    fields: CONTENT_BLOCK_FIELDS,
    filters: { collection, published: true },
    pagination: { take: 500, skip: 0, order: { rank: 'ASC', created_at: 'ASC' } },
  })

  return res.json({ content_blocks: data, count: data.length })
}
