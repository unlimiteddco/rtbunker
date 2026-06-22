import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

// service_type espejo del contrato del storefront (src/lib/portfolio.ts).
export const PORTFOLIO_SERVICE_TYPES = [
  'wrapping',
  'car-design',
  'chrome-delete',
  'ahumado',
  'rotulacion',
] as const

// ─── Schemas ──────────────────────────────────────────────────────

export const ListPortfolioSchema = createFindParams().merge(
  z.object({
    service_type: z.enum(PORTFOLIO_SERVICE_TYPES).optional(),
    published: z.coerce.boolean().optional(),
  }),
)
export type ListPortfolioSchema = z.infer<typeof ListPortfolioSchema>

export const GetPortfolioWorkSchema = createFindParams()

export const CreatePortfolioWorkSchema = z.object({
  service_type: z.enum(PORTFOLIO_SERVICE_TYPES),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  car: z.string().optional().nullable(),
  materials: z.string().optional().nullable(),
  date_label: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type CreatePortfolioWorkSchema = z.infer<typeof CreatePortfolioWorkSchema>

export const UpdatePortfolioWorkSchema = z.object({
  service_type: z.enum(PORTFOLIO_SERVICE_TYPES).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  car: z.string().optional().nullable(),
  materials: z.string().optional().nullable(),
  date_label: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type UpdatePortfolioWorkSchema = z.infer<typeof UpdatePortfolioWorkSchema>

// Campos devueltos por las rutas admin (lista y detalle).
const PORTFOLIO_ADMIN_FIELDS = [
  'id',
  'service_type',
  'title',
  'description',
  'car',
  'materials',
  'date_label',
  'thumbnail',
  'images',
  'rank',
  'published',
  'created_at',
  'updated_at',
]

// ─── Middleware routes ────────────────────────────────────────────

export const portfolioAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/portfolio',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(ListPortfolioSchema, {
        defaults: PORTFOLIO_ADMIN_FIELDS,
        isList: true,
        defaultLimit: 100,
      }),
    ],
  },
  {
    matcher: '/admin/portfolio',
    method: 'POST',
    middlewares: [validateAndTransformBody(CreatePortfolioWorkSchema)],
  },
  {
    matcher: '/admin/portfolio/:id',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetPortfolioWorkSchema, {
        defaults: PORTFOLIO_ADMIN_FIELDS,
        isList: false,
      }),
    ],
  },
  {
    matcher: '/admin/portfolio/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(UpdatePortfolioWorkSchema)],
  },
]
