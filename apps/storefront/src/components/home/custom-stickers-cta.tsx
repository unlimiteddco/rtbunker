import { ArrowRight, Eye, Sparkles, Truck, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

interface Perk {
  icon: LucideIcon
  title: string
  body: string
}

const PERKS: Perk[] = [
  {
    icon: Zap,
    title: 'Precio al instante',
    body: 'Forma, material, tamaño y cantidad en una sola pantalla.',
  },
  {
    icon: Eye,
    title: 'Prueba digital',
    body: 'Te enseñamos cómo queda antes de mandarlo a imprimir.',
  },
  {
    icon: Truck,
    title: 'Envío en 24-48 h',
    body: 'A toda España. Pedido mínimo de 15 unidades.',
  },
]

/**
 * CTA de pegatinas personalizadas en la home. Va justo tras `CategoryGrid`
 * para romper el ritmo de secciones claras: fondo carbón con textura de
 * rejilla y halos teal, mismo lenguaje visual que `AboutBanner` y el hero de
 * /personalizadas. Único destino: el configurador de /personalizadas.
 */
export function CustomStickersCta() {
  // La franja `TrustBadges` que va justo debajo también es carbón: el hairline
  // inferior evita que ambas se lean como un único bloque negro.
  return (
    <section className="relative overflow-hidden border-b border-rt-black-3 bg-rt-black text-rt-white">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 h-[340px] w-[340px] rounded-full bg-rt-yellow/20 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-[280px] w-[280px] rounded-full bg-rt-yellow/10 blur-3xl"
      />

      <div className="container-page relative py-20 md:py-24">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <Reveal as="up" className="max-w-[620px]">
            <p className="inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow">
              <Sparkles className="h-3.5 w-3.5" />
              Diseño a medida
            </p>

            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(30px,4.8vw,58px)] uppercase leading-[1.02] tracking-[-0.02em] text-balance">
              Tu idea,
              <br />
              <span className="text-rt-yellow">en vinilo premium</span>
            </h2>

            <p className="mt-5 max-w-[520px] text-[15px] leading-[1.65] text-rt-ink-300 md:text-[16px]">
              Sube tu logo o tu ilustración y calcula el precio al instante. Te mandamos una
              prueba digital antes de imprimir y lo tienes en casa en 24-48 h. Pedido mínimo
              de 15 unidades.
            </p>
          </Reveal>

          <Reveal as="up" delay={120} className="shrink-0">
            <Button asChild variant="primary" size="xl">
              <Link href="/personalizadas">
                Diseñar mi pegatina
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[20px] border border-rt-black-3 bg-rt-black-3 sm:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, body }, i) => (
            <Reveal
              key={title}
              as="up"
              delay={i * 90}
              className="flex h-full flex-col gap-3 bg-rt-black p-6"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-rt-yellow/15 text-rt-yellow">
                <Icon className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <p className="font-[family-name:var(--font-heading)] text-[15px] font-bold leading-tight text-rt-white">
                {title}
              </p>
              <p className="text-[13px] leading-[1.55] text-rt-ink-300">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
