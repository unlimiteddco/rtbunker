import { model } from '@medusajs/framework/utils'

/**
 * Reseña de producto. Las reseñas pasan por moderación: nacen en `pending`
 * y solo se muestran en la PDP cuando Nikita las aprueba desde el admin.
 *
 * `product_*` se desnormalizan al crear la reseña para no depender de un
 * module-link (el admin y el storefront muestran título/thumbnail sin más).
 */
const Review = model.define('review', {
  id: model.id().primaryKey(),
  product_id: model.text(),
  product_title: model.text().nullable(),
  product_handle: model.text().nullable(),
  product_thumbnail: model.text().nullable(),
  customer_id: model.text().nullable(),
  order_id: model.text().nullable(),
  email: model.text(),
  name: model.text().nullable(),
  rating: model.number(),
  title: model.text().nullable(),
  content: model.text().nullable(),
  // URLs públicas de fotos subidas por el cliente (R2). Hasta 6.
  images: model.json().nullable(),
  status: model.enum(['pending', 'approved', 'rejected']).default('pending'),
  verified_purchase: model.boolean().default(false),
  admin_response: model.text().nullable(),
}).indexes([
  // Un email solo puede reseñar un producto una vez (ignora soft-deleted).
  { on: ['product_id', 'email'], unique: true, where: 'deleted_at IS NULL' },
])

export default Review
