import { Reveal } from '@/components/services/reveal'
import { resolveIcon, type ProcessStep } from '@/lib/site-content'

interface ServicesProcessProps {
  /** Pasos del proceso (backend, con respaldo estático). */
  steps: ProcessStep[]
}

export function ServicesProcess({ steps }: ServicesProcessProps) {
  return (
    <section className="relative overflow-hidden bg-rt-white py-20 md:py-28">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rt-ink-100 to-transparent"
      />

      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <Reveal as="left">
            <p className="rt-eyebrow text-rt-yellow-deep">Cómo trabajamos</p>
            <h2 className="mt-3 rt-h2 text-balance">
              De la idea al coche listo en cuatro pasos claros.
            </h2>
            <p className="mt-5 max-w-[420px] text-[16px] leading-[1.65] text-rt-ink-500">
              Sin promesas vacías ni sobrecostes. Cada proyecto pasa por el mismo proceso
              probado en más de 120 coches.
            </p>
          </Reveal>

          <ol className="relative space-y-5">
            {/* Línea vertical conectora */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[27px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-rt-yellow via-rt-ink-100 to-transparent md:block"
            />
            {steps.map((step, i) => (
              <Reveal key={step.id} as="up" delay={i * 100}>
                {/* El número 01/02/03… se deriva de la posición en la lista. */}
                <ProcessStepItem step={step} number={String(i + 1).padStart(2, '0')} />
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function ProcessStepItem({ step, number }: { step: ProcessStep; number: string }) {
  const Icon = resolveIcon(step.icon)
  return (
    <li className="group relative flex items-start gap-5 rounded-[20px] border border-rt-ink-100 bg-rt-white p-5 transition-all duration-[280ms] ease-[var(--ease-out-rt)] hover:-translate-y-0.5 hover:border-rt-yellow hover:shadow-[var(--shadow-md)] md:p-6">
      <span className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-rt-black text-rt-yellow transition-colors duration-300 group-hover:bg-rt-yellow group-hover:text-rt-black">
        <Icon className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-display)] text-[20px] uppercase leading-none tracking-[-0.02em] text-rt-ink-300">
            {number}
          </span>
          <span className="rounded-full bg-rt-white-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
            {step.badge}
          </span>
        </div>
        <h3 className="mt-2 font-[family-name:var(--font-heading)] text-[22px] font-bold leading-[1.1] text-rt-black">
          {step.title}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.6] text-rt-ink-500">{step.description}</p>
      </div>
    </li>
  )
}
