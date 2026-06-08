'use client'

import type { HttpTypes } from '@medusajs/types'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { PriceTag } from '@/components/commerce/price-tag'
import {
  CustomLineItemMeta,
  CustomLineItemThumb,
  isCustomLineItem,
} from '@/components/personalizadas/custom-line-item'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { formatVariantTitle } from '@/lib/variant'

interface OrderSummaryProps {
  cart: HttpTypes.StoreCart
  /** Locale en formato `es` */
  locale: string
  /** En móvil empieza colapsado y abre hacia abajo. */
  collapsibleOnMobile?: boolean
}

export function OrderSummary({ cart, locale, collapsibleOnMobile = true }: OrderSummaryProps) {
  const [open, setOpen] = useState(!collapsibleOnMobile)
  const currency = cart.currency_code ?? 'eur'
  const items = cart.items ?? []
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <aside className="rounded-xl border border-border bg-card md:sticky md:top-24">
      {collapsibleOnMobile ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between p-5 text-left md:hidden"
          aria-expanded={open}
        >
          <span className="text-sm font-medium">
            {open ? 'Ocultar' : 'Ver'} resumen ({itemCount}{' '}
            {itemCount === 1 ? 'artículo' : 'artículos'})
          </span>
          <div className="flex items-center gap-2">
            <PriceTag amount={cart.total ?? 0} currency={currency} className="font-semibold" />
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </div>
        </button>
      ) : null}

      <div className={cn(open ? 'block' : 'hidden', 'md:block')}>
        <div className="hidden p-5 pb-3 md:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen del pedido
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
          </p>
        </div>

        <ul className="divide-y divide-border border-y border-border md:border-b-0">
          {items.map((item) => {
            const custom = isCustomLineItem(item.metadata) ? item.metadata : null
            return (
              <li key={item.id} className="flex gap-3 p-5">
                <div className="relative shrink-0">
                  {custom ? (
                    <CustomLineItemThumb metadata={custom} size={64} />
                  ) : (
                    <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                      {item.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  )}
                  <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 text-sm leading-tight">
                  <p className="font-medium">{item.product_title}</p>
                  {custom ? (
                    <CustomLineItemMeta metadata={custom} className="mt-0.5" />
                  ) : formatVariantTitle(item.variant_title) ? (
                    <p className="text-xs text-muted-foreground">
                      {formatVariantTitle(item.variant_title)}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-medium tabular-nums">
                  {formatMoney((item.unit_price ?? 0) * item.quantity, currency)}
                </p>
              </li>
            )
          })}
        </ul>

        <div className="space-y-2 p-5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMoney(cart.subtotal ?? 0, currency)}</span>
          </div>
          {cart.discount_total ? (
            <div className="flex justify-between font-medium text-rt-success">
              <span>Descuento de socio</span>
              <span className="tabular-nums">−{formatMoney(cart.discount_total, currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-muted-foreground">
            <span>Envío</span>
            <span className="tabular-nums">
              {cart.shipping_total ? formatMoney(cart.shipping_total, currency) : '—'}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Impuestos</span>
            <span className="tabular-nums">{formatMoney(cart.tax_total ?? 0, currency)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-xl font-semibold tabular-nums">
              {formatMoney(cart.total ?? 0, currency)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
