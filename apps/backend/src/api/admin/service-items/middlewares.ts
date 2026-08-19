import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

// ─── Schemas ──────────────────────────────────────────────────────

export const ListServiceItemsSchema = createFindParams().merge(
  z.object({
    published: z.coerce.boolean().optional(),
  }),
)
export type ListServiceItemsSchema = z.infer<typeof ListServiceItemsSchema>

export const GetServiceItemSchema = createFindParams()

export const CreateServiceItemSchema = z.object({
  eyebrow: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  bullets: z.array(z.string()).optional().nullable(),
  cta_label: z.string().optional().nullable(),
  cta_href: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type CreateServiceItemSchema = z.infer<typeof CreateServiceItemSchema>

export const UpdateServiceItemSchema = z.object({
  eyebrow: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  bullets: z.array(z.string()).optional().nullable(),
  cta_label: z.string().optional().nullable(),
  cta_href: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type UpdateServiceItemSchema = z.infer<typeof UpdateServiceItemSchema>

// Campos devueltos por las rutas admin (lista y detalle).
const SERVICE_ITEM_ADMIN_FIELDS = [
  'id',
  'eyebrow',
  'title',
  'description',
  'bullets',
  'cta_label',
  'cta_href',
  'icon',
  'image',
  'featured',
  'rank',
  'published',
  'created_at',
  'updated_at',
]

// ─── Middleware routes ────────────────────────────────────────────

export const serviceItemAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/service-items',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(ListServiceItemsSchema, {
        defaults: SERVICE_ITEM_ADMIN_FIELDS,
        isList: true,
        defaultLimit: 100,
      }),
    ],
  },
  {
    matcher: '/admin/service-items',
    method: 'POST',
    middlewares: [validateAndTransformBody(CreateServiceItemSchema)],
  },
  {
    matcher: '/admin/service-items/:id',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetServiceItemSchema, {
        defaults: SERVICE_ITEM_ADMIN_FIELDS,
        isList: false,
      }),
    ],
  },
  {
    matcher: '/admin/service-items/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(UpdateServiceItemSchema)],
  },
]
