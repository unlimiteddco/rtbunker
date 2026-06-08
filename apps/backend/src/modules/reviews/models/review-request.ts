import { model } from '@medusajs/framework/utils'

/**
 * Marca de "ya le pedimos reseña a este pedido". El scheduled job
 * `request-reviews` la consulta para no spammear: si existe un registro
 * para un `order_id`, no se vuelve a enviar el email de petición de reseña.
 * `created_at` (automático) sirve como fecha de envío.
 */
const ReviewRequest = model.define('review_request', {
  id: model.id().primaryKey(),
  order_id: model.text(),
  email: model.text(),
}).indexes([
  { on: ['order_id'], unique: true, where: 'deleted_at IS NULL' },
])

export default ReviewRequest
