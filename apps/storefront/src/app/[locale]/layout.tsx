import type { Metadata, Viewport } from 'next'
import { Anton, Inter, Montserrat } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale, getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://rtbunker.com').replace(/\/$/, '')

/**
 * Metadata por defecto de toda la web: título, descripción e imagen que sale
 * al compartir un enlace. Las páginas la heredan y pisan solo lo que definan.
 * El favicon y los iconos salen de los archivos `app/favicon.ico`,
 * `app/icon.png` y `app/apple-icon.png`.
 *
 * Staging/preview: con `NEXT_PUBLIC_SITE_NOINDEX=true` añade el meta
 * `robots: noindex, nofollow` a TODAS las páginas (las páginas no sobreescriben
 * `robots`, así que se hereda). En producción se quita la variable.
 */
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'es_ES',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  ...(process.env.NEXT_PUBLIC_SITE_NOINDEX === 'true'
    ? { robots: { index: false, follow: false } }
    : {}),
}

/** Color de la barra del navegador en móvil: el carbón de la cabecera. */
export const viewport: Viewport = { themeColor: '#0f0f0f' }

import { MiniCartDrawer } from '@/components/cart/mini-cart-drawer'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { CookieBanner } from '@/components/marketing/cookie-banner'
import { EmailCapturePopup } from '@/components/marketing/email-capture-popup'
import { WhatsappButton } from '@/components/marketing/whatsapp-button'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { locales } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, OG_IMAGE, SITE_NAME } from '@/lib/seo'

// Display: tall condensed caps — usado en hero / display names.
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-anton',
})

// Heading: section headings, product titles, eyebrows, botones uppercase.
const montserrat = Montserrat({
  weight: ['500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
})

// Body: párrafos, meta, formularios.
const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!locales.includes(locale as (typeof locales)[number])) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${anton.variable} ${montserrat.variable} ${inter.variable}`}
    >
      <body className="bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <Header locale={locale} />
              <main className="flex-1">{children}</main>
              <Footer />
              <MiniCartDrawer locale={locale} />
              <EmailCapturePopup />
              <WhatsappButton />
              <CookieBanner />
              <Toaster position="top-center" />
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
