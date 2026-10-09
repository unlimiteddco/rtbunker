import { model } from '@medusajs/framework/utils'

/**
 * ContentBlock — pieza de contenido editable genérica, agrupada por
 * `collection`. Evita crear un modelo (más sus rutas y workflows) por cada
 * trozo de la web que Nikita quiere poder cambiar.
 *
 * Colecciones en uso (ver `src/lib/content-blocks.ts`):
 *   marquee       Línea corredora de marcas (Servicios y Personalizadas).
 *                 title = texto, image = logo (opcional; si hay, sale el logo).
 *   product_type  Tarjetas "Elige tu producto" de Personalizadas.
 *                 key = id interno (vinyls, sheets…), title, description,
 *                 image = foto/icono de la tarjeta.
 *   color_swatch  Muestras de color del selector de variantes.
 *                 title = nombre EXACTO del color de la variante,
 *                 value = color (#hex), image = foto de la muestra (opcional).
 *   showcase      Paneles "Más que stickers" de la home.
 *                 subtitle = línea superior, title, description, image,
 *                 link_label + link_href = botón.
 *
 * key:        identificador estable cuando el código necesita reconocer la
 *             pieza (p. ej. el tipo de producto). Null en listas libres.
 * rank:       orden (asc).
 * published:  solo los `true` salen en la web.
 */
const ContentBlock = model
  .define('content_block', {
    id: model.id().primaryKey(),
    collection: model.text(),
    key: model.text().nullable(),
    title: model.text().nullable(),
    subtitle: model.text().nullable(),
    description: model.text().nullable(),
    image: model.text().nullable(),
    value: model.text().nullable(),
    link_label: model.text().nullable(),
    link_href: model.text().nullable(),
    rank: model.number().default(0),
    published: model.boolean().default(true),
  })
  .indexes([{ on: ['collection'] }])

export default ContentBlock
