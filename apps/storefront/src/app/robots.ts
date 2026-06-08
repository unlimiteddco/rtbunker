import type { MetadataRoute } from 'next'

import { env } from '@/../env'

/**
 * En staging/preview se pone `NEXT_PUBLIC_SITE_NOINDEX=true` para bloquear todo
 * a los buscadores. En producción (sin esa variable) se sirve el robots normal.
 */
const NOINDEX = process.env.NEXT_PUBLIC_SITE_NOINDEX === 'true'

export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  const base = env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/checkout', '/carrito', '/cuenta'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
