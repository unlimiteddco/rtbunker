'use client'

import { Crown, LayoutDashboard, LogOut, MapPin, Package, Sparkles } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Link, usePathname, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { sdk } from '@/lib/medusa'

const items = [
  { href: '/cuenta', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/cuenta/pedidos', label: 'Pedidos', icon: Package },
  { href: '/cuenta/personalizadas', label: 'Personalizadas', icon: Sparkles },
  { href: '/cuenta/suscripcion', label: 'Mi suscripción', icon: Crown },
  { href: '/cuenta/direcciones', label: 'Direcciones', icon: MapPin },
] as const

export function AccountNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function logout() {
    startTransition(async () => {
      try {
        await sdk.auth.logout()
        toast.success('Sesión cerrada')
        router.push('/')
        router.refresh()
      } catch {
        toast.error('No se pudo cerrar sesión')
      }
    })
  }

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {items.map((it) => {
        const Icon = it.icon
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href)
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {it.label}
          </Link>
        )
      })}
      <Button
        type="button"
        onClick={logout}
        disabled={pending}
        variant="ghost"
        className="mt-2 justify-start gap-2 text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </Button>
    </nav>
  )
}
