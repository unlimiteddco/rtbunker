'use client'

import type { HttpTypes } from '@medusajs/types'
import { Truck } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { sdk } from '@/lib/medusa'

interface ShippingStepProps {
  cart: HttpTypes.StoreCart
  onBack: () => void
  onContinue: (cart: HttpTypes.StoreCart) => void
}

export function ShippingStep({ cart, onBack, onContinue }: ShippingStepProps) {
  const [options, setOptions] = useState<HttpTypes.StoreCartShippingOption[] | null>(null)
  const [selected, setSelected] = useState<string>(
    cart.shipping_methods?.[0]?.shipping_option_id ?? '',
  )
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    sdk.store.fulfillment
      .listCartOptions({ cart_id: cart.id })
      .then(({ shipping_options }) => {
        setOptions(shipping_options)
        if (!selected && shipping_options[0]) setSelected(shipping_options[0].id)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.id])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    startTransition(async () => {
      try {
        const { cart: updated } = await sdk.store.cart.addShippingMethod(cart.id, {
          option_id: selected,
        })
        onContinue(updated)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {!options ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : options.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          No hay opciones de envío para tu dirección. Vuelve atrás y revisa el país / código postal.
        </p>
      ) : (
        <ul className="space-y-2">
          {options.map((o) => {
            const active = selected === o.id
            return (
              <li key={o.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-foreground',
                  )}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={o.id}
                    checked={active}
                    onChange={() => setSelected(o.id)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{o.name}</p>
                    <p className="text-xs text-muted-foreground">Entrega estimada: 24-48h</p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatMoney(o.amount ?? 0, cart.currency_code ?? 'eur')}
                  </p>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button type="submit" size="lg" className="flex-1" disabled={pending || !selected}>
          {pending ? 'Guardando…' : 'Continuar a pago'}
        </Button>
      </div>
    </form>
  )
}
