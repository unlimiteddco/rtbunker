import { Reveal } from '@/components/services/reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FaqEntry {
  q: string
  a: string
}

const FAQS: FaqEntry[] = [
  {
    q: '¿Cuánto tardan en llegar las pegatinas?',
    a: 'Preparamos tu pedido en 24-48 h laborables y lo enviamos a toda España con entrega en 24-72 h. En el checkout verás el plazo estimado según tu dirección.',
  },
  {
    q: '¿Las pegatinas aguantan el exterior y los lavados?',
    a: 'Sí. Usamos vinilo premium con laminado protector resistente a los rayos UV, la lluvia y el lavado a presión. Pensadas para coche, moto, casco o cualquier superficie expuesta.',
  },
  {
    q: '¿Puedo pedir una pegatina con mi propio diseño?',
    a: 'Claro. En la sección de personalizadas subes tu diseño, eliges tamaño y acabado, y te lo fabricamos a medida. Si necesitas ayuda con el arte, escríbenos y lo vemos.',
  },
  {
    q: '¿Qué materiales y acabados ofrecéis?',
    a: 'Trabajamos vinilo blanco, transparente, holográfico y de corte, con acabado mate o brillo. Cada producto indica los acabados disponibles en su ficha.',
  },
  {
    q: '¿Cuál es el pedido mínimo?',
    a: 'No hay pedido mínimo: puedes comprar una sola pegatina. Para tiradas grandes o reventa, contáctanos y te pasamos precios por volumen.',
  },
  {
    q: '¿Cómo aplico correctamente la pegatina?',
    a: 'Limpia y seca bien la superficie, despega el dorso, coloca la pegatina y presiona desde el centro hacia los bordes para evitar burbujas. Para piezas grandes recomendamos aplicación en húmedo.',
  },
  {
    q: '¿Puedo devolver mi pedido?',
    a: 'Los productos de catálogo admiten devolución según nuestra política. Las pegatinas personalizadas, al fabricarse bajo pedido, solo se reemplazan si llegan defectuosas.',
  },
  {
    q: '¿Qué métodos de pago aceptáis?',
    a: 'Tarjeta de crédito y débito con pago cifrado, además de recogida en tienda. Todas las transacciones se procesan de forma segura.',
  },
]

/**
 * Preguntas frecuentes de la home · acordeón Radix (un solo panel abierto a
 * la vez). Respuestas generales sobre envíos, materiales, personalización y
 * devoluciones para resolver dudas antes de comprar.
 */
export function HomeFaq() {
  return (
    <section className="bg-rt-white-2 py-20 md:py-24">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <Reveal as="up">
            <header className="md:sticky md:top-28">
              <p className="rt-eyebrow text-rt-yellow-deep">Dudas frecuentes</p>
              <h2 className="mt-3 rt-h2 text-balance">Todo lo que necesitas saber</h2>
              <p className="mt-4 text-[16px] leading-[1.65] text-rt-ink-500">
                ¿No encuentras tu respuesta? Escríbenos y te ayudamos antes de
                tu compra.
              </p>
            </header>
          </Reveal>

          <Reveal as="up" delay={120}>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${i}`}
                  className="border-b border-rt-black/10"
                >
                  <AccordionTrigger className="py-5 text-left text-[16px] font-bold text-rt-black hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pt-0 text-[15px] leading-[1.65] text-rt-ink-500">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
