import type { Metadata } from 'next'
import { Check, Crown, Sparkles, Star, Truck, Zap } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import { PlanCheckoutButton } from '@/components/memberships/plan-checkout-button'
import { Reveal } from '@/components/services/reveal'
import { FaqChat, type FaqChatItem } from '@/components/ui/faq-chat'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { MEMBERSHIP_TIERS, type MembershipTier, tierSavingsPct } from '@/lib/memberships'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Planes de suscripción · RT Bunker Club',
    description:
      'Hazte socio de RT Bunker: créditos mensuales para pegatinas personalizadas, envío urgente gratis, impresión el mismo día y hasta un 10% de descuento en todos tus pedidos.',
    alternates: { canonical: `/${locale}/planes` },
  }
}

const ACCENT: Record<MembershipTier['accent'], { text: string; ring: string; chip: string }> = {
  bronce: { text: 'text-[#c0894a]', ring: 'ring-[#c0894a]/40', chip: 'bg-[#c0894a]/12 text-[#a06d33]' },
  plata: { text: 'text-[#7f8794]', ring: 'ring-[#7f8794]/40', chip: 'bg-[#7f8794]/12 text-[#5f6675]' },
  gold: { text: 'text-[#c69214]', ring: 'ring-[#c69214]/40', chip: 'bg-[#c69214]/12 text-[#9a7110]' },
}

const eur = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2).replace('.', ','))

export default async function PlanesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-rt-black text-rt-white">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-rt-yellow/20 blur-3xl"
        />
        <div className="container-page relative py-16 text-center md:py-24">
          <Reveal as="up">
            <p className="rt-eyebrow inline-flex items-center gap-2 text-rt-yellow">
              <Crown className="h-4 w-4" /> RT Bunker Club
            </p>
            <h1 className="mx-auto mt-4 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(36px,7vw,80px)] uppercase leading-[0.95] tracking-[-0.02em]">
              Hazte socio y <span className="text-rt-yellow">produce más</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.6] text-rt-ink-300">
              Créditos mensuales para pegatinas personalizadas, envío urgente gratis, impresión el
              mismo día y descuento en todos tus pedidos. Cancela cuando quieras.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── Tarjetas de planes ───────────────────────────── */}
      <section className="bg-rt-white-2 py-16 md:py-24">
        <div className="container-page">
          <div className="grid items-start gap-6 lg:grid-cols-3">
            {MEMBERSHIP_TIERS.map((tier, i) => (
              <Reveal key={tier.id} as="up" delay={i * 90} className="h-full">
                <PlanCard tier={tier} />
              </Reveal>
            ))}
          </div>

          <p className="mt-8 text-center text-[13px] text-rt-ink-500">
            Precios con IVA incluido · facturación mensual · puedes cancelar en cualquier momento
            desde tu cuenta.
          </p>
        </div>
      </section>

      {/* ─── FAQ del Club (chat) ──────────────────────────── */}
      <section className="bg-rt-white py-16 md:py-24">
        <div className="container-page">
          <Reveal as="up">
            <FaqChat eyebrow="RT Bunker Club" title="Preguntas frecuentes" items={CLUB_FAQS} />
          </Reveal>
        </div>
      </section>

      {/* ─── Cómo funcionan los créditos ──────────────────── */}
      <section className="bg-rt-white-2 py-16 md:py-24">
        <div className="container-page">
          <Reveal as="up" className="mx-auto max-w-[640px] text-center">
            <p className="rt-eyebrow text-rt-yellow-deep">Cómo funciona</p>
            <h2 className="mt-3 rt-h2 text-balance">Tus créditos, tus pegatinas</h2>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: '1 crédito = 1 pegatina',
                text: 'Cada crédito canjea una pegatina personalizada de 5, 7 o 9 cm, en cualquier acabado.',
              },
              {
                icon: Zap,
                title: 'Se recargan cada mes',
                text: 'Tu saldo de créditos se renueva automáticamente en cada ciclo de facturación.',
              },
              {
                icon: Truck,
                title: 'Envío urgente gratis',
                text: 'Todos los socios reciben envío exprés sin coste e impresión el mismo día del pedido.',
              },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="rounded-[20px] border border-rt-ink-100 bg-rt-white p-6 text-center"
                >
                  <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-rt-yellow/15 text-rt-yellow-deep">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-[family-name:var(--font-heading)] text-[16px] font-bold text-rt-black">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.55] text-rt-ink-500">{step.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA final ────────────────────────────────────── */}
      <section className="bg-rt-white py-16 md:py-24">
        <div className="container-page mx-auto max-w-2xl">
          <div className="rounded-[20px] bg-rt-black p-8 text-center text-rt-white">
            <p className="font-[family-name:var(--font-display)] text-[clamp(22px,3vw,32px)] uppercase leading-[1.1]">
              ¿Aún con dudas?
            </p>
            <p className="mx-auto mt-2 max-w-[440px] text-[14px] text-rt-ink-300">
              Escríbenos y te ayudamos a elegir el plan que mejor encaja con tu volumen.
            </p>
            <Link
              href="/contacto"
              className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-rt-yellow px-6 py-3 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.14em] text-rt-black transition-colors hover:bg-rt-yellow-deep"
            >
              Hablar con el equipo
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function PlanCard({ tier }: { tier: MembershipTier }) {
  const accent = ACCENT[tier.accent]
  const savings = tierSavingsPct(tier)
  const popular = Boolean(tier.popular)

  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-[24px] border bg-rt-white p-7',
        popular
          ? 'border-transparent shadow-[var(--shadow-lg)] ring-2 ring-rt-yellow'
          : 'border-rt-ink-100',
      )}
    >
      {popular ? (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-rt-yellow px-3 py-1 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.16em] text-rt-black">
          <Star className="h-3 w-3 fill-current" /> Más popular
        </span>
      ) : null}

      <header>
        <div className="flex items-center gap-2">
          <Crown className={cn('h-5 w-5', accent.text)} />
          <h3 className="font-[family-name:var(--font-display)] text-[26px] uppercase leading-none tracking-[-0.01em] text-rt-black">
            {tier.name}
          </h3>
        </div>
        <p className="mt-2 text-[14px] text-rt-ink-500">{tier.tagline}</p>
      </header>

      <div className="mt-6 flex items-end gap-1.5">
        <span className="font-[family-name:var(--font-display)] text-[44px] leading-none tracking-[-0.02em] text-rt-black">
          {eur(tier.pricePerMonth)}€
        </span>
        <span className="mb-1 text-[14px] font-medium text-rt-ink-500">/mes</span>
      </div>
      <p className="mt-1 text-[13px] text-rt-ink-500">
        Valor <span className="line-through">{eur(tier.value)}€</span>
        {savings > 0 ? (
          <span className="ml-1.5 font-semibold text-rt-success">ahorras {savings}%</span>
        ) : null}
      </p>

      {tier.credits > 0 ? (
        <div className={cn('mt-5 rounded-[12px] px-3 py-2 text-center', accent.chip)}>
          <span className="font-[family-name:var(--font-heading)] text-[15px] font-bold uppercase tracking-[0.04em]">
            {tier.credits} créditos / mes
          </span>
        </div>
      ) : null}

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {tier.benefits.map((b) => (
          <li key={b.label} className="flex items-start gap-2.5">
            <Check
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                b.highlight ? 'text-rt-yellow-deep' : 'text-rt-ink-300',
              )}
              strokeWidth={3}
            />
            <span
              className={cn(
                'text-[14px] leading-[1.45]',
                b.highlight ? 'font-semibold text-rt-black' : 'text-rt-ink-700',
              )}
            >
              {b.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <PlanCheckoutButton
          tierId={tier.id}
          variant={popular ? 'primary' : 'dark'}
          label={`Hazte ${tier.name}`}
        />
      </div>
    </div>
  )
}

const CLUB_FAQS: FaqChatItem[] = [
  {
    q: '¿Diseñas tú las pegatinas para mí?',
    a: 'No, tú subes tus propios diseños, logotipo, lo que quieras, y nosotros te lo imprimimos y enviamos. Puedes acumular créditos indefinidamente.',
  },
  {
    q: '¿Cómo funcionan los créditos de las pegatinas?',
    a: 'Cada mes recibirás créditos para pegatinas personalizadas que podrás usar para añadir pegatinas a cualquier pedido, o simplemente solicitar tus pegatinas mensuales sin coste adicional. Todas están impresas en material de alta calidad y resistente a la intemperie.',
  },
  {
    q: '¿De qué tamaño son los créditos de las pegatinas?',
    a: 'Los créditos para pegatinas son válidos para pegatinas de 5, 7 y 9 cm. Sin embargo, las de 5 cm son las más comunes para botellas de agua, portátiles, neveras portátiles, etc.',
  },
  {
    q: '¿Los créditos solo funcionan con pegatinas de vinilo normales?',
    a: 'Puedes usar tus créditos para todo tipo de pegatinas: holográficas, con purpurina, transparentes, cromadas, etc.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Por supuesto. Puedes cancelar tu membresía Pro en cualquier momento sin cargos adicionales. Tus beneficios finalizarán de inmediato, pero tus créditos seguirán siendo válidos hasta que los uses.',
  },
  {
    q: '¿Cómo funciona el Fast Pass?',
    a: 'El Pase Rápido es una función que te permite priorizar tu pedido, lo que se traduce en tiempos de entrega más rápidos para todos tus pedidos de pegatinas personalizadas. Los pedidos Pro se imprimen normalmente en 24 horas.',
  },
  {
    q: '¿Qué incluye el soporte exclusivo?',
    a: 'Los miembros Pro tienen acceso directo a nuestro equipo de soporte por WhatsApp para obtener respuestas más rápidas y asistencia personalizada con sus pedidos y consultas de diseño. ¡Antes o después de realizar su pedido!',
  },
]
