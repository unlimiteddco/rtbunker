import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { HomeTestimonials } from '@/components/home/home-testimonials'
import { PersonalizadasAbout } from '@/components/personalizadas/personalizadas-about'
import { PersonalizadasClubCta } from '@/components/personalizadas/personalizadas-club-cta'
import { PersonalizadasHero } from '@/components/personalizadas/personalizadas-hero'
import { PersonalizadasLogosMarquee } from '@/components/personalizadas/personalizadas-logos-marquee'
import { PersonalizadasProductPicker } from '@/components/personalizadas/personalizadas-product-picker'
import { getMembership, isActiveMembership } from '@/lib/membership'
import { getFeaturedReviews } from '@/lib/reviews'

interface PersonalizadasPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: PersonalizadasPageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Pegatinas personalizadas · RT Bunker',
    description:
      'Diseña tu pegatina a medida en una sola pantalla. Forma, material, tamaño y cantidad. Precio al instante y envío en 24–48 h a toda España.',
    alternates: {
      canonical: `/${locale}/personalizadas`,
    },
  }
}

export default async function PersonalizadasPage({ params }: PersonalizadasPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const membership = await getMembership()
  const availableCredits = isActiveMembership(membership) ? (membership?.credits_balance ?? 0) : 0

  // Reseñas destacadas de la tienda para los testimonios (getFeaturedReviews
  // nunca lanza: devuelve [] si el backend falla).
  const reviews = await getFeaturedReviews(8)

  return (
    <>
      <PersonalizadasHero />
      <PersonalizadasLogosMarquee />
      <PersonalizadasProductPicker availableCredits={availableCredits} />
      <HomeTestimonials reviews={reviews} />
      <PersonalizadasAbout />
      {availableCredits > 0 ? null : <PersonalizadasClubCta />}
    </>
  )
}
