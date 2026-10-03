import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'
import { z } from 'zod'

/**
 * "Precios por tamaño" (página admin `precios`).
 *
 * Cada celda dice: en la fila `row` (un tamaño; null = todas) y para los
 * valores de columna `cols` (colores; null = todos), el precio pasa a ser
 * `amount` en EUR tal cual (NO en céntimos). Se aplica a `product_ids`.
 *
 * La página manda los productos en tandas pequeñas para poder enseñar el
 * progreso y no depender de una única petición larga, de ahí el máximo.
 */
export const UpdatePriceTableSchema = z.object({
  product_ids: z.array(z.string().min(1)).min(1).max(10),
  cells: z
    .array(
      z.object({
        row: z.string().min(1).max(120).nullable(),
        cols: z.array(z.string().min(1).max(120)).min(1).max(200).nullable(),
        amount: z.number().positive('El precio debe ser mayor que 0').max(100000),
      }),
    )
    .min(1)
    .max(500),
})
export type UpdatePriceTableSchema = z.infer<typeof UpdatePriceTableSchema>

/**
 * Validación manual en vez de `validateAndTransformBody`: el backend tiene su
 * propia copia de zod distinta de la de Medusa y el `instanceof ZodError` de
 * Medusa falla (un body inválido acabaría en 500). Ver quick-product.
 */
function validatePriceTableBody(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const parsed = UpdatePriceTableSchema.strict().safeParse(req.body ?? {})
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

export const priceTableAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/price-tables',
    method: 'POST',
    middlewares: [validatePriceTableBody],
  },
]
