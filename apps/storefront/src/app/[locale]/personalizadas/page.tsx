import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { ClubPromoBanner } from '@/components/memberships/club-promo-banner'
import { PersonalizadasCompact } from '@/components/personalizadas/personalizadas-compact'
import { getMembership, isActiveMembership } from '@/lib/membership'

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

  return (
    <>
      <PersonalizadasCompact availableCredits={availableCredits} />
      {availableCredits > 0 ? null : <ClubPromoBanner />}
    </>
  )
}
