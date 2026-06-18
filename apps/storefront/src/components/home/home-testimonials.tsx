'use client'

import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { useRef } from 'react'

import { StarRating } from '@/components/product/star-rating'
import { Reveal } from '@/components/services/reveal'
import { cn } from '@/lib/cn'
import type { ProductReview } from '@/lib/reviews'

interface HomeTestimonialsProps {
  reviews: ProductReview[]
}

/**
 * Testimonios de la home · carrusel horizontal con scroll-snap de las
 * mejores reseñas aprobadas de la tienda. Si no llega ninguna reseña, no
 * renderiza nada (la home no muestra una sección vacía). Las flechas
 * desplazan el carril; en móvil se hace swipe nativo.
 */
export function HomeTestimonials({ reviews }: HomeTestimonialsProps) {
  const trackRef = useRef<HTMLUListElement>(null)

  if (reviews.length === 0) return null

  function scrollBy(dir: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('li')
    const amount = card ? card.clientWidth + 20 : track.clientWidth * 0.8
    track.scrollBy({ left: amount * dir, behavior: 'smooth' })
  }

  const showControls = reviews.length > 1

  return (
    <section className="bg-rt-white py-20 md:py-24">
      <div className="container-page">
        <Reveal as="up">
          <header className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
            <div className="max-w-[620px]">
              <p className="rt-eyebrow text-rt-yellow-deep">Lo que dicen</p>
              <h2 className="mt-3 rt-h2 text-balance">Clientes que repiten</h2>
              <p className="mt-4 text-[16px] leading-[1.65] text-rt-ink-500">
                Cientos de coches, motos y portátiles llevan ya nuestras
                pegatinas. Estas son algunas de sus valoraciones.
              </p>
            </div>

            {showControls ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => scrollBy(-1)}
                  aria-label="Anterior"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollBy(1)}
                  aria-label="Siguiente"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </header>
        </Reveal>

        <ul
          ref={trackRef}
          className={cn(
            'flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {reviews.map((review) => (
            <TestimonialCard key={review.id} review={review} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function TestimonialCard({ review }: { review: ProductReview }) {
  const photo =
    Array.isArray(review.images) && review.images.length > 0 ? review.images[0] : null
  const date = new Date(review.created_at).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <li className="flex w-[300px] shrink-0 snap-start flex-col rounded-[20px] border border-rt-ink-100 bg-rt-white-2 p-6 sm:w-[360px]">
      <div className="flex items-center justify-between">
        <StarRating value={review.rating} size={16} />
        <Quote className="h-7 w-7 text-rt-yellow" aria-hidden />
      </div>

      {review.title ? (
        <h3 className="mt-4 font-[family-name:var(--font-heading)] text-[17px] font-bold leading-[1.25] text-rt-black">
          {review.title}
        </h3>
      ) : null}

      {review.content ? (
        <p className="mt-2 line-clamp-5 text-[14px] leading-[1.6] text-rt-ink-500">
          {review.content}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3 border-t border-rt-black/8 pt-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rt-yellow font-[family-name:var(--font-heading)] text-[15px] font-bold text-rt-black">
            {(review.name ?? 'C').charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-rt-black">
            {review.name ?? 'Cliente'}
          </p>
          <p className="text-[12px] text-rt-ink-500">{date}</p>
        </div>
      </div>
    </li>
  )
}
