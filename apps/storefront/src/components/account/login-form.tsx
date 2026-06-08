'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/routing'
import { sdk } from '@/lib/medusa'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showPwd, setShowPwd] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await sdk.auth.login('customer', 'emailpass', values)
        toast.success('¡Hola de nuevo!')
        router.push('/cuenta')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión')
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Field
        label="Email"
        htmlFor="email"
        error={form.formState.errors.email?.message}
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register('email')}
          className={inputClass}
          placeholder="tu@correo.com"
        />
      </Field>

      <Field
        label="Contraseña"
        htmlFor="password"
        error={form.formState.errors.password?.message}
        action={
          <Link
            href="/login/recuperar"
            className="text-[12px] font-bold uppercase tracking-[0.14em] text-rt-ink-500 font-[family-name:var(--font-heading)] hover:text-rt-black"
          >
            ¿Olvidada?
          </Link>
        }
      >
        <div className="relative">
          <input
            id="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            {...form.register('password')}
            className={`${inputClass} pr-12`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-rt-ink-500 transition-colors hover:text-rt-black"
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full justify-center"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando…
          </>
        ) : (
          <>
            Iniciar sesión <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </Button>

      <p className="pt-2 text-center text-[12px] text-rt-ink-500">
        Al continuar aceptas nuestras{' '}
        <Link href="/pagina/condiciones" className="underline-offset-4 hover:underline">
          condiciones
        </Link>{' '}
        y{' '}
        <Link href="/pagina/privacidad" className="underline-offset-4 hover:underline">
          política de privacidad
        </Link>
        .
      </p>
    </form>
  )
}

// ─── Atomic Field + input class ────────────────────────────────────

const inputClass =
  'block w-full rounded-[14px] border border-rt-ink-100 bg-rt-white px-4 py-3 text-[15px] text-rt-black placeholder:text-rt-ink-300 transition-colors focus:border-rt-yellow focus:outline-none focus:ring-2 focus:ring-rt-yellow/30 aria-[invalid=true]:border-rt-danger aria-[invalid=true]:focus:ring-rt-danger/30'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  action?: React.ReactNode
  hint?: string
  children: React.ReactNode
}

export function Field({ label, htmlFor, error, action, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-[12px] font-bold uppercase tracking-[0.16em] text-rt-black font-[family-name:var(--font-heading)]"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-rt-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-rt-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

export { inputClass as authInputClass }
