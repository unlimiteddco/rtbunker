import { model } from '@medusajs/framework/utils'

/**
 * ProcessStep — paso de la "línea del tiempo" de la página de Servicios.
 *
 * Espejo de los STEPS hardcodeados en
 * apps/storefront/src/components/services/services-process.tsx
 * (01 Briefing / 02 Presupuesto + cita / 03 Aplicación en taller /
 *  04 Entrega + garantía).
 *
 * badge:     píldora de la tarjeta (`meta` en el storefront), p.ej. "< 24 h",
 *            "Sin compromiso", "1 a 5 días", "Garantía 2 años".
 * icon:      nombre del icono de lucide-react (p.ej. "MessageSquare").
 * rank:      orden (asc). Alimenta el número "01", "02"… del storefront.
 * published: solo los `true` salen en la web.
 */
const ProcessStep = model.define('process_step', {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  badge: model.text().nullable(),
  icon: model.text().nullable(),
  rank: model.number().default(0),
  published: model.boolean().default(true),
})

export default ProcessStep
