import { Check, Crown, Sparkles } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import { ManageSubscriptionButton } from '@/components/memberships/manage-subscription-button'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { getMembership, isActiveMembership } from '@/lib/membership'
import { getTier } from '@/lib/memberships'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: 'Activa', cls: 'bg-rt-success/15 text-rt-success' },
  past_due: { label: 'Pago pendiente', cls: 'bg-rt-danger/10 text-rt-danger' },
  canceled: { label: 'Cancelada', cls: 'bg-rt-ink-100 text-rt-ink-700' },
  incomplete: { label: 'Procesando', cls: 'bg-rt-yellow/15 text-rt-yellow-deep' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default async function SubscriptionPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { status } = await searchParams
  setRequestLocale(locale)

  const membership = await getMembership()
  const tier = membership ? getTier(membership.tier) : undefined
  const active = isActiveMembership(membership)
  const justSubscribed = status === 'success'

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-rt-black">Mi suscripción</h2>
        <p className="text-sm text-rt-ink-500">Gestiona tu plan del RT Bunker Club.</p>
      </header>

      {justSubscribed && !active ? (
        <div className="rounded-[14px] border border-rt-yellow/40 bg-rt-yellow/10 p-4 text-sm text-rt-black">
          <p className="font-semibold">¡Pago recibido! Estamos activando tu suscripción…</p>
          <p className="mt-1 text-rt-ink-700">
            Puede tardar unos segundos. Recarga la página en un momento.
          </p>
        </div>
      ) : null}

      {active && tier && membership ? (
        <div className="space-y-5">
          <div className="rounded-[18px] border border-rt-ink-100 bg-rt-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-rt-yellow/15 text-rt-yellow-deep">
                  <Crown className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-[24px] uppercase leading-none tracking-[-0.01em] text-rt-black">
                    {tier.name}
                  </p>
                  <p className="mt-1 text-[13px] text-rt-ink-500">
                    {tier.pricePerMonth}€/mes · {tier.discountPct}% de descuento en todos tus pedidos
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                  STATUS_LABEL[membership.status]?.cls ?? STATUS_LABEL.incomplete!.cls
                }`}
              >
                {STATUS_LABEL[membership.status]?.label ?? membership.status}
              </span>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-rt-ink-100 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-[12px] font-bold uppercase tracking-[0.1em] text-rt-ink-500">
                  {membership.cancel_at_period_end ? 'Acceso hasta' : 'Próxima renovación'}
                </dt>
                <dd className="mt-1 text-[15px] font-medium text-rt-black">
                  {formatDate(membership.current_period_end)}
                </dd>
              </div>
              {tier.credits > 0 ? (
                <div>
                  <dt className="text-[12px] font-bold uppercase tracking-[0.1em] text-rt-ink-500">
                    Créditos disponibles
                  </dt>
                  <dd className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-medium text-rt-black">
                    <Sparkles className="h-4 w-4 text-rt-yellow-deep" />
                    {membership.credits_balance} / {tier.credits}
                  </dd>
                </div>
              ) : null}
            </dl>

            {membership.cancel_at_period_end ? (
              <p className="mt-4 rounded-[10px] bg-rt-white-2 px-3 py-2 text-[13px] text-rt-ink-700">
                Tu suscripción se cancelará al final del periodo actual. Mantienes los beneficios
                hasta entonces.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <ManageSubscriptionButton />
              <Button asChild variant="ghost" size="default">
                <Link href="/planes">Ver planes</Link>
              </Button>
            </div>
          </div>

          {/* Beneficios del plan */}
          <div className="rounded-[18px] border border-rt-ink-100 bg-rt-white p-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-rt-ink-500">
              Tus beneficios
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {tier.benefits.map((b) => (
                <li key={b.label} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-rt-yellow-deep" strokeWidth={3} />
                  <span className="text-[14px] leading-[1.45] text-rt-ink-700">{b.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-rt-ink-100 bg-rt-white p-10 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-rt-yellow/15 text-rt-yellow-deep">
            <Crown className="h-6 w-6" />
          </span>
          <p className="mt-4 font-[family-name:var(--font-heading)] text-[18px] font-bold text-rt-black">
            Aún no eres socio
          </p>
          <p className="mx-auto mt-1 max-w-[420px] text-[14px] text-rt-ink-500">
            Únete al RT Bunker Club y consigue créditos para pegatinas, envío urgente gratis y
            descuento en todos tus pedidos.
          </p>
          <Button asChild variant="primary" size="lg" className="mt-6">
            <Link href="/planes">Ver planes</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
