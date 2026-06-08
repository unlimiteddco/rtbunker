'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field, authInputClass } from '@/components/account/login-form'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/routing'
import { sdk } from '@/lib/medusa'
import { isValidSpanishId, normalizeSpanishId } from '@/lib/spanish-id'

const schema = z
  .object({
    first_name: z.string().min(1, 'Tu nombre, porfa'),
    last_name: z.string().min(1, 'Y tu apellido'),
    email: z.string().email('Email inválido'),
    dni: z
      .string()
      .min(1, 'Necesitamos tu DNI para la factura')
      .refine((v) => isValidSpanishId(v), 'DNI, NIE o CIF no válido'),
    phone: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (v) => !v || /^[+\d\s-]{6,20}$/.test(v),
        'Teléfono no parece válido',
      ),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    accept_rgpd: z
      .boolean()
      .refine((v) => v === true, 'Necesitamos tu consentimiento RGPD'),
  })
  .transform((data) => ({
    ...data,
    dni: normalizeSpanishId(data.dni),
    phone: data.phone?.trim() || undefined,
  }))

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showPwd, setShowPwd] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      dni: '',
      phone: '',
      password: '',
      accept_rgpd: false,
    },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const token = await sdk.auth.register('customer', 'emailpass', {
          email: values.email,
          password: values.password,
        })

        await sdk.store.customer.create(
          {
            email: values.email,
            first_name: values.first_name,
            last_name: values.last_name,
            phone: values.phone,
            metadata: { dni: values.dni },
          },
          {},
          { Authorization: `Bearer ${token}` },
        )

        // Inicia sesión por cookie para que el navegador la conserve.
        await sdk.auth.login('customer', 'emailpass', {
          email: values.email,
          password: values.password,
        })

        toast.success('¡Cuenta creada!')
        router.push('/cuenta')
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear la cuenta'
        toast.error(message)
      }
    })
  }

  const pwd = form.watch('password') ?? ''

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="first_name" error={form.formState.errors.first_name?.message}>
          <input
            id="first_name"
            autoComplete="given-name"
            placeholder="Nikita"
            {...form.register('first_name')}
            className={authInputClass}
          />
        </Field>
        <Field label="Apellido" htmlFor="last_name" error={form.formState.errors.last_name?.message}>
          <input
            id="last_name"
            autoComplete="family-name"
            placeholder="Bellostas"
            {...form.register('last_name')}
            className={authInputClass}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          {...form.register('email')}
          className={authInputClass}
        />
      </Field>

      <Field
        label="DNI / NIE / CIF"
        htmlFor="dni"
        error={form.formState.errors.dni?.message}
        hint="Imprescindible para emitir factura."
      >
        <input
          id="dni"
          autoComplete="off"
          placeholder="12345678A"
          {...form.register('dni')}
          className={`${authInputClass} uppercase`}
        />
      </Field>

      <Field
        label="Teléfono (opcional)"
        htmlFor="phone"
        error={form.formState.errors.phone?.message}
        hint="Solo lo usamos para avisarte de envíos."
      >
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+34 600 000 000"
          {...form.register('phone')}
          className={authInputClass}
        />
      </Field>

      <Field
        label="Contraseña"
        htmlFor="password"
        error={form.formState.errors.password?.message}
        hint="Mínimo 8 caracteres."
      >
        <div className="relative">
          <input
            id="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register('password')}
            className={`${authInputClass} pr-12`}
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
        {pwd.length > 0 ? <PasswordStrength value={pwd} /> : null}
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-rt-ink-100 bg-rt-white p-3 transition-colors hover:border-rt-ink-300">
        <input
          type="checkbox"
          {...form.register('accept_rgpd')}
          className="peer mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border-2 border-rt-ink-300 transition-colors checked:border-rt-yellow checked:bg-rt-yellow"
        />
        <span className="text-[13px] leading-[1.5] text-rt-ink-700">
          He leído y acepto la{' '}
          <Link
            href="/pagina/privacidad"
            className="font-bold text-rt-black underline-offset-4 hover:underline"
          >
            política de privacidad
          </Link>{' '}
          y los{' '}
          <Link
            href="/pagina/condiciones"
            className="font-bold text-rt-black underline-offset-4 hover:underline"
          >
            términos
          </Link>
          .
        </span>
      </label>
      {form.formState.errors.accept_rgpd?.message ? (
        <p className="-mt-3 text-[12px] font-medium text-rt-danger">
          {form.formState.errors.accept_rgpd.message}
        </p>
      ) : null}

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
            Creando cuenta…
          </>
        ) : (
          <>
            Crear cuenta <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
    </form>
  )
}

// ─── Indicador visual de fuerza de password ──────────────────────────

function passwordScore(value: string): number {
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  return Math.min(score, 4)
}

function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value)
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'] as const
  const tones = [
    'bg-rt-danger',
    'bg-rt-danger',
    'bg-rt-yellow',
    'bg-rt-yellow-deep',
    'bg-rt-success',
  ] as const
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="grid h-1.5 flex-1 grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`rounded-full ${i < score ? tones[score]! : 'bg-rt-ink-100'}`}
          />
        ))}
      </div>
      <span
        className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] font-[family-name:var(--font-heading)] ${
          score >= 3 ? 'text-rt-success' : 'text-rt-ink-500'
        }`}
      >
        {score >= 3 ? <CheckCircle2 className="h-3 w-3" /> : null}
        {labels[score]}
      </span>
    </div>
  )
}
