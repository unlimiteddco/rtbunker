'use client'

import { ShoppingBag, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'

import { closeCartDrawer, useCartDrawerOpen } from '@/components/cart/cart-store'
import { EmptyState } from '@/components/commerce/empty-state'
import {
  CustomLineItemMeta,
  CustomLineItemThumb,
  isCustomLineItem,
} from '@/components/personalizadas/custom-line-item'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/routing'
import { formatMoney } from '@/lib/format'
import { formatVariantTitle } from '@/lib/variant'
import { clearCartAction, getCartSnapshot, updateLineItemAction } from '@/app/actions/cart'

type Snapshot = Awaited<ReturnType<typeof getCartSnapshot>>

export function MiniCartDrawer({ locale }: { locale: string }) {
  const t = useTranslations('cart')
  const open = useCartDrawerOpen()
  const [, startTransition] = useTransition()
  const [snapshot, setSnapshot] = useState<Snapshot>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getCartSnapshot()
      .then(setSnapshot)
      .finally(() => setLoading(false))
  }, [open])

  function onRemove(itemId: string) {
    if (!snapshot) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('cart_id', snapshot.id)
      fd.set('item_id', itemId)
      fd.set('quantity', '0')
      fd.set('country_code', locale)
      await updateLineItemAction(fd)
      const fresh = await getCartSnapshot()
      setSnapshot(fresh)
    })
  }

  function onClear() {
    startTransition(async () => {
      await clearCartAction(locale)
      setSnapshot(await getCartSnapshot())
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? null : closeCartDrawer())}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            {t('title')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && !snapshot ? (
            <div className="space-y-3 p-5">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-20 w-20 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !snapshot || snapshot.items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ShoppingBag}
                title={t('empty')}
                description="Cuando añadas productos aparecerán aquí."
                action={
                  <Button asChild onClick={() => closeCartDrawer()}>
                    <Link href="/tienda">Ir a la tienda</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {snapshot.items.map((item) => {
                const custom = isCustomLineItem(item.metadata) ? item.metadata : null
                return (
                <li key={item.id} className="flex gap-3 p-5">
                  {custom ? (
                    <CustomLineItemThumb metadata={custom} size={80} />
                  ) : item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-md bg-muted" />
                  )}
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium leading-tight">{item.product_title}</p>
                    {custom ? (
                      <CustomLineItemMeta metadata={custom} className="mt-0.5" />
                    ) : formatVariantTitle(item.variant_title) ? (
                      <p className="text-xs text-muted-foreground">
                        {formatVariantTitle(item.variant_title)}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Cantidad: {item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" /> {t('remove')}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatMoney(item.total, snapshot.currency_code)}
                  </p>
                </li>
                )
              })}
            </ul>
          )}
        </div>

        {snapshot && snapshot.items.length > 0 ? (
          <div className="space-y-3 border-t border-border bg-muted/30 p-5">
            {snapshot.discount_total ? (
              <div className="flex items-baseline justify-between text-sm font-medium text-rt-success">
                <span>Descuento de socio</span>
                <span>−{formatMoney(snapshot.discount_total, snapshot.currency_code)}</span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t('subtotal')}</span>
              <span className="text-lg font-semibold">
                {formatMoney(snapshot.subtotal, snapshot.currency_code)}
              </span>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <Button asChild size="lg" onClick={() => closeCartDrawer()}>
                <Link href="/checkout">{t('checkout')}</Link>
              </Button>
              <Button asChild variant="ghost" onClick={() => closeCartDrawer()}>
                <Link href="/carrito">Ver carrito</Link>
              </Button>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" /> Vaciar carrito
              </button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
