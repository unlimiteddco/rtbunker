/**
 * Gestión de consentimiento de cookies (RGPD / LSSI-CE).
 *
 * El estado se guarda en una cookie de primera parte `_rtb_consent` (180 días)
 * con las categorías aceptadas. `necessary` siempre es true (cookies técnicas
 * imprescindibles: carrito, sesión, idioma y el propio consentimiento).
 *
 * Para activar scripts de terceros en el futuro (analítica, píxeles…),
 * consulta `getConsent()?.analytics` / `.marketing` antes de cargarlos y
 * escucha el evento `rtb:consent-change` para reaccionar a cambios.
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'

export interface ConsentState {
  necessary: true
  analytics: boolean
  marketing: boolean
  /** timestamp (ms) en que se registró la decisión */
  ts: number
  /** versión de la política — si sube, se vuelve a pedir consentimiento */
  v: number
}

const COOKIE = '_rtb_consent'
const MAX_AGE_DAYS = 180

/** Súbela cuando cambie la política de cookies para re-solicitar consentimiento. */
export const CONSENT_VERSION = 1

/** Evento para abrir el panel de preferencias (lo dispara el footer). */
export const CONSENT_OPEN_EVENT = 'rtb:consent-open'
/** Evento emitido cuando el usuario guarda una decisión. */
export const CONSENT_CHANGE_EVENT = 'rtb:consent-change'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]!) : null
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const d = new Date()
  d.setTime(d.getTime() + days * 86400000)
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`
}

/** Devuelve el consentimiento guardado, o null si no hay (o si caducó la versión). */
export function getConsent(): ConsentState | null {
  const raw = readCookie(COOKIE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ConsentState
    if (parsed.v !== CONSENT_VERSION) return null
    return { ...parsed, necessary: true }
  } catch {
    return null
  }
}

/** true si el usuario ya tomó una decisión válida (no hay que mostrar el banner). */
export function hasConsent(): boolean {
  return getConsent() !== null
}

/** Guarda una decisión y notifica a la app vía `rtb:consent-change`. */
export function setConsent(input: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
    ts: Date.now(),
    v: CONSENT_VERSION,
  }
  writeCookie(COOKIE, JSON.stringify(state), MAX_AGE_DAYS)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state }))
  }
  return state
}

export const acceptAll = () => setConsent({ analytics: true, marketing: true })
export const rejectAll = () => setConsent({ analytics: false, marketing: false })

/** Abre el panel de preferencias desde cualquier parte (p. ej. el footer). */
export function openConsentPreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
  }
}
