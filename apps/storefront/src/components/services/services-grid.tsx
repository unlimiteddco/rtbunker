import { ArrowUpRight, Car, Layers, Lightbulb, Paintbrush2, Sparkles, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Link } from '@/i18n/routing'

interface Service {
  key: string
  number: string
  icon: LucideIcon
  title: string
  tagline: string
  description: string
  bullets: string[]
  /** Card "destacada" → fondo carbón, no white. */
  featured?: boolean
}

const SERVICES: Service[] = [
  {
    key: 'car-wrapping',
    number: '01',
    icon: Layers,
    title: 'Car Wrapping',
    tagline: 'Superficial · Full Wrap',
    description:
      'Cambia el color, textura o acabado de tu coche con vinilo de calidad cast. Aplicamos en zonas exteriores o desmontaje completo para un Full Wrap impecable.',
    bullets: ['Materiales 3M / Hexis / KPMF', 'Garantía 2 años', 'Desmontaje incluido'],
    featured: true,
  },
  {
    key: 'car-design',
    number: '02',
    icon: Paintbrush2,
    title: 'Car Design',
    tagline: 'Diseño exterior a medida',
    description:
      'Vinilados parciales pensados para personalizar capó, techo, retrovisores o stripes laterales. Ideal si buscas un toque único sin recubrir el coche entero.',
    bullets: ['Diseños propios o brief', 'Plantillas digitales', 'Acabados mate / brillo / satin'],
  },
  {
    key: 'chrome-delete',
    number: '03',
    icon: Sparkles,
    title: 'Chrome Delete',
    tagline: 'Eliminar cromados',
    description:
      'Cubrimos todas las molduras y embellecedores cromados de tu coche con vinilo negro o de color. Look agresivo, limpio y reversible en cualquier momento.',
    bullets: ['Marcos ventana / parrilla', 'Negro brillo o mate', 'Sin pegamentos residuales'],
  },
  {
    key: 'ahumado-faros',
    number: '04',
    icon: Lightbulb,
    title: 'Ahumado de faros',
    tagline: 'Faros + protección',
    description:
      'Vinilos translúcidos homologables para oscurecer faros y pilotos sin perder visibilidad. También aplicamos láminas de protección PPF en zonas vulnerables.',
    bullets: ['Tonos 20% · 35% · 50%', 'Protección antigrava', 'Homologable ITV'],
  },
  {
    key: 'rotulacion',
    number: '05',
    icon: Type,
    title: 'Rotulación de vehículos',
    tagline: 'Flotas y branding',
    description:
      'Diseñamos y aplicamos rotulaciones para furgonetas, coches comerciales y flotas. Branding completo con tu logo, copy y datos de contacto sobre vinilo de larga duración.',
    bullets: ['Diseño incluido', 'Aplicación en taller', 'Facturación a empresa'],
  },
]

export function ServicesGrid() {
  return (
    <section id="servicios" className="bg-rt-white-2 py-20 md:py-28">
      <div className="container-page">
        <Reveal as="up" className="max-w-[720px]">
          <p className="rt-eyebrow text-rt-yellow-deep">Servicios disponibles</p>
          <h2 className="mt-3 rt-h2 text-balance">
            Cinco maneras de transformar tu coche con vinilo premium.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-rt-ink-500">
            Cada servicio se cotiza individualmente según el vehículo y el alcance.
            Pídenos un presupuesto sin compromiso — te lo enviamos en menos de 24 h con un
            desglose claro.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal key={service.key} as="up" delay={i * 80} className="h-full">
              <ServiceCard service={service} />
            </Reveal>
          ))}

          {/* Card final · CTA */}
          <Reveal as="up" delay={SERVICES.length * 80} className="h-full">
            <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-rt-black-3 bg-rt-black p-7 text-rt-white transition-all duration-[320ms] ease-[var(--ease-out-rt)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rt-yellow/25 blur-3xl transition-opacity duration-500 group-hover:bg-rt-yellow/40"
              />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-rt-yellow text-rt-black">
                  <Car className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <h3 className="mt-6 font-[family-name:var(--font-display)] text-[40px] uppercase leading-none tracking-[-0.02em] text-rt-white">
                  ¿Tu coche
                  <br />
                  no encaja?
                </h3>
                <p className="mt-4 text-[14px] leading-[1.6] text-rt-ink-300">
                  Si lo que necesitas no aparece aquí, cuéntanoslo igual. Trabajamos con
                  cualquier tipo de vehículo: coche, moto, furgo o flota.
                </p>
              </div>
              <Link
                href="/contacto"
                className="relative mt-6 inline-flex items-center gap-2 self-start text-[13px] font-bold uppercase tracking-[0.18em] text-rt-yellow font-[family-name:var(--font-heading)] hover:gap-3 transition-all"
              >
                Cuéntanos tu proyecto
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon
  const isFeatured = !!service.featured

  return (
    <article
      id={service.key}
      className={`group relative flex h-full scroll-mt-28 flex-col justify-between overflow-hidden rounded-[24px] border p-7 transition-all duration-[320ms] ease-[var(--ease-out-rt)] hover:-translate-y-1 ${
        isFeatured
          ? 'border-rt-black-3 bg-rt-black text-rt-white hover:shadow-[var(--shadow-lg)]'
          : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-yellow hover:shadow-[var(--shadow-md)]'
      }`}
    >
      {/* Glow corner */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition-opacity duration-500 ${
          isFeatured ? 'bg-rt-yellow/30' : 'bg-rt-yellow/0 group-hover:bg-rt-yellow/20'
        }`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] transition-colors ${
              isFeatured
                ? 'bg-rt-yellow text-rt-black'
                : 'bg-rt-white-2 text-rt-black group-hover:bg-rt-yellow'
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <span
            className={`font-[family-name:var(--font-display)] text-[40px] uppercase leading-none tracking-[-0.02em] ${
              isFeatured ? 'text-rt-white/15' : 'text-rt-ink-100'
            }`}
          >
            {service.number}
          </span>
        </div>

        <p
          className={`mt-7 text-[11px] font-bold uppercase tracking-[0.2em] font-[family-name:var(--font-heading)] ${
            isFeatured ? 'text-rt-yellow' : 'text-rt-yellow-deep'
          }`}
        >
          {service.tagline}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-heading)] text-[26px] font-bold leading-[1.1]">
          {service.title}
        </h3>
        <p
          className={`mt-3 text-[14px] leading-[1.6] ${
            isFeatured ? 'text-rt-ink-300' : 'text-rt-ink-500'
          }`}
        >
          {service.description}
        </p>

        <ul className="mt-5 space-y-2">
          {service.bullets.map((b) => (
            <li
              key={b}
              className={`flex items-start gap-2 text-[13px] ${
                isFeatured ? 'text-rt-white/90' : 'text-rt-black/80'
              }`}
            >
              <span
                className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                  isFeatured ? 'bg-rt-yellow' : 'bg-rt-yellow'
                }`}
              />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/contacto"
        className={`relative mt-7 inline-flex items-center gap-2 self-start text-[12px] font-bold uppercase tracking-[0.18em] font-[family-name:var(--font-heading)] transition-all hover:gap-3 ${
          isFeatured ? 'text-rt-yellow' : 'text-rt-black'
        }`}
      >
        Solicitar presupuesto · Gratis
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  )
}
