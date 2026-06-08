'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { sdk } from '@/lib/medusa'
import type { MembershipTierId } from '@/lib/memberships'

interface PlanCheckoutButtonProps {
  tierId: MembershipTierId
  label?: string
  variant?: 'primary' | 'dark' | 'ghost'
  className?: string
}

/**
 * CTA de alta de plan. Llama a la Store API para abrir un Stripe Checkout
 * Session (modo suscripción) y redirige a Stripe. Si el cliente no está
 * logueado, lo manda a /login.
 */
export function PlanCheckoutButton({
  tierId,
  label = 'Hazte socio',
  variant = 'primary',
  className,
}: PlanCheckoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    try {
      const { url } = await sdk.client.fetch<{ url: string }>(
        '/store/customers/me/membership/checkout-session',
        { method: 'POST', body: { tier_id: tierId } },
      )
      if (url) {
        window.location.href = url
        return
      }
      toast.error('No se pudo iniciar el alta. Inténtalo de nuevo.')
    } catch (err) {
      const status = (err as { status?: number })?.status
      if (status === 401) {
        toast('Inicia sesión para hacerte socio')
        router.push(`/login?redirect=${encodeURIComponent('/planes')}`)
        return
      }
      const msg =
        (err as { message?: string })?.message ?? 'No se pudo iniciar el alta. Inténtalo de nuevo.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      onClick={onClick}
      disabled={loading}
      className={cn('w-full justify-center', className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}
