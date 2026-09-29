'use client'

import type { HttpTypes } from '@medusajs/types'
import { Landmark, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import {
  BANK_TRANSFER_METHOD,
  MANUAL_PAYMENT_PROVIDER,
  formatIban,
  type BankTransferInfo,
} from '@/lib/bank-transfer'
import { resetCartCookie } from '@/lib/cart'
import { formatMoney } from '@/lib/format'
import { sdk } from '@/lib/medusa'

import { CopyButton } from './copy-button'

interface BankTransferStepProps {
  cart: HttpTypes.StoreCart
  bank: BankTransferInfo
  onBack: () => void
}

type Metadata = Record<string, unknown>

/**
 * Pago por transferencia bancaria. Usa el proveedor manual de Medusa
 * (`pp_system_default`): autoriza sin cobrar y el pedido queda con el pago
 * pendiente de capturar. El equipo lo marca como pagado en el admin cuando
 * llega la transferencia.
 *
 * Antes de completar guardamos `cart.metadata.payment_method = 'bank_transfer'`
 * (pasa al pedido) para distinguirlo de un pedido gratis y mostrar los datos
 * bancarios en la página de éxito y en el email.
 */
export function BankTransferStep({ cart, bank, onBack }: BankTransferStepProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const currency = cart.currency_code ?? 'eur'

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const baseMetadata: Metadata = { ...((cart.metadata as Metadata | null | undefined) ?? {}) }
      let marked = false
      try {
        const { cart: updated } = await sdk.store.cart.update(cart.id, {
          metadata: { ...baseMetadata, payment_method: BANK_TRANSFER_METHOD },
        })
        marked = true

        await sdk.store.payment.initiatePaymentSession(updated, {
          provider_id: MANUAL_PAYMENT_PROVIDER,
        })

        const completed = await sdk.store.cart.complete(cart.id)
        if (completed.type === 'order') {
          await resetCartCookie()
          toast.success('¡Pedido registrado!')
          router.push(`/checkout/exito/${completed.order.id}`)
          return
        }
        setError(completed.error?.message ?? 'No se pudo completar el pedido.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado')
      }

      // Si no se llegó a crear el pedido, quitamos la marca para que un pago
      // posterior con otro método no quede etiquetado como transferencia.
      if (marked) {
        const { payment_method: _omit, ...rest } = baseMetadata
        await sdk.store.cart.update(cart.id, { metadata: rest }).catch(() => undefined)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-rt-yellow/40 bg-rt-yellow/5 p-4">
        <div className="flex items-start gap-3">
          <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-rt-yellow" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rt-black">Transferencia bancaria</p>
            <p className="mt-1 text-sm text-rt-ink-700">
              Recibirás los datos para la transferencia al confirmar. Preparamos tu pedido cuando
              recibamos el pago (1-2 días hábiles).
            </p>
          </div>
        </div>

        <dl className="mt-4 space-y-2 rounded-md border border-rt-ink-100 bg-white p-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <dt className="text-rt-ink-500">Importe</dt>
            <dd className="font-semibold tabular-nums text-rt-black">
              {formatMoney(cart.total ?? 0, currency)}
            </dd>
          </div>
          {bank.holder ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="text-rt-ink-500">Titular</dt>
              <dd className="font-medium text-rt-black">{bank.holder}</dd>
            </div>
          ) : null}
          {bank.iban ? (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <dt className="text-rt-ink-500">IBAN</dt>
              <dd className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                <span className="whitespace-nowrap font-mono text-[13px] font-medium text-rt-black sm:text-sm">
                  {formatIban(bank.iban)}
                </span>
                <CopyButton value={bank.iban.replace(/\s+/g, '')} label="Copiar IBAN" />
              </dd>
            </div>
          ) : null}
          <p className="pt-1 text-xs text-rt-ink-500">
            El concepto (nº de pedido) aparecerá al confirmar y en el email de confirmación.
          </p>
        </dl>
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
