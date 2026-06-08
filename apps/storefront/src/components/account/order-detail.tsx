'use client'

import type { HttpTypes } from '@medusajs/types'
import { ArrowLeft, Check, Crown, Package, Truck, Home, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { sdk } from '@/lib/medusa'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  archived: 'Archivado',
  canceled: 'Cancelado',
  requires_action: 'Requiere acción',
  not_fulfilled: 'En preparación',
  partially_fulfilled: 'Preparación parcial',
  fulfilled: 'Preparado',
  partially_shipped: 'Envío parcial',
  shipped: 'Enviado',
  partially_delivered: 'Entrega parcial',
  delivered: 'Entregado',
}

/** Pasos del timeline en orden y el fulfillment_status que los activa. */
const STEPS = [
  { key: 'placed', label: 'Confirmado', icon: Check },
  { key: 'preparing', label: 'En preparación', icon: Package },
  { key: 'shipped', label: 'Enviado', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: Home },
] as const

function currentStepIndex(fulfillmentStatus?: string | null): number {
  switch (fulfillmentStatus) {
    case 'delivered':
    case 'partially_delivered':
      return 3
    case 'shipped':
    case 'partially_shipped':
      return 2
    case 'fulfilled':
    case 'partially_fulfilled':
      return 1
    default:
      return 0
  }
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    sdk.store.order
      .retrieve(orderId, {
        fields:
          'id,display_id,status,fulfillment_status,payment_status,created_at,email,currency_code,total,subtotal,shipping_total,tax_total,discount_total,items.*,shipping_address.*,fulfillments.tracking_links,fulfillments.shipped_at,fulfillments.delivered_at',
      })
      .then(({ order }) => setOrder(order))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
  }, [orderId])

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-destructive">
          No hemos podido cargar este pedido. {error}
        </p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const currency = order.currency_code ?? 'eur'
  const canceled = order.status === 'canceled'
  const activeStep = currentStepIndex(order.fulfillment_status)
  const dateFmt = new Date(order.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const fulfillments = (order.fulfillments ?? []) as Array<{
    tracking_links?: Array<{ tracking_number?: string; url?: string }>
  }>
  const trackingLinks = fulfillments.flatMap((f) => f.tracking_links ?? [])

  // Ahorro de socio. El entity `order` no expone la relación `promotions`, así
  // que usamos `discount_total`: hoy el único descuento de la tienda es el del
  // Club (promociones automáticas por customer group). Si en el futuro hay
  // cupones de otra naturaleza, habrá que diferenciar por `items.adjustments`.
  const memberSavings = order.discount_total ?? 0
  const hasMemberPromo = memberSavings > 0
  const showMemberSavings = hasMemberPromo

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Pedido #{order.display_id}</h2>
          <p className="text-sm text-muted-foreground">Realizado el {dateFmt}</p>
        </div>
        <Badge
          variant="muted"
          className={canceled ? 'bg-destructive/10 text-destructive' : undefined}
        >
          {STATUS_LABEL[order.fulfillment_status ?? ''] ??
            STATUS_LABEL[order.status ?? ''] ??
            order.status ??
            'Pedido'}
        </Badge>
      </header>

      {/* Ahorro de socio */}
      {showMemberSavings ? (
        <div className="flex items-center gap-3 rounded-xl border border-rt-success/30 bg-rt-success/10 p-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rt-success/15 text-rt-success">
            <Crown className="h-5 w-5" />
          </span>
          <p className="text-sm text-rt-ink-700">
            Con tu descuento de socio te ahorraste{' '}
            <strong className="text-rt-success">{formatMoney(memberSavings, currency)}</strong> en
            este pedido.
          </p>
        </div>
      ) : null}

      {/* Timeline de estado */}
      {canceled ? (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <Clock className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-destructive">Este pedido fue cancelado.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <ol className="flex items-center">
            {STEPS.map((step, i) => {
              const done = i <= activeStep
              const Icon = step.icon
              return (
                <li key={step.key} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        'whitespace-nowrap text-[11px] font-medium',
                        done ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 ? (
                    <span
                      className={cn(
                        'mx-1 mb-5 h-0.5 flex-1 rounded transition-colors',
                        i < activeStep ? 'bg-primary' : 'bg-border',
                      )}
                    />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* Seguimiento */}
      {trackingLinks.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Seguimiento del envío
          </p>
          <ul className="space-y-2">
            {trackingLinks.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-mono">{t.tracking_number ?? 'Envío'}</span>
                {t.url ? (
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Seguir →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Artículos + totales */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Artículos
        </p>
        <ul className="space-y-4">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex gap-3">
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.product_title}</p>
                {item.variant_title && item.variant_title !== item.product_title ? (
                  <p className="text-xs text-muted-foreground">{item.variant_title}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {formatMoney((item.unit_price ?? 0) * item.quantity, currency)}
              </p>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />

        <dl className="space-y-1.5 text-sm">
          {order.subtotal != null ? (
            <Row label="Subtotal" value={formatMoney(order.subtotal, currency)} />
          ) : null}
          {order.discount_total ? (
            <div
              className={`flex items-baseline justify-between ${hasMemberPromo ? 'font-medium text-rt-success' : ''}`}
            >
              <dt className={hasMemberPromo ? '' : 'text-muted-foreground'}>
                {hasMemberPromo ? 'Descuento de socio' : 'Descuento'}
              </dt>
              <dd className="tabular-nums">
                −{formatMoney(Math.abs(order.discount_total), currency)}
              </dd>
            </div>
          ) : null}
          {order.shipping_total != null ? (
            <Row label="Envío" value={formatMoney(order.shipping_total, currency)} />
          ) : null}
          {order.tax_total ? (
            <Row label="Impuestos (incl.)" value={formatMoney(order.tax_total, currency)} />
          ) : null}
          <Separator className="my-2" />
          <div className="flex items-baseline justify-between">
            <dt className="font-semibold">Total</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatMoney(order.total ?? 0, currency)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Dirección */}
      {order.shipping_address ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dirección de envío
          </p>
          <p className="text-sm font-medium">
            {order.shipping_address.first_name} {order.shipping_address.last_name}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.shipping_address.address_1}
            {order.shipping_address.address_2 ? `, ${order.shipping_address.address_2}` : ''}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.shipping_address.postal_code} {order.shipping_address.city},{' '}
            {order.shipping_address.country_code?.toUpperCase()}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground">
      <Link href="/cuenta/pedidos">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Mis pedidos
      </Link>
    </Button>
  )
}
