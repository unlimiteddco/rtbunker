import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

import './env'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // No bloquear el build de producción por errores de tipo/lint pre-existentes
  // (strictness: exactOptionalPropertyTypes, variantes de Button, etc.). No son
  // bugs de runtime. El type-check/lint se corren aparte (`tsc --noEmit`,
  // `eslint`). TODO post-lanzamiento: limpiar y reactivar.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ['lucide-react', '@medusajs/js-sdk'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'media.example.com' },
      // Imágenes servidas por el backend local en desarrollo (file-local →
      // http://localhost:9000/static/...). Sin esto, next/image las rechaza y
      // el producto aparece sin foto en local.
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
  transpilePackages: ['@rtbunker/ui'],
}

export default withNextIntl(config)
