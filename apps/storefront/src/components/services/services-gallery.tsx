import { PortfolioGrid } from '@/components/services/portfolio-grid'
import { Reveal } from '@/components/services/reveal'
import type { PortfolioWork } from '@/lib/portfolio'

interface ServicesGalleryProps {
  works: PortfolioWork[]
}

export function ServicesGallery({ works }: ServicesGalleryProps) {
  return (
    <section className="bg-rt-black py-20 text-rt-white md:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal as="up" className="max-w-[640px]">
            <p className="rt-eyebrow text-rt-yellow">Trabajos recientes</p>
            <h2 className="mt-3 rt-h2 text-balance text-rt-white">
              Cada coche que pasa por aquí se va con su mejor versión.
            </h2>
          </Reveal>
          <Reveal as="up" delay={120}>
            <p className="max-w-[360px] text-[14px] leading-[1.65] text-rt-ink-300">
              Una selección de proyectos finalizados en Cuarte de Huerva. Filtra por servicio y abre
              cada trabajo para ver más fotos y los detalles.
            </p>
          </Reveal>
        </div>

        <Reveal as="up" delay={80}>
          <PortfolioGrid works={works} />
        </Reveal>
      </div>
    </section>
  )
}
