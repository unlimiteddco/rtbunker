'use client'

import type { HttpTypes } from '@medusajs/types'
import { Gift, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { resetCartCookie } from '@/lib/cart'
import { sdk } from '@/lib/medusa'

interface FreeOrderStepProps {
  cart: HttpTypes.StoreCart
  onBack: () => void
}

/**
 * Checkout de pedido gratis (total 0 €) — típicamente un canje 100% con
 * créditos del Club + envío gratis de socio. Stripe no procesa importes
 * menores a 0,50 €, así que usamos el proveedor "system" (autoriza sin cobro
 * real) y completamos el carrito.
 */
export function FreeOrderStep({ cart, onBack }: FreeOrderStepProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        // Sesión de pago manual (system) para un total de 0 €.
        await sdk.store.payment.initiatePaymentSession(cart, {
          provider_id: 'pp_system_default',
        })
        const completed = await sdk.store.cart.complete(cart.id)
        if (completed.type === 'order') {
          await resetCartCookie()
          toast.success('¡Pedido confirmado!')
          router.push(`/checkout/exito/${completed.order.id}`)
        } else {
          setError('No se pudo completar el pedido.')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-rt-success/30 bg-rt-success/10 p-4">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-rt-success" />
        <div>
          <p className="text-sm font-semibold text-rt-black">Tu pedido es gratis 🎉</p>
          <p className="mt-1 text-sm text-rt-ink-700">
            Cubierto con tus créditos del Club y envío urgente gratis de socio. No se te cobrará
            nada.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={pending}>
          Atrás
        </Button>
        <Button type="button" size="lg" className="flex-1" onClick={onConfirm} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirmando…
            </>
          ) : (
            'Confirmar pedido'
          )}
        </Button>
      </div>
    </div>
  )
}
