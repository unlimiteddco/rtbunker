import { createHash } from 'node:crypto'

import type { MedusaContainer } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  buildPriceTable,
  PRICE_TABLE_PRODUCT_FIELDS,
  type PriceTableProduct,
} from '../../../lib/price-table'

type Entry = { id: string; title: string; thumbnail: string | null; signature: string }

/**
 * Firma de la tabla de precios de TODOS los productos, para saber cuáles
 * comparten exactamente la misma tabla. Recorrer el catálogo entero (más de
 * 20.000 variantes) tarda unos segundos, así que el resultado se guarda en
 * memoria un par de minutos y se descarta en cuanto se cambia un precio desde
 * la página (los cambios hechos en otra parte del panel caducan solos).
 */
const TTL_MS = 2 * 60 * 1000
const PAGE = 20
let cache: { at: number; entries: Entry[] } | null = null

export const invalidatePriceTableSignatures = () => {
  cache = null
}

export const hashSignature = (signature: string) =>
  createHash('sha1').update(signature).digest('hex')

export async function getPriceTableSignatures(container: MedusaContainer): Promise<Entry[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.entries

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const entries: Entry[] = []

  for (let skip = 0; ; skip += PAGE) {
    const { data } = await query.graph({
      entity: 'product',
      fields: PRICE_TABLE_PRODUCT_FIELDS,
      pagination: { skip, take: PAGE, order: { created_at: 'ASC' } },
    })
    const products = data as unknown as PriceTableProduct[]
    for (const p of products) {
      entries.push({
        id: p.id,
        title: p.title,
        thumbnail: p.thumbnail ?? null,
        signature: hashSignature(buildPriceTable(p).signature),
      })
    }
    if (products.length < PAGE) break
  }

  cache = { at: Date.now(), entries }
  return entries
}
