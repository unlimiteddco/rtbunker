import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { HomeTestimonials } from '@/components/home/home-testimonials'
import { PersonalizadasAbout } from '@/components/personalizadas/personalizadas-about'
import { PersonalizadasClubCta } from '@/components/personalizadas/personalizadas-club-cta'
import { PersonalizadasHero } from '@/components/personalizadas/personalizadas-hero'
import { PersonalizadasLogosMarquee } from '@/components/personalizadas/personalizadas-logos-marquee'
import { PersonalizadasProductPicker } from '@/components/personalizadas/personalizadas-product-picker'
import { getMarqueeItems, getProductTypeContent } from '@/lib/content-blocks'
import { getMembership, isActiveMembership } from '@/lib/membership'
import { getFeaturedReviews } from '@/lib/reviews'
import { shareMetadata } from '@/lib/seo'

interface PersonalizadasPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: PersonalizadasPageProps): Promise<Metadata> {
  const { locale } = await params
  const title = 'Pegatinas personalizadas · RT Bunker'
  const description =
    'Diseña tu pegatina a medida en una sola pantalla. Forma, material, tamaño y cantidad. Precio al instante y envío en 24–48 h a toda España.'
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/personalizadas`,
    },
    ...shareMetadata({ title, description, path: `/${locale}/personalizadas` }),
  }
}

export default async function PersonalizadasPage({ params }: PersonalizadasPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const membership = await getMembership()
  const availableCredits = isActiveMembership(membership) ? (membership?.credits_balance ?? 0) : 0

  // Reseñas destacadas de la tienda para los testimonios (getFeaturedReviews
  // nunca lanza: devuelve [] si el backend falla).
  const [reviews, brands, productTypeContent] = await Promise.all([
    getFeaturedReviews(8),
    // Editables desde el panel (Contenido web); con respaldo si el backend falla.
    getMarqueeItems(),
    getProductTypeContent(),
  ])

  return (
    <>
      <PersonalizadasHero />
      <PersonalizadasLogosMarquee items={brands} />
      <PersonalizadasProductPicker
        availableCredits={availableCredits}
        content={productTypeContent}
      />
      <HomeTestimonials reviews={reviews} />
      <PersonalizadasAbout />
      {availableCredits > 0 ? null : <PersonalizadasClubCta />}
    </>
  )
}
