/**
 * Helpers para agregar pedidos en métricas tipo Shopify:
 *   - Ingresos / nº pedidos por ventana (hoy, 7d, 30d)
 *   - Delta % vs periodo anterior
 *   - Serie temporal por día para sparklines
 */

export interface OrderLite {
  id: string
  display_id?: number
  total: number
  currency_code: string
  created_at: string
  email?: string | null
  payment_status?: string
  fulfillment_status?: string
  items?: { id: string; quantity: number }[]
}

export interface PeriodMetrics {
  revenue: number
  orders: number
  avgOrderValue: number
  /** Cambio porcentual respecto al mismo periodo previo. `null` si no hay base. */
  revenueDelta: number | null
  ordersDelta: number | null
}

/**
 * Filtra una lista de orders al rango [start, end).
 * `start` y `end` son Date.
 */
export function ordersInRange(orders: OrderLite[], start: Date, end: Date): OrderLite[] {
  return orders.filter((o) => {
    const t = new Date(o.created_at).getTime()
    return t >= start.getTime() && t < end.getTime()
  })
}

function sumRevenue(orders: OrderLite[]): number {
  return orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0)
}

function percentDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / prev) * 100
}

/**
 * Calcula métricas para una ventana de `days` días desde ahora.
 * El periodo anterior es la ventana de la misma duración inmediatamente anterior.
 */
export function metricsForWindow(orders: OrderLite[], days: number, now = new Date()): PeriodMetrics {
  const end = now
  const start = new Date(end.getTime() - days * 86400000)
  const prevEnd = start
  const prevStart = new Date(prevEnd.getTime() - days * 86400000)

  const current = ordersInRange(orders, start, end)
  const previous = ordersInRange(orders, prevStart, prevEnd)

  const revenue = sumRevenue(current)
  const prevRevenue = sumRevenue(previous)

  return {
    revenue,
    orders: current.length,
    avgOrderValue: current.length > 0 ? revenue / current.length : 0,
    revenueDelta: percentDelta(revenue, prevRevenue),
    ordersDelta: percentDelta(current.length, previous.length),
  }
}

/**
 * Métricas del día de hoy comparadas con el día de ayer (no las últimas 24h
 * móviles — el corte es al inicio del día local).
 */
export function metricsForToday(orders: OrderLite[], now = new Date()): PeriodMetrics {
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart.getTime() + 86400000)
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)

  const today = ordersInRange(orders, todayStart, todayEnd)
  const yesterday = ordersInRange(orders, yesterdayStart, todayStart)

  const revenue = sumRevenue(today)
  const prevRevenue = sumRevenue(yesterday)

  return {
    revenue,
    orders: today.length,
    avgOrderValue: today.length > 0 ? revenue / today.length : 0,
    revenueDelta: percentDelta(revenue, prevRevenue),
    ordersDelta: percentDelta(today.length, yesterday.length),
  }
}

export interface DailyPoint {
  /** YYYY-MM-DD. */
  date: string
  revenue: number
  orders: number
}

/**
 * Agrega los orders por día durante los últimos `days` días (incluyendo hoy).
 * Devuelve la serie ordenada cronológicamente. Días sin pedidos = 0.
 */
export function dailySeries(orders: OrderLite[], days: number, now = new Date()): DailyPoint[] {
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const buckets = new Map<string, { revenue: number; orders: number }>()
  // Inicializamos todos los días con 0.
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * 86400000)
    const key = isoDate(d)
    buckets.set(key, { revenue: 0, orders: 0 })
  }

  for (const o of orders) {
    const d = new Date(o.created_at)
    d.setHours(0, 0, 0, 0)
    const key = isoDate(d)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.revenue += Number(o.total) || 0
    bucket.orders += 1
  }

  return [...buckets.entries()].map(([date, v]) => ({ date, ...v }))
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function formatMoney(amount: number, currency = 'eur'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDelta(value: number | null): string {
  if (value == null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
