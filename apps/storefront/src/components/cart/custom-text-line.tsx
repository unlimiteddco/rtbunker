import { cn } from '@/lib/cn'
import { readLineItemCustomText } from '@/lib/custom-text'

interface CustomTextLineProps {
  metadata: unknown
  className?: string
}

/**
 * Línea "Texto: «…»" bajo el título de un line item cuando el comprador ha
 * escrito un texto personalizado (line_item.metadata.custom_text).
 */
export function CustomTextLine({ metadata, className }: CustomTextLineProps) {
  const text = readLineItemCustomText(metadata)
  if (!text) return null
  return (
    <p className={cn('text-xs text-rt-ink-500', className)}>
      Texto: <span className="break-all font-semibold text-rt-black">«{text}»</span>
    </p>
  )
}
