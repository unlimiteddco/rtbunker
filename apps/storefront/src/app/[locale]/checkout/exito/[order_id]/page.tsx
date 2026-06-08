import { CheckCircle2, Mail, Package } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/i18n/routing'
import { formatMoney } from '@/lib/format'
import { sdk } from '@/lib/medusa'

interface SuccessPageProps {
  params: Promise<{ locale: string; order_id: string }>
}

async function fetchOrder(id: string) {
  try {
    const { order } = await sdk.store.order.retrieve(id, {
      fields: 'id,display_id,email,total,currency_code,items.*,shipping_address.*',
    })
    return order
  } catch {
    return null
  }
}

export default async function CheckoutSuccessPage({ params }: SuccessPageProps) {
  const { locale, order_id } = await params
  setRequestLocale(locale)

  const order = await fetchOrder(order_id)

  if (!order) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold">No hemos podido cargar tu pedido</h1>
        <p className="mt-2 text-muted-foreground">
          Comprueba tu email — el pedido podría haberse confirmado igualmente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
      </div>
    )
  }

  const currency = order.currency_code ?? 'eur'
  const orderJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Order',
    orderNumber: String(order.display_id),
    priceCurrency: currency.toUpperCase(),
    price: order.total,
    orderStatus: 'https://schema.org/OrderProcessing',
  }

  return (
    <div className="container-page py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orderJsonLd) }}
      />

      <div className="mx-auto max-w-2xl text-center">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-primary/30"
            style={{ animationDuration: '1.8s', animationIterationCount: 2 }}
          />
          <CheckCircle2 className="relative h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">¡Pedido confirmado!</h1>
        <p className="mt-3 text-muted-foreground">
          Hemos recibido tu pedido <span className="font-medium text-foreground">#{order.display_id}</span>.
          Te hemos enviado la confirmación a{' '}
          <span className="font-medium text-foreground">{order.email}</span>.
        </p>
      </div>

      <Card className="mx-auto mt-10 max-w-2xl">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">Confirmación por email</p>
              <p className="text-sm text-muted-foreground">
                Recibirás un email con todos los detalles. Si no llega en unos minutos, revisa la
                carpeta de spam.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">Preparación y envío</p>
              <p className="text-sm text-muted-foreground">
                Tu pedido se preparará en las próximas 24h. Te avisaremos cuando salga del almacén.
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resumen
            </p>
            <ul className="space-y-2 text-sm">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.quantity} × {item.product_title}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney((item.unit_price ?? 0) * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="my-3" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatMoney(order.total ?? 0, currency)}
              </span>
            </div>
          </div>

          {order.shipping_address ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dirección de envío
              </p>
              <p className="text-sm">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.address_1}
                {order.shipping_address.address_2
                  ? `, ${order.shipping_address.address_2}`
                  : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.postal_code} {order.shipping_address.city},{' '}
                {order.shipping_address.country_code?.toUpperCase()}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/tienda">Seguir comprando</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
      </div>
    </div>
  )
}
