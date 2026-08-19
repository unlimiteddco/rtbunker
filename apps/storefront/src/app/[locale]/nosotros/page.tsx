import type { Metadata } from 'next'
import { ArrowRight, Factory, Lock, ShieldCheck, Truck } from 'lucide-react'
import Image from 'next/image'
import { setRequestLocale } from 'next-intl/server'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Nosotros · RT Bunker',
    description:
      'La historia de RT Bunker: de un proyecto nacido en 2022 de la pasión por el motor a un taller de wrapping, adhesivos y personalización premium. Conoce a Nikita y nuestra filosofía.',
    alternates: { canonical: `/${locale}/nosotros` },
  }
}

const VALUES = [
  { icon: ShieldCheck, title: 'Calidad garantizada', text: 'Solo materiales premium pensados para destacar y resistir el paso del tiempo.' },
  { icon: Lock, title: 'Pago seguro', text: 'Checkout protegido y cifrado. Tus datos siempre a salvo.' },
  { icon: Truck, title: 'Envío express', text: 'Preparamos y enviamos tu pedido en 24–48 h a toda España.' },
  { icon: Factory, title: 'Somos fabricantes', text: 'Producimos en casa, sin intermediarios. Control total del resultado.' },
]

export default async function NosotrosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-rt-black text-rt-white">
        <Image
          src="/about/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-rt-black via-rt-black/75 to-rt-black/30"
        />
        <div className="container-page relative flex min-h-[380px] flex-col justify-center py-16 text-center md:min-h-[480px] md:py-24">
          <Reveal as="up">
            <p className="rt-eyebrow text-rt-yellow">Quiénes somos · desde 2022</p>
            <h1 className="mx-auto mt-4 max-w-[14ch] font-[family-name:var(--font-display)] text-[clamp(36px,7vw,80px)] uppercase leading-[0.95] tracking-[-0.02em]">
              Donde nace la <span className="text-rt-yellow">personalización</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.6] text-rt-ink-300">
              Un proyecto nacido de la pasión por los coches y la búsqueda constante de la
              exclusividad. Cada vehículo es único y merece un toque especial.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── La historia ──────────────────────────────────── */}
      <section className="bg-rt-white py-20 md:py-28">
        <div className="container-page grid gap-12 md:grid-cols-2 md:items-center">
          <Reveal as="left">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[var(--shadow-lg)]">
              <Image
                src="/about/founder.jpg"
                alt="Nikita, fundador de RT Bunker"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal as="right">
            <p className="rt-eyebrow text-rt-yellow-deep">La historia</p>
            <h2 className="mt-3 rt-h2 text-balance">Hola, soy Nikita</h2>
            <div className="mt-5 space-y-4 text-[16px] leading-[1.7] text-rt-ink-700">
              <p>
                Un apasionado amante del mundo del motor y del arte de la personalización de
                vehículos. Desde mis inicios en <strong className="text-rt-black">2022</strong>, he
                forjado un camino desde cero, enfrentando retos con pocos recursos pero con una
                determinación inquebrantable.
              </p>
              <p>
                Mi objetivo no es ofrecer un servicio básico, sino hacer que cada cliente se sienta
                realmente especial. Nos especializamos en <strong className="text-rt-black">car
                wrapping</strong> y adhesivos para vehículos —y muy pronto también en{' '}
                <strong className="text-rt-black">detailing</strong>— usando únicamente materiales
                de alta calidad.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Especialidad (gallery) ───────────────────────── */}
      <section className="bg-rt-white-2 py-14 md:py-20">
        <div className="container-page">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { src: '/about/wrap.jpg', label: 'Car Wrapping', href: '/servicios#car-wrapping' },
              { src: '/about/detailing.jpg', label: 'Car Detailing', href: '/servicios' },
            ].map((g, i) => (
              <Reveal key={g.label} as="up" delay={i * 100}>
                <Link
                  href={g.href}
                  className="group relative block aspect-[16/10] overflow-hidden rounded-[24px] bg-rt-black"
                >
                  <Image
                    src={g.src}
                    alt={g.label}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-90 transition-transform duration-[600ms] ease-[var(--ease-out-rt)] group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-rt-black/70 to-transparent" />
                  <span className="absolute bottom-5 left-5 inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-[15px] font-bold uppercase tracking-[0.12em] text-rt-white">
                    {g.label}
                    <ArrowRight className="h-4 w-4 text-rt-yellow transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Filosofía (quote) ────────────────────────────── */}
      <section className="bg-rt-black py-20 text-rt-white md:py-28">
        <div className="container-page max-w-[920px]">
          <Reveal as="up">
            <p className="rt-eyebrow text-rt-yellow">Nuestra filosofía</p>
            <p className="mt-6 font-[family-name:var(--font-display)] text-[clamp(24px,3.6vw,42px)] uppercase leading-[1.12] tracking-[-0.01em] text-balance">
              Reinvertimos cada beneficio para mejorar. La atención al cliente es nuestra prioridad
              y cada venta crea un servicio más <span className="text-rt-yellow">personalizado y
              único</span>.
            </p>
            <p className="mt-7 max-w-[640px] text-[16px] leading-[1.7] text-rt-ink-300">
              La transparencia es la base de nuestra relación contigo. Si algo no está a la altura
              de tus expectativas, queremos saberlo: estamos aquí para aprender y evolucionar.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── El nombre ────────────────────────────────────── */}
      <section className="bg-rt-white py-20 md:py-28">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
          <Reveal as="left">
            <p className="rt-eyebrow text-rt-yellow-deep">El nombre</p>
            <h2 className="mt-3 rt-h2 text-balance">¿Por qué RT Bunker?</h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-rt-ink-700">
              El nombre tiene sus raíces en mi origen ruso y en la pasión por el mundo del motor.
              Dos ideas que lo resumen todo.
            </p>
          </Reveal>

          <Reveal as="right">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-rt-black-3 bg-rt-black p-7 text-rt-white">
                <p className="font-[family-name:var(--font-display)] text-[44px] leading-none text-rt-yellow">
                  RT
                </p>
                <p className="mt-4 font-[family-name:var(--font-heading)] text-[15px] font-bold uppercase tracking-[0.08em]">
                  RusoTurista
                </p>
                <p className="mt-2 text-[13px] leading-[1.5] text-rt-ink-300">
                  El apodo que siempre me ha acompañado, por mi origen ruso.
                </p>
              </div>
              <div className="rounded-[24px] border border-rt-ink-100 bg-rt-white-2 p-7">
                <p className="font-[family-name:var(--font-display)] text-[44px] leading-none text-rt-black">
                  Bunker
                </p>
                <p className="mt-4 font-[family-name:var(--font-heading)] text-[15px] font-bold uppercase tracking-[0.08em] text-rt-black">
                  El taller
                </p>
                <p className="mt-2 text-[13px] leading-[1.5] text-rt-ink-700">
                  El lugar donde nacen la creatividad y la personalización que ofrecemos.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Valores ──────────────────────────────────────── */}
      <section className="bg-rt-white-2 py-20 md:py-28">
        <div className="container-page">
          <Reveal as="up" className="mx-auto max-w-[640px] text-center">
            <p className="rt-eyebrow text-rt-yellow-deep">Por qué confiar en nosotros</p>
            <h2 className="mt-3 rt-h2 text-balance">Excelencia y durabilidad en cada detalle</h2>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = v.icon
              return (
                <Reveal key={v.title} as="up" delay={i * 80} className="h-full">
                  <div className="flex h-full flex-col rounded-[20px] border border-rt-ink-100 bg-rt-white p-6">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-rt-yellow/15 text-rt-yellow-deep">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-[family-name:var(--font-heading)] text-[16px] font-bold text-rt-black">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.55] text-rt-ink-500">{v.text}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Firma + CTA ──────────────────────────────────── */}
      <section className="bg-rt-black py-20 text-rt-white md:py-28">
        <div className="container-page">
          <Reveal as="up" className="max-w-[680px]">
            <p className="font-[family-name:var(--font-display)] text-[clamp(22px,2.8vw,32px)] uppercase leading-[1.1] tracking-[-0.01em]">
              Gracias por ser parte de esta travesía. No solo personalizamos vehículos:{' '}
              <span className="text-rt-yellow">creamos experiencias únicas sobre ruedas</span>.
            </p>
            <p className="mt-6 font-[family-name:var(--font-heading)] text-[14px] font-bold uppercase tracking-[0.14em] text-rt-ink-300">
              Nikita · Fundador de RT Bunker
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="primary" size="lg">
                <Link href="/tienda">
                  Ver la tienda
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghostInv" size="lg">
                <Link href="/personalizadas">Diseña tu pegatina</Link>
              </Button>
              <Button asChild variant="ghostInv" size="lg">
                <Link href="/servicios">Nuestros servicios</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
