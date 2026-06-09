import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import { REVIEWS_MODULE } from '../../modules/reviews'

export interface CreateReviewInput {
  product_id: string
  email: string
  name?: string | null
  rating: number
  title?: string | null
  content?: string | null
  images?: string[] | null
  customer_id?: string | null
}

export interface CreateReviewOutput {
  review: {
    id: string
    product_id: string
    rating: number
    status: string
    verified_purchase: boolean
    images: string[] | null
  }
}

/**
 * Crea una reseña en estado `pending`. Antes:
 *  · valida que el email no haya reseñado ya este producto (one-per-email).
 *  · desnormaliza título/handle/thumbnail del producto.
 *  · marca `verified_purchase` si el email tiene un pedido con ese producto.
 */
export const createReviewStep = createStep(
  'create-review',
  async (input: CreateReviewInput, { container }) => {
    const service: any = container.resolve(REVIEWS_MODULE)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const normalizedEmail = input.email.trim().toLowerCase()

    // 1) Anti-duplicado
    const existing = await service.listReviews({
      product_id: input.product_id,
      email: normalizedEmail,
    })
    if (existing && existing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'Ya has dejado una reseña para este producto.',
      )
    }

    // 2) Datos del producto (desnormalizados)
    const { data: products } = await query.graph({
      entity: 'product',
      fields: ['id', 'title', 'handle', 'thumbnail'],
      filters: { id: input.product_id },
    })
    const product = products?.[0]
    if (!product) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Producto no encontrado.')
    }

    // 3) ¿Compra verificada? Buscamos un pedido del mismo email con ese producto.
    let verified = false
    let orderId: string | null = null
    const { data: orders } = await query.graph({
      entity: 'order',
      fields: ['id', 'email', 'items.product_id'],
      filters: { email: normalizedEmail },
    })
    for (const o of orders ?? []) {
      const hasProduct = (o.items ?? []).some(
        (it: any) => it.product_id === input.product_id,
      )
      if (hasProduct) {
        verified = true
        orderId = o.id
        break
      }
    }

    const [created] = await service.createReviews([
      {
        product_id: input.product_id,
        product_title: product.title ?? null,
        product_handle: product.handle ?? null,
        product_thumbnail: product.thumbnail ?? null,
        customer_id: input.customer_id ?? null,
        order_id: orderId,
        email: normalizedEmail,
        name: input.name ?? null,
        rating: input.rating,
        title: input.title ?? null,
        content: input.content ?? null,
        images: input.images ?? null,
        status: 'pending',
        verified_purchase: verified,
      },
    ])

    return new StepResponse(
      {
        review: {
          id: created.id,
          product_id: created.product_id,
          rating: created.rating,
          status: created.status,
          verified_purchase: created.verified_purchase,
          images: created.images ?? null,
        },
      } as CreateReviewOutput,
      { created_id: created.id as string },
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData?.created_id) return
    const service: any = container.resolve(REVIEWS_MODULE)
    await service.deleteReviews(compensationData.created_id)
  },
)
