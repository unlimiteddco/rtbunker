import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/account/auth-shell'
import { LoginForm } from '@/components/account/login-form'
import { Link } from '@/i18n/routing'

interface LoginPageProps {
  params: Promise<{ locale: string }>
}

export const metadata: Metadata = {
  title: 'Iniciar sesión · RT Bunker',
  robots: { index: false, follow: false },
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <AuthShell
      eyebrow="Tu cuenta RT Bunker"
      display={
        <>
          De vuelta al
          <br />
          <span className="text-rt-yellow">garaje</span>
        </>
      }
      subcopy="Sigue tus pedidos personalizados, gestiona direcciones y revisa el histórico de pegatinas. Si aún no estás dentro, créate una cuenta — tarda un minuto."
      bullets={[
        {
          label: 'Seguimiento E2E',
          description: 'Mockups, aprobaciones y tracking en un solo sitio.',
        },
        {
          label: 'Direcciones guardadas',
          description: 'Vuelve a pedir sin volver a rellenar nada.',
        },
        {
          label: 'Cupones y novedades',
          description: 'Acceso prioritario a sorteos y descuentos exclusivos.',
        },
      ]}
    >
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
          Iniciar sesión
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-[28px] font-bold leading-[1.1] text-rt-black md:text-[32px]">
          Entra con tu cuenta.
        </h2>
        <p className="mt-2 text-[14px] text-rt-ink-500">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registro" className="font-bold text-rt-black underline-offset-4 hover:underline">
            Crear una →
          </Link>
        </p>
      </header>

      <LoginForm />
    </AuthShell>
  )
}
