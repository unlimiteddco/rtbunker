import { cache } from 'react'

import { sdk } from './medusa'

export interface ProductReview {
  id: string
  name: string | null
  rating: number
  title: string | null
  content: string | null
  images: string[] | null
  verified_purchase: boolean
  admin_response: string | null
  created_at: string
}

export interface ProductReviewsData {
  reviews: ProductReview[]
  count: number
  average: number
  distribution: Record<number, number>
  limit: number
  offset: number
}

const EMPTY: ProductReviewsData = {
  reviews: [],
  count: 0,
  average: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  limit: 10,
  offset: 0,
}

/**
 * Reseñas APROBADAS de un producto + estadísticas. Server-side, cacheado
 * por request. Nunca lanza: si el backend falla devolvemos el estado vacío
 * para no romper la PDP.
 */
export const getProductReviews = cache(
  async (productId: string): Promise<ProductReviewsData> => {
    try {
      const data = await sdk.client.fetch<ProductReviewsData>('/store/reviews', {
        query: { product_id: productId, limit: 20 },
        next: { revalidate: 60, tags: [`reviews:${productId}`] },
      } as Record<string, unknown>)
      return { ...EMPTY, ...data }
    } catch {
      return EMPTY
    }
  },
)

/**
 * Reseñas aprobadas DESTACADAS de toda la tienda (sin filtrar por producto),
 * para los testimonios de la home. Pide al backend la lista global de
 * aprobadas y prioriza las que mejor venden: primero con foto y mayor
 * puntuación. Server-side, cacheado por request. Nunca lanza.
 */
export const getFeaturedReviews = cache(
  async (limit = 8): Promise<ProductReview[]> => {
    try {
      const data = await sdk.client.fetch<ProductReviewsData>('/store/reviews', {
        // Pedimos un margen amplio para poder ordenar/seleccionar las mejores.
        query: { limit: 50 },
        next: { revalidate: 60, tags: ['reviews:featured'] },
      } as Record<string, unknown>)

      const reviews = data?.reviews ?? []

      const hasImages = (r: ProductReview) =>
        Array.isArray(r.images) && r.images.length > 0

      return [...reviews]
        .sort((a, b) => {
          // 1º las que tienen foto, 2º mayor rating, 3º más recientes.
          const imgDiff = Number(hasImages(b)) - Number(hasImages(a))
          if (imgDiff !== 0) return imgDiff
          if (b.rating !== a.rating) return b.rating - a.rating
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        .slice(0, limit)
    } catch {
      return []
    }
  },
)
