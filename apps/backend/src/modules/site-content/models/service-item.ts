import { model } from '@medusajs/framework/utils'

/**
 * ServiceItem — tarjeta de la página de Servicios, editable desde el admin.
 *
 * Espejo de las cards hardcodeadas en
 * apps/storefront/src/components/services/services-grid.tsx
 * ("Car Wrapping", "Car Design", "Chrome Delete", "Ahumado de faros",
 * "Rotulación de vehículos"…).
 *
 * eyebrow:   línea superior en mayúsculas (`tagline` en el storefront),
 *            p.ej. "Superficial · Full Wrap".
 * bullets:   array de strings (JSON) con los puntos de la tarjeta.
 * icon:      nombre del icono de lucide-react (p.ej. "Layers"). El storefront
 *            mapea el string al componente.
 * featured:  tarjeta destacada → fondo carbón en vez de blanco.
 * rank:      orden de aparición (asc). Menor = primero. También alimenta el
 *            número "01", "02"… que pinta el storefront.
 * published: solo los `true` salen en la web.
 */
const ServiceItem = model.define('service_item', {
  id: model.id().primaryKey(),
  eyebrow: model.text().nullable(),
  title: model.text(),
  description: model.text().nullable(),
  bullets: model.json().nullable(),
  cta_label: model.text().nullable(),
  cta_href: model.text().nullable(),
  icon: model.text().nullable(),
  image: model.text().nullable(),
  featured: model.boolean().default(false),
  rank: model.number().default(0),
  published: model.boolean().default(true),
})

export default ServiceItem
