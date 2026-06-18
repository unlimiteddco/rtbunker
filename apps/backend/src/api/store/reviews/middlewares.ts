import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework'
import multer from 'multer'
import { z } from 'zod'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB tope por foto
})

export const ListReviewsSchema = z.object({
  // Opcional: si se omite, se listan TODAS las reseñas aprobadas (vista
  // global para la home). Si viene, se filtra por producto (PDP).
  product_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})
export type ListReviewsSchema = z.infer<typeof ListReviewsSchema>

export const CreateReviewSchema = z.object({
  product_id: z.string(),
  email: z.string().email(),
  name: z.string().max(80).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  content: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(6).optional().nullable(),
})
export type CreateReviewSchema = z.infer<typeof CreateReviewSchema>

export const storeReviewMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/reviews',
    method: 'GET',
    middlewares: [validateAndTransformQuery(ListReviewsSchema, {})],
  },
  {
    matcher: '/store/reviews/upload',
    method: 'POST',
    bodyParser: false,
    middlewares: [upload.single('file')],
  },
  {
    matcher: '/store/reviews',
    method: 'POST',
    middlewares: [validateAndTransformBody(CreateReviewSchema)],
  },
]
