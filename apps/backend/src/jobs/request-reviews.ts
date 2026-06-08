import type { MedusaContainer } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { REVIEWS_MODULE } from '../modules/reviews'
import { requestReviewWorkflow } from '../workflows/request-review'

const DELAY_DAYS = Number(process.env.REVIEW_REQUEST_DELAY_DAYS ?? 7)
// Ventana de gracia: solo miramos pedidos que cruzaron el umbral en los
// últimos N días (con el dedup, evita re-escanear todo el histórico).
const WINDOW_DAYS = Number(process.env.REVIEW_REQUEST_WINDOW_DAYS ?? 21)

/**
 * Pide reseña por email a los pedidos hechos hace ~DELAY_DAYS días.
 * Idempotente: el módulo `reviews` guarda un `review_request` por pedido,
 * así que cada pedido recibe el email una sola vez.
 */
export default async function requestReviewsJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const reviews: any = container.resolve(REVIEWS_MODULE)

  const now = Date.now()
  const upper = new Date(now - DELAY_DAYS * 86400000) // hace DELAY_DAYS días
  const lower = new Date(now - (DELAY_DAYS + WINDOW_DAYS) * 86400000)

  try {
    const { data: orders } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'display_id',
        'email',
        'created_at',
        'customer.first_name',
        'items.product_id',
        'items.product_title',
        'items.product_handle',
        'items.thumbnail',
      ],
      filters: {
        created_at: { $lte: upper, $gte: lower },
      },
    })

    if (!orders?.length) {
      logger.info('[request-reviews] No hay pedidos en la ventana.')
      return
    }

    // Pedidos que ya recibieron petición → set para descartar.
    const orderIds = orders.map((o: any) => o.id)
    const alreadyRequested = await reviews.listReviewRequests({ order_id: orderIds })
    const requestedSet = new Set(alreadyRequested.map((r: any) => r.order_id))

    let sent = 0
    for (const order of orders) {
      if (!order.email) continue
      if (requestedSet.has(order.id)) continue

      // Productos únicos del pedido (ignora líneas custom sin product_id).
      const seen = new Set<string>()
      const products: Array<{
        title: string
        handle: string | null
        thumbnail: string | null
      }> = []
      for (const it of order.items ?? []) {
        if (!it.product_id || seen.has(it.product_id)) continue
        seen.add(it.product_id)
        products.push({
          title: it.product_title ?? 'Tu producto',
          handle: it.product_handle ?? null,
          thumbnail: it.thumbnail ?? null,
        })
      }
      if (products.length === 0) continue

      try {
        await requestReviewWorkflow(container).run({
          input: {
            order_id: order.id,
            email: order.email,
            customer_name: order.customer?.first_name ?? null,
            order_short_id: `#${order.display_id}`,
            products,
          },
        })
        sent += 1
      } catch (err: any) {
        logger.error(
          `[request-reviews] Falló para pedido ${order.id}: ${err?.message ?? err}`,
        )
      }
    }

    logger.info(`[request-reviews] Emails de reseña enviados: ${sent}`)
  } catch (err: any) {
    logger.error(`[request-reviews] Job falló: ${err?.message ?? err}`)
  }
}

export const config = {
  name: 'request-reviews',
  schedule: '0 10 * * *', // todos los días a las 10:00
}
