import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

const HERO_STATS = [
  { value: '120+', label: 'productos' },
  { value: '18', label: 'marcas' },
  { value: '24h', label: 'envío exprés' },
  { value: '2022', label: 'fabricando' },
] as const

/**
 * Hero homepage · pieza de conversión.
 *
 * Optimizado para:
 *   - Captar al comprador en 3s (display + value prop + trust pill).
 *   - CTA primario claro a /tienda + secundaria a /personalizadas.
 *   - Trust signals visibles antes del fold (envío, made in Spain, materiales).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-rt-black text-rt-white">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-rt-yellow/22 blur-3xl animate-float-slow"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 -bottom-20 h-[320px] w-[320px] rounded-full bg-rt-yellow/12 blur-3xl"
      />

      {/* Altura unificada con /servicios y /personalizadas (78vh) y algo más
          baja que antes, según feedback del cliente. */}
      <div className="container-page relative flex min-h-[78vh] flex-col items-center justify-center py-16 text-center md:py-20">
        <Reveal as="up">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-rt-white/15 bg-rt-black/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-rt-white/85 font-[family-name:var(--font-heading)] backdrop-blur">
            <span className="inline-flex items-center gap-1.5 text-rt-yellow">
              <Sparkles className="h-3 w-3" />
              Fabricado en España
            </span>
            <span aria-hidden className="text-rt-white/25">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3 w-3" />
              Envío 24-72 h
            </span>
            <span aria-hidden className="text-rt-white/25">·</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              Vinilo premium
            </span>
          </span>
        </Reveal>

        <Reveal as="up" delay={120}>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(54px,9vw,128px)] uppercase leading-[0.92] tracking-[-0.02em]">
            Pegatinas <span className="text-rt-yellow">premium</span>
            <br />
            para tu coche
          </h1>
        </Reveal>

        <Reveal as="up" delay={240}>
          <p className="mt-6 max-w-[640px] text-balance text-[16px] leading-[1.6] text-rt-ink-300 md:text-[17px]">
            Hechas a mano en Cuarte de Huerva. Diseña la tuya o elige entre 120+ productos
            listos para enviar.
          </p>
        </Reveal>

        <Reveal as="up" delay={360}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/tienda">
                Ver tienda completa <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="ghostInv" size="lg">
              <Link href="/personalizadas">Diseña la tuya</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal as="up" delay={480}>
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
    </section>
  )
}
