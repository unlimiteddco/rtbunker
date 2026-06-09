import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  ArrowUpRightOnBox,
  ChartBar,
  CreditCard,
  CurrencyDollar,
  ReceiptPercent,
  ShoppingCart,
  Sparkles,
  Spinner,
  Trophy,
  Users,
  UsersSolid,
} from '@medusajs/icons'
import { Badge, Container, Heading, Text } from '@medusajs/ui'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { KPICard } from '../../components/kpi-card'
import { Sparkline, describeSparkline } from '../../components/sparkline'
import { sdk } from '../../lib/client'
import {
  STATUS_LABELS,
  STATUS_COLOR,
  type CustomOrder,
} from '../../lib/custom-orders'
import {
  dailySeries,
  formatMoney,
  metricsForToday,
  metricsForWindow,
  totalRevenue,
  type OrderLite,
} from '../../lib/dashboard-metrics'

interface AdminOrdersResponse {
  orders: OrderLite[]
  count: number
}

interface CustomOrdersResponse {
  custom_orders: CustomOrder[]
  count: number
}

interface MembershipsSummaryResponse {
  active_count: number
  by_tier: { bronce: number; plata: number; gold: number }
  mrr: number
  arr: number
}

const PENDING_CUSTOM_STATUSES = ['pending_review', 'awaiting_changes', 'proof_sent'] as const
const READY_TO_SHIP_STATUSES = ['approved', 'in_production'] as const

const DashboardPage = () => {
  // 1. Orders de los últimos 90 días → suficiente para los KPIs de 30d y delta.
  const ninetyDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return d.toISOString()
  }, [])

  const { data: ordersData, isLoading: ordersLoading } = useQuery<AdminOrdersResponse>({
    queryKey: ['dashboard-orders', ninetyDaysAgo],
    queryFn: () =>
      sdk.client.fetch('/admin/orders', {
        query: {
          limit: 500,
          order: '-created_at',
          // El filtro Medusa para fechas usa el operador $gte como subpath.
          'created_at[$gte]': ninetyDaysAgo,
          fields:
            'id,display_id,total,currency_code,email,created_at,payment_status,fulfillment_status,items.id,items.quantity',
        },
      }),
  })

  // 2. Pedidos custom abiertos.
  const { data: customData, isLoading: customLoading } = useQuery<CustomOrdersResponse>({
    queryKey: ['dashboard-custom-orders'],
    queryFn: () => sdk.client.fetch('/admin/custom-orders', { query: { limit: 50 } }),
  })

  // 3. KPIs del RT Bunker Club (MRR/ARR/socios). Carga en mount.
  const { data: clubData } = useQuery<MembershipsSummaryResponse>({
    queryKey: ['dashboard-club'],
    queryFn: () => sdk.client.fetch('/admin/memberships/summary'),
  })

  const orders = ordersData?.orders ?? []
  const customOrders = customData?.custom_orders ?? []
  const club = clubData ?? {
    active_count: 0,
    by_tier: { bronce: 0, plata: 0, gold: 0 },
    mrr: 0,
    arr: 0,
  }

  const today = useMemo(() => metricsForToday(orders), [orders])
  const week = useMemo(() => metricsForWindow(orders, 7), [orders])
  const month = useMemo(() => metricsForWindow(orders, 30), [orders])
  const series = useMemo(() => dailySeries(orders, 30), [orders])
  const billedTotal = useMemo(() => totalRevenue(orders), [orders])

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders])

  const pendingCustomOrders = useMemo(
    () =>
      customOrders.filter((o) =>
        (PENDING_CUSTOM_STATUSES as readonly string[]).includes(o.status),
      ),
    [customOrders],
  )
  const readyToShipCount = useMemo(
    () =>
      customOrders.filter((o) =>
        (READY_TO_SHIP_STATUSES as readonly string[]).includes(o.status),
      ).length,
    [customOrders],
  )

  if (ordersLoading || customLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="text-ui-fg-muted animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <Container className="flex items-end justify-between px-6 py-4">
        <div>
          <Heading>Dashboard</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Vista rápida del negocio · {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </div>
        <div className="text-right">
          <Text size="xsmall" leading="compact" className="text-ui-fg-muted uppercase tracking-[0.12em]">
            Últimos 30 días
          </Text>
          <Text size="small" leading="compact" weight="plus">
            {describeSparkline(series, 'revenue')}
          </Text>
        </div>
      </Container>

      {/* ─── KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 px-1 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Ingresos hoy"
          icon={CurrencyDollar}
          value={formatMoney(today.revenue)}
          delta={today.revenueDelta}
          hint={`${today.orders} ${today.orders === 1 ? 'pedido' : 'pedidos'} hoy`}
        />
        <KPICard
          label="Ingresos · 7 días"
          icon={ChartBar}
          value={formatMoney(week.revenue)}
          delta={week.revenueDelta}
          hint={`Ticket medio: ${formatMoney(week.avgOrderValue)}`}
        />
        <KPICard
          label="Ingresos · 30 días"
          icon={ChartBar}
          value={formatMoney(month.revenue)}
          delta={month.revenueDelta}
          trail={<Sparkline data={series} metric="revenue" />}
        />
        <KPICard
          label="Pedidos · 30 días"
          icon={ShoppingCart}
          value={String(month.orders)}
          delta={month.ordersDelta}
          trail={<Sparkline data={series} metric="orders" stroke="#0f0f0f" />}
        />
        <KPICard
          label="Ticket medio · 30 días"
          icon={ReceiptPercent}
          value={formatMoney(month.avgOrderValue)}
          hint={`${month.orders} ${month.orders === 1 ? 'pedido' : 'pedidos'} en 30 días`}
        />
        <KPICard
          label="Total facturado"
          icon={CurrencyDollar}
          value={formatMoney(billedTotal)}
          hint="Acumulado de los últimos 90 días"
        />
      </div>

      {/* ─── RT Bunker Club ─────────────────────────────────────── */}
      <ClubBlock club={club} />

      {/* ─── Personalizadas + Recent orders ─────────────────────── */}
      <div className="grid grid-cols-1 gap-3 px-1 lg:grid-cols-[1fr_360px]">
        <RecentOrdersBlock orders={recentOrders} />
        <CustomOrdersQueueBlock pending={pendingCustomOrders} readyToShip={readyToShipCount} />
      </div>
    </div>
  )
}

// ─── RT Bunker Club block ────────────────────────────────────────────

const TIER_LABELS: Record<'bronce' | 'plata' | 'gold', string> = {
  bronce: 'Bronce',
  plata: 'Plata',
  gold: 'Gold',
}

function ClubBlock({ club }: { club: MembershipsSummaryResponse }) {
  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">RT Bunker Club</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Ingresos recurrentes y socios activos.
          </Text>
        </div>
        <Link
          to="/memberships"
          className="text-ui-fg-interactive flex items-center gap-1 text-xs font-medium"
        >
          Ver socios
          <ArrowUpRightOnBox className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 pb-4 md:grid-cols-3">
        <KPICard
          label="MRR"
          icon={CreditCard}
          value={formatMoney(club.mrr)}
          hint="Estimado · socios activos × precio del tier"
        />
        <KPICard
          label="Socios activos"
          icon={UsersSolid}
          value={String(club.active_count)}
          hint={`${TIER_LABELS.bronce} ${club.by_tier.bronce} · ${TIER_LABELS.plata} ${club.by_tier.plata} · ${TIER_LABELS.gold} ${club.by_tier.gold}`}
        />
        <KPICard
          label="ARR"
          icon={Trophy}
          value={formatMoney(club.arr)}
          hint="Estimado · MRR × 12"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 px-6 pb-6">
        <TierStat label={TIER_LABELS.bronce} value={club.by_tier.bronce} tone="orange" />
        <TierStat label={TIER_LABELS.plata} value={club.by_tier.plata} tone="green" />
        <TierStat label={TIER_LABELS.gold} value={club.by_tier.gold} tone="purple" />
      </div>
    </Container>
  )
}

function TierStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'orange' | 'purple' | 'green'
}) {
  const bg =
    tone === 'orange'
      ? 'bg-ui-tag-orange-bg'
      : tone === 'purple'
        ? 'bg-ui-tag-purple-bg'
        : 'bg-ui-tag-green-bg'
  const fg =
    tone === 'orange'
      ? 'text-ui-tag-orange-text'
      : tone === 'purple'
        ? 'text-ui-tag-purple-text'
        : 'text-ui-tag-green-text'

  return (
    <div className={`rounded-md px-3 py-2 ${bg}`}>
      <Text
        size="xsmall"
        leading="compact"
        weight="plus"
        className={`uppercase tracking-[0.12em] ${fg}`}
      >
        {label}
      </Text>
      <Heading level="h2" className={fg}>
        {value}
      </Heading>
    </div>
  )
}

// ─── Recent orders block ─────────────────────────────────────────────

function RecentOrdersBlock({ orders }: { orders: OrderLite[] }) {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Pedidos recientes</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Últimos 8. Click → detalle en /orders.
          </Text>
        </div>
        <Link
          to="/orders"
          className="text-ui-fg-interactive flex items-center gap-1 text-xs font-medium"
        >
          Ver todos
          <ArrowUpRightOnBox className="h-3 w-3" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Users className="text-ui-fg-muted" />
          <Heading level="h3">Aún no hay pedidos</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Cuando lleguen, aparecerán aquí.
          </Text>
        </div>
      ) : (
        <ul className="divide-y">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/orders/${o.id}`}
                className="hover:bg-ui-bg-base-hover flex items-center justify-between gap-4 px-6 py-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text size="small" leading="compact" weight="plus">
                      #{o.display_id ?? o.id.slice(-6).toUpperCase()}
                    </Text>
                    {o.payment_status ? (
                      <Badge
                        size="2xsmall"
                        color={o.payment_status === 'captured' ? 'green' : 'orange'}
                      >
                        {o.payment_status}
                      </Badge>
                    ) : null}
                    {o.fulfillment_status && o.fulfillment_status !== 'not_fulfilled' ? (
                      <Badge size="2xsmall" color="blue">
                        {o.fulfillment_status}
                      </Badge>
                    ) : null}
                  </div>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle truncate">
                    {o.email ?? 'Invitado'} ·{' '}
                    {new Date(o.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </div>
                <Text size="small" leading="compact" weight="plus" className="tabular-nums">
                  {formatMoney(o.total, o.currency_code)}
                </Text>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}

// ─── Custom orders queue block ───────────────────────────────────────

function CustomOrdersQueueBlock({
  pending,
  readyToShip,
}: {
  pending: CustomOrder[]
  readyToShip: number
}) {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Personalizadas</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Tu cola de mockups y producción.
          </Text>
        </div>
        <Link
          to="/custom-orders"
          className="text-ui-fg-interactive flex items-center gap-1 text-xs font-medium"
        >
          Ir
          <ArrowUpRightOnBox className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 py-4">
        <QueueStat label="Por mockear" value={pending.length} tone="orange" />
        <QueueStat label="Listas envío" value={readyToShip} tone="purple" />
      </div>

      <ul className="divide-y">
        {pending.length === 0 ? (
          <li className="px-6 py-6 text-center">
            <Sparkles className="text-ui-fg-muted mx-auto" />
            <Text size="small" leading="compact" className="text-ui-fg-subtle mt-2">
              Sin pendientes. ¡Todo al día!
            </Text>
          </li>
        ) : (
          pending.slice(0, 5).map((o) => (
            <li key={o.id}>
              <Link
                to={`/custom-orders/${o.id}`}
                className="hover:bg-ui-bg-base-hover flex items-center justify-between gap-3 px-6 py-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <Text size="small" leading="compact" weight="plus" className="truncate">
                    {o.customer_name ?? o.customer_email}
                  </Text>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    #{o.id.slice(-6).toUpperCase()} · {o.units} uds
                  </Text>
                </div>
                <Badge size="2xsmall" color={STATUS_COLOR[o.status]}>
                  {STATUS_LABELS[o.status]}
                </Badge>
              </Link>
            </li>
          ))
        )}
      </ul>
    </Container>
  )
}

function QueueStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'orange' | 'purple' | 'green'
}) {
  const bg =
    tone === 'orange'
      ? 'bg-ui-tag-orange-bg'
      : tone === 'purple'
        ? 'bg-ui-tag-purple-bg'
        : 'bg-ui-tag-green-bg'
  const fg =
    tone === 'orange'
      ? 'text-ui-tag-orange-text'
      : tone === 'purple'
        ? 'text-ui-tag-purple-text'
        : 'text-ui-tag-green-text'

  return (
    <div className={`rounded-md px-3 py-2 ${bg}`}>
      <Text size="xsmall" leading="compact" weight="plus" className={`uppercase tracking-[0.12em] ${fg}`}>
        {label}
      </Text>
      <Heading level="h2" className={fg}>
        {value}
      </Heading>
    </div>
  )
}

export const config = defineRouteConfig({
  label: 'Dashboard',
  icon: ChartBar,
})

export default DashboardPage
