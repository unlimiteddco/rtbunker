import { Sparkles } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'

/**
 * Hero de la página de personalizadas. Mantiene el lenguaje visual del hero de
 * Servicios (fondo carbón, eyebrow amarillo, halos difuminados). Su ALTURA está
 * igualada a la del resto de cabeceras oscuras (referencia: /planes ≈ 480 px);
 * la home es la única excepción. Sin botones: el configurador aparece justo
 * debajo con "Vinilos" ya seleccionado, así que el CTA sería redundante.
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

      {/* Misma altura que el resto de cabeceras oscuras (referencia: /planes):
          py-16 / md:py-24, sin min-h. La home es la única excepción. */}
      <div className="container-page relative flex min-h-[380px] flex-col items-center justify-center py-16 text-center md:min-h-[480px] md:py-24">
        <Reveal as="up">
          <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
            <Sparkles className="h-3.5 w-3.5" />
            Pegatinas personalizadas
          </p>
        </Reveal>

        <Reveal as="up" delay={120}>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(36px,7vw,80px)] uppercase leading-[0.95] tracking-[-0.02em]">
            Tu diseño,
            <br />
            <span className="text-rt-yellow">en vinilo premium</span>
          </h1>
        </Reveal>

        <Reveal as="up" delay={240}>
          {/* Máximo dos líneas: el detalle ya se explica en el configurador. */}
          <p className="mt-5 max-w-[560px] text-balance text-[15px] leading-[1.6] text-rt-ink-300 md:text-[16px]">
            Precio al instante, prueba digital antes de imprimir y envío en 24–48 h.
          </p>
        </Reveal>

      </div>
    </section>
  )
}
