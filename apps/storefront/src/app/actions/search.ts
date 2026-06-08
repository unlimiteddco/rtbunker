'use server'

import { searchProducts, type SearchHit } from '@/lib/search'

export type { SearchHit }

export async function searchAction(query: string): Promise<SearchHit[]> {
  return searchProducts(query, 8)
}
