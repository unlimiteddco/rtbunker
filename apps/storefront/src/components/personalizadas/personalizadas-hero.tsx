import { ArrowDown, Crown, Sparkles } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

/**
 * Hero de la página de personalizadas. Mantiene el lenguaje visual del hero de
 * Servicios (fondo carbón, eyebrow amarillo, halos difuminados) con h1 algo
 * menor y sin franja marquee. La ALTURA está unificada con los heroes de la
 * home y de /servicios (min-h 78vh) por petición del cliente.
 */
export function PersonalizadasHero() {
  return (
    <section className="relative overflow-hidden bg-rt-black text-rt-white">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 h-[320px] w-[320px] rounded-full bg-rt-yellow/20 blur-3xl animate-float-slow"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-20 -bottom-16 h-[260px] w-[260px] rounded-full bg-rt-yellow/10 blur-3xl"
      />

      {/* Misma altura (78vh) que el hero de la home y el de /servicios. */}
      <div className="container-page relative flex min-h-[78vh] flex-col items-center justify-center py-12 text-center md:py-16">
        <Reveal as="up">
          <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
            <Sparkles className="h-3.5 w-3.5" />
            Pegatinas personalizadas
          </p>
        </Reveal>

        <Reveal as="up" delay={120}>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(40px,6.5vw,84px)] uppercase leading-[0.96] tracking-[-0.02em]">
            Tu diseño,
            <br />
            <span className="text-rt-yellow">en vinilo premium</span>
          </h1>
        </Reveal>

        <Reveal as="up" delay={240}>
          <p className="mt-5 max-w-[560px] text-balance text-[15px] leading-[1.6] text-rt-ink-300 md:text-[16px]">
            Forma, material, tamaño y cantidad en una sola pantalla. Precio al instante,
            prueba digital antes de imprimir y envío en 24–48 h a toda España.
          </p>
        </Reveal>

        <Reveal as="up" delay={360}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <a href="#configurador">
                Diseñar ahora <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild variant="ghostInv" size="lg">
              <Link href="/planes">
                <Crown className="h-4 w-4" />
                Únete al Club
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
