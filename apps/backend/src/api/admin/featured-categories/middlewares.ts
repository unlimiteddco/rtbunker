import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

// ─── Schemas ──────────────────────────────────────────────────────

export const ListFeaturedCategoriesSchema = createFindParams().merge(
  z.object({
    published: z.coerce.boolean().optional(),
  }),
)
export type ListFeaturedCategoriesSchema = z.infer<typeof ListFeaturedCategoriesSchema>

export const GetFeaturedCategorySchema = createFindParams()

export const CreateFeaturedCategorySchema = z.object({
  category_handle: z.string().min(1),
  label: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type CreateFeaturedCategorySchema = z.infer<typeof CreateFeaturedCategorySchema>

export const UpdateFeaturedCategorySchema = z.object({
  category_handle: z.string().min(1).optional(),
  label: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type UpdateFeaturedCategorySchema = z.infer<typeof UpdateFeaturedCategorySchema>

// Campos devueltos por las rutas admin (lista y detalle).
const FEATURED_CATEGORY_ADMIN_FIELDS = [
  'id',
  'category_handle',
  'label',
  'image',
  'rank',
  'published',
  'created_at',
  'updated_at',
]

// ─── Middleware routes ────────────────────────────────────────────

export const featuredCategoryAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/featured-categories',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(ListFeaturedCategoriesSchema, {
        defaults: FEATURED_CATEGORY_ADMIN_FIELDS,
        isList: true,
        defaultLimit: 100,
      }),
    ],
  },
  {
    matcher: '/admin/featured-categories',
    method: 'POST',
    middlewares: [validateAndTransformBody(CreateFeaturedCategorySchema)],
  },
  {
    matcher: '/admin/featured-categories/:id',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetFeaturedCategorySchema, {
        defaults: FEATURED_CATEGORY_ADMIN_FIELDS,
        isList: false,
      }),
    ],
  },
  {
    matcher: '/admin/featured-categories/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(UpdateFeaturedCategorySchema)],
  },
]
