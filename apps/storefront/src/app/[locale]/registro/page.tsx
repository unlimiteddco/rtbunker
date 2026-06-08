import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/account/auth-shell'
import { RegisterForm } from '@/components/account/register-form'
import { Link } from '@/i18n/routing'

interface RegisterPageProps {
  params: Promise<{ locale: string }>
}

export const metadata: Metadata = {
  title: 'Crear cuenta · RT Bunker',
  robots: { index: false, follow: false },
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <AuthShell
      eyebrow="Únete a RT Bunker"
      display={
        <>
          Tu garaje
          <br />
          <span className="text-rt-yellow">arranca aquí</span>
        </>
      }
      subcopy="Crear una cuenta es gratis y te lleva un minuto. Después podrás pedir pegatinas personalizadas, hacer seguimiento de mockups y guardar tus direcciones."
      bullets={[
        {
          label: 'Pedidos personalizados',
          description: 'Configurador con upload, mockups y aprobaciones inline.',
        },
        {
          label: 'Histórico permanente',
          description: 'Todos tus pedidos guardados con su estado y tracking.',
        },
        {
          label: 'Cero spam',
          description: 'Solo emails de tus pedidos. Nada de publicidad sin consentimiento.',
        },
      ]}
    >
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
          Crear cuenta
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-[28px] font-bold leading-[1.1] text-rt-black md:text-[32px]">
          Solo necesitamos lo justo.
        </h2>
        <p className="mt-2 text-[14px] text-rt-ink-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold text-rt-black underline-offset-4 hover:underline">
            Iniciar sesión →
          </Link>
        </p>
      </header>

      <RegisterForm />
    </AuthShell>
  )
}
