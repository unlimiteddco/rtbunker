import { ChevronLeft } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import { CheckoutFlow } from '@/components/checkout/checkout-flow'
import { EmptyState } from '@/components/commerce/empty-state'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { getCurrentCustomer } from '@/lib/auth'
import { getCart } from '@/lib/cart'

interface CheckoutPageProps {
  params: Promise<{ locale: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const [cart, customer] = await Promise.all([getCart(), getCurrentCustomer()])

  // Pre-fill DNI desde metadata del customer logueado.
  const defaultDni =
    (customer?.metadata as { dni?: string } | null | undefined)?.dni ?? null

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Tu carrito está vacío"
          description="Añade productos antes de tramitar el pedido."
          action={
            <Button asChild>
              <Link href="/tienda">Ir a la tienda</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-6 md:py-10">
      <Link
        href="/carrito"
        className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Volver al carrito
      </Link>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight md:text-4xl">Checkout</h1>
      <CheckoutFlow cart={cart} locale={locale} defaultDni={defaultDni} />
    </div>
  )
}
