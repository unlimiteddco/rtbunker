import { Lock, ShieldCheck, Truck } from 'lucide-react'

/**
 * Tres value props con badges cuadrados amarillos (no circulares — el
 * design system es explícito sobre esto). Surface tinted en `--rt-white-2`.
 */
export function WhyUs() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Calidad garantizada',
      body: 'Dale vida a tus objetos con nuestras garantizadas creaciones adhesivas.',
    },
    {
      icon: Truck,
      title: 'Envío express',
      body: 'Envío express a toda España para que tus pegatinas lleguen cuando más las necesitas.',
    },
    {
      icon: Lock,
      title: 'Pago seguro',
      body: 'Pago seguro con tarjeta o recogida en tienda, tu satisfacción es nuestra prioridad.',
    },
  ] as const

  return (
    <section className="bg-rt-white-2 py-20 md:py-24">
      <div className="container-page">
        <h2 className="rt-h3 mb-10 md:mb-12">Por qué comprar en nuestra tienda</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="flex flex-col gap-4 rounded-[20px] border border-rt-ink-100 bg-rt-white p-7"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-rt-yellow text-rt-black">
                <Icon className="h-7 w-7" strokeWidth={1.6} />
              </span>
              <h3 className="font-[family-name:var(--font-heading)] text-[22px] font-bold">
                {title}
              </h3>
              <p className="text-[14px] leading-[1.6] text-rt-ink-500">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
