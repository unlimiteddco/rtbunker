import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { BRAND_LOGOS } from '@/lib/brand-logos'

const HERO_STATS = [
  { value: '5', label: 'servicios' },
  { value: '120+', label: 'proyectos' },
  { value: '24-72h', label: 'respuesta' },
  { value: '0€', label: 'presupuesto' },
] as const

const MARQUEE_TAGS = [
  'Car Wrapping',
  'Full Wrap',
  'Chrome Delete',
  'Ahumado de Faros',
  'Rotulación',
  'Car Design',
  'Vinilo Premium',
  'Acabados a medida',
]

/**
 * Hero de /servicios. Altura unificada (min-h 78vh) con los heroes de la home
 * y de /personalizadas: la sección es una columna flex y el bloque de copy
 * crece (`flex-1`) hasta dejar las dos franjas corredoras pegadas abajo.
 */
export function ServicesHero() {
  // Duplicamos la lista para que el bucle de -50% no muestre el corte.
  const logoTiles = [...BRAND_LOGOS, ...BRAND_LOGOS]

  return (
    <section className="relative flex min-h-[78vh] flex-col overflow-hidden bg-rt-black text-rt-white">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[380px] w-[380px] rounded-full bg-rt-yellow/20 blur-3xl animate-float-slow"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 -bottom-20 h-[300px] w-[300px] rounded-full bg-rt-yellow/10 blur-3xl"
      />

      <div className="container-page relative flex flex-1 flex-col items-center justify-center py-14 text-center md:py-16">
        <Reveal as="up">
          <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
            <Sparkles className="h-3.5 w-3.5" />
            Bunker Studio · Cuarte de Huerva
          </p>
        </Reveal>

        <Reveal as="up" delay={120}>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(48px,8vw,112px)] uppercase leading-[0.94] tracking-[-0.02em]">
            Servicios <span className="text-rt-yellow">in-shop</span>
            <br />
            para tu coche
          </h1>
        </Reveal>

        <Reveal as="up" delay={240}>
          <p className="mt-6 max-w-[640px] text-balance text-[16px] leading-[1.6] text-rt-ink-300 md:text-[17px]">
            Wrapping, chrome delete, ahumado de faros y rotulación profesional en taller
            propio. Materiales certificados, equipo formado y acabado garantizado. Te hacemos
            el presupuesto gratis en menos de 24 h.
          </p>
        </Reveal>

        <Reveal as="up" delay={360}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/contacto">
                Solicitar presupuesto <ArrowRight className="h-3.5 w-3.5" />
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

        <Reveal as="up" delay={360}>
          <dl className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <dt className="font-[family-name:var(--font-display)] text-[30px] uppercase leading-none tracking-[-0.02em] text-rt-white md:text-[34px]">
                  {s.value}
                </dt>
                <dd className="mt-2 text-[11px] uppercase tracking-[0.18em] text-rt-ink-300 font-[family-name:var(--font-heading)] font-bold">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {/* Marquee inferior amarillo */}
      <div className="relative border-y border-rt-black-3 bg-rt-yellow text-rt-black">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap py-4 pr-10">
            {[...MARQUEE_TAGS, ...MARQUEE_TAGS].map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="flex items-center gap-10 text-[14px] font-bold uppercase tracking-[0.22em] font-[family-name:var(--font-heading)]"
              >
                {tag}
                <span aria-hidden className="text-rt-black/40">
                  ★
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Línea corredora de marcas · mismo patrón que el marquee de
          /personalizadas (lib/brand-logos + .animate-marquee), en versión
          oscura para cerrar el hero. */}
      <div className="relative border-b border-rt-black-3 bg-rt-black-2">
        <p className="container-page pt-6 text-center font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.22em] text-rt-ink-300">
          Han confiado en nuestro trabajo
        </p>
        <div
          className="group relative mt-4 overflow-hidden pb-6"
          // Máscara de degradado en los bordes para que entren/salgan suaves.
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <ul className="animate-marquee flex w-max items-center gap-12 group-hover:[animation-play-state:paused] md:gap-16">
            {logoTiles.map((name, i) => (
              <li
                key={`${name}-${i}`}
                aria-hidden={i >= BRAND_LOGOS.length}
                className="shrink-0 select-none font-[family-name:var(--font-display)] text-[clamp(20px,2.6vw,30px)] uppercase leading-none tracking-[0.04em] text-rt-white/45 transition-colors duration-300 hover:text-rt-white"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
