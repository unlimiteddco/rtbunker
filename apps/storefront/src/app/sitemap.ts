import type { MetadataRoute } from 'next'

import { env } from '@/../env'
import { locales } from '@/i18n/config'
import { listCmsSlugs } from '@/lib/cms'
import { sdk } from '@/lib/medusa'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  const now = new Date()

  const productSlugs: string[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const { products, count } = await sdk.store.product.list({
      fields: 'handle',
      limit,
      offset,
    })
    productSlugs.push(...products.map((p) => p.handle).filter(Boolean) as string[])
    offset += products.length
    if (offset >= count || products.length === 0) break
  }

  const cmsSlugs = listCmsSlugs()
  const staticRoutes = ['', '/tienda', '/cuenta']

  const entries: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    for (const path of staticRoutes) {
      entries.push({ url: `${base}/${locale}${path}`, lastModified: now })
    }
    for (const slug of cmsSlugs) {
      entries.push({ url: `${base}/${locale}/pagina/${slug}`, lastModified: now })
    }
    for (const handle of productSlugs) {
      entries.push({ url: `${base}/${locale}/producto/${handle}`, lastModified: now })
    }
  }
  return entries
}
