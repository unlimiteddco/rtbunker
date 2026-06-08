import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

import { REVIEW_STATUSES } from '../../../workflows/steps/moderate-review'

const REVIEW_FIELDS = [
  'id',
  'product_id',
  'product_title',
  'product_handle',
  'product_thumbnail',
  'customer_id',
  'order_id',
  'email',
  'name',
  'rating',
  'title',
  'content',
  'status',
  'verified_purchase',
  'admin_response',
  'created_at',
  'updated_at',
]

export const ListReviewsAdminSchema = createFindParams().merge(
  z.object({
    q: z.string().optional(),
    status: z.enum(REVIEW_STATUSES).optional(),
    product_id: z.string().optional(),
  }),
)
export type ListReviewsAdminSchema = z.infer<typeof ListReviewsAdminSchema>

export const ModerateReviewSchema = z.object({
  status: z.enum(REVIEW_STATUSES),
  admin_response: z.string().max(2000).optional().nullable(),
})
export type ModerateReviewSchema = z.infer<typeof ModerateReviewSchema>

export const reviewAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/reviews',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(ListReviewsAdminSchema, {
        defaults: REVIEW_FIELDS,
        isList: true,
        defaultLimit: 25,
      }),
    ],
  },
  {
    matcher: '/admin/reviews/:id/status',
    method: 'POST',
    middlewares: [validateAndTransformBody(ModerateReviewSchema)],
  },
]
