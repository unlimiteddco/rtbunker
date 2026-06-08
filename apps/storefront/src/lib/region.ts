import { cache } from 'react'

import { sdk } from './medusa'

/**
 * Resuelve la región a partir del locale (ISO country code en minúsculas).
 * Cachea durante la request y revalida cada hora en el server.
 */
export const getRegion = cache(async (countryCode: string) => {
  const code = countryCode.toLowerCase()
  const { regions } = await sdk.store.region.list(
    {},
    { next: { revalidate: 3600, tags: ['regions'] } } as RequestInit,
  )

  const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === code))
  return region ?? regions[0]
})

export const listRegions = cache(async () => {
  const { regions } = await sdk.store.region.list(
    {},
    { next: { revalidate: 3600, tags: ['regions'] } } as RequestInit,
  )
  return regions
})
