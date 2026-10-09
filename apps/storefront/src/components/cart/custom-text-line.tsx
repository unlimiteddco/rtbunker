import { cn } from '@/lib/cn'
import { readLineItemChoices, readLineItemCustomText } from '@/lib/custom-text'

interface CustomTextLineProps {
  metadata: unknown
  className?: string
}

/**
 * Personalización de un line item, bajo su título: "Texto: «…»" si el
 * comprador escribió un texto (`metadata.custom_text`) y una línea por cada
 * opción elegida (`metadata.custom_choices`, p. ej. "Fuente: Redonda").
 */
export function CustomTextLine({ metadata, className }: CustomTextLineProps) {
  const text = readLineItemCustomText(metadata)
  const choices = readLineItemChoices(metadata)
  if (!text && choices.length === 0) return null
  return (
    <div className={cn('space-y-0.5 text-xs text-rt-ink-500', className)}>
      {text ? (
        <p>
          Texto: <span className="break-all font-semibold text-rt-black">«{text}»</span>
        </p>
      ) : null}
      {choices.map((c) => (
        <p key={c.label}>
          {c.label}: <span className="font-semibold text-rt-black">{c.value}</span>
        </p>
      ))}
    </div>
  )
}
