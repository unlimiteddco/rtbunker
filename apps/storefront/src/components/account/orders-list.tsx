'use client'

import type { HttpTypes } from '@medusajs/types'
import { ChevronRight, Package } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/commerce/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/routing'
import { sdk } from '@/lib/medusa'
import { formatMoney } from '@/lib/format'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  archived: 'Archivado',
  canceled: 'Cancelado',
  requires_action: 'Requiere acción',
  not_fulfilled: 'En preparación',
  fulfilled: 'Enviado',
  partially_fulfilled: 'Envío parcial',
  delivered: 'Entregado',
}

export function OrdersList() {
  const [orders, setOrders] = useState<HttpTypes.StoreOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    sdk.store.order
      .list({ limit: 20 })
      .then(({ orders }) => setOrders(orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
  }, [])

  if (error) return <p className="text-sm text-destructive">{error}</p>

  if (!orders) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aún no tienes pedidos"
        description="Cuando hagas tu primera compra aparecerá aquí."
        action={
          <Button asChild>
            <Link href="/tienda">Ver tienda</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {orders.map((o) => {
        const dateFmt = new Date(o.created_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
        const items = (o.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
        return (
          <li key={o.id}>
            <Link
              href={`/cuenta/pedidos/${o.id}`}
              className="flex flex-wrap items-center gap-3 p-4 text-sm transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">Pedido #{o.display_id}</p>
                <p className="text-xs text-muted-foreground">
                  {dateFmt} · {items} {items === 1 ? 'artículo' : 'artículos'}
                </p>
              </div>
              <Badge variant="muted">
                {STATUS_LABEL[o.fulfillment_status ?? ''] ??
                  STATUS_LABEL[o.status ?? ''] ??
                  o.status ??
                  'Pedido'}
              </Badge>
              <p className="font-semibold tabular-nums">
                {formatMoney(o.total ?? 0, o.currency_code ?? 'eur')}
              </p>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
