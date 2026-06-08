import { setRequestLocale } from 'next-intl/server'

import { OrdersList } from '@/components/account/orders-list'

interface OrdersPageProps {
  params: Promise<{ locale: string }>
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Mis pedidos</h2>
        <p className="text-sm text-muted-foreground">
          Histórico de tus pedidos y estado de envío.
        </p>
      </header>
      <OrdersList />
    </div>
  )
}
