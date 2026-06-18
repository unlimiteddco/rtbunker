import { Lock, ShieldCheck, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'

interface Badge {
  icon: LucideIcon
  title: string
  body: string
}

const BADGES: Badge[] = [
  {
    icon: ShieldCheck,
    title: 'Calidad garantizada',
    body: 'Vinilo premium resistente al sol, la lluvia y el lavado.',
  },
  {
    icon: Truck,
    title: 'Envíos 24-72h',
    body: 'Preparamos y enviamos tu pedido a toda España en tiempo récord.',
  },
  {
    icon: Lock,
    title: 'Pago seguro',
    body: 'Tarjeta cifrada o recogida en tienda. Tú eliges cómo pagar.',
  },
]

/**
 * Franja de confianza · 3 badges sobre fondo carbón para cortar el ritmo
 * entre secciones claras. Iconos en cuadrado amarillo, coherente con el
 * resto del design system.
 */
export function TrustBadges() {
  return (
    <section className="bg-rt-black py-14 md:py-16">
      <div className="container-page">
        <div className="grid gap-8 md:grid-cols-3 md:gap-10">
          {BADGES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} as="up" delay={i * 80}>
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-rt-yellow text-rt-black">
                  <Icon className="h-6 w-6" strokeWidth={1.7} />
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-[17px] font-bold text-rt-white">
                    {title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-[1.55] text-rt-ink-300">
                    {body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
