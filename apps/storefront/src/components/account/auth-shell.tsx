import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

import { Reveal } from '@/components/services/reveal'

interface AuthShellProps {
  /** Eyebrow corto sobre el display ("Bienvenido", "Crear cuenta"...). */
  eyebrow: string
  /** Display Anton. Acepta JSX para poder pintar el span amarillo. */
  display: ReactNode
  /** Subcopy bajo el display. */
  subcopy: string
  /** Mini-features que aparecen en el brand panel. Máx 3. */
  bullets?: { label: string; description: string }[]
  /** Form panel (server o client). */
  children: ReactNode
}

/**
 * Layout split usado por /login y /registro.
 *   - Panel izquierdo (md+): carbón + grid pattern + blob cyan + display Anton
 *     + bullets de marca. Hidden en mobile para que el form coja todo el ancho.
 *   - Panel derecho: tarjeta blanca con el formulario.
 *
 * Reusa los tokens del design system (`bg-grid-carbon`, `rt-yellow`,
 * `<Reveal>`...) para que coincida con /servicios, /personalizadas/aprobar, etc.
 */
export function AuthShell({ eyebrow, display, subcopy, bullets, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-rt-white-2">
      <div className="grid min-h-screen items-stretch md:grid-cols-[1.15fr_1fr]">
        {/* ─── Brand panel ───────────────────────────────────────── */}
        <section className="relative hidden overflow-hidden bg-rt-black text-rt-white md:flex">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-40" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-rt-yellow/20 blur-3xl animate-float-slow"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -left-16 bottom-0 h-[300px] w-[300px] rounded-full bg-rt-yellow/10 blur-3xl"
          />
          <div className="relative z-10 flex flex-col justify-between p-10 lg:p-14">
            <Reveal as="up">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
                <Sparkles className="h-3 w-3" />
                {eyebrow}
              </p>
            </Reveal>

            <div className="flex flex-col gap-6">
              <Reveal as="up" delay={120}>
                <h1 className="font-[family-name:var(--font-display)] text-[clamp(48px,6vw,80px)] uppercase leading-[0.92] tracking-[-0.02em]">
                  {display}
                </h1>
              </Reveal>
              <Reveal as="up" delay={240}>
                <p className="max-w-[420px] text-[16px] leading-[1.6] text-rt-ink-300">
                  {subcopy}
                </p>
              </Reveal>
            </div>

            {bullets && bullets.length > 0 ? (
              <ul className="flex flex-col gap-4 border-t border-rt-black-3 pt-6">
                {bullets.map((b, i) => (
                  <Reveal as="up" delay={360 + i * 100} key={b.label}>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-rt-yellow" />
                      <div>
                        <p className="text-[14px] font-bold uppercase tracking-[0.14em] text-rt-white font-[family-name:var(--font-heading)]">
                          {b.label}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-[1.5] text-rt-ink-300">
                          {b.description}
                        </p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        {/* ─── Form panel ────────────────────────────────────────── */}
        <section className="flex items-center justify-center px-4 py-10 md:px-10 md:py-14">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  )
}
