import { ShoppingBag, Trash2 } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'

import { EmptyState } from '@/components/commerce/empty-state'
import {
  CustomLineItemMeta,
  CustomLineItemThumb,
  isCustomLineItem,
} from '@/components/personalizadas/custom-line-item'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/i18n/routing'
import { clearCartAction, updateLineItemAction } from '@/app/actions/cart'
import { formatMoney } from '@/lib/format'
import { formatVariantTitle } from '@/lib/variant'
import { getCart } from '@/lib/cart'

interface CartPageProps {
  params: Promise<{ locale: string }>
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('cart')
  const cart = await getCart()
  const currency = cart?.currency_code ?? 'eur'

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container-page py-16">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <EmptyState
          icon={ShoppingBag}
          title={t('empty')}
          description="Cuando añadas productos al carrito aparecerán aquí."
          action={
            <Button asChild>
              <Link href="/tienda">Ir a la tienda</Link>
            </Button>
          }
        />
      </div>
    )
  }

  async function clearCart() {
    'use server'
    await clearCartAction(locale)
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <form action={clearCart}>
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Vaciar carrito
          </Button>
        </form>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_360px]">
        <section>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {(cart.items ?? []).map((item) => {
              const custom = isCustomLineItem(item.metadata) ? item.metadata : null
              return (
              <li key={item.id} className="flex gap-4 p-4">
                {custom ? (
                  <CustomLineItemThumb metadata={custom} size={96} />
                ) : item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt={item.product_title ?? ''}
                    className="h-24 w-24 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-md bg-muted" />
                )}
                <div className="flex flex-1 flex-col">
                  <p className="font-medium">{item.product_title}</p>
                  {custom ? (
                    <CustomLineItemMeta metadata={custom} className="mt-0.5" />
                  ) : formatVariantTitle(item.variant_title) ? (
                    <p className="text-sm text-muted-foreground">
                      {formatVariantTitle(item.variant_title)}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-end gap-3 pt-3">
                    <form action={updateLineItemAction} className="flex items-center gap-2">
                      <input type="hidden" name="cart_id" value={cart.id} />
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="country_code" value={locale} />
                      <input
                        type="number"
                        name="quantity"
                        defaultValue={item.quantity}
                        min={1}
                        className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm"
                      />
                      <Button type="submit" size="sm" variant="ghost">
                        Actualizar
                      </Button>
                    </form>
                    <form action={updateLineItemAction}>
                      <input type="hidden" name="cart_id" value={cart.id} />
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="country_code" value={locale} />
                      <input type="hidden" name="quantity" value="0" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('remove')}
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatMoney((item.unit_price ?? 0) * item.quantity, currency)}
                  </p>
                  {item.quantity > 1 ? (
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(item.unit_price ?? 0, currency)} c/u
                    </p>
                  ) : null}
                </div>
              </li>
              )
            })}
          </ul>
        </section>

        <aside className="h-fit space-y-4 rounded-lg border border-border bg-card p-5 md:sticky md:top-24">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('subtotal')}</dt>
              <dd>{formatMoney(cart.subtotal ?? 0, currency)}</dd>
            </div>
            {cart.discount_total ? (
              <div className="flex justify-between font-medium text-rt-success">
                <dt>Descuento de socio</dt>
                <dd>−{formatMoney(cart.discount_total, currency)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('shipping')}</dt>
              <dd>
                {cart.shipping_total
                  ? formatMoney(cart.shipping_total, currency)
                  : 'Calcular en checkout'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('taxes')}</dt>
              <dd>{formatMoney(cart.tax_total ?? 0, currency)}</dd>
            </div>
          </dl>
          <Separator />
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">{t('total')}</p>
            <p className="text-xl font-semibold">{formatMoney(cart.total ?? 0, currency)}</p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">{t('checkout')}</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/tienda">Seguir comprando</Link>
          </Button>
        </aside>
      </div>
    </div>
  )
}
