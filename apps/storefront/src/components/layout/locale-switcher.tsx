'use client'

import { Globe } from 'lucide-react'
import { useTransition } from 'react'

import { setCartLocaleAction } from '@/app/actions/cart-locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { locales, type Locale } from '@/i18n/config'
import { usePathname, useRouter } from '@/i18n/routing'

const LABELS: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' }
const SHORT: Record<Locale, string> = { es: 'ES', en: 'EN', fr: 'FR' }

interface LocaleSwitcherProps {
  currentLocale: string
}

/**
 * Selector de idioma compacto. En el header oscuro se ve como un chip
 * "ES / EN / FR" con el icono globe. Cambia el cookie del cart al
 * cambiar de locale.
 */
export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function onChange(next: Locale) {
    if (next === currentLocale) return
    startTransition(async () => {
      await setCartLocaleAction(next)
      router.replace(pathname, { locale: next })
    })
  }

  const short = SHORT[currentLocale as Locale] ?? currentLocale.toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Idioma"
          disabled={isPending}
          className="inline-flex h-10 items-center gap-1.5 rounded-[12px] px-3 text-[12px] font-bold uppercase tracking-[0.18em] text-rt-white transition-colors hover:bg-rt-black-2 font-[family-name:var(--font-heading)]"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => onChange(l)}
            className={l === currentLocale ? 'font-semibold text-primary' : ''}
          >
            {LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
