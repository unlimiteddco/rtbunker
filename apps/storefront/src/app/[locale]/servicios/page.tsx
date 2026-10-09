import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { ServicesCta } from '@/components/services/services-cta'
import { ServicesFaq } from '@/components/services/services-faq'
import { ServicesGallery } from '@/components/services/services-gallery'
import { ServicesGrid } from '@/components/services/services-grid'
import { ServicesHero } from '@/components/services/services-hero'
import { ServicesProcess } from '@/components/services/services-process'
import { ServicesWarranty } from '@/components/services/services-warranty'
import { ServicesWhy } from '@/components/services/services-why'
import { getMarqueeItems } from '@/lib/content-blocks'
import { getPortfolioWorks } from '@/lib/portfolio'
import { OG_IMAGE, SITE_NAME } from '@/lib/seo'
import { getProcessSteps, getServiceItems } from '@/lib/site-content'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Servicios · Bunker Studio · Car Wrapping en Zaragoza',
  description:
    'Car wrapping, chrome delete, ahumado de faros y rotulación profesional en Cuarte de Huerva. Materiales 3M, Hexis y KPMF con garantía de 2 años. Presupuesto gratis.',
  alternates: { canonical: '/es/servicios' },
  openGraph: {
    title: 'Bunker Studio · Servicios de car wrapping en Zaragoza',
    description:
      'Wrapping, chrome delete y rotulación con materiales certificados y garantía. Taller propio en Cuarte de Huerva.',
    type: 'website',
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
}

interface ServicesPageProps {
  params: Promise<{ locale: string }>
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  // Contenido desde el backend (resiliente: cae al respaldo estático si falla).
  const [works, serviceItems, processSteps, brands] = await Promise.all([
    getPortfolioWorks(),
    getServiceItems(),
    getProcessSteps(),
    getMarqueeItems(),
  ])

  return (
    <>
      <ServicesHero brands={brands} />
      <ServicesGrid items={serviceItems} />
      <ServicesProcess steps={processSteps} />
      <ServicesGallery works={works} />
      <ServicesWhy />
      <ServicesWarranty />
      <ServicesFaq />
      <ServicesCta />
    </>
  )
}
