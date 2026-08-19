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
                Calle Aneto 15, Nave A6 · 50410 — Cuarte de Huerva, Zaragoza, España.
              </p>
              <div className="mt-5 flex flex-col items-start gap-3">
                <a
                  href="mailto:info@rtbunker.com"
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-rt-yellow hover:underline"
                >
                  <Mail className="h-4 w-4" /> info@rtbunker.com
                </a>
                <a
                  href="https://instagram.com/rtbunker_"
                  target="_blank"
                  rel="noopener"
                  aria-label="Instagram de RT Bunker: @rtbunker_"
                  className="inline-flex items-center gap-2.5 rounded-full border border-rt-yellow/40 bg-rt-yellow/10 px-4 py-2 text-[15px] font-bold text-rt-yellow transition-colors hover:bg-rt-yellow hover:text-rt-black font-[family-name:var(--font-heading)]"
                >
                  <Instagram className="h-[18px] w-[18px]" />
                  @rtbunker_
                </a>
              </div>
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
            <div className="flex flex-col items-start gap-1.5">
              <span>
                © {year} RT Bunker. {t('rights')}
              </span>
              {/* Crédito Bellostas Studio */}
              <a
                href="https://bellostas.studio"
                target="_blank"
                rel="noopener"
                className="group inline-flex items-center gap-1.5 text-[12px] text-rt-ink-500 transition-colors hover:text-rt-white"
                aria-label="Web diseñada y desarrollada por Bellostas Studio"
              >
                <span>Diseñado y desarrollado por</span>
                <span className="relative font-semibold tracking-tight text-rt-white/60 transition-colors group-hover:text-rt-white">
                  Bellostas Studio
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px origin-left scale-x-0 bg-rt-yellow transition-transform duration-300 group-hover:scale-x-100" />
                </span>
              </a>
            </div>
            <div className="flex items-center gap-5">
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
