'use client'

import { MessageCircleQuestion } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
 * avatar a la izquierda y, al abrirla, la respuesta aparece como una segunda
 * burbuja del negocio, indentada y con fondo de marca.
 *
 * Todas las respuestas salen ABIERTAS de entrada (se lee como una conversación
 * completa); el usuario puede plegar las que no le interesen.
 *
 * Accesibilidad: acordeón Radix (múltiple), con navegación por teclado y aria
 * gestionados por la primitiva.
 */
export function FaqChat({ items, title, eyebrow, className }: FaqChatProps) {
  if (items.length === 0) return null

  // Todas abiertas por defecto.
  const allValues = items.map((_, i) => `faq-chat-${i}`)

  return (
    <div className={cn('mx-auto w-full max-w-3xl', className)}>
      {eyebrow || title ? (
        <header className="mb-8 text-center">
          {eyebrow ? <p className="rt-eyebrow text-rt-yellow-deep">{eyebrow}</p> : null}
          {title ? <h2 className="mt-3 rt-h2 text-balance text-rt-black">{title}</h2> : null}
        </header>
      ) : null}

      <Accordion type="multiple" defaultValue={allValues} className="flex flex-col gap-3">
        {items.map((item, i) => (
          <AccordionItem
            key={item.q}
            value={`faq-chat-${i}`}
            className="group border-b-0"
          >
            <div className="flex items-start gap-3">
              {/* Avatar de la pregunta */}
              <span
                aria-hidden
                className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rt-ink-100 bg-rt-white text-rt-ink-500 transition-colors duration-200 group-data-[state=open]:border-rt-yellow group-data-[state=open]:bg-rt-yellow group-data-[state=open]:text-rt-black"
              >
                <MessageCircleQuestion className="h-[18px] w-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                {/* Burbuja pregunta */}
                <AccordionTrigger className="w-full gap-4 rounded-2xl rounded-tl-md border border-rt-ink-100 bg-rt-white px-5 py-4 text-left font-[family-name:var(--font-heading)] text-[15px] font-bold leading-[1.4] text-rt-black transition-colors duration-200 hover:no-underline hover:border-rt-ink-300 data-[state=open]:border-rt-yellow data-[state=open]:shadow-[var(--shadow-md)] md:text-[16px] [&>svg]:text-rt-ink-500 [&[data-state=open]>svg]:text-rt-yellow-deep">
                  {item.q}
                </AccordionTrigger>

                {/* Burbuja respuesta (el negocio contesta) */}
                <AccordionContent className="pb-0 pt-3 text-rt-ink-700">
                  <div className="flex items-start gap-3 pl-4 sm:pl-8">
                    <span
                      aria-hidden
                      className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rt-black font-[family-name:var(--font-display)] text-[12px] leading-none tracking-[0.02em] text-rt-yellow"
                    >
                      RT
                    </span>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-rt-yellow/30 bg-rt-yellow/10 px-5 py-4 text-[14px] leading-[1.65] text-rt-ink-700 md:text-[15px]">
                      {item.a}
                    </div>
                  </div>
                </AccordionContent>
              </div>
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
