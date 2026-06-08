import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MeiliSearch } from 'meilisearch'

const MEILI_INDEX = process.env.MEILISEARCH_INDEX ?? 'products'

let client: MeiliSearch | null = null
function getClient() {
  if (client) return client
  client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
    // En el endpoint público se debería usar un search-only key, no la master key.
    apiKey: process.env.MEILISEARCH_SEARCH_KEY ?? process.env.MEILISEARCH_API_KEY,
  })
  return client
}

/**
 * GET /store/search?q=...&limit=10
 * Devuelve resultados de Meilisearch con documentos de producto.
 * Pensado para el autocomplete del storefront.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query.q as string | undefined)?.trim() ?? ''
  const limit = Math.min(parseInt((req.query.limit as string) ?? '10', 10) || 10, 50)

  if (!q) {
    res.json({ hits: [], query: '', total: 0 })
    return
  }

  const search = await getClient().index(MEILI_INDEX).search(q, {
    limit,
    attributesToRetrieve: ['id', 'handle', 'title', 'subtitle', 'thumbnail'],
    attributesToHighlight: ['title'],
  })

  res.json({
    hits: search.hits,
    query: search.query,
    total: search.estimatedTotalHits,
  })
}
