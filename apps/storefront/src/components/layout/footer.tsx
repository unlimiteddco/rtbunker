import { Instagram, Mail, MapPin } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { CookiePreferencesButton } from '@/components/layout/cookie-preferences-button'
import { Newsletter } from '@/components/layout/newsletter'
import { Link } from '@/i18n/routing'

/**
 * Footer RT Bunker: surface carbón, headings amarillos UPPERCASE, links
 * blancos en Inter 500. La newsletter va en su propia banda amarilla
 * antes del footer.
 */
export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  const cols: { title: string; items: { href: string; label: string }[] }[] = [
    {
      title: 'Tienda',
      items: [
        { href: '/categoria/marcas-de-coches', label: 'Marcas de coches' },
        { href: '/categoria/parasoles', label: 'Parasoles' },
        { href: '/categoria/banner-delantero', label: 'Banner delantero' },
        { href: '/personalizadas', label: 'Personalizadas' },
      ],
    },
    {
      title: 'Servicios',
      items: [
        { href: '/servicios', label: 'Car Wrapping' },
        { href: '/servicios', label: 'Chrome Delete' },
        { href: '/servicios', label: 'Ahumado de faros' },
        { href: '/servicios', label: 'Rotulación' },
      ],
    },
    {
      title: 'Atención',
      items: [
        { href: '/planes', label: 'Hazte socio' },
        { href: '/cuenta', label: 'Mi cuenta' },
        { href: '/pagina/devoluciones', label: 'Envíos' },
        { href: '/contacto', label: 'Contacto' },
        { href: '/nosotros', label: 'Nosotros' },
      ],
    },
  ]

  return (
    <>
      <Newsletter />

      <footer className="bg-rt-black text-rt-white">
        <div className="container-page py-16">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" aria-label="RT Bunker" className="inline-flex items-center">
                <Image
                  src="/logo-white.png"
                  alt="RT Bunker"
                  width={1166}
                  height={188}
                  sizes="180px"
                  className="h-8 w-auto"
                />
              </Link>
              <p className="mt-4 max-w-[340px] text-[14px] leading-[1.6] text-rt-ink-300">
                Fabricantes de pegatinas premium para coches.
                <br />
                Calle Neto, nave 15 · 50410 — Cuarte de Huerva, Zaragoza, España.
                {/* TODO confirmar CP y ciudad */}
              </p>
              <a
                href="mailto:info@rtbunker.com"
                className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-rt-yellow hover:underline"
              >
                <Mail className="h-4 w-4" /> info@rtbunker.com
              </a>
            </div>

            {cols.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {col.items.map((it) => (
                    <li key={`${col.title}-${it.label}`}>
                      <Link
                        href={it.href}
                        className="text-[14px] font-medium text-rt-white transition-colors hover:text-rt-yellow"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-rt-black-3 pt-6 text-[12px] text-rt-ink-500 md:flex-row md:items-center md:justify-between">
            <span>
              © {year} RT Bunker. {t('rights')}
            </span>
            <div className="flex items-center gap-5">
              {/* TODO Nikita: handle real */}
              <a
                href="https://instagram.com/rtbunker_oficial"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
                className="text-rt-ink-500 transition-colors hover:text-rt-yellow"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <CookiePreferencesButton className="hover:text-rt-yellow" />
              <Link href="/pagina/privacidad" className="hover:text-rt-yellow">
                Privacidad
              </Link>
              <Link href="/pagina/aviso-legal" className="hover:text-rt-yellow">
                Condiciones
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

// Suprimir warning de import no usado.
void MapPin
