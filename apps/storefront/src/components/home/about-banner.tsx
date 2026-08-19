import { ArrowRight } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

/**
 * Banner carbón "Sobre nosotros". Va inmediatamente después de `ScrollShowcase`
 * —cuya última fila es "El taller donde nacen las RT Bunker"— para que el CTA a
 * /nosotros quede justo donde se cuenta el origen de la marca (petición del
 * cliente: "poner esto mejor en donde nacen las RT Bunker").
 */
export function AboutBanner() {
  return (
    <section className="relative overflow-hidden bg-rt-black text-rt-white">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full bg-rt-yellow/15 blur-3xl"
      />

      <div className="container-page relative py-16 md:py-20">
        <Reveal as="up">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
            <div className="max-w-[640px]">
              <p className="rt-eyebrow text-rt-yellow">Sobre nosotros · RT Bunker</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(28px,4.4vw,52px)] uppercase leading-[1.02] tracking-[-0.02em] text-balance">
                Conoce la historia y valores de nuestra marca
              </h2>
            </div>

            <Button asChild variant="primary" size="lg" className="shrink-0">
              <Link href="/nosotros">
                Conócenos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
