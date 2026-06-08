'use client'

import { Loader2, MessageSquare, RefreshCw, ThumbsUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { sdk } from '@/lib/medusa'

interface InlineApprovalProps {
  customOrderId: string
}

/**
 * Botones de aprobación dentro de `/cuenta/personalizadas/[id]`. Usa la
 * variante autenticada del endpoint (no requiere magic_token, valida por
 * email del customer logueado).
 */
export function InlineApproval({ customOrderId }: InlineApprovalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'requesting' | 'submitting'>('idle')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(decision: 'approved' | 'changes_requested') {
    setError(null)
    setMode('submitting')
    try {
      await sdk.client.fetch(
        `/store/customers/me/custom-orders/${customOrderId}/response`,
        {
          method: 'POST',
          body: {
            decision,
            notes: notes.trim() || undefined,
          },
        },
      )
      // Refresca la página para que el server component re-fetchee y muestre
      // el nuevo estado del pedido + la decisión registrada en el proof.
      router.refresh()
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'No hemos podido registrar tu respuesta. Vuelve a probar.'
      setError(message)
      setMode(decision === 'changes_requested' ? 'requesting' : 'idle')
    }
  }

  if (mode === 'requesting') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rt-yellow-deep font-[family-name:var(--font-heading)]">
          Pedir cambios
        </p>
        <p className="text-sm leading-relaxed text-rt-black">
          Cuéntanos qué quieres ajustar (colores, tamaño, posición, lo que sea).
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Por ejemplo: el azul más oscuro, y el logo un 10% más pequeño."
          className="w-full rounded-[12px] border border-rt-ink-100 bg-rt-white px-3 py-2 text-sm leading-[1.5] text-rt-black placeholder:text-rt-ink-300 focus:border-rt-yellow focus:outline-none focus:ring-2 focus:ring-rt-yellow/30"
        />
        {error ? <p className="text-xs text-rt-danger">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={() => submit('changes_requested')}
            disabled={mode === 'submitting' || notes.trim().length < 3}
          >
            {mode === 'submitting' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            Enviar cambios
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={() => {
              setMode('idle')
              setError(null)
            }}
            disabled={mode === 'submitting'}
          >
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-xs text-rt-danger">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="primary"
          size="default"
          onClick={() => submit('approved')}
          disabled={mode === 'submitting'}
          className="flex-1"
        >
          {mode === 'submitting' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ThumbsUp className="h-3.5 w-3.5" />
          )}
          Aprobar mockup
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="default"
          onClick={() => setMode('requesting')}
          disabled={mode === 'submitting'}
          className="flex-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Pedir cambios
        </Button>
      </div>
    </div>
  )
}
