import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

import { CUSTOM_ORDER_STATUSES } from '../../../workflows/steps/update-custom-order-status'

// ─── Schemas ──────────────────────────────────────────────────────

export const ListCustomOrdersSchema = createFindParams().merge(
  z.object({
    q: z.string().optional(),
    status: z.enum(CUSTOM_ORDER_STATUSES).optional(),
  }),
)
export type ListCustomOrdersSchema = z.infer<typeof ListCustomOrdersSchema>

export const GetCustomOrderSchema = createFindParams()

export const CreateCustomOrderSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),

  shape: z.enum(['rect', 'square', 'circle', 'custom']),
  material: z.enum(['mate', 'brillo', 'holo', 'refl']),
  size_id: z.enum(['s', 'm', 'l', 'xl']).optional().nullable(),
  width_cm: z.number().positive().optional().nullable(),
  height_cm: z.number().positive().optional().nullable(),
  units: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),

  design_file_url: z.string().url().optional().nullable(),
  design_file_name: z.string().optional().nullable(),
  customer_notes: z.string().optional().nullable(),
})
export type CreateCustomOrderSchema = z.infer<typeof CreateCustomOrderSchema>

// Soporta lote (varios mockups en una sola llamada) manteniendo compat con el
// formato antiguo de un único proof ({ url, file_name }). El route normaliza
// cualquiera de las dos formas a un array de proofs y valida que llegue al
// menos uno (no usamos `.refine()` aquí porque `validateAndTransformBody`
// requiere un ZodObject plano, no un ZodEffects).
export const AddProofSchema = z.object({
  // Lote: lista de proofs a adjuntar de una vez.
  proofs: z
    .array(
      z.object({
        url: z.string().url(),
        file_name: z.string().nullable().optional(),
      }),
    )
    .min(1)
    .optional(),
  // Compat single: un único proof inline.
  url: z.string().url().optional(),
  file_name: z.string().nullable().optional(),
  // Notas del mockup (van al email del cliente). Comunes a todo el lote.
  admin_notes: z.string().nullable().optional(),
})
export type AddProofSchema = z.infer<typeof AddProofSchema>

export const UpdateStatusSchema = z.object({
  status: z.enum(CUSTOM_ORDER_STATUSES),
  admin_notes: z.string().optional().nullable(),
  tracking_number: z.string().optional().nullable(),
  // Aceptamos cualquier string como tracking_url: el admin sabe lo que pega y
  // forzar `z.string().url()` rebota si la pega sin `https://`. La normalizamos
  // en el step si hace falta.
  tracking_url: z.string().optional().nullable(),
  shipping_carrier: z.string().optional().nullable(),
})
export type UpdateStatusSchema = z.infer<typeof UpdateStatusSchema>

// ─── Middleware routes ────────────────────────────────────────────

export const customOrderMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/custom-orders',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(ListCustomOrdersSchema, {
        defaults: [
          'id',
          'customer_email',
          'customer_name',
          'shape',
          'material',
          'size_id',
          'width_cm',
          'height_cm',
          'units',
          'unit_price',
          'total_price',
          'status',
          'design_file_url',
          'design_file_name',
          'customer_notes',
          'admin_notes',
          'proofs',
          'magic_token',
          'cart_id',
          'order_id',
          'tracking_number',
          'tracking_url',
          'shipping_carrier',
          'priority',
          'membership_tier',
          'paid_with_credits',
          'created_at',
          'updated_at',
        ],
        isList: true,
        defaultLimit: 25,
      }),
    ],
  },
  {
    matcher: '/admin/custom-orders',
    method: 'POST',
    middlewares: [validateAndTransformBody(CreateCustomOrderSchema)],
  },
  {
    matcher: '/admin/custom-orders/:id',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetCustomOrderSchema, {
        defaults: [
          'id',
          'customer_email',
          'customer_name',
          'customer_phone',
          'shape',
          'material',
          'size_id',
          'width_cm',
          'height_cm',
          'units',
          'unit_price',
          'total_price',
          'status',
          'design_file_url',
          'design_file_name',
          'customer_notes',
          'admin_notes',
          'proofs',
          'magic_token',
          'cart_id',
          'order_id',
          'tracking_number',
          'tracking_url',
          'shipping_carrier',
          'priority',
          'membership_tier',
          'paid_with_credits',
          'created_at',
          'updated_at',
        ],
        isList: false,
      }),
    ],
  },
  {
    matcher: '/admin/custom-orders/:id/proofs',
    method: 'POST',
    middlewares: [validateAndTransformBody(AddProofSchema)],
  },
  {
    matcher: '/admin/custom-orders/:id/status',
    method: 'POST',
    middlewares: [validateAndTransformBody(UpdateStatusSchema)],
  },
]
