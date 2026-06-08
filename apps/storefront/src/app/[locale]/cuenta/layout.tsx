import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { AccountNav } from '@/components/account/account-nav'
import { getCurrentCustomer } from '@/lib/auth'

interface AccountLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { locale } = await params
  const customer = await getCurrentCustomer()

  // Si no hay sesión, redirigimos a login. Pero la ruta /cuenta/login y /cuenta/registro
  // no están bajo este layout (van por su propia route directa); este layout solo cubre
  // las páginas autenticadas.
  if (!customer) {
    redirect(`/${locale}/login`)
  }

  return (
    <div className="container-page py-8 md:py-12">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Mi cuenta
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          Hola, {customer.first_name ?? customer.email.split('@')[0]}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-24 md:self-start">
          <AccountNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
