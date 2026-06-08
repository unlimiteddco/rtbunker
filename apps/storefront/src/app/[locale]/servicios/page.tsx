import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { ServicesCta } from '@/components/services/services-cta'
import { ServicesFaq } from '@/components/services/services-faq'
import { ServicesGallery } from '@/components/services/services-gallery'
import { ServicesGrid } from '@/components/services/services-grid'
import { ServicesHero } from '@/components/services/services-hero'
import { ServicesProcess } from '@/components/services/services-process'
import { ServicesWhy } from '@/components/services/services-why'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Servicios · Bunker Studio · Car Wrapping en Zaragoza',
  description:
    'Car wrapping, chrome delete, ahumado de faros y rotulación profesional en Cuarte de Huerva. Materiales 3M, Hexis y KPMF con garantía de 2 años. Presupuesto gratis.',
  alternates: { canonical: '/servicios' },
  openGraph: {
    title: 'Bunker Studio · Servicios de car wrapping en Zaragoza',
    description:
      'Wrapping, chrome delete y rotulación con materiales certificados y garantía. Taller propio en Cuarte de Huerva.',
    type: 'website',
  },
}

interface ServicesPageProps {
  params: Promise<{ locale: string }>
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <ServicesHero />
      <ServicesGrid />
      <ServicesProcess />
      <ServicesGallery />
      <ServicesWhy />
      <ServicesFaq />
      <ServicesCta />
    </>
  )
}
