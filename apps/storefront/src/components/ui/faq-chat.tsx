import { MessageCircleQuestion } from 'lucide-react'

import { cn } from '@/lib/cn'

export interface FaqChatItem {
  q: string
  a: string
}

interface FaqChatProps {
  items: FaqChatItem[]
  /** Titular del bloque. Si no se pasa, no se pinta cabecera. */
  title?: string | undefined
  /** Antetítulo sobre el titular. */
  eyebrow?: string | undefined
  className?: string | undefined
}

/**
 * FAQ en formato conversación (estilo chat): cada pregunta es una burbuja con
 * avatar a la izquierda y, debajo, la respuesta como una segunda burbuja del
 * negocio, indentada y con fondo de marca.
 *
 * Petición del cliente: las preguntas NO se pliegan. Todo queda SIEMPRE
 * visible, se lee como una conversación completa. Sin acordeón, sin estado y
 * sin JS: es un componente de servidor puro.
 *
 * Accesibilidad: lista de definiciones (`dl` → `dt` pregunta / `dd`
 * respuesta), legible por lectores de pantalla sin interacción.
 */
export function FaqChat({ items, title, eyebrow, className }: FaqChatProps) {
  if (items.length === 0) return null

  return (
    <div className={cn('mx-auto w-full max-w-3xl', className)}>
      {eyebrow || title ? (
        <header className="mb-8 text-center">
          {eyebrow ? <p className="rt-eyebrow text-rt-yellow-deep">{eyebrow}</p> : null}
          {title ? <h2 className="mt-3 rt-h2 text-balance text-rt-black">{title}</h2> : null}
        </header>
      ) : null}

      <dl className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.q}>
            {/* Pregunta: avatar + burbuja clara */}
            <dt className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rt-yellow bg-rt-yellow text-rt-black"
              >
                <MessageCircleQuestion className="h-[18px] w-[18px]" />
              </span>

              <span className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-rt-yellow bg-rt-white px-5 py-4 font-[family-name:var(--font-heading)] text-[15px] font-bold leading-[1.4] text-rt-black shadow-[var(--shadow-md)] md:text-[16px]">
                {item.q}
              </span>
            </dt>

            {/* Respuesta: el negocio contesta, indentada bajo la pregunta */}
            <dd className="ml-0 mt-3 flex items-start gap-3 pl-16 text-rt-ink-700 sm:pl-20">
              <span
                aria-hidden
                className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rt-black font-[family-name:var(--font-display)] text-[12px] leading-none tracking-[0.02em] text-rt-yellow"
              >
                RT
              </span>
              <span className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-rt-yellow/30 bg-rt-yellow/10 px-5 py-4 text-[14px] leading-[1.65] text-rt-ink-700 md:text-[15px]">
                {item.a}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
