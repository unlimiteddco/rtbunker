import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * GET /admin/quick-product/context
 * Datos auxiliares para el formulario "Publicar producto": todas las
 * categorías (id, nombre y padre) ordenadas como en la tienda.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: 'product_category',
    fields: ['id', 'name', 'handle', 'rank', 'parent_category_id', 'is_active', 'is_internal'],
  })

  const byId = new Map(data.map((c) => [c.id, c]))

  const categories = data
    .map((c) => {
      const parent = c.parent_category_id ? byId.get(c.parent_category_id) : null
      return {
        id: c.id,
        name: c.name,
        handle: c.handle,
        rank: c.rank ?? 0,
        is_active: c.is_active,
        is_internal: c.is_internal,
        parent: parent ? { id: parent.id, name: parent.name } : null,
      }
    })
    // Primero las raíz (por rank) y detrás cada hija junto a su padre.
    .sort((a, b) => {
      const ka = a.parent ? byId.get(a.parent.id)?.rank ?? 0 : a.rank
      const kb = b.parent ? byId.get(b.parent.id)?.rank ?? 0 : b.rank
      if (ka !== kb) return ka - kb
      if (!a.parent !== !b.parent) return a.parent ? 1 : -1
      return a.rank - b.rank || a.name.localeCompare(b.name, 'es')
    })

  return res.json({ categories })
}
