import { CalendarCheck, ShieldCheck, ShieldX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'

interface WarrantyPoint {
  icon: LucideIcon
  title: string
  body: string
}

// TODO Nikita: confirmar el alcance, las exclusiones y la duración exacta de la garantía.
const POINTS: WarrantyPoint[] = [
  {
    icon: ShieldCheck,
    title: 'Qué cubre',
    body: 'La instalación del material aplicado: despegues en bordes, burbujas, levantamientos o fallos de adhesión imputables al montaje. Lo reparamos sin coste.',
  },
  {
    icon: ShieldX,
    title: 'Qué excluye',
    body: 'Daños por mal uso, mal mantenimiento o lavados agresivos: impactos, rascadas, lavados a presión a corta distancia y productos abrasivos no recomendados.',
  },
  {
    icon: CalendarCheck,
    title: 'Duración',
    body: '2 años desde la entrega, con certificado de aplicación firmado y una guía de cuidados para que la garantía se mantenga válida.',
  },
]

export function ServicesWarranty() {
  return (
    <section className="bg-rt-black py-20 text-rt-white md:py-28">
      <div className="container-page">
        <Reveal as="up" className="max-w-[680px]">
          <p className="rt-eyebrow text-rt-yellow">Tranquilidad garantizada</p>
          <h2 className="mt-3 rt-h2 text-balance text-rt-white">Garantía de 2 años.</h2>
          <p className="mt-5 text-[15px] leading-[1.65] text-rt-ink-300">
            Cada trabajo se entrega firmado y con garantía oficial sobre la instalación del material
            aplicado. Sin letra pequeña: te explicamos qué cubre, qué no y durante cuánto tiempo.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {POINTS.map((p, i) => (
            <Reveal key={p.title} as="up" delay={i * 90}>
              <WarrantyCard point={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function WarrantyCard({ point }: { point: WarrantyPoint }) {
  const Icon = point.icon
  return (
    <article className="group relative h-full overflow-hidden rounded-[20px] border border-rt-black-3 bg-rt-black-2 p-7 transition-all duration-[280ms] ease-[var(--ease-out-rt)] hover:-translate-y-1 hover:border-rt-yellow hover:shadow-[var(--shadow-md)]">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-rt-yellow text-rt-black transition-transform duration-300 group-hover:-rotate-6">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <h3 className="mt-6 font-[family-name:var(--font-heading)] text-[20px] font-bold leading-[1.15] text-rt-white">
        {point.title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.6] text-rt-ink-300">{point.body}</p>
    </article>
  )
}
