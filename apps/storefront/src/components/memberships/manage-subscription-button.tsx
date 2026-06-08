'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { sdk } from '@/lib/medusa'

/**
 * Abre el Stripe Billing Portal para gestionar/cancelar la suscripción.
 */
export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    try {
      const { url } = await sdk.client.fetch<{ url: string }>(
        '/store/customers/me/membership/portal-session',
        { method: 'POST' },
      )
      if (url) {
        window.location.href = url
        return
      }
      toast.error('No se pudo abrir la gestión de la suscripción.')
    } catch {
      toast.error('No se pudo abrir la gestión de la suscripción.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="dark" size="default" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Gestionar suscripción
    </Button>
  )
}
