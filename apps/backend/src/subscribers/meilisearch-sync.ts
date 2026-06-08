import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { MeiliSearch } from 'meilisearch'

const MEILI_INDEX = process.env.MEILISEARCH_INDEX ?? 'products'

let _client: MeiliSearch | null = null
function getClient(): MeiliSearch {
  if (_client) return _client
  _client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
  })
  return _client
}

/**
 * Sincroniza productos creados / actualizados a Meilisearch.
 * El borrado se gestiona en otro subscriber (product-deleted).
 */
async function upsertProducts(productIds: string[], container: SubscriberArgs<unknown>['container']) {
  if (!productIds.length) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      'id',
      'handle',
      'title',
      'subtitle',
      'description',
      'thumbnail',
      'status',
      'tags.value',
      'collection.title',
      'categories.name',
      'variants.id',
      'variants.title',
      'variants.sku',
      'variants.calculated_price.calculated_amount',
    ],
    filters: { id: productIds, status: 'published' },
  })

  if (!products.length) return

  const documents = products.map((p) => ({
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

  const client = getClient()
  await client.index(MEILI_INDEX).addDocuments(documents, { primaryKey: 'id' })
}

export default async function meilisearchSyncHandler({
  event,
  container,
}: SubscriberArgs<{ id: string } | { ids: string[] }>) {
  if (event.name === 'product.deleted') {
    const ids = 'ids' in event.data ? event.data.ids : [event.data.id]
    await getClient().index(MEILI_INDEX).deleteDocuments(ids)
    return
  }

  const ids = 'ids' in event.data ? event.data.ids : [event.data.id]
  await upsertProducts(ids, container)
}

export const config: SubscriberConfig = {
  event: ['product.created', 'product.updated', 'product.deleted'],
}
