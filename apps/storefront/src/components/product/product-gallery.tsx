'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/cn'

const arrowCls =
  'absolute top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-rt-black/85 text-rt-white opacity-0 shadow-md backdrop-blur-sm transition-[opacity,background-color] duration-200 hover:bg-rt-black group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rt-yellow [@media(hover:none)]:opacity-100'

interface ProductGalleryProps {
  images: { id?: string; url: string }[]
  alt: string
  fallbackThumbnail?: string | null
}

export function ProductGallery({ images, alt, fallbackThumbnail }: ProductGalleryProps) {
  const all = images.length > 0 ? images : fallbackThumbnail ? [{ url: fallbackThumbnail }] : []
  const [active, setActive] = useState(0)

  if (all.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Sin imagen
      </div>
    )
  }

  function go(delta: number) {
    setActive((curr) => (curr + delta + all.length) % all.length)
  }

  const current = all[active] ?? all[0]
  if (!current) return null

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {all.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {all.map((img, i) => (
            <li key={img.id ?? img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Imagen ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors md:h-20 md:w-20',
                  i === active ? 'border-primary' : 'border-transparent hover:border-border',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="group relative flex-1 overflow-hidden rounded-lg bg-muted">
        <div className="aspect-square w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={alt}
            className="h-full w-full object-cover"
            key={current.url}
          />
        </div>
        {all.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              className={cn(arrowCls, 'left-3')}
              onClick={() => go(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              className={cn(arrowCls, 'right-3')}
              onClick={() => go(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground/80 px-2.5 py-1 text-[10px] font-medium text-background">
              {active + 1} / {all.length}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
