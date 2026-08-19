import { model } from '@medusajs/framework/utils'

/**
 * FeaturedCategory — selección manual de las categorías que salen en el bloque
 * "Shop stickers" de la home (apps/storefront/src/components/home/category-grid.tsx).
 *
 * Hoy el storefront coge `listCategories().slice(0, 4)` y usa la foto del primer
 * producto de cada categoría. Con este modelo Nikita decide QUÉ categorías salen,
 * EN QUÉ ORDEN y CON QUÉ FOTO.
 *
 * category_handle: handle de la categoría de Medusa (product_category.handle).
 *                  Es la clave de unión; el storefront resuelve el resto.
 * label:           título a mostrar. Si es null, el storefront usa el nombre
 *                  real de la categoría.
 * image:           foto personalizada subida desde el admin. Si es null, el
 *                  storefront cae al comportamiento actual (foto del primer
 *                  producto de la categoría).
 * rank:            orden (asc).
 * published:       solo los `true` salen en la web.
 */
const FeaturedCategory = model.define('featured_category', {
  id: model.id().primaryKey(),
  category_handle: model.text(),
  label: model.text().nullable(),
  image: model.text().nullable(),
  rank: model.number().default(0),
  published: model.boolean().default(true),
})

export default FeaturedCategory
