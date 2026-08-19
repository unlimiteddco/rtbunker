import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import type { ListStoreServiceItemsSchema } from './middlewares'

/**
 * GET /store/service-items
 * Lista pública de las tarjetas de la página de Servicios. Solo
 * `published=true`, ordenadas por rank (asc). Sustituye al array SERVICES
 * hardcodeado en apps/storefront/src/components/services/services-grid.tsx.
 *
 * Mapeo para el storefront:
 *   eyebrow → tagline
 *   icon    → nombre del icono de lucide-react (mapear string → componente)
 *   rank    → posición; el número "01", "02"… se deriva del índice
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { limit, offset } = req.validatedQuery as unknown as ListStoreServiceItemsSchema

  const take = limit ?? 100
  const skip = offset ?? 0

  const { data, metadata } = await query.graph({
    entity: 'service_item',
    fields: [
      'id',
      'eyebrow',
      'title',
      'description',
      'bullets',
      'cta_label',
      'cta_href',
      'icon',
      'image',
      'featured',
      'rank',
    ],
    filters: { published: true },
    pagination: { take, skip, order: { rank: 'ASC', created_at: 'ASC' } },
  })

  return res.json({
    service_items: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}
