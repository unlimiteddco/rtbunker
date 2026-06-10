import { cache } from 'react'

import { sdk } from './medusa'

/**
 * Resuelve la región a partir del locale (ISO country code en minúsculas).
 * Cachea durante la request y revalida cada hora en el server.
 */
export const getRegion = cache(async (countryCode: string) => {
  const code = countryCode.toLowerCase()
  try {
    const { regions } = await sdk.store.region.list(
      {},
      { next: { revalidate: 3600, tags: ['regions'] } } as RequestInit,
    )
    const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === code))
    return region ?? regions[0]
  } catch {
    // Backend no accesible (p. ej. en build-time): región stub para no romper
    // el render; en runtime con backend vivo se resuelve la real.
    return { id: '', name: 'default', countries: [] } as Awaited<
      ReturnType<typeof sdk.store.region.list>
    >['regions'][number]
  }
})

export const listRegions = cache(async () => {
  const { regions } = await sdk.store.region.list(
    {},
    { next: { revalidate: 3600, tags: ['regions'] } } as RequestInit,
  )
  return regions
})
