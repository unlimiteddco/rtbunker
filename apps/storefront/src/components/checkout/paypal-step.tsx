'use client'

import type { HttpTypes } from '@medusajs/types'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { resetCartCookie } from '@/lib/cart'
import { sdk } from '@/lib/medusa'

interface PaypalStepProps {
  cart: HttpTypes.StoreCart
  onBack: () => void
}

/**
 * Paso de pago con PayPal. Espejo de `payment-step.tsx` pero con los botones
 * de PayPal en lugar del `<PaymentElement>` de Stripe.
 *
 * Flujo:
 *  1. `createOrder`: inicia (o re-inicia) la sesión de pago de Medusa contra
 *     `pp_paypal_paypal`. El provider crea una Order en PayPal y devuelve su id
 *     en `session.data.id`, que entregamos al SDK de PayPal.
 *  2. El comprador aprueba el pago en el popup de PayPal.
 *  3. `onApprove`: completamos el carrito en Medusa, que captura/autoriza el
 *     pago en PayPal a través del provider.
 */
export function PaypalStep({ cart, onBack }: PaypalStepProps) {
  const router = useRouter()
  const [{ isPending, isRejected }] = usePayPalScriptReducer()
  const [error, setError] = useState<string | null>(null)
  // Mientras completamos el carrito tras la aprobación de PayPal: feedback al
  // usuario y guard de idempotencia (evita doble `cart.complete`).
  const [processing, setProcessing] = useState(false)

  async function createOrder(): Promise<string> {
    setError(null)
    // SIEMPRE re-iniciamos la sesión al crear la orden, igual que en Stripe.
    // Medusa elimina la sesión previa y crea una Order nueva en PayPal.
    const { payment_collection } = await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: 'pp_paypal_paypal',
    })
    const session = payment_collection.payment_sessions?.find(
      (s) => s.provider_id === 'pp_paypal_paypal',
    )
    const paypalOrderId = (session?.data as { id?: string } | undefined)?.id
    if (!paypalOrderId) {
      setError('No se pudo iniciar el pago con PayPal.')
      throw new Error('missing_paypal_order_id')
    }
    return paypalOrderId
  }

  async function onApprove(_data: { orderID: string }) {
    if (processing) return // idempotencia: no completar dos veces
    setError(null)
    setProcessing(true)
    try {
      const completed = await sdk.store.cart.complete(cart.id)
      if (completed.type === 'order') {
        await resetCartCookie()
        toast.success('¡Pedido confirmado!')
        router.push(`/checkout/exito/${completed.order.id}`)
        return // dejamos `processing` activo durante la redirección
      }
      setError('No se pudo completar el pedido.')
      setProcessing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4">
        {isRejected ? (
          <p className="text-sm text-destructive">
            No se pudo cargar PayPal. Recarga la página o prueba con tarjeta.
          </p>
        ) : isPending ? (
          <p className="text-sm text-muted-foreground">Cargando PayPal…</p>
        ) : (
          <PayPalButtons
            style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
            disabled={processing}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={() => {
              setProcessing(false)
              setError('Hubo un problema con PayPal. Inténtalo de nuevo.')
            }}
            onCancel={() => {
              setProcessing(false)
              setError(null)
            }}
          />
        )}
        {processing ? (
          <p className="mt-3 text-sm text-muted-foreground">Procesando tu pedido…</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Pago seguro procesado por PayPal. Tus datos no pasan por nuestros servidores.
      </p>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={processing}>
          Atrás
        </Button>
      </div>
    </div>
  )
}
