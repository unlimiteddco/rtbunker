import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { BRAND_LOGOS } from '@/lib/brand-logos'

/**
 * Hero de /servicios: bloque de copy + una franja corredora de marcas.
 * Su altura está igualada a la del resto de cabeceras oscuras (referencia:
 * /planes ≈ 480 px en escritorio). La home es la única excepción, más alta.
 */
export function ServicesHero() {
  // Duplicamos la lista para que el bucle de -50% no muestre el corte.
  const logoTiles = [...BRAND_LOGOS, ...BRAND_LOGOS]

  return (
    <section className="relative flex min-h-[380px] flex-col overflow-hidden bg-rt-black text-rt-white md:min-h-[480px]">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[380px] w-[380px] rounded-full bg-rt-yellow/20 blur-3xl animate-float-slow"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 -bottom-20 h-[300px] w-[300px] rounded-full bg-rt-yellow/10 blur-3xl"
      />

      <div className="container-page relative flex flex-1 flex-col items-center justify-center py-6 text-center md:py-10">
        <Reveal as="up">
          <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
            <Sparkles className="h-3.5 w-3.5" />
            Bunker Studio · Cuarte de Huerva
          </p>
        </Reveal>

        <Reveal as="up" delay={120}>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(36px,7vw,80px)] uppercase leading-[0.95] tracking-[-0.02em]">
            Servicios <span className="text-rt-yellow">in-shop</span>
            <br />
            para tu coche
          </h1>
        </Reveal>

        <Reveal as="up" delay={240}>
          <p className="mt-5 max-w-[560px] text-balance text-[16px] leading-[1.6] text-rt-ink-300">
            Wrapping, chrome delete, ahumado de faros y rotulación en taller propio.
            Presupuesto gratis en menos de 24 h.
          </p>
        </Reveal>

        <Reveal as="up" delay={360}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/contacto">
                Solicitar presupuesto <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {/* Oculto en móvil: allí ya está el botón flotante de WhatsApp, y
                así la cabecera mantiene la altura del resto de páginas. */}
            <Button asChild variant="ghostInv" size="lg" className="hidden sm:inline-flex">
              <a href="https://wa.me/34624690489" target="_blank" rel="noreferrer noopener">
                <MessageCircle className="h-4 w-4" />
                WhatsApp directo
              </a>
            </Button>
          </div>
        </Reveal>

      </div>

      {/* Línea corredora de marcas · mismo patrón que el marquee de
          /personalizadas (lib/brand-logos + .animate-marquee), en versión
          oscura para cerrar el hero. Compacta, para que la cabecera mida lo
          mismo que las del resto de páginas (referencia: /planes). */}
      <div className="relative border-y border-rt-black-3 bg-rt-black-2">
        <div
          className="group relative overflow-hidden py-3"
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
