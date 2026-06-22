import { model } from '@medusajs/framework/utils'

/**
 * PortfolioWork — trabajo del portafolio de RT Bunker editable desde el admin.
 *
 * Nikita añade trabajos (servicio, título, descripción y fotos) y el storefront
 * los lee desde /store/portfolio. Contrato espejo de `src/lib/portfolio.ts` del
 * storefront (PortfolioWork): serviceType → service_type, date → date_label.
 *
 * service_type ∈ { wrapping, car-design, chrome-delete, ahumado, rotulacion }
 *
 * images:    array de URLs (JSON). Carrusel del modal en el storefront.
 * thumbnail: foto de la rejilla.
 * rank:      orden de aparición (asc). Menor = primero.
 * published: solo los `true` salen en el storefront.
 */
const PortfolioWork = model.define('portfolio_work', {
  id: model.id().primaryKey(),
  service_type: model.text(),
  title: model.text(),
  description: model.text().nullable(),
  car: model.text().nullable(),
  materials: model.text().nullable(),
  date_label: model.text().nullable(),
  thumbnail: model.text().nullable(),
  images: model.json().nullable(),
  rank: model.number().default(0),
  published: model.boolean().default(true),
})

export default PortfolioWork
