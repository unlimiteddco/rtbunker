import type { Metadata } from 'next'

import { env } from '@/../env'
import { locales } from '@/i18n/config'

/**
 * Helper para construir metadata raíz por locale, con alternates hreflang.
 * Cualquier página puede importar `buildMetadata` y mergear sus campos propios.
 */
export function buildMetadata(input: {
  locale: string
  pathname: string
  title: string
  description?: string
}): Metadata {
  const base = env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  const path = input.pathname.startsWith('/') ? input.pathname : `/${input.pathname}`

  return {
    title: input.title,
    description: input.description,
    metadataBase: new URL(base),
    alternates: {
      canonical: `${base}/${input.locale}${path}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${base}/${l}${path}`]),
      ),
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: `${base}/${input.locale}${path}`,
      type: 'website',
    },
  }
}
