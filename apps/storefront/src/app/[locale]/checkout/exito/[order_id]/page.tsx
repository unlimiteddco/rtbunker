import { CheckCircle2, Landmark, Mail, Package } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import { CopyButton } from '@/components/checkout/copy-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/i18n/routing'
import {
  BANK_TRANSFER_METHOD,
  formatIban,
  getBankTransferInfo,
  type BankTransferInfo,
} from '@/lib/bank-transfer'
import { readLineItemChoices } from '@/lib/custom-text'
import { formatMoney } from '@/lib/format'
import { sdk } from '@/lib/medusa'

interface SuccessPageProps {
  params: Promise<{ locale: string; order_id: string }>
}

async function fetchOrder(id: string) {
  try {
    const { order } = await sdk.store.order.retrieve(id, {
      fields: 'id,display_id,email,total,currency_code,metadata,cart.metadata,items.*,shipping_address.*',
    })
    return order
  } catch {
    return null
  }
}

/** Texto personalizado del line item (`metadata.custom_text`), si existe. */
function customTextOf(metadata: unknown): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null
  const v = (metadata as Record<string, unknown>).custom_text
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export default async function CheckoutSuccessPage({ params }: SuccessPageProps) {
  const { locale, order_id } = await params
  setRequestLocale(locale)

  const order = await fetchOrder(order_id)
  // `payment_method` se guarda en la metadata del carrito; un subscriber la
  // copia al pedido, pero puede no haber corrido aún al llegar aquí → miramos
  // también el carrito enlazado.
  const paymentMethodOf = (m: unknown) =>
    (m as Record<string, unknown> | null | undefined)?.payment_method
  const isBankTransfer =
    paymentMethodOf(order?.metadata) === BANK_TRANSFER_METHOD ||
    paymentMethodOf((order as { cart?: { metadata?: unknown } | null } | null)?.cart?.metadata) ===
      BANK_TRANSFER_METHOD
  const bank = isBankTransfer ? await getBankTransferInfo() : null

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
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {isBankTransfer ? '¡Pedido recibido!' : '¡Pedido confirmado!'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Hemos recibido tu pedido <span className="font-medium text-foreground">#{order.display_id}</span>.
          Te hemos enviado la confirmación a{' '}
          <span className="font-medium text-foreground">{order.email}</span>.
        </p>
      </div>

      {isBankTransfer ? (
        <BankTransferBlock
          bank={bank}
          displayId={order.display_id ?? ''}
          total={formatMoney(order.total ?? 0, currency)}
        />
      ) : null}

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
                {isBankTransfer
                  ? 'Preparamos tu pedido en cuanto recibamos la transferencia. Te avisaremos cuando salga del almacén.'
                  : 'Tu pedido se preparará en las próximas 24h. Te avisaremos cuando salga del almacén.'}
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
                <li key={item.id} className="flex justify-between gap-4">
                  <span className="min-w-0 text-muted-foreground">
                    {item.quantity} × {item.product_title}
                    {customTextOf(item.metadata) ? (
                      <span className="mt-0.5 block text-xs">
                        Texto:{' '}
                        <span className="break-all font-semibold text-foreground">
                          «{customTextOf(item.metadata)}»
                        </span>
                      </span>
                    ) : null}
                    {readLineItemChoices(item.metadata).map((c) => (
                      <span key={c.label} className="mt-0.5 block text-xs">
                        {c.label}:{' '}
                        <span className="font-semibold text-foreground">{c.value}</span>
                      </span>
                    ))}
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

/**
 * Bloque destacado con los datos para pagar por transferencia. Concepto =
 * "Pedido #<display_id>" para que Nikita pueda conciliar el ingreso.
 */
function BankTransferBlock({
  bank,
  displayId,
  total,
}: {
  bank: BankTransferInfo | null
  displayId: number | string
  total: string
}) {
  const concept = `Pedido #${displayId}`

  return (
    <section
      aria-labelledby="bank-transfer-title"
      className="mx-auto mt-10 max-w-2xl rounded-xl border-2 border-rt-yellow bg-rt-yellow/5 p-5 md:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rt-yellow/15 text-rt-yellow">
          <Landmark className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 id="bank-transfer-title" className="font-semibold text-rt-black">
            Completa el pago por transferencia
          </h2>
          <p className="mt-1 text-sm text-rt-ink-700">
            Tu pedido está reservado. <strong>Lo preparamos en cuanto recibamos la transferencia</strong>{' '}
            (normalmente 1-2 días hábiles). También te hemos enviado estos datos por email.
          </p>
        </div>
      </div>

      {bank?.iban ? (
        <dl className="mt-5 divide-y divide-rt-ink-100 rounded-lg border border-rt-ink-100 bg-white text-sm">
          <BankRow label="Importe">
            <span className="text-base font-semibold tabular-nums text-rt-black">{total}</span>
          </BankRow>
          {bank.holder ? (
            <BankRow label="Titular">
              <span className="font-medium text-rt-black">{bank.holder}</span>
            </BankRow>
          ) : null}
          <BankRow label="IBAN" stacked>
            <span className="whitespace-nowrap font-mono text-[13px] font-medium text-rt-black sm:text-sm">
              {formatIban(bank.iban)}
            </span>
            <CopyButton value={bank.iban.replace(/\s+/g, '')} label="Copiar IBAN" />
          </BankRow>
          {bank.bank ? (
            <BankRow label="Banco">
              <span className="font-medium text-rt-black">{bank.bank}</span>
            </BankRow>
          ) : null}
          {bank.bic ? (
            <BankRow label="BIC">
              <span className="font-mono font-medium text-rt-black">{bank.bic}</span>
            </BankRow>
          ) : null}
          <BankRow label="Concepto">
            <span className="font-semibold text-rt-black">{concept}</span>
            <CopyButton value={concept} label="Copiar concepto" />
          </BankRow>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-rt-ink-700">
          Te hemos enviado los datos bancarios por email. Importe: <strong>{total}</strong> ·
          Concepto: <strong>{concept}</strong>.
        </p>
      )}

      <p className="mt-3 text-xs text-rt-ink-500">
        Indica el concepto exactamente así para que podamos identificar tu pago.
      </p>
    </section>
  )
}

function BankRow({
  label,
  stacked = false,
  children,
}: {
  label: string
  /** En móvil, etiqueta arriba y valor a lo ancho (para el IBAN). */
  stacked?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={
        stacked
          ? 'flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
          : 'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3'
      }
    >
      <dt className="text-rt-ink-500">{label}</dt>
      <dd
        className={
          stacked
            ? 'flex flex-wrap items-center justify-between gap-2 sm:justify-end'
            : 'flex min-w-0 items-center gap-2 text-right'
        }
      >
        {children}
      </dd>
    </div>
  )
}
