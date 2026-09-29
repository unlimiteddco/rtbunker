'use client'

import { Elements } from '@stripe/react-stripe-js'
import type { HttpTypes } from '@medusajs/types'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { Loader2, MessageCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  MANUAL_PAYMENT_PROVIDER,
  getBankTransferInfo,
  type BankTransferInfo,
} from '@/lib/bank-transfer'
import { cn } from '@/lib/cn'
import { sdk } from '@/lib/medusa'
import { getPaypalOptions } from '@/lib/paypal'
import { getStripe } from '@/lib/stripe'

import { AddressStep } from './address-step'
import { BankTransferStep } from './bank-transfer-step'
import { CheckoutStepper, type CheckoutStep } from './checkout-stepper'
import { FreeOrderStep } from './free-order-step'
import { OrderSummary } from './order-summary'
import { PaymentStep } from './payment-step'
import { PaypalStep } from './paypal-step'
import { ShippingStep } from './shipping-step'

type PaymentMethod = 'stripe' | 'paypal' | 'bank_transfer'

const METHOD_LABEL: Record<PaymentMethod, string> = {
  stripe: 'Tarjeta',
  paypal: 'PayPal',
  bank_transfer: 'Transferencia bancaria',
}

type PaymentOptions =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; methods: PaymentMethod[]; bank: BankTransferInfo | null }

interface CheckoutFlowProps {
  cart: HttpTypes.StoreCart
  locale: string
  /** DNI guardado en el customer logueado para precargar en Address. */
  defaultDni?: string | null
}

const STEP_TITLE: Record<CheckoutStep, { title: string; description: string }> = {
  address: { title: 'Dirección de envío', description: '¿Dónde quieres recibir tu pedido?' },
  shipping: { title: 'Método de envío', description: 'Elige cómo te lo enviamos.' },
  payment: { title: 'Pago', description: 'Elige cómo quieres pagar tu pedido.' },
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
  const [selected, setSelected] = useState<PaymentMethod | null>(null)
  const [options, setOptions] = useState<PaymentOptions>({ status: 'loading' })
  // `null` si NEXT_PUBLIC_PAYPAL_CLIENT_ID no está → PayPal no se ofrece.
  const paypalOptions = getPaypalOptions()
  const regionId = cart.region_id

  // Métodos de pago REALES de la región (proveedores habilitados en Medusa)
  // cruzados con la config del storefront / backend:
  //   · Tarjeta       → pp_stripe_* en la región.
  //   · PayPal        → pp_paypal_paypal + NEXT_PUBLIC_PAYPAL_CLIENT_ID.
  //   · Transferencia → pp_system_default + IBAN configurado en el backend.
  const loadPaymentOptions = useCallback(async () => {
    if (!regionId) {
      setOptions({ status: 'ready', methods: [], bank: null })
      return
    }
    setOptions({ status: 'loading' })
    try {
      const [{ payment_providers }, bank] = await Promise.all([
        sdk.store.payment.listPaymentProviders({ region_id: regionId }),
        getBankTransferInfo(),
      ])
      const ids = payment_providers.map((p) => p.id)
      const methods: PaymentMethod[] = []
      if (ids.some((id) => id.startsWith('pp_stripe_'))) methods.push('stripe')
      if (ids.includes('pp_paypal_paypal') && paypalOptions) methods.push('paypal')
      if (ids.includes(MANUAL_PAYMENT_PROVIDER) && bank?.enabled) methods.push('bank_transfer')
      setOptions({ status: 'ready', methods, bank })
    } catch {
      setOptions({ status: 'error' })
    }
    // `paypalOptions` depende solo de env pública (estable entre renders).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId])

  useEffect(() => {
    void loadPaymentOptions()
  }, [loadPaymentOptions])

  const available = options.status === 'ready' ? options.methods : []
  // Por defecto, el primero disponible.
  const method: PaymentMethod | null =
    selected && available.includes(selected) ? selected : (available[0] ?? null)
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
            <div className="space-y-5">
              {options.status === 'loading' ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando métodos de pago…
                </p>
              ) : null}

              {options.status === 'error' ? (
                <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p className="text-destructive">No se pudieron cargar los métodos de pago.</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setStep('shipping')}>
                      Atrás
                    </Button>
                    <Button type="button" variant="subtle" onClick={() => void loadPaymentOptions()}>
                      Reintentar
                    </Button>
                  </div>
                </div>
              ) : null}

              {options.status === 'ready' && !method ? (
                <NoPaymentAvailable onBack={() => setStep('shipping')} />
              ) : null}

              {/* Selector: solo si hay más de un método disponible. */}
              {available.length > 1 ? (
                <div
                  className={cn(
                    'grid gap-2',
                    available.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3',
                  )}
                  role="tablist"
                  aria-label="Método de pago"
                >
                  {available.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={method === m}
                      onClick={() => setSelected(m)}
                      className={cn(
                        'rounded-lg border p-3 text-sm font-medium transition-colors',
                        method === m
                          ? 'border-rt-yellow bg-rt-yellow/5 text-rt-black'
                          : 'border-border text-muted-foreground hover:border-rt-yellow/50',
                      )}
                    >
                      {METHOD_LABEL[m]}
                    </button>
                  ))}
                </div>
              ) : null}

              {method === 'paypal' && paypalOptions ? (
                <PayPalScriptProvider options={paypalOptions}>
                  <PaypalStep cart={cart} onBack={() => setStep('shipping')} />
                </PayPalScriptProvider>
              ) : null}

              {method === 'bank_transfer' && options.status === 'ready' && options.bank ? (
                <BankTransferStep
                  cart={cart}
                  bank={options.bank}
                  onBack={() => setStep('shipping')}
                />
              ) : null}

              {method === 'stripe' ? (
                <Elements
                  stripe={getStripe()}
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
              ) : null}
            </div>
          )
        ) : null}
      </section>

      <OrderSummary cart={cart} locale={locale} />
    </div>
  )
}

/** Sin ningún método de pago disponible en la región: derivamos a WhatsApp. */
function NoPaymentAvailable({ onBack }: { onBack: () => void }) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent('Hola RT Bunker, quiero hacer un pedido y no me aparece ningún método de pago.')}`
    : null

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-rt-black">Pago no disponible</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ahora mismo no podemos cobrar online. Contáctanos por WhatsApp y te ayudamos a completar
          tu pedido.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        {href ? (
          <Button asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              Escríbenos por WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
