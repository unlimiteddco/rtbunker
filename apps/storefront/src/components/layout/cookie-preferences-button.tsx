'use client'

import { openConsentPreferences } from '@/lib/consent'

/** Botón que reabre el panel de preferencias de cookies desde el footer. */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentPreferences} className={className}>
      Cookies
    </button>
  )
}
