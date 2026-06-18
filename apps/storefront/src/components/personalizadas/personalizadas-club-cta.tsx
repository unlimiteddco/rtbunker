import { ArrowRight, Crown, Percent, Truck, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Link } from '@/i18n/routing'

interface ClubBenefit {
  icon: LucideIcon
  title: string
  description: string
}

const BENEFITS: ClubBenefit[] = [
  {
    icon: Crown,
    title: 'Hasta 100 créditos al mes',
    description: '1 crédito = 1 pegatina personalizada. Canjéalos directo en el configurador.',
  },
  {
    icon: Zap,
    title: 'Impresión el mismo día',
    description: 'Tus pedidos del Club saltan a la cabeza de la cola de producción.',
  },
  {
    icon: Truck,
    title: 'Envío urgente gratis',
    description: 'Sin coste de envío en todos tus pedidos mientras seas socio.',
  },
  {
    icon: Percent,
    title: 'Hasta un 10% de descuento',
    description: 'Tarifa de socio aplicada automáticamente en cada compra.',
  },
]

/**
 * Sección CTA al RT Bunker Club, específica para personalizadas (los créditos
 * son justo para estas pegatinas). Comparte el lenguaje del ClubPromoBanner
 * —tarjeta carbón con halo amarillo— pero desplegado en una rejilla de
 * beneficios + botón a /planes.
 */
export function PersonalizadasClubCta() {
  return (
    <section className="bg-rt-white-2">
      <div className="container-page pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-[24px] bg-rt-black px-6 py-10 text-rt-white md:px-12 md:py-14">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-40"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rt-yellow/20 blur-3xl"
          />

          <div className="relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <Reveal as="up" className="max-w-[560px]">
                <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
                  <Crown className="h-3.5 w-3.5" />
                  RT Bunker Club
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(30px,4.5vw,52px)] uppercase leading-[1.02] tracking-[-0.02em]">
                  ¿Pides muchas pegatinas?
                  <br />
                  <span className="text-rt-yellow">Hazte del Club.</span>
                </h2>
                <p className="mt-4 max-w-[460px] text-[15px] leading-[1.6] text-rt-ink-300">
                  Créditos cada mes, producción prioritaria y precio de socio. Pensado para
                  quien personaliza sin parar.
                </p>
              </Reveal>

              <Reveal as="up" delay={120}>
                <Link
                  href="/planes"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] bg-rt-yellow px-7 py-3.5 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.14em] text-rt-black transition-colors hover:bg-rt-yellow-deep"
                >
                  Ver planes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>

            <div className="mt-10 grid gap-px overflow-hidden rounded-[20px] border border-rt-black-3 bg-rt-black-3 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((benefit, i) => {
                const Icon = benefit.icon
                return (
                  <Reveal
                    key={benefit.title}
                    as="up"
                    delay={i * 90}
                    className="flex h-full flex-col gap-3 bg-rt-black p-6"
                  >
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-rt-yellow/15 text-rt-yellow">
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </span>
                    <p className="font-[family-name:var(--font-heading)] text-[15px] font-bold leading-tight text-rt-white">
                      {benefit.title}
                    </p>
                    <p className="text-[13px] leading-[1.55] text-rt-ink-300">
                      {benefit.description}
                    </p>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
