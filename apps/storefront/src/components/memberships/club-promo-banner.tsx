import { ArrowRight, Crown } from 'lucide-react'

import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'

interface ClubPromoBannerProps {
  className?: string
}

/**
 * Banda promocional del RT Bunker Club. Pensada para el configurador de
 * personalizadas (los créditos son justo para estas pegatinas), pero
 * reutilizable en otras páginas.
 */
export function ClubPromoBanner({ className }: ClubPromoBannerProps) {
  return (
    <section className={cn('bg-rt-white-2', className)}>
      <div className="container-page pb-12">
        <div className="relative overflow-hidden rounded-[24px] bg-rt-black px-6 py-7 text-rt-white md:px-9 md:py-8">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rt-yellow/20 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-rt-yellow/15 text-rt-yellow">
                <Crown className="h-6 w-6" />
              </span>
              <div>
                <p className="rt-eyebrow text-rt-yellow">RT Bunker Club</p>
                <h3 className="mt-1.5 font-[family-name:var(--font-heading)] text-[clamp(18px,2.4vw,24px)] font-extrabold leading-[1.15] tracking-[-0.01em]">
                  ¿Pides muchas pegatinas? Ahorra con el Club.
                </h3>
                <p className="mt-1.5 max-w-[520px] text-[14px] leading-[1.5] text-rt-ink-300">
                  Hasta 100 créditos al mes para personalizadas, envío urgente gratis e impresión
                  el mismo día, y hasta un 10% de descuento en todos tus pedidos.
                </p>
              </div>
            </div>

            <Link
              href="/planes"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-[12px] bg-rt-yellow px-6 py-3 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.14em] text-rt-black transition-colors hover:bg-rt-yellow-deep md:self-auto"
            >
              Ver planes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
