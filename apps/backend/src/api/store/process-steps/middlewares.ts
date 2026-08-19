import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'
import { z } from 'zod'

export const ListStoreProcessStepsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})
export type ListStoreProcessStepsSchema = z.infer<typeof ListStoreProcessStepsSchema>

export const storeProcessStepMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/process-steps',
    method: 'GET',
    middlewares: [validateAndTransformQuery(ListStoreProcessStepsSchema, {})],
  },
]
