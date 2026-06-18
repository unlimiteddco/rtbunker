import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { PersonalizadasClubCta } from '@/components/personalizadas/personalizadas-club-cta'
import { PersonalizadasCompact } from '@/components/personalizadas/personalizadas-compact'
import { PersonalizadasHero } from '@/components/personalizadas/personalizadas-hero'
import { PersonalizadasSlider } from '@/components/personalizadas/personalizadas-slider'
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
      <PersonalizadasHero />
      <div id="configurador" className="scroll-mt-20">
        <PersonalizadasCompact availableCredits={availableCredits} />
      </div>
      <PersonalizadasSlider />
      {availableCredits > 0 ? null : <PersonalizadasClubCta />}
    </>
  )
}
