import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'
import { z } from 'zod'

import { CONTENT_COLLECTIONS } from '../../../lib/content-blocks'

/**
 * Piezas de contenido editables por colección (panel "Contenido web").
 * Ver `modules/site-content/models/content-block.ts` para qué significa cada
 * campo en cada colección.
 */
const text = (max: number) => z.string().trim().max(max).nullable().optional()

const fields = {
  key: text(60),
  title: text(200),
  subtitle: text(200),
  description: text(2000),
  image: text(2000),
  value: text(500),
  link_label: text(120),
  link_href: text(500),
  rank: z.number().int().min(0).max(100000).optional(),
  published: z.boolean().optional(),
}

export const CreateContentBlockSchema = z.object({
  collection: z.enum(CONTENT_COLLECTIONS),
  ...fields,
})
export type CreateContentBlockSchema = z.infer<typeof CreateContentBlockSchema>

export const UpdateContentBlockSchema = z.object(fields)
export type UpdateContentBlockSchema = z.infer<typeof UpdateContentBlockSchema>

/**
 * Validación manual en vez de `validateAndTransformBody`: el backend tiene su
 * propia copia de zod distinta de la de Medusa y el `instanceof ZodError` de
 * Medusa falla (un body inválido acabaría en 500). Ver quick-product.
 */
const validateBody =
  (schema: z.ZodObject<z.ZodRawShape>) =>
  (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
    const parsed = schema.strict().safeParse(req.body ?? {})
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

export const contentBlockAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/content-blocks',
    method: 'POST',
    middlewares: [validateBody(CreateContentBlockSchema)],
  },
  {
    matcher: '/admin/content-blocks/:id',
    method: 'POST',
    middlewares: [validateBody(UpdateContentBlockSchema)],
  },
]
