import { ArrowRight, Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

interface InfoItem {
  icon: LucideIcon
  label: string
  primary: string
  secondary: string
  href?: string
}

const INFO_ITEMS: InfoItem[] = [
  {
    icon: MapPin,
    label: 'Dirección',
    primary: 'Calle Aneto 15, Nave A6 · 50410',
    secondary: 'Cuarte de Huerva, Zaragoza',
  },
  {
    icon: Phone,
    label: 'Teléfono',
    primary: '+34 600 00 00 00',
    secondary: 'L-V · 9 a 18 h',
    href: 'tel:+34600000000',
  },
  {
    icon: Clock,
    label: 'Horario',
    primary: 'L-V · 9:00 — 18:00',
    secondary: 'Sábado · 9:00 — 14:00',
  },
]

export function ServicesCta() {
  return (
    <section className="relative overflow-hidden bg-rt-black text-rt-white">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-40" />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rt-yellow/15 blur-[140px]"
      />

      {/* Stamp gigante de fondo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-[family-name:var(--font-display)] uppercase leading-none tracking-[-0.04em] text-rt-white/[0.04]"
        style={{ fontSize: 'clamp(160px, 26vw, 420px)' }}
      >
        Bunker
      </span>

      <div className="container-page relative flex flex-col items-center py-20 text-center md:py-28">
        <Reveal as="up">
          <p className="inline-flex items-center gap-2 rounded-full border border-rt-yellow/40 bg-rt-yellow/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rt-yellow" />
            Aceptando proyectos
          </p>
        </Reveal>

        <Reveal as="up" delay={120}>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(48px,8vw,128px)] uppercase leading-[0.92] tracking-[-0.02em]">
            Pasamos del
            <br />
            <span className="text-rt-yellow">presupuesto</span> al taller.
          </h2>
        </Reveal>

        <Reveal as="up" delay={240}>
          <p className="mt-6 max-w-[760px] text-balance text-[16px] leading-[1.6] text-rt-ink-300 md:text-[17px]">
            Mándanos una foto del coche y lo que tienes en mente.
            <br className="hidden md:inline" /> Te respondemos en menos de 24 h con
            presupuesto detallado — sin compromiso, sin adelanto.
          </p>
        </Reveal>

        <Reveal as="up" delay={360}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/contacto">
                Solicitar presupuesto · Gratis
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="ghostInv" size="lg">
              <a href="https://wa.me/34600000000" target="_blank" rel="noreferrer noopener">
                <MessageCircle className="h-4 w-4" />
                WhatsApp directo
              </a>
            </Button>
          </div>
        </Reveal>

        {/* Strip inferior de info */}
        <Reveal as="up" delay={480} className="mt-14 w-full">
          <div className="grid gap-px overflow-hidden rounded-[20px] border border-rt-black-3 bg-rt-black-3 md:grid-cols-3">
            {INFO_ITEMS.map((item) => {
              const Icon = item.icon
              const Wrap = item.href ? 'a' : 'div'
              return (
                <Wrap
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-4 bg-rt-black p-6 text-left transition-colors hover:bg-rt-black-2"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-rt-yellow/15 text-rt-yellow transition-colors group-hover:bg-rt-yellow group-hover:text-rt-black">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
                      {item.label}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-heading)] text-[15px] font-bold leading-tight text-rt-white">
                      {item.primary}
                    </p>
                    <p className="mt-0.5 text-[12px] text-rt-ink-300">{item.secondary}</p>
                  </div>
                </Wrap>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
