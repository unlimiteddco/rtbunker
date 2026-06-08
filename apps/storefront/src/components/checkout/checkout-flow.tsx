'use client'

import { Elements } from '@stripe/react-stripe-js'
import type { HttpTypes } from '@medusajs/types'
import { useState } from 'react'

import { getStripe } from '@/lib/stripe'

import { AddressStep } from './address-step'
import { CheckoutStepper, type CheckoutStep } from './checkout-stepper'
import { FreeOrderStep } from './free-order-step'
import { OrderSummary } from './order-summary'
import { PaymentStep } from './payment-step'
import { ShippingStep } from './shipping-step'

interface CheckoutFlowProps {
  cart: HttpTypes.StoreCart
  locale: string
  /** DNI guardado en el customer logueado para precargar en Address. */
  defaultDni?: string | null
}

const STEP_TITLE: Record<CheckoutStep, { title: string; description: string }> = {
  address: { title: 'Dirección de envío', description: '¿Dónde quieres recibir tu pedido?' },
  shipping: { title: 'Método de envío', description: 'Elige cómo te lo enviamos.' },
  payment: { title: 'Pago', description: 'Pago seguro procesado por Stripe.' },
}

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0abab5',
    colorBackground: '#ffffff',
    colorText: '#141414',
    colorDanger: '#c43434',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': { boxShadow: 'none', borderColor: 'hsl(0 0% 90%)' },
    '.Tab': { borderColor: 'hsl(0 0% 90%)' },
    '.Tab--selected': { borderColor: '#0abab5' },
  },
}

export function CheckoutFlow({ cart: initialCart, locale, defaultDni }: CheckoutFlowProps) {
  const [step, setStep] = useState<CheckoutStep>('address')
  const [cart, setCart] = useState(initialCart)
  const stripePromise = getStripe()
  const meta = STEP_TITLE[step]
  const isFreeOrder = (cart.total ?? 0) <= 0
  const description =
    step === 'payment' && isFreeOrder
      ? 'Confirma tu pedido. No se te cobrará nada.'
      : meta.description

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_360px] md:gap-10">
      <section className="min-w-0 space-y-6">
        <CheckoutStepper current={step} onSelect={setStep} />

        <header className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{meta.title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>

        {step === 'address' ? (
          <AddressStep
            cart={cart}
            defaultDni={defaultDni ?? null}
            onContinue={(updated) => {
              setCart(updated)
              setStep('shipping')
            }}
          />
        ) : null}

        {step === 'shipping' ? (
          <ShippingStep
            cart={cart}
            onBack={() => setStep('address')}
            onContinue={(updated) => {
              setCart(updated)
              setStep('payment')
            }}
          />
        ) : null}

        {step === 'payment' ? (
          (cart.total ?? 0) <= 0 ? (
            // Pedido gratis (canje 100% créditos + envío gratis): sin Stripe.
            <FreeOrderStep cart={cart} onBack={() => setStep('shipping')} />
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                mode: 'payment',
                // Stripe espera el importe en céntimos (entero). Medusa guarda
                // euros decimales (e.g. 51.4129) → redondeamos a la unidad mínima.
                amount: Math.max(1, Math.round((cart.total ?? 0) * 100)),
                currency: cart.currency_code ?? 'eur',
                locale: locale as 'es' | 'en' | 'fr',
                appearance: stripeAppearance,
              }}
            >
              <PaymentStep cart={cart} locale={locale} onBack={() => setStep('shipping')} />
            </Elements>
          )
        ) : null}
      </section>

      <OrderSummary cart={cart} locale={locale} />
    </div>
  )
}
