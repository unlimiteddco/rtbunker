'use client'

import { CheckCircle2, Loader2, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { sdk } from '@/lib/medusa'

const COOKIE_NAME = '_rtb_popup'
const COOKIE_DAYS = 30
const TRIGGER_DELAY_MS = 25_000 // 25 segundos
const TRIGGER_SCROLL_PCT = 0.5 // o 50% de scroll, lo que pase primero

/**
 * Popup de captura de email con descuento (cupón RTBUNKER10).
 * Triggers (lo que llegue primero):
 *   1. 25 s en la página.
 *   2. Scroll 50% del documento.
 *   3. Exit-intent (cursor sale por arriba del viewport en desktop).
 *
 * Dismissal: cookie `_rtb_popup` (30 días). Valores:
 *   · 'dismissed' — el usuario cerró el popup
 *   · 'subscribed' — se suscribió correctamente
 *
 * Se monta perezosamente desde el layout root y solo aparece tras
 * cumplir el trigger (no renderiza nada hasta entonces).
 */
export function EmailCapturePopup() {
  const [phase, setPhase] = useState<'hidden' | 'open' | 'submitting' | 'success'>('hidden')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)

  const open = useCallback(() => {
    setPhase((p) => (p === 'hidden' ? 'open' : p))
  }, [])

  const close = useCallback((reason: 'dismissed' | 'subscribed') => {
    setPhase('hidden')
    setCookie(COOKIE_NAME, reason, COOKIE_DAYS)
  }, [])

  // ─── Triggers ────────────────────────────────────────────────────
  useEffect(() => {
    if (getCookie(COOKIE_NAME)) return // ya dismissed o subscribed

    let opened = false
    const fire = () => {
      if (opened) return
      opened = true
      open()
    }

    // 1) Tiempo
    const t = window.setTimeout(fire, TRIGGER_DELAY_MS)

    // 2) Scroll
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      if (window.scrollY / max >= TRIGGER_SCROLL_PCT) fire()
    }

    // 3) Exit-intent (solo desktop con puntero fino)
    const isDesktop = window.matchMedia('(pointer: fine) and (min-width: 768px)').matches
    const onMouseLeave = (e: MouseEvent) => {
      if (!isDesktop) return
      if (e.clientY <= 0) fire()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [open])

  // Tecla escape cierra
  useEffect(() => {
    if (phase === 'hidden') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close('dismissed')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, close])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !consent) {
      setError('Completa email y acepta la política de privacidad.')
      return
    }
    setPhase('submitting')
    try {
      const res = await sdk.client.fetch<{ coupon_code: string }>(
        '/store/newsletter/subscribe',
        {
          method: 'POST',
          body: { email, consent_given: consent, source: 'popup_home' },
        },
      )
      setCouponCode(res.coupon_code)
      setPhase('success')
      setCookie(COOKIE_NAME, 'subscribed', COOKIE_DAYS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Algo ha fallado'
      setError(message)
      setPhase('open')
    }
  }

  function copyCoupon() {
    if (!couponCode) return
    void navigator.clipboard.writeText(couponCode)
    toast.success(`Código ${couponCode} copiado`)
  }

  if (phase === 'hidden') return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rt-popup-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-rt-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) close('dismissed')
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-rt-black-3 bg-rt-black text-rt-white shadow-[var(--shadow-xl)] animate-in fade-in zoom-in-95 duration-300">
        {/* Glow + grid */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rt-yellow/30 blur-3xl animate-float-slow"
        />

        {/* Close */}
        <button
          type="button"
          onClick={() => close('dismissed')}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rt-black/50 text-rt-white/80 backdrop-blur transition-colors hover:bg-rt-black/80 hover:text-rt-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-7 md:p-8">
          {phase === 'success' ? (
            <SuccessView couponCode={couponCode} onCopy={copyCoupon} onClose={() => close('subscribed')} />
          ) : (
            <FormView
              email={email}
              setEmail={setEmail}
              consent={consent}
              setConsent={setConsent}
              error={error}
              submitting={phase === 'submitting'}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-vistas ──────────────────────────────────────────────────────

function FormView({
  email,
  setEmail,
  consent,
  setConsent,
  error,
  submitting,
  onSubmit,
}: {
  email: string
  setEmail: (v: string) => void
  consent: boolean
  setConsent: (v: boolean) => void
  error: string | null
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <>
      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
        <Sparkles className="h-3 w-3" />
        Oferta de bienvenida
      </p>
      <h2
        id="rt-popup-title"
        className="mt-3 font-[family-name:var(--font-display)] text-[clamp(38px,7vw,52px)] uppercase leading-[0.94] tracking-[-0.02em]"
      >
        −10% en tu
        <br />
        <span className="text-rt-yellow">primer pedido</span>
      </h2>
      <p className="mt-3 text-[14px] leading-[1.55] text-rt-ink-300">
        Suscríbete a la lista y te mandamos un cupón único para usar en cualquier producto o
        diseño personalizado. Sin spam, sin cláusulas raras.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          className="block w-full rounded-[14px] border border-rt-black-3 bg-rt-black-2 px-4 py-3 text-[15px] text-rt-white placeholder:text-rt-ink-500 transition-colors focus:border-rt-yellow focus:outline-none focus:ring-2 focus:ring-rt-yellow/40"
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-rt-black-3 bg-rt-black-2/50 p-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="peer mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border-2 border-rt-ink-500 transition-colors checked:border-rt-yellow checked:bg-rt-yellow"
          />
          <span className="text-[12px] leading-[1.5] text-rt-ink-300">
            Acepto recibir comunicaciones comerciales de RT Bunker. Puedes darte de baja en
            cualquier email.
          </span>
        </label>

        {error ? <p className="text-[12px] font-medium text-rt-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-rt-yellow px-5 py-3 text-[14px] font-bold uppercase tracking-[0.1em] text-rt-black shadow-[var(--shadow-yellow)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-rt-yellow-deep disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 font-[family-name:var(--font-heading)]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            'Quiero mi −10%'
          )}
        </button>

        <p className="text-center text-[11px] text-rt-ink-500">
          Al enviar aceptas nuestra política de privacidad.
        </p>
      </form>
    </>
  )
}

function SuccessView({
  couponCode,
  onCopy,
  onClose,
}: {
  couponCode: string | null
  onCopy: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-4 text-center">
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-rt-yellow text-rt-black">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h2
        id="rt-popup-title"
        className="font-[family-name:var(--font-display)] text-[clamp(34px,6vw,46px)] uppercase leading-[0.94] tracking-[-0.02em]"
      >
        ¡Bienvenido!
      </h2>
      <p className="text-[14px] leading-[1.55] text-rt-ink-300">
        Te hemos enviado el cupón por email. También puedes copiarlo desde aquí y aplicarlo en
        checkout:
      </p>
      {couponCode ? (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex w-full items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-rt-yellow bg-rt-black-2 px-4 py-3 text-rt-yellow transition-colors hover:bg-rt-black-3"
        >
          <span className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.22em] text-rt-yellow/70">
            Tu código
          </span>
          <span className="font-mono text-[20px] font-bold tracking-[0.12em]">{couponCode}</span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="text-[12px] font-bold uppercase tracking-[0.18em] text-rt-ink-300 underline-offset-4 hover:text-rt-white hover:underline font-[family-name:var(--font-heading)]"
      >
        Seguir explorando
      </button>
    </div>
  )
}

// ─── Cookie helpers ──────────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]!) : null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const d = new Date()
  d.setTime(d.getTime() + days * 86400000)
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`
}
