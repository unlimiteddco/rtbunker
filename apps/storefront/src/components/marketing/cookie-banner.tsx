'use client'

import { Cookie, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import {
  acceptAll,
  CONSENT_OPEN_EVENT,
  getConsent,
  rejectAll,
  setConsent,
} from '@/lib/consent'

type View = 'hidden' | 'banner' | 'preferences'

export function CookieBanner() {
  const [view, setView] = useState<View>('hidden')
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  // Decisión inicial: mostrar el banner solo si no hay consentimiento válido.
  useEffect(() => {
    const existing = getConsent()
    if (!existing) {
      setView('banner')
    } else {
      setAnalytics(existing.analytics)
      setMarketing(existing.marketing)
    }
  }, [])

  // Permite reabrir el panel desde el footer ("Configurar cookies").
  useEffect(() => {
    const open = () => {
      const existing = getConsent()
      setAnalytics(existing?.analytics ?? false)
      setMarketing(existing?.marketing ?? false)
      setView('preferences')
    }
    window.addEventListener(CONSENT_OPEN_EVENT, open)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open)
  }, [])

  if (view === 'hidden') return null

  function handleAcceptAll() {
    acceptAll()
    setView('hidden')
  }

  function handleRejectAll() {
    rejectAll()
    setView('hidden')
  }

  function handleSavePreferences() {
    setConsent({ analytics, marketing })
    setView('hidden')
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
    >
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-rt-black-3 bg-rt-black text-rt-white shadow-2xl">
        {view === 'banner' ? (
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-rt-yellow" />
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-heading)] text-[15px] font-bold">
                  Usamos cookies
                </p>
                <p className="mt-1 text-[13px] leading-[1.55] text-rt-ink-300">
                  Usamos cookies propias técnicas (imprescindibles) y, con tu permiso, de
                  analítica y marketing para mejorar la tienda. Puedes aceptarlas, rechazarlas
                  o configurarlas. Más info en nuestra{' '}
                  <Link href="/pagina/cookies" className="text-rt-yellow underline-offset-2 hover:underline">
                    política de cookies
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setView('preferences')}
                className="order-3 rounded-[10px] px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-rt-ink-300 transition-colors hover:text-rt-white sm:order-1"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="order-2 rounded-[10px] border border-rt-black-3 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-rt-white transition-colors hover:bg-rt-black-2"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="order-1 rounded-[10px] bg-rt-yellow px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-rt-black transition-colors hover:bg-rt-yellow-deep sm:order-3"
              >
                Aceptar todo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-[family-name:var(--font-heading)] text-[15px] font-bold">
                Preferencias de cookies
              </p>
              <button
                type="button"
                onClick={() => setView(getConsent() ? 'hidden' : 'banner')}
                aria-label="Cerrar"
                className="text-rt-ink-300 transition-colors hover:text-rt-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col divide-y divide-rt-black-3 rounded-xl border border-rt-black-3">
              <CategoryRow
                title="Técnicas (necesarias)"
                description="Imprescindibles para que funcione la tienda: carrito, sesión, idioma y tus preferencias de cookies. No se pueden desactivar."
                checked
                disabled
              />
              <CategoryRow
                title="Analítica"
                description="Nos ayudan a entender cómo se usa la tienda para mejorarla. Datos agregados y anónimos."
                checked={analytics}
                onChange={setAnalytics}
              />
              <CategoryRow
                title="Marketing"
                description="Permiten mostrarte contenido y ofertas más relevantes dentro y fuera de la tienda."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRejectAll}
                className="rounded-[10px] border border-rt-black-3 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-rt-white transition-colors hover:bg-rt-black-2"
              >
                Rechazar todo
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="rounded-[10px] bg-rt-yellow px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-rt-black transition-colors hover:bg-rt-yellow-deep"
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-rt-white">{title}</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-rt-ink-300">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-rt-yellow' : 'bg-rt-black-3',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-rt-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
