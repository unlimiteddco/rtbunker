'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface PortfolioImageCarouselProps {
  images: string[]
  alt: string
}

/**
 * Carrusel de imágenes para el modal de detalle del portafolio.
 * Flechas prev/next + puntos de paginación. Si solo hay una imagen,
 * se muestra sin controles.
 */
export function PortfolioImageCarousel({ images, alt }: PortfolioImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const total = images.length
  const hasMultiple = total > 1

  const go = (delta: number) => {
    setIndex((i) => (i + delta + total) % total)
  }

  if (total === 0) return null

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] border border-rt-black-3 bg-rt-black-2">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={`${alt} — imagen ${i + 1}`}
          fill
          sizes="(min-width: 768px) 640px, 100vw"
          priority={i === 0}
          className={`object-cover transition-opacity duration-500 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-rt-black/55 text-rt-white backdrop-blur transition-colors hover:bg-rt-black/85"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-rt-black/55 text-rt-white backdrop-blur transition-colors hover:bg-rt-black/85"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Paginación */}
          <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-rt-yellow' : 'w-1.5 bg-rt-white/40 hover:bg-rt-white/70'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
