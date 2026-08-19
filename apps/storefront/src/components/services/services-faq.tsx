import { Reveal } from '@/components/services/reveal'
import { FaqChat, type FaqChatItem } from '@/components/ui/faq-chat'

const FAQS: FaqChatItem[] = [
  {
    q: '¿Cuánto cuesta un Full Wrap?',
    a: 'Depende del coche y del material elegido. Un Full Wrap empieza alrededor de 1.800 €; un SUV o coupé deportivo puede irse a 2.800-3.500 €. Te damos un presupuesto exacto en menos de 24 h.',
  },
  {
    q: '¿Cuánto dura el vinilo aplicado?',
    a: 'Los materiales que usamos son los mejores del mercado (3M, Hexis, KPMF) y tienen una vida útil de 5-7 años en exterior. Te damos 2 años de garantía oficial sobre el trabajo y el material.',
  },
  {
    q: '¿Es necesario que la pieza esté bien pintada para vinilarla?',
    a: 'Es esencial para su instalación que la pieza esté en buen estado o repintada con calidad, ya que se notarán los desperfectos y, a la hora de quitar el material o reposicionarlo, hay riesgo de levantar pintura.',
  },
  {
    q: '¿El vinilo daña la pintura original?',
    a: 'No. Al contrario: la protege de arañazos leves, UV y excrementos de pájaro. Al retirar el vinilo, la pintura queda intacta — incluso suele estar mejor conservada que la del resto del coche.',
  },
  {
    q: '¿Hay que comunicar el cambio de color al seguro o a tráfico?',
    a: 'Si el cambio es total (Full Wrap a otro color) sí — hay que notificarlo a la DGT. Los cambios parciales no requieren trámite.',
  },
  {
    q: '¿Cuánto tiempo se queda el coche en taller?',
    a: 'Un wrap parcial (capó, techo) suele ser 1 día (una mañana o una tarde). Un Chrome Delete completo, 1-2 días. Un Full Wrap con desmontaje, 1-2 semanas. Te damos fecha fija al cerrar el presupuesto.',
  },
  {
    q: '¿Trabajáis con flotas y empresas?',
    a: 'Sí. Hacemos rotulación y wrapping para furgonetas comerciales, flotas de empresa, vehículos de evento o branding temporal. Facturamos con IVA y emitimos certificados de aplicación.',
  },
  {
    q: '¿Qué cubre exactamente la garantía de 2 años?',
    a: 'La garantía cubre la instalación del material aplicado: defectos de aplicación como despegues en bordes, burbujas, levantamientos o fallos de adhesión imputables al montaje. Durante 2 años desde la entrega lo reparamos sin coste. Va siempre acompañada de un certificado de aplicación firmado.',
  },
  {
    q: '¿Qué NO cubre la garantía?',
    a: 'Quedan excluidos los daños por mal uso, mal mantenimiento o lavados agresivos: rascadas, impactos, lavados a presión a corta distancia, ceras o productos abrasivos no recomendados, y el desgaste natural del material fuera de su vida útil. Te entregamos una guía de cuidados para que la garantía se mantenga válida.',
  },
]

/**
 * FAQ de servicios en formato chat (estilo Sticker Shuttle): cada pregunta es
 * una burbuja de conversación y la respuesta llega como mensaje del negocio.
 */
export function ServicesFaq() {
  return (
    <section className="bg-rt-white py-20 md:py-28">
      <div className="container-page">
        <Reveal as="up">
          <FaqChat eyebrow="Servicios" title="Preguntas frecuentes" items={FAQS} />
        </Reveal>

        <p className="mx-auto mt-10 max-w-[560px] text-center text-[15px] leading-[1.65] text-rt-ink-500">
          Si la tuya no está aquí, escríbenos por WhatsApp y te respondemos al momento.
        </p>
      </div>
    </section>
  )
}
