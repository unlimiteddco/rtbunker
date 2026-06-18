'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useRef } from 'react'

import { Reveal } from '@/components/services/reveal'

interface DesignTile {
  id: string
  label: string
  image: string
}

// TODO Nikita: reemplazar los placeholders de /designs/*.png por los PNG reales
// de diseños listos (transparentes, encuadre cuadrado 1:1).
const DESIGNS: DesignTile[] = [
  { id: 'd1', label: 'Logo troquelado', image: '/designs/design-1.png' },
  { id: 'd2', label: 'Lettering retro', image: '/designs/design-2.png' },
  { id: 'd3', label: 'Mascota ilustrada', image: '/designs/design-3.png' },
  { id: 'd4', label: 'Sticker holográfico', image: '/designs/design-4.png' },
  { id: 'd5', label: 'Pack racing', image: '/designs/design-5.png' },
  { id: 'd6', label: 'Etiqueta de marca', image: '/designs/design-6.png' },
]

/**
 * Carrusel horizontal de diseños de ejemplo. Scroll nativo con snap (táctil en
 * móvil) y flechas para escritorio. Cada tile es cuadrado 1:1 para mantener un
 * tamaño uniforme independientemente del PNG.
 */
export function PersonalizadasSlider() {
  const trackRef = useRef<HTMLDivElement | null>(null)

  const scrollBy = useCallback((dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    // Avanza ~el ancho de una tarjeta (incluye el gap aproximado).
    const card = track.querySelector<HTMLElement>('[data-design-card]')
    const step = card ? card.offsetWidth + 16 : track.clientWidth * 0.8
    track.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  return (
    <section className="bg-rt-white-2 py-16 md:py-20">
      <div className="container-page">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal as="up" className="max-w-[620px]">
            <p className="rt-eyebrow text-rt-yellow">Galería de diseños</p>
            <h2 className="mt-3 rt-h2 text-balance text-rt-black">
              Ideas que ya hemos impreso para clientes.
            </h2>
          </Reveal>
          <Reveal as="up" delay={120} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Siguiente"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </Reveal>
        </div>

        <div
          ref={trackRef}
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {DESIGNS.map((design, i) => (
            <Reveal
              key={design.id}
              as="scale"
              delay={(i % 4) * 90}
              className="shrink-0 snap-start"
            >
              <article
                data-design-card
                className="group w-[240px] overflow-hidden rounded-[20px] border border-rt-ink-100 bg-rt-white shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-md)] sm:w-[280px]"
              >
                <div className="relative aspect-square overflow-hidden bg-rt-white-3">
                  <Image
                    src={design.image}
                    alt={design.label}
                    fill
                    sizes="(min-width: 640px) 280px, 240px"
                    className="object-cover transition-transform duration-[600ms] ease-[var(--ease-out-rt)] group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <span className="font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.08em] text-rt-black">
                    {design.label}
                  </span>
                  <span className="rounded-full bg-rt-white-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
                    PNG
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal as="up">
          <p className="mt-2 text-[13px] leading-[1.5] text-rt-ink-500">
            ¿Tienes tu propio diseño? Súbelo en el configurador y lo imprimimos tal cual.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
