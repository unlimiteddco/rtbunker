import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'
import { z } from 'zod'

/**
 * "Publicar producto" rápido (página admin `publicar-producto`).
 *
 * Crea un producto completo en una sola llamada replicando cómo están montados
 * los productos del catálogo: canal de venta por defecto de la tienda,
 * precios por variante en EUR (tal cual, NO en céntimos), manage_inventory
 * false + allow_backorder true, SKU `<handle>-v<n>` y descripción en HTML.
 *
 * Aquí solo se valida la forma; las reglas de negocio (valores repetidos,
 * nº máximo de combinaciones…) están en el step `prepareQuickProductStep`.
 */

const optionValue = z.string().trim().min(1).max(60)

const QuickProductOptionSchema = z.object({
  title: z.string().trim().min(1).max(40),
  values: z.array(optionValue).min(1).max(100),
  // Precio por valor (solo se aplica en la PRIMERA opción). Clave = valor.
  prices: z.record(z.string(), z.number().positive()).optional(),
})

export const CreateQuickProductSchema = z.object({
  title: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  // Texto plano; el workflow lo convierte a <p>…</p>.
  description: z.string().max(10000).optional().nullable(),
  category_ids: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  thumbnail: z.string().url().optional().nullable(),
  // EUR tal cual (6.99 = 6,99 €).
  price: z.number().positive('El precio debe ser mayor que 0'),
  options: z.array(QuickProductOptionSchema).max(2).default([]),
  status: z.enum(['published', 'draft']).default('published'),
  custom_text: z
    .object({
      enabled: z.boolean(),
      label: z.string().trim().max(80).optional().nullable(),
      placeholder: z.string().trim().max(80).optional().nullable(),
      max: z.number().int().positive().max(200).optional().nullable(),
      required: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
  // Opciones que elige el cliente sin cambiar el precio (p. ej. la fuente).
  // Se guardan en product.metadata.custom_choices; no crean variantes.
  custom_choices: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        options: z.array(z.string().trim().min(1).max(120)).min(2).max(30),
        required: z.boolean().optional(),
      }),
    )
    .max(6)
    .optional()
    .nullable(),
})
export type CreateQuickProductSchema = z.infer<typeof CreateQuickProductSchema>

/**
 * Equivalente a `validateAndTransformBody` pero con mensajes legibles.
 *
 * OJO: no usamos `validateAndTransformBody` porque el backend tiene su propia
 * copia de zod (3.22, en apps/backend/node_modules) distinta de la que usa
 * Medusa (3.25, hoisted): el `instanceof ZodError` de Medusa falla y cualquier
 * body inválido acaba en un 500 "unknown_error" en vez de un 400.
 */
function validateQuickProductBody(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const parsed = CreateQuickProductSchema.strict().safeParse(req.body ?? {})
  if (!parsed.success) {
    const message = parsed.error.issues
      .slice(0, 3)
      .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
      .join('; ')
    return next(new MedusaError(MedusaError.Types.INVALID_DATA, `Datos no válidos — ${message}`))
  }
  req.validatedBody = parsed.data
  next()
}

export const quickProductAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/quick-product',
    method: 'POST',
    middlewares: [validateQuickProductBody],
  },
]
