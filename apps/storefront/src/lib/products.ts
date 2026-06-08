import { cache } from 'react'

import { sdk } from './medusa'
import { getRegion } from './region'

export interface ListProductsParams {
  countryCode: string
  limit?: number
  offset?: number
  category_id?: string[]
  collection_id?: string[]
  q?: string
  order?: string
}

export const listProducts = cache(async (params: ListProductsParams) => {
  const region = await getRegion(params.countryCode)
  const { products, count, limit, offset } = await sdk.store.product.list(
    {
      region_id: region.id,
      fields:
        '*variants.calculated_price,+variants.inventory_quantity,*categories,*collection,*images',
      limit: params.limit ?? 12,
      offset: params.offset ?? 0,
      ...(params.category_id ? { category_id: params.category_id } : {}),
      ...(params.collection_id ? { collection_id: params.collection_id } : {}),
      ...(params.q ? { q: params.q } : {}),
      ...(params.order ? { order: params.order } : {}),
    },
    { next: { revalidate: 60, tags: ['products'] } } as RequestInit,
  )
  return { products, count, limit, offset, region }
})

export const getProductByHandle = cache(async (handle: string, countryCode: string) => {
  const region = await getRegion(countryCode)
  const { products } = await sdk.store.product.list(
    {
      handle,
      region_id: region.id,
      fields:
        '*variants.calculated_price,+variants.inventory_quantity,*variants.options,*options.values,*images,*categories,*collection',
    },
    { next: { revalidate: 60, tags: [`product:${handle}`] } } as RequestInit,
  )
  return { product: products[0], region }
})

export const listCategories = cache(async () => {
  const { product_categories } = await sdk.store.category.list(
    {
      fields: 'id,name,handle,description,rank,parent_category.id,parent_category.name',
      limit: 200,
    },
    { next: { revalidate: 3600, tags: ['categories'] } } as RequestInit,
  )
  return product_categories
})

type RawCategory = Awaited<ReturnType<typeof listCategories>>[number]

const byRank = (a: RawCategory, b: RawCategory) =>
  ((a as { rank?: number }).rank ?? 0) - ((b as { rank?: number }).rank ?? 0) ||
  a.name.localeCompare(b.name)

const parentIdOf = (c: RawCategory) =>
  (c as { parent_category?: { id?: string } }).parent_category?.id ?? null

export interface CategoryTreeNode {
  id: string
  name: string
  handle: string
  children: { id: string; name: string; handle: string }[]
}

/** Árbol categoría → subcategorías (raíces ordenadas por rank). */
export const getCategoryTree = cache(async (): Promise<CategoryTreeNode[]> => {
  const cats = await listCategories()
  const childrenOf = (parentId: string) =>
    cats.filter((c) => parentIdOf(c) === parentId).sort(byRank)
  return cats
    .filter((c) => !parentIdOf(c))
    .sort(byRank)
    .map((root) => ({
      id: root.id,
      name: root.name,
      handle: root.handle,
      children: childrenOf(root.id).map((k) => ({ id: k.id, name: k.name, handle: k.handle })),
    }))
})

/** Busca una categoría por handle + devuelve los ids de sus subcategorías. */
export const getCategoryByHandle = cache(async (handle: string) => {
  const cats = await listCategories()
  const category = cats.find((c) => c.handle === handle)
  if (!category) return null
  const childIds = cats.filter((c) => parentIdOf(c) === category.id).map((c) => c.id)
  return { category, descendantIds: [category.id, ...childIds] }
})

export interface ShopMenuNode extends CategoryTreeNode {
  thumbnail: string | null
}

/**
 * Datos para el mega menú del header: categorías raíz con una foto de muestra
 * (un producto de la categoría o de sus hijas) + sus subcategorías.
 */
export const getShopMenuData = cache(async (): Promise<ShopMenuNode[]> => {
  const cats = await listCategories()
  const childrenOf = (parentId: string) =>
    cats.filter((c) => parentIdOf(c) === parentId).sort(byRank)
  const roots = cats.filter((c) => !parentIdOf(c)).sort(byRank)

  return Promise.all(
    roots.map(async (root) => {
      const children = childrenOf(root.id)
      const ids = [root.id, ...children.map((c) => c.id)]
      let thumbnail: string | null = null
      try {
        const { products } = await sdk.store.product.list(
          { category_id: ids, limit: 1, fields: 'thumbnail,images.url' },
          { next: { revalidate: 3600, tags: ['products'] } } as RequestInit,
        )
        const p = products[0] as { thumbnail?: string | null; images?: { url: string }[] } | undefined
        thumbnail = p?.thumbnail ?? p?.images?.[0]?.url ?? null
      } catch {
        thumbnail = null
      }
      return {
        id: root.id,
        name: root.name,
        handle: root.handle,
        thumbnail,
        children: children.map((c) => ({ id: c.id, name: c.name, handle: c.handle })),
      }
    }),
  )
})
