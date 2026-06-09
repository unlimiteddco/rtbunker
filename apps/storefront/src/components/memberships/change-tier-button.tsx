'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { sdk } from '@/lib/medusa'
import type { MembershipTierId } from '@/lib/memberships'

interface ChangeTierButtonProps {
  targetTierId: MembershipTierId
  label: string
  variant?: 'primary' | 'dark' | 'ghost' | 'subtle'
  className?: string
}

/**
 * Cambia el plan del socio cobrando solo la diferencia proporcional (prorrateo
 * de Stripe). Llama a la Store API, que actualiza la suscripción in-place — no
 * redirige a Stripe. Tras el cambio refresca la página de cuenta.
 */
export function ChangeTierButton({
  targetTierId,
  label,
  variant = 'subtle',
  className,
}: ChangeTierButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    try {
      await sdk.client.fetch('/store/customers/me/membership/change-tier', {
        method: 'POST',
        body: { tier_id: targetTierId },
      })
      toast.success('Plan actualizado, puede tardar unos segundos en reflejarse')
      router.refresh()
    } catch (err) {
      const status = (err as { status?: number })?.status
      if (status === 401) {
        toast('Inicia sesión para cambiar de plan')
        router.push(`/login?redirect=${encodeURIComponent('/cuenta/suscripcion')}`)
        return
      }
      const msg =
        (err as { message?: string })?.message ?? 'No se pudo cambiar de plan. Inténtalo de nuevo.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="default"
      onClick={onClick}
      disabled={loading}
      className={cn('justify-center', className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}
