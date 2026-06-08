import { setRequestLocale } from 'next-intl/server'

import { OrderDetail } from '@/components/account/order-detail'

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return <OrderDetail orderId={id} />
}
