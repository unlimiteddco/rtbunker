import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { FIXED_COLLECTIONS, type ContentCollection } from '../../lib/content-blocks'
import { SITE_CONTENT_MODULE } from '../../modules/site-content'

export interface ContentBlockFields {
  key?: string | null
  title?: string | null
  subtitle?: string | null
  description?: string | null
  image?: string | null
  value?: string | null
  link_label?: string | null
  link_href?: string | null
  rank?: number
  published?: boolean
}

export interface CreateContentBlockInput extends ContentBlockFields {
  collection: ContentCollection
}

export interface UpdateContentBlockInput extends ContentBlockFields {
  id: string
}

export interface DeleteContentBlockInput {
  id: string
}

const assertNotFixed = (collection: string, action: string) => {
  if ((FIXED_COLLECTIONS as readonly string[]).includes(collection)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Las piezas de «${collection}» son fijas: se pueden editar, pero no ${action}.`,
    )
  }
}

export const createContentBlockStep = createStep(
  'create-content-block',
  async (input: CreateContentBlockInput, { container }) => {
    assertNotFixed(input.collection, 'crear')
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    // Sin orden explícito, la pieza nueva va al final de su colección.
    let rank = input.rank
    if (rank === undefined) {
      const siblings = await service.listContentBlocks(
        { collection: input.collection },
        { select: ['rank'], take: null },
      )
      rank = siblings.reduce((max: number, b: { rank: number }) => Math.max(max, b.rank), -1) + 1
    }

    const block = await service.createContentBlocks({ ...input, rank })
    return new StepResponse(block, block.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.deleteContentBlocks(id)
  },
)

export const updateContentBlockStep = createStep(
  'update-content-block',
  async (input: UpdateContentBlockInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveContentBlock(input.id)

    // La `key` de una pieza fija es lo que la une al código: no se toca.
    const { key, ...rest } = input
    const data = (FIXED_COLLECTIONS as readonly string[]).includes(existing.collection)
      ? rest
      : input

    const [updated] = await service.updateContentBlocks([data])
    return new StepResponse(updated, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    await service.updateContentBlocks([previous])
  },
)

export const deleteContentBlockStep = createStep(
  'delete-content-block',
  async (input: DeleteContentBlockInput, { container }) => {
    const service: any = container.resolve(SITE_CONTENT_MODULE)

    const existing = await service.retrieveContentBlock(input.id)
    assertNotFixed(existing.collection, 'borrar')

    await service.deleteContentBlocks(input.id)
    return new StepResponse({ id: input.id }, existing)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: any = container.resolve(SITE_CONTENT_MODULE)
    // Restaura el registro borrado (incluyendo su id original).
    await service.createContentBlocks(previous)
  },
)
