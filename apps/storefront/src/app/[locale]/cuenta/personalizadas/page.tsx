import { ArrowRight, Sparkles } from 'lucide-react'
import { cookies } from 'next/headers'
import { setRequestLocale } from 'next-intl/server'

import {
  CustomLineItemThumb,
  isPreviewableImage,
} from '@/components/personalizadas/custom-line-item'
import { EmptyState } from '@/components/commerce/empty-state'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { sdk } from '@/lib/medusa'
import {
  STATUS_LABEL,
  describeShortConfig,
  type CustomerCustomOrder,
} from '@/lib/customer-custom-orders'
import { formatMoney } from '@/lib/format'

export const dynamic = 'force-dynamic'

interface ListResponse {
  custom_orders: CustomerCustomOrder[]
  count: number
}

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function CustomerCustomOrdersListPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const c = await cookies()
  const cookieHeader = c.toString()

  let orders: CustomerCustomOrder[] = []
  try {
    const res = await sdk.client.fetch<ListResponse>('/store/customers/me/custom-orders', {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    orders = res.custom_orders ?? []
  } catch (err) {
    // Probablemente no autenticado; el layout ya redirige al login.
    console.error('[cuenta/personalizadas] fetch fallo:', err)
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Aún no tienes pedidos personalizados"
        description="Cuando hagas un pedido en el configurador podrás seguir aquí el proceso del mockup."
        action={
          <Button asChild>
            <Link href="/personalizadas">Crear mi primer pedido →</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Personalizadas</h2>
          <p className="text-sm text-muted-foreground">
            Estado de tus pedidos custom · mockups, decisiones y envío.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/personalizadas">Nuevo pedido →</Link>
        </Button>
      </header>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/cuenta/personalizadas/${o.id}`}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
            >
              <CustomLineItemThumb
                metadata={{
                  custom_request: true,
                  design_file_url: o.design_file_url,
                  design_file_name: o.design_file_name,
                  config: {
                    shape: o.shape,
                    material: o.material,
                    size_id: o.size_id,
                    width_cm: o.width_cm,
                    height_cm: o.height_cm,
                  },
                }}
                size={72}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Pedido #{o.short_id}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {describeShortConfig(o)} · {o.units} uds
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {o.proofs.length} mockup{o.proofs.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="font-semibold tabular-nums">{formatMoney(o.total_price, 'eur')}</p>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  const color: Record<typeof status, string> = {
    pending_review: 'bg-orange-100 text-orange-900',
    proof_sent: 'bg-blue-100 text-blue-900',
    awaiting_changes: 'bg-orange-100 text-orange-900',
    approved: 'bg-emerald-100 text-emerald-900',
    in_production: 'bg-purple-100 text-purple-900',
    shipped: 'bg-blue-100 text-blue-900',
    delivered: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-red-100 text-red-900',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${color[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

// Silenciar warning del lint si no se usa la export específica
void isPreviewableImage
