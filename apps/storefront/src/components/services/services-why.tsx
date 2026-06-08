import { Award, Clock4, GaugeCircle, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'

interface Pillar {
  icon: LucideIcon
  title: string
  body: string
}

const PILLARS: Pillar[] = [
  {
    icon: Award,
    title: 'Materiales certificados',
    body: 'Trabajamos exclusivamente con 3M, Hexis y KPMF — los mismos que usan los OEMs.',
  },
  {
    icon: ShieldCheck,
    title: 'Garantía 2 años',
    body: 'Todo trabajo entregado va firmado y con garantía oficial del material aplicado.',
  },
  {
    icon: GaugeCircle,
    title: 'Equipo certificado',
    body: 'Aplicadores con titulación 3M / Hexis y formación continua en nuevas técnicas.',
  },
  {
    icon: Clock4,
    title: 'Plazos cumplidos',
    body: 'Te damos una fecha de entrega real y la cumplimos. Si surge algo, te avisamos.',
  },
]

export function ServicesWhy() {
  return (
    <section className="bg-rt-white-2 py-20 md:py-28">
      <div className="container-page">
        <Reveal as="up" className="max-w-[640px]">
          <p className="rt-eyebrow text-rt-yellow-deep">Por qué Bunker Studio</p>
          <h2 className="mt-3 rt-h2 text-balance">
            Cuatro razones para dejar tu coche en nuestras manos.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} as="up" delay={i * 90}>
              <PillarCard pillar={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PillarCard({ pillar }: { pillar: Pillar }) {
  const Icon = pillar.icon
  return (
    <article className="group relative h-full overflow-hidden rounded-[20px] border border-rt-ink-100 bg-rt-white p-7 transition-all duration-[280ms] ease-[var(--ease-out-rt)] hover:-translate-y-1 hover:border-rt-yellow hover:shadow-[var(--shadow-md)]">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-rt-yellow text-rt-black transition-transform duration-300 group-hover:-rotate-6">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <h3 className="mt-6 font-[family-name:var(--font-heading)] text-[20px] font-bold leading-[1.15] text-rt-black">
        {pillar.title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.6] text-rt-ink-500">{pillar.body}</p>
    </article>
  )
}
