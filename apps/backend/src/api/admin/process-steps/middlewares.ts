import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

// ─── Schemas ──────────────────────────────────────────────────────

export const ListProcessStepsSchema = createFindParams().merge(
  z.object({
    published: z.coerce.boolean().optional(),
  }),
)
export type ListProcessStepsSchema = z.infer<typeof ListProcessStepsSchema>

export const GetProcessStepSchema = createFindParams()

export const CreateProcessStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type CreateProcessStepSchema = z.infer<typeof CreateProcessStepSchema>

export const UpdateProcessStepSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  rank: z.number().int().optional(),
  published: z.boolean().optional(),
})
export type UpdateProcessStepSchema = z.infer<typeof UpdateProcessStepSchema>

// Campos devueltos por las rutas admin (lista y detalle).
const PROCESS_STEP_ADMIN_FIELDS = [
  'id',
  'title',
  'description',
  'badge',
  'icon',
  'rank',
  'published',
  'created_at',
  'updated_at',
]

// ─── Middleware routes ────────────────────────────────────────────

export const processStepAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/process-steps',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(ListProcessStepsSchema, {
        defaults: PROCESS_STEP_ADMIN_FIELDS,
        isList: true,
        defaultLimit: 100,
      }),
    ],
  },
  {
    matcher: '/admin/process-steps',
    method: 'POST',
    middlewares: [validateAndTransformBody(CreateProcessStepSchema)],
  },
  {
    matcher: '/admin/process-steps/:id',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(GetProcessStepSchema, {
        defaults: PROCESS_STEP_ADMIN_FIELDS,
        isList: false,
      }),
    ],
  },
  {
    matcher: '/admin/process-steps/:id',
    method: 'POST',
    middlewares: [validateAndTransformBody(UpdateProcessStepSchema)],
  },
]
