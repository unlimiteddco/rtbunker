import { cache } from 'react'

import { sdk } from './medusa'
import { getRegion } from './region'

/**
 * Devuelve productos relacionados por categoría compartida.
 * Si el producto no tiene categoría, devuelve productos recientes.
 */
export const listRelatedProducts = cache(
  async (params: {
    productId: string
    categoryIds: string[]
    countryCode: string
    limit?: number
  }) => {
    const region = await getRegion(params.countryCode)
    const { products } = await sdk.store.product.list(
      {
        region_id: region.id,
        limit: (params.limit ?? 4) + 1,
        fields: '*variants.calculated_price,*images,*categories',
        ...(params.categoryIds.length > 0 ? { category_id: params.categoryIds } : {}),
      },
      { next: { revalidate: 60, tags: ['products'] } } as RequestInit,
    )
    return products.filter((p) => p.id !== params.productId).slice(0, params.limit ?? 4)
  },
)
