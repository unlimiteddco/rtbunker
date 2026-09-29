'use client'

import { PenLine } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@/lib/cn'
import { type CustomTextConfig, normalizeCustomText } from '@/lib/custom-text'

export interface CustomTextPreviewStyle {
  /** Valor CSS (color sólido o gradiente) con el que pintar el texto. */
  paint: string
  /** El color es muy claro → la vista previa usa fondo oscuro. */
  light: boolean
  /** Nombre del color elegido (p.ej. "Rojo"), para el pie de la vista previa. */
  name?: string
}

interface CustomTextFieldProps {
  config: CustomTextConfig
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  preview?: CustomTextPreviewStyle | undefined
  /** Mostrar el aviso de "obligatorio" (el comprador intentó añadir vacío). */
  showRequiredError?: boolean
}

function previewFontSize(length: number): string {
  if (length <= 10) return 'text-[34px] md:text-[40px]'
  if (length <= 18) return 'text-[26px] md:text-[30px]'
  if (length <= 28) return 'text-[20px] md:text-[23px]'
  return 'text-[16px] md:text-[18px]'
}

/**
 * Campo de "texto personalizado" de la ficha de producto (p.ej. el @usuario
 * de una Pegatina Instagram) con contador y vista previa en vivo.
 */
export function CustomTextField({
  config,
  value,
  onChange,
  onBlur,
  preview,
  showRequiredError = false,
}: CustomTextFieldProps) {
  const inputId = useId()
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  const normalized = normalizeCustomText(value, config.max)
  const count = value.length
  const nearLimit = count >= config.max * 0.85
  const missing = config.required && normalized.length === 0
  const paint = preview?.paint ?? 'var(--rt-black)'
  const isGradient = paint.includes('gradient')

  return (
    <section className="space-y-3 rounded-[16px] border border-rt-ink-100 bg-rt-white p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={inputId}
          className="text-uppercase-tight inline-flex items-center gap-1.5 text-[13px] tracking-[0.18em]"
        >
          <PenLine className="h-3.5 w-3.5" />
          {config.label}
          {config.required ? (
            <span className="text-destructive" aria-hidden>
              *
            </span>
          ) : (
            <span className="text-[11px] normal-case tracking-normal text-rt-ink-500">
              (opcional)
            </span>
          )}
        </label>
        <span
          className={cn(
            'text-[12px] tabular-nums',
            nearLimit ? 'font-semibold text-destructive' : 'text-rt-ink-500',
          )}
          aria-live="polite"
        >
          {count}/{config.max}
        </span>
      </div>

      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, config.max))}
        onBlur={onBlur}
        maxLength={config.max}
        placeholder={config.placeholder}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        required={config.required}
        aria-invalid={showRequiredError && missing ? true : undefined}
        aria-describedby={
          [config.help ? helpId : null, showRequiredError && missing ? errorId : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={cn(
          'h-12 w-full rounded-[12px] border bg-rt-white px-4 font-[family-name:var(--font-heading)] text-[16px] font-semibold text-rt-black transition-colors',
          'placeholder:font-normal placeholder:text-rt-ink-300',
          'focus-visible:border-rt-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rt-yellow/40',
          showRequiredError && missing
            ? 'border-destructive'
            : 'border-rt-ink-100 hover:border-rt-black/60',
        )}
      />

      {config.help ? (
        <p id={helpId} className="text-[12px] leading-snug text-rt-ink-500">
          {config.help}
        </p>
      ) : null}

      {showRequiredError && missing ? (
        <p id={errorId} role="alert" className="text-[12px] font-semibold text-destructive">
          Escribe tu texto para poder añadirlo al carrito.
        </p>
      ) : null}

      {/* Vista previa en vivo */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
          Así se verá
        </span>
        <div
          className={cn(
            'flex min-h-[88px] items-center justify-center overflow-hidden rounded-[12px] border px-4 py-5 text-center',
            preview?.light ? 'border-rt-black bg-rt-black' : 'border-rt-ink-100 bg-rt-white-2',
          )}
        >
          {normalized ? (
            <span
              className={cn(
                'max-w-full break-all font-[family-name:var(--font-heading)] font-extrabold leading-[1.05] tracking-[-0.01em]',
                previewFontSize(normalized.length),
              )}
              style={
                isGradient
                  ? {
                      backgroundImage: paint,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }
                  : { color: paint }
              }
            >
              {normalized}
            </span>
          ) : (
            <span
              className={cn('text-[14px]', preview?.light ? 'text-rt-white/60' : 'text-rt-ink-300')}
            >
              {config.placeholder || 'Escribe arriba tu texto'}
            </span>
          )}
        </div>
        {preview?.name ? (
          <p className="text-[11px] text-rt-ink-500">
            Color: <span className="text-rt-ink-700">{preview.name}</span> · vista orientativa
          </p>
        ) : null}
      </div>
    </section>
  )
}
