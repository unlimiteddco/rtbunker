import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  CONTENT_BLOCK_DEFAULTS,
  CONTENT_COLLECTIONS,
  FIXED_COLLECTIONS,
} from '../lib/content-blocks'
import { SITE_CONTENT_MODULE } from '../modules/site-content'

/**
 * Siembra las piezas de contenido (`content_block`) con lo que hasta ahora
 * estaba escrito a mano en el storefront, para que en "Contenido web"
 * aparezca lo que ya se ve en la web.
 *
 * Idempotente por colección:
 *   · Colecciones libres (marcas, colores, paneles): solo se siembran si la
 *     colección está VACÍA. Si ya tiene algo, no se toca.
 *   · Colecciones fijas (tipos de personalizada): se añaden las `key` que
 *     falten, sin tocar las que ya existen.
 *
 * Es contenido de arranque, no una mutación de negocio: escribe con el
 * servicio del módulo directamente, igual que el resto de seeds de sistema.
 *
 * Uso manual: `npx medusa exec ./src/scripts/seed-content-blocks.ts`
 */
export default async function seedContentBlocks({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const service: any = container.resolve(SITE_CONTENT_MODULE)

  for (const collection of CONTENT_COLLECTIONS) {
    const existing: { key: string | null }[] = await service.listContentBlocks(
      { collection },
      { select: ['id', 'key'], take: null },
    )
    const defaults = CONTENT_BLOCK_DEFAULTS[collection]
    const fixed = FIXED_COLLECTIONS.includes(collection)

    const missing = fixed
      ? defaults.filter((d) => !existing.some((e) => e.key === d.key))
      : existing.length === 0
        ? defaults
        : []

    if (missing.length === 0) {
      logger.info(`Seed content-blocks: «${collection}» ya tiene contenido, se omite.`)
      continue
    }

    await service.createContentBlocks(
      missing.map((d) => ({
        ...d,
        collection,
        rank: defaults.indexOf(d),
        published: true,
      })),
    )
    logger.info(`Seed content-blocks: ${missing.length} pieza(s) creadas en «${collection}».`)
  }
}
