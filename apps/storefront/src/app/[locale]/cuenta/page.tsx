import { ArrowRight, MapPin, Package, ShoppingBag, Sparkles } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { getCurrentCustomer } from '@/lib/auth'

interface AccountPageProps {
  params: Promise<{ locale: string }>
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const customer = await getCurrentCustomer()

  const stats = [
    {
      icon: Package,
      label: 'Pedidos',
      hint: 'Histórico y seguimiento',
      href: '/cuenta/pedidos',
    },
    {
      icon: Sparkles,
      label: 'Personalizadas',
      hint: 'Mockups y producción',
      href: '/cuenta/personalizadas',
    },
    {
      icon: MapPin,
      label: 'Direcciones',
      hint: `${customer?.addresses?.length ?? 0} guardadas`,
      href: '/cuenta/direcciones',
    },
    {
      icon: ShoppingBag,
      label: 'Volver a la tienda',
      hint: 'Sigue comprando',
      href: '/tienda',
    },
  ] as const

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Aquí gestionas tus pedidos, direcciones y datos personales.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Email:</span> {customer?.email}
          </p>
          {customer?.first_name || customer?.last_name ? (
            <p>
              <span className="font-medium text-foreground">Nombre:</span>{' '}
              {[customer?.first_name, customer?.last_name].filter(Boolean).join(' ')}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {stats.map(({ icon: Icon, label, hint, href }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
