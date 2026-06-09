import type { Metadata } from 'next'
import { Anton, Inter, Montserrat } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale, getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

/**
 * Staging/preview: con `NEXT_PUBLIC_SITE_NOINDEX=true` añade el meta
 * `robots: noindex, nofollow` a TODAS las páginas (las páginas no sobreescriben
 * `robots`, así que se hereda). En producción se quita la variable.
 */
export const metadata: Metadata =
  process.env.NEXT_PUBLIC_SITE_NOINDEX === 'true'
    ? { robots: { index: false, follow: false } }
    : {}

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
