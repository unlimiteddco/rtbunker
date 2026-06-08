import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Package,
  RefreshCw,
  Sparkles,
  Truck,
} from 'lucide-react'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { InlineApproval } from '@/components/personalizadas/inline-approval'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/i18n/routing'
import { sdk } from '@/lib/medusa'
import {
  STATUS_COPY,
  STATUS_LABEL,
  STATUS_STEPS,
  describeMaterial,
  describeShape,
  describeShortConfig,
  describeSize,
  isCancelled,
  statusStepIndex,
  type CustomerCustomOrder,
} from '@/lib/customer-custom-orders'
import { formatMoney } from '@/lib/format'

export const dynamic = 'force-dynamic'

interface DetailResponse {
  custom_order: CustomerCustomOrder
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function CustomerCustomOrderDetailPage({ params }: PageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const c = await cookies()
  const cookieHeader = c.toString()

  let order: CustomerCustomOrder | null = null
  try {
    const res = await sdk.client.fetch<DetailResponse>(
      `/store/customers/me/custom-orders/${id}`,
      {
        headers: { Cookie: cookieHeader },
        cache: 'no-store',
      },
    )
    order = res.custom_order
  } catch {
    notFound()
  }

  if (!order) notFound()

  const proofs = [...(order.proofs ?? [])].sort((a, b) => b.version - a.version)
  const latestProof = proofs[0] ?? null
  const cancelled = isCancelled(order.status)
  const stepIdx = statusStepIndex(order.status)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href="/cuenta/personalizadas">
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </Link>
          </Button>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Pedido #{order.short_id}
          </h2>
          <p className="text-sm text-muted-foreground">
            Hecho el{' '}
            {new Date(order.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total pagado</p>
          <p className="font-[family-name:var(--font-display)] text-3xl uppercase leading-none tracking-[-0.02em] tabular-nums text-rt-yellow">
            {formatMoney(order.total_price, 'eur')}
          </p>
        </div>
      </header>

      {/* Stepper visual */}
      {!cancelled ? <StatusStepper stepIdx={stepIdx} status={order.status} /> : null}

      {/* Copy del estado actual */}
      <div className="rounded-2xl border border-rt-yellow-soft bg-rt-yellow-soft/30 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-rt-yellow-deep font-[family-name:var(--font-heading)]">
          <Sparkles className="h-3 w-3" />
          {STATUS_LABEL[order.status]}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-rt-black">{STATUS_COPY[order.status]}</p>
        {order.status === 'proof_sent' && latestProof ? (
          <div className="mt-4 rounded-xl border border-rt-yellow/40 bg-rt-white p-3">
            <InlineApproval customOrderId={order.id} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
        {/* Timeline de mockups */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Mockups recibidos</h3>
          {proofs.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Todavía no hay mockup. Te avisaremos por email cuando esté listo.
            </p>
          ) : (
            <ol className="space-y-3">
              {proofs.map((p) => (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-[4/3] bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={`Mockup v${p.version}`}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rt-yellow px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-rt-black font-[family-name:var(--font-heading)]">
                      v{p.version}
                    </span>
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-rt-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rt-white backdrop-blur-sm">
                      <ExternalLink className="h-3 w-3" />
                      Abrir
                    </span>
                  </a>
                  <div className="space-y-2 p-4 text-sm">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(p.sent_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {p.admin_notes ? (
                      <p className="rounded-md bg-muted/50 p-2 text-sm leading-relaxed">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          Nota del equipo
                        </span>
                        <br />
                        {p.admin_notes}
                      </p>
                    ) : null}
                    {p.customer_response === 'approved' ? (
                      <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Aprobaste esta versión
                        {p.customer_response_at
                          ? ` el ${new Date(p.customer_response_at).toLocaleDateString('es-ES')}`
                          : ''}
                      </p>
                    ) : p.customer_response === 'changes_requested' ? (
                      <p className="flex items-center gap-2 text-sm font-medium text-orange-700">
                        <RefreshCw className="h-4 w-4" />
                        Pediste cambios
                      </p>
                    ) : null}
                    {p.customer_response_notes ? (
                      <p className="rounded-md border border-border bg-background p-2 text-sm">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          Tus notas
                        </span>
                        <br />
                        {p.customer_response_notes}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Sidebar: config + envío + diseño */}
        <aside className="space-y-4">
          <ConfigCard order={order} />
          <DesignCard order={order} />
          {order.status === 'shipped' || order.status === 'delivered' ? (
            <TrackingCard order={order} />
          ) : null}
        </aside>
      </div>
    </div>
  )
}

// ─── Stepper ─────────────────────────────────────────────────────────

function StatusStepper({ stepIdx, status }: { stepIdx: number; status: string }) {
  const labels: Record<string, { icon: typeof Clock; label: string }> = {
    pending_review: { icon: Sparkles, label: 'Recibido' },
    proof_sent: { icon: FileText, label: 'Mockup' },
    approved: { icon: CheckCircle2, label: 'Aprobado' },
    in_production: { icon: Package, label: 'En taller' },
    shipped: { icon: Truck, label: 'Enviado' },
    delivered: { icon: CheckCircle2, label: 'Entregado' },
  }

  return (
    <ol className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 md:grid-cols-6">
      {STATUS_STEPS.map((s, i) => {
        const meta = labels[s]!
        const Icon = meta.icon
        const done = i < stepIdx
        const current = i === stepIdx
        const future = i > stepIdx
        return (
          <li
            key={s}
            className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center transition-colors ${
              current ? 'bg-rt-yellow-soft/40' : ''
            }`}
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                done
                  ? 'bg-rt-yellow text-rt-black'
                  : current
                    ? 'bg-rt-black text-rt-yellow'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.12em] font-[family-name:var(--font-heading)] ${
                future ? 'text-muted-foreground/60' : 'text-rt-black'
              }`}
            >
              {meta.label}
            </span>
          </li>
        )
      })}
      {/* aux: silenciar warning de typecheck */}
      <span className="hidden" aria-hidden>{status}</span>
    </ol>
  )
}

// ─── Sidebar cards ───────────────────────────────────────────────────

function ConfigCard({ order }: { order: CustomerCustomOrder }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground font-[family-name:var(--font-heading)]">
        Tu configuración
      </p>
      <dl className="space-y-2 text-sm">
        <Row label="Forma" value={describeShape(order.shape)} />
        <Row label="Material" value={describeMaterial(order.material)} />
        <Row label="Tamaño" value={describeSize(order)} />
        <Row label="Unidades" value={String(order.units)} />
        <Row label="Precio unidad" value={formatMoney(order.unit_price, 'eur')} />
      </dl>
      <Separator />
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground font-[family-name:var(--font-heading)]">
          Total
        </span>
        <span className="text-lg font-semibold tabular-nums">
          {formatMoney(order.total_price, 'eur')}
        </span>
      </div>
    </div>
  )
}

function DesignCard({ order }: { order: CustomerCustomOrder }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground font-[family-name:var(--font-heading)]">
        Tu diseño
      </p>
      {order.design_file_url ? (
        <a
          href={order.design_file_url}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-lg border border-border bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.design_file_url}
            alt={order.design_file_name ?? 'Tu diseño'}
            className="h-32 w-full object-contain"
          />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">Sin archivo subido.</p>
      )}
      {order.design_file_name ? (
        <p className="truncate text-xs text-muted-foreground">{order.design_file_name}</p>
      ) : null}
      {order.customer_notes ? (
        <p className="rounded-md bg-muted/50 p-2 text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-[0.12em]">Notas que enviaste</span>
          <br />
          {order.customer_notes}
        </p>
      ) : null}
    </div>
  )
}

function TrackingCard({ order }: { order: CustomerCustomOrder }) {
  return (
    <div className="space-y-3 rounded-2xl border border-rt-yellow/40 bg-rt-yellow-soft/20 p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-rt-yellow-deep font-[family-name:var(--font-heading)]">
        <Truck className="h-3 w-3" />
        Seguimiento
      </p>
      {order.shipping_carrier ? <p className="text-sm font-medium">{order.shipping_carrier}</p> : null}
      {order.tracking_number ? (
        <p className="font-mono text-sm tabular-nums text-rt-black">{order.tracking_number}</p>
      ) : null}
      {order.tracking_url ? (
        <Button asChild size="sm" variant="dark" className="w-full justify-center">
          <a href={order.tracking_url} target="_blank" rel="noreferrer">
            Seguir el envío →
          </a>
        </Button>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
