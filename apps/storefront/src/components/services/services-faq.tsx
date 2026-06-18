'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState } from 'react'

import { Reveal } from '@/components/services/reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: '¿Cuánto cuesta un Full Wrap?',
    a: 'Depende del coche y del material elegido. Un Full Wrap en utilitario empieza alrededor de 1.800 €, un SUV o coupé deportivo puede irse a 2.800-3.500 €. Te damos un presupuesto exacto en menos de 24 h.',
  },
  {
    q: '¿Cuánto dura el vinilo aplicado?',
    a: 'Los materiales que usamos (3M, Hexis, KPMF) tienen una vida útil de 5-7 años en exterior. Te damos 2 años de garantía oficial sobre el trabajo y el material.',
  },
  {
    q: '¿El vinilo daña la pintura original?',
    a: 'No. Al contrario: la protege de arañazos leves, UV y excrementos de pájaro. Al retirar el vinilo, la pintura queda intacta — incluso suele estar mejor conservada que la del resto del coche.',
  },
  {
    q: '¿Hay que comunicar el cambio de color al seguro o tráfico?',
    a: 'Si el cambio es total (Full Wrap a otro color) sí — hay que notificarlo a la DGT. Te ayudamos con el papeleo: rellenamos el formulario y te indicamos paso a paso. Cambios parciales no requieren trámite.',
  },
  {
    q: '¿Cuánto tiempo se queda el coche en taller?',
    a: 'Un wrap parcial (capó, techo) suele ser 1 día. Un Chrome Delete completo, 1-2 días. Un Full Wrap con desmontaje, 4-5 días laborables. Te damos fecha fija al cerrar el presupuesto.',
  },
  {
    q: '¿Trabajáis con flotas y empresas?',
    a: 'Sí. Hacemos rotulación y wrapping para furgonetas comerciales, flotas de empresa, vehículos de evento o branding temporal. Facturamos con IVA y emitimos certificados de aplicación.',
  },
  {
    // TODO Nikita: confirmar alcance exacto y duración de la garantía oficial.
    q: '¿Qué cubre exactamente la garantía de 2 años?',
    a: 'La garantía cubre la instalación del material aplicado: defectos de aplicación como despegues en bordes, burbujas, levantamientos o fallos de adhesión imputables al montaje. Durante 2 años desde la entrega lo reparamos sin coste. Va siempre acompañada de un certificado de aplicación firmado.',
  },
  {
    // TODO Nikita: confirmar lista de exclusiones (lavados a presión, productos, etc.).
    q: '¿Qué NO cubre la garantía?',
    a: 'Quedan excluidos los daños por mal uso, mal mantenimiento o lavados agresivos: rascadas, impactos, lavados a presión a corta distancia, ceras o productos abrasivos no recomendados, y el desgaste natural del material fuera de su vida útil. Te entregamos una guía de cuidados para que la garantía se mantenga válida.',
  },
]

/** Acordeón reutilizable: se usa inline y dentro del popup. */
function FaqAccordion({ idPrefix }: { idPrefix: string }) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {FAQS.map((f, i) => (
        <AccordionItem
          key={f.q}
          value={`${idPrefix}-${i}`}
          className="rounded-[16px] border border-rt-ink-100 bg-rt-white-2 px-5 transition-colors data-[state=open]:border-rt-yellow data-[state=open]:bg-rt-white"
        >
          <AccordionTrigger className="py-4 text-left font-[family-name:var(--font-heading)] text-[16px] font-bold leading-[1.3] text-rt-black hover:no-underline">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-[14px] leading-[1.65] text-rt-ink-500">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function ServicesFaq() {
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-rt-white py-20 md:py-28">
      <div className="container-page grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <Reveal as="left">
          <p className="rt-eyebrow text-rt-yellow-deep">Preguntas frecuentes</p>
          <h2 className="mt-3 rt-h2 text-balance">Las dudas que todo el mundo nos hace.</h2>
          <p className="mt-5 text-[15px] leading-[1.65] text-rt-ink-500">
            Si la tuya no está aquí, escríbenos por WhatsApp y te respondemos al momento.
          </p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-7 inline-flex items-center gap-2 rounded-[14px] bg-rt-black px-5 py-3 text-[13px] font-bold uppercase tracking-[0.1em] text-rt-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rt-black-2 font-[family-name:var(--font-heading)]"
          >
            Ver todas las preguntas
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </button>
        </Reveal>

        {/* Acordeón inline (no se toca el comportamiento original). */}
        <Reveal as="up">
          <FaqAccordion idPrefix="faq" />
        </Reveal>
      </div>

      {/* Popup con el acordeón completo (más visible). */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-rt-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-[100] flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-[24px] border border-rt-ink-100 bg-rt-white text-rt-black shadow-[var(--shadow-xl)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            aria-describedby={undefined}
          >
            <div className="flex items-start justify-between gap-4 border-b border-rt-ink-100 px-6 py-5">
              <div>
                <p className="rt-eyebrow text-rt-yellow-deep">Preguntas frecuentes</p>
                <DialogPrimitive.Title className="mt-1.5 font-[family-name:var(--font-heading)] text-[22px] font-bold leading-[1.1] text-rt-black">
                  Todas las dudas, en un sitio
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close
                aria-label="Cerrar"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rt-white-2 text-rt-ink-500 transition-colors hover:bg-rt-ink-100 hover:text-rt-black"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              <FaqAccordion idPrefix="faq-modal" />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  )
}
