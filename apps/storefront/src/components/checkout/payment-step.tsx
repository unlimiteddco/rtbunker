'use client'

import type { HttpTypes } from '@medusajs/types'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Lock } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { resetCartCookie } from '@/lib/cart'
import { sdk } from '@/lib/medusa'

interface PaymentStepProps {
  cart: HttpTypes.StoreCart
  locale: string
  onBack: () => void
}

export function PaymentStep({ cart, locale, onBack }: PaymentStepProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function ensurePaymentSession() {
    // SIEMPRE re-iniciamos al pulsar pagar. Medusa elimina la sesión
    // previa y crea una nueva contra la cuenta Stripe actual. Esto
    // protege contra:
    //   · Sesiones huérfanas tras cambiar de cuenta Stripe (live ↔ test).
    //   · PaymentIntents que Stripe ha cancelado por timeout (>24h).
    // El coste es ~1 llamada extra a Stripe por intento de pago.
    const { payment_collection } = await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: 'pp_stripe_stripe',
    })
    return payment_collection.payment_sessions?.find(
      (s) => s.provider_id === 'pp_stripe_stripe',
    )
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      if (!stripe || !elements) return
      try {
        const session = await ensurePaymentSession()
        const clientSecret = (session?.data as { client_secret?: string } | undefined)
          ?.client_secret
        if (!clientSecret) {
          setError('No se pudo iniciar el pago.')
          return
        }
        const { error: submitErr } = await elements.submit()
        if (submitErr) {
          setError(submitErr.message ?? 'Error en el formulario de pago.')
          return
        }

        const result = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/${locale}/checkout?confirm=true`,
          },
          redirect: 'if_required',
        })

        if (result.error) {
          setError(result.error.message ?? 'Error en el pago.')
          return
        }

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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Pago seguro procesado por Stripe. Tus datos no pasan por nuestros servidores.
      </p>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={pending || !stripe || !elements}
        >
          {pending ? 'Procesando…' : 'Confirmar y pagar'}
        </Button>
      </div>
    </form>
  )
}
