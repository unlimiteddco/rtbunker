import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/account/auth-shell'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

interface RecoverPageProps {
  params: Promise<{ locale: string }>
}

export const metadata: Metadata = {
  title: 'Recuperar contraseña · RT Bunker',
  robots: { index: false, follow: false },
}

/**
 * Placeholder de recuperación de contraseña hasta que se monte el flujo
 * automático (workflow + endpoint `/auth/user/emailpass/reset` + email
 * con Resend). Roadmap Fase B #8.
 */
export default async function RecoverPasswordPage({ params }: RecoverPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <AuthShell
      eyebrow="Recuperar contraseña"
      display={
        <>
          ¿Se te ha
          <br />
          <span className="text-rt-yellow">olvidado?</span>
        </>
      }
      subcopy="Pronto podrás recuperarla automáticamente desde aquí. De momento, escríbenos y te ayudamos en menos de 24 h laborables."
    >
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
          Próximamente
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-[28px] font-bold leading-[1.1] text-rt-black md:text-[32px]">
          Lo arreglamos a mano por ahora.
        </h2>
      </header>

      <div className="space-y-5 rounded-[20px] border border-rt-ink-100 bg-rt-white p-6">
        <p className="text-[14px] leading-[1.6] text-rt-ink-700">
          Mándanos un email a{' '}
          <a
            href="mailto:info@rtbunker.com?subject=Recuperar%20contraseña"
            className="font-bold text-rt-black underline-offset-4 hover:underline"
          >
            info@rtbunker.com
          </a>{' '}
          desde la dirección con la que te registraste y te devolvemos el acceso en
          un par de horas laborables.
        </p>
        <p className="text-[13px] text-rt-ink-500">
          Estamos preparando el flujo automático con email de reset. Te avisaremos
          cuando esté listo.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild variant="primary" size="default">
            <a href="mailto:info@rtbunker.com?subject=Recuperar%20contraseña">
              Enviar email
            </a>
          </Button>
          <Button asChild variant="ghost" size="default">
            <Link href="/login">Volver al login</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
