'use client'

import { Loader2, Send } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { sendContactAction, type ContactResult } from '@/app/actions/contact'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

const fieldBase =
  'w-full rounded-[12px] border bg-rt-white px-3.5 py-2.5 text-[14px] text-rt-black outline-none transition-colors placeholder:text-rt-ink-500 focus:ring-2 focus:ring-rt-yellow/55'

export function ContactForm() {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<ContactResult['errors']>({})
  const [done, setDone] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    setErrors({})
    startTransition(async () => {
      const res = await sendContactAction(fd)
      if (res.ok) {
        toast.success(res.message ?? '¡Mensaje enviado!')
        form.reset()
        setDone(true)
      } else {
        setErrors(res.errors ?? {})
        toast.error(res.message ?? 'No se pudo enviar el mensaje')
      }
    })
  }

  if (done) {
    return (
      <div className="rounded-[16px] border border-rt-ink-100 bg-rt-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rt-yellow/20">
          <Send className="h-5 w-5 text-rt-yellow-deep" />
        </div>
        <p className="font-[family-name:var(--font-heading)] text-[18px] font-bold text-rt-black">
          ¡Mensaje enviado!
        </p>
        <p className="mt-1 text-[14px] text-rt-ink-500">
          Te responderemos lo antes posible, normalmente en menos de 24 h laborables.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-5 text-[13px] font-bold text-rt-black underline-offset-2 hover:underline"
        >
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-[16px] border border-rt-ink-100 bg-rt-white p-5 md:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" error={errors?.name}>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className={cn(fieldBase, errors?.name ? 'border-rt-danger' : 'border-rt-ink-100 focus:border-rt-yellow/60')}
          />
        </Field>
        <Field label="Email" error={errors?.email}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            className={cn(fieldBase, errors?.email ? 'border-rt-danger' : 'border-rt-ink-100 focus:border-rt-yellow/60')}
          />
        </Field>
      </div>

      <Field label="Asunto" optional error={errors?.subject}>
        <input
          name="subject"
          type="text"
          placeholder="¿Sobre qué nos escribes?"
          className={cn(fieldBase, errors?.subject ? 'border-rt-danger' : 'border-rt-ink-100 focus:border-rt-yellow/60')}
        />
      </Field>

      <Field label="Mensaje" error={errors?.message}>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Cuéntanos qué necesitas: producto, cantidad, plazos, dudas sobre personalizadas…"
          className={cn(
            fieldBase,
            'resize-y',
            errors?.message ? 'border-rt-danger' : 'border-rt-ink-100 focus:border-rt-yellow/60',
          )}
        />
      </Field>

      {/* Honeypot anti-spam, oculto a usuarios reales. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-rt-ink-500">
          Al enviar aceptas nuestra{' '}
          <a href="/es/pagina/privacidad" className="font-medium text-rt-black underline-offset-2 hover:underline">
            política de privacidad
          </a>
          .
        </p>
        <Button type="submit" variant="primary" size="default" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              Enviar mensaje
              <Send className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string
  optional?: boolean | undefined
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.1em] text-rt-ink-700">
        {label}
        {optional ? <span className="text-[10px] font-medium normal-case text-rt-ink-500">(opcional)</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[12px] text-rt-danger">{error}</span> : null}
    </label>
  )
}
