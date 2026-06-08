import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { MeiliSearch } from 'meilisearch'

/**
 * Reindexa TODOS los productos publicados en Meilisearch. Útil tras una
 * migración/seed o al desplegar en un servidor nuevo (el subscriber
 * `meilisearch-sync.ts` solo sincroniza cambios en caliente, no el histórico).
 *
 * Genera el mismo documento que el subscriber para que la búsqueda sea
 * coherente. Idempotente (addDocuments hace upsert por `id`).
 *
 * Uso: npx medusa exec ./src/scripts/reindex-meilisearch.ts
 */
const MEILI_INDEX = process.env.MEILISEARCH_INDEX ?? 'products'

export default async function reindexMeilisearch({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
  })

  const fields = [
    'id',
    'handle',
    'title',
    'subtitle',
    'description',
    'thumbnail',
    'tags.value',
    'collection.title',
    'categories.name',
    'variants.sku',
  ]

  let skip = 0
  const take = 200
  let total = 0

  for (;;) {
    const { data: products } = await query.graph({
      entity: 'product',
      fields,
      filters: { status: 'published' } as any,
      pagination: { skip, take } as any,
    })
    if (!products.length) break

    const documents = (products as any[]).map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      thumbnail: p.thumbnail,
      tags: (p.tags ?? []).map((t: { value: string }) => t.value),
      collection: p.collection?.title ?? null,
      categories: (p.categories ?? []).map((c: { name: string }) => c.name),
      skus: (p.variants ?? []).map((v: { sku?: string }) => v.sku).filter(Boolean),
    }))

    await client.index(MEILI_INDEX).addDocuments(documents, { primaryKey: 'id' })
    total += documents.length
    logger.info(`[reindex] enviados ${total} productos…`)

    if (products.length < take) break
    skip += take
  }

  logger.info(`[reindex] ✅ Meilisearch reindexado: ${total} productos en "${MEILI_INDEX}".`)
}
