import { MiddlewareRoute, validateAndTransformBody } from '@medusajs/framework'
import multer from 'multer'
import { z } from 'zod'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB tope
})

export const RespondToProofSchema = z.object({
  decision: z.enum(['approved', 'changes_requested']),
  notes: z.string().max(2000).optional().nullable(),
})
export type RespondToProofSchema = z.infer<typeof RespondToProofSchema>

export const AddCustomOrderToCartSchema = z.object({
  cart_id: z.string().optional().nullable(),
  customer_id: z.string().optional().nullable(),
  config: z.object({
    shape: z.enum(['rect', 'square', 'circle', 'custom']),
    material: z.enum(['mate', 'brillo', 'holo', 'refl']),
    size_id: z.enum(['s', 'm', 'l', 'xl']).optional().nullable(),
    width_cm: z.number().positive().optional().nullable(),
    height_cm: z.number().positive().optional().nullable(),
  }),
  units: z.number().int().min(1),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
  /** Créditos de socio a canjear (1 crédito = 1 unidad). 0 = pago normal. */
  credits_used: z.number().int().nonnegative().optional().nullable(),
  design_file_url: z.string().url().optional().nullable(),
  design_file_name: z.string().optional().nullable(),
  customer_notes: z.string().max(2000).optional().nullable(),
  region_id: z.string().optional().nullable(),
})
export type AddCustomOrderToCartSchema = z.infer<typeof AddCustomOrderToCartSchema>

export const storeCustomOrderMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/custom-orders/by-token/:token/response',
    method: 'POST',
    middlewares: [validateAndTransformBody(RespondToProofSchema)],
  },
  {
    matcher: '/store/custom-orders/upload',
    method: 'POST',
    bodyParser: false,
    middlewares: [upload.single('file')],
  },
  {
    matcher: '/store/custom-orders/cart',
    method: 'POST',
    middlewares: [validateAndTransformBody(AddCustomOrderToCartSchema)],
  },
]
