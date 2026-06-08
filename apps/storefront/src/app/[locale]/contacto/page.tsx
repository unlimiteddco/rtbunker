import type { Metadata } from 'next'
import { Clock, Instagram, Mail, MapPin } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'

import { ContactForm } from '@/components/contact/contact-form'
import { Link } from '@/i18n/routing'

interface ContactPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Contacto · RT Bunker',
    description:
      'Hablemos. Escríbenos para pedidos, pegatinas personalizadas, plazos o cualquier duda. Respondemos en menos de 24 h laborables.',
    alternates: { canonical: `/${locale}/contacto` },
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-10 max-w-2xl">
        <p className="text-eyebrow mb-2">Contacto</p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(34px,6vw,64px)] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black">
          Hablemos
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-rt-ink-500">
          ¿Tienes un proyecto, una duda sobre un pedido o quieres pegatinas a medida? Cuéntanoslo y
          te respondemos lo antes posible, normalmente en menos de 24 h laborables.
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:gap-12">
        {/* Columna info */}
        <aside className="space-y-6">
          <InfoRow icon={Mail} title="Email">
            <a
              href="mailto:info@rtbunker.com"
              className="font-semibold text-rt-black hover:text-rt-yellow-deep"
            >
              info@rtbunker.com
            </a>
          </InfoRow>

          <InfoRow icon={MapPin} title="Dirección">
            Calle Forqueta
            <br />
            50410 Cuarte de Huerva
            <br />
            Zaragoza, España
          </InfoRow>

          <InfoRow icon={Clock} title="Horario">
            Lunes a viernes
            <br />
            9:00 – 18:00 h
          </InfoRow>

          <InfoRow icon={Instagram} title="Instagram">
            <a
              href="https://instagram.com/rtbunker"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-rt-black hover:text-rt-yellow-deep"
            >
              @rtbunker
            </a>
          </InfoRow>

          <div className="rounded-[16px] border border-rt-ink-100 bg-rt-white-2 p-4">
            <p className="text-[13px] leading-[1.55] text-rt-ink-700">
              ¿Buscas algo muy concreto? Echa un vistazo a la{' '}
              <Link href="/tienda" className="font-semibold text-rt-black underline-offset-2 hover:underline">
                tienda
              </Link>{' '}
              o diseña tu pegatina en{' '}
              <Link href="/personalizadas" className="font-semibold text-rt-black underline-offset-2 hover:underline">
                personalizadas
              </Link>
              .
            </p>
          </div>
        </aside>

        {/* Columna formulario */}
        <ContactForm />
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Mail
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rt-yellow/15 text-rt-yellow-deep">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.12em] text-rt-ink-500">
          {title}
        </p>
        <p className="mt-0.5 text-[14px] leading-[1.5] text-rt-ink-700">{children}</p>
      </div>
    </div>
  )
}
