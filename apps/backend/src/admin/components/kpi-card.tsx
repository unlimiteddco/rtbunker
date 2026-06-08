import { Minus, TriangleDownMini, TriangleUpMini } from '@medusajs/icons'
import { Heading, Text } from '@medusajs/ui'
import type { ComponentType, ReactNode } from 'react'

import { formatDelta } from '../lib/dashboard-metrics'

interface KPICardProps {
  label: string
  value: string
  delta?: number | null
  hint?: string
  icon?: ComponentType<{ className?: string }>
  /** Slot opcional debajo del valor (p.ej. una sparkline). */
  trail?: ReactNode
}

/**
 * Card de métrica para el dashboard. Muestra:
 *   - Label uppercase (tracking ancho)
 *   - Valor grande
 *   - Delta vs periodo anterior con flecha + color
 *   - Hint opcional (texto pequeño bajo el valor)
 *   - Slot trail para gráficos/sparklines
 */
export function KPICard({ label, value, delta, hint, icon: Icon, trail }: KPICardProps) {
  const deltaTone =
    delta == null
      ? 'text-ui-fg-muted'
      : delta === 0
        ? 'text-ui-fg-subtle'
        : delta > 0
          ? 'text-ui-tag-green-text'
          : 'text-ui-tag-red-text'

  const DeltaIcon =
    delta == null || delta === 0 ? Minus : delta > 0 ? TriangleUpMini : TriangleDownMini

  return (
    <div className="shadow-elevation-card-rest bg-ui-bg-base rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <Text
          size="xsmall"
          leading="compact"
          weight="plus"
          className="text-ui-fg-muted uppercase tracking-[0.12em]"
        >
          {label}
        </Text>
        {Icon ? (
          <span className="bg-ui-bg-component text-ui-fg-subtle inline-flex h-7 w-7 items-center justify-center rounded-md">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-baseline gap-3">
        <Heading level="h2" className="text-ui-fg-base">
          {value}
        </Heading>
        {delta !== undefined ? (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${deltaTone}`}
            title="Comparado con el periodo anterior"
          >
            <DeltaIcon className="h-3 w-3" />
            {formatDelta(delta ?? null)}
          </span>
        ) : null}
      </div>

      {hint ? (
        <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
          {hint}
        </Text>
      ) : null}

      {trail ? <div className="mt-3">{trail}</div> : null}
    </div>
  )
}
