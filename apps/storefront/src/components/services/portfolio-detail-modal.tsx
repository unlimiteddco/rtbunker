'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { PortfolioImageCarousel } from '@/components/services/portfolio-image-carousel'
import { SERVICE_TYPE_LABELS, type PortfolioWork } from '@/lib/portfolio'

interface PortfolioDetailModalProps {
  work: PortfolioWork | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal de detalle de un trabajo del portafolio (Radix Dialog).
 * Muestra el carrusel de imágenes, título, descripción y metadatos.
 * Controlado desde el grid: `work` + `open` se actualizan al hacer click.
 */
export function PortfolioDetailModal({ work, open, onOpenChange }: PortfolioDetailModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-rt-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-[100] grid max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-0 overflow-y-auto rounded-[24px] border border-rt-black-3 bg-rt-black text-rt-white shadow-[var(--shadow-xl)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          {/* Close */}
          <DialogPrimitive.Close
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rt-black/55 text-rt-white/80 backdrop-blur transition-colors hover:bg-rt-black/85 hover:text-rt-white"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          {work ? (
            <div className="p-5 md:p-7">
              <PortfolioImageCarousel images={work.images} alt={work.title} />

              <div className="mt-6">
                <span className="inline-block rounded-full border border-rt-white/15 bg-rt-black-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rt-yellow font-[family-name:var(--font-heading)]">
                  {SERVICE_TYPE_LABELS[work.serviceType]}
                </span>

                <DialogPrimitive.Title className="mt-4 font-[family-name:var(--font-heading)] text-[clamp(22px,3.4vw,30px)] font-bold uppercase leading-[1.1] tracking-[-0.01em] text-rt-white">
                  {work.title}
                </DialogPrimitive.Title>

                <p className="mt-4 text-[15px] leading-[1.7] text-rt-ink-300">{work.description}</p>

                {(work.car || work.materials || work.date) && (
                  <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-[16px] border border-rt-black-3 bg-rt-black-3 sm:grid-cols-3">
                    {work.car ? <MetaItem label="Vehículo" value={work.car} /> : null}
                    {work.materials ? <MetaItem label="Materiales" value={work.materials} /> : null}
                    {work.date ? <MetaItem label="Año" value={work.date} /> : null}
                  </dl>
                )}
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-rt-black-2 px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] font-semibold leading-[1.4] text-rt-white">{value}</dd>
    </div>
  )
}
