'use server'

import { env } from '@/../env'

export interface SearchHit {
  id: string
  handle: string
  title: string
  subtitle?: string | null
  thumbnail?: string | null
}

/**
 * Search via el endpoint público del backend (que a su vez consulta Meilisearch).
 * Mantenemos la lógica server-side para no exponer la API key.
 */
export async function searchProducts(query: string, limit = 10): Promise<SearchHit[]> {
  if (!query.trim()) return []

  const url = new URL('/store/search', env.MEDUSA_BACKEND_URL ?? env.NEXT_PUBLIC_MEDUSA_BACKEND_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url, {
    headers: {
      'x-publishable-api-key': env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    },
    next: { revalidate: 30 },
  })

  if (!res.ok) return []
  const data = (await res.json()) as { hits: SearchHit[] }
  return data.hits
}
