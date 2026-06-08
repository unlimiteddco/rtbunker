import type { DailyPoint } from '../lib/dashboard-metrics'
import { formatMoney } from '../lib/dashboard-metrics'

interface SparklineProps {
  data: DailyPoint[]
  metric: 'revenue' | 'orders'
  height?: number
  /** Color de la curva. Default = cyan RT. */
  stroke?: string
}

/**
 * Sparkline mínimo en SVG. Sin dependencias externas.
 * - Eje X = índice del día (uniformemente espaciado).
 * - Eje Y = valor de la métrica (auto-escalado).
 * - Pinta área degradada bajo la curva.
 */
export function Sparkline({
  data,
  metric,
  height = 80,
  stroke = '#0abab5',
}: SparklineProps) {
  if (data.length === 0) return null

  const width = 800 // viewBox virtual; SVG escala via responsive class
  const values = data.map((d) => (metric === 'revenue' ? d.revenue : d.orders))
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)

  const stepX = width / Math.max(data.length - 1, 1)
  const points = values
    .map((v, i) => {
      const x = i * stepX
      const y = height - ((v - min) / span) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const areaPath = `M 0,${height} L ${points} L ${width},${height} Z`
  const linePath = `M ${points.replaceAll(' ', ' L ')}`

  const gradientId = `spark-grad-${metric}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block h-20 w-full"
      role="img"
      aria-label={`Tendencia ${metric === 'revenue' ? 'ingresos' : 'pedidos'} 30 días`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

export function describeSparkline(data: DailyPoint[], metric: 'revenue' | 'orders'): string {
  if (data.length === 0) return ''
  if (metric === 'revenue') {
    const total = data.reduce((acc, d) => acc + d.revenue, 0)
    return `${formatMoney(total)} en ${data.length} días`
  }
  const total = data.reduce((acc, d) => acc + d.orders, 0)
  return `${total} pedidos en ${data.length} días`
}
