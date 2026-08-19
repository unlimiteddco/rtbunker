import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { SITE_CONTENT_MODULE } from '../modules/site-content'
import { createFeaturedCategoryWorkflow } from '../workflows/create-featured-category'
import { createProcessStepWorkflow } from '../workflows/create-process-step'
import { createServiceItemWorkflow } from '../workflows/create-service-item'

/**
 * Siembra el contenido web editable (módulo `siteContent`) con los valores que
 * HOY están hardcodeados en el storefront, para que Nikita arranque con todo
 * lleno y solo tenga que editar.
 *
 * Fuentes (solo lectura):
 *   · apps/storefront/src/components/services/services-grid.tsx    → service_item
 *   · apps/storefront/src/components/services/services-process.tsx → process_step
 *   · apps/storefront/src/components/home/category-grid.tsx        → featured_category
 *
 * Idempotente POR ENTIDAD: si una entidad ya tiene registros, se salta esa
 * entidad y sigue con las demás (así se puede re-ejecutar tras añadir una).
 *
 * Uso:
 *   npx medusa exec ./src/scripts/seed-site-content.ts
 */
export default async function seedSiteContent({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const service: any = container.resolve(SITE_CONTENT_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // ── 1 · Servicios ───────────────────────────────────────────────
  // Espejo del array SERVICES de services-grid.tsx.
  // tagline → eyebrow, y el CTA es el mismo para todas las tarjetas.
  const services = [
    {
      eyebrow: 'Superficial · Full Wrap',
      title: 'Car Wrapping',
      description:
        'Cambia el color, textura o acabado de tu coche con vinilo de calidad cast. Aplicamos en zonas exteriores o desmontaje completo para un Full Wrap impecable.',
      bullets: ['Materiales 3M / Hexis / KPMF', 'Garantía 2 años', 'Desmontaje incluido'],
      icon: 'Layers',
      featured: true,
    },
    {
      eyebrow: 'Diseño exterior a medida',
      title: 'Car Design',
      description:
        'Vinilados parciales pensados para personalizar capó, techo, retrovisores o stripes laterales. Ideal si buscas un toque único sin recubrir el coche entero.',
      bullets: [
        'Diseños propios o brief',
        'Plantillas digitales',
        'Acabados mate / brillo / satin',
      ],
      icon: 'Paintbrush2',
      featured: false,
    },
    {
      eyebrow: 'Eliminar cromados',
      title: 'Chrome Delete',
      description:
        'Cubrimos todas las molduras y embellecedores cromados de tu coche con vinilo negro o de color. Look agresivo, limpio y reversible en cualquier momento.',
      bullets: ['Marcos ventana / parrilla', 'Negro brillo o mate', 'Sin pegamentos residuales'],
      icon: 'Sparkles',
      featured: false,
    },
    {
      eyebrow: 'Faros + protección',
      title: 'Ahumado de faros',
      description:
        'Vinilos translúcidos homologables para oscurecer faros y pilotos sin perder visibilidad. También aplicamos láminas de protección PPF en zonas vulnerables.',
      bullets: ['Tonos 20% · 35% · 50%', 'Protección antigrava', 'Homologable ITV'],
      icon: 'Lightbulb',
      featured: false,
    },
    {
      eyebrow: 'Flotas y branding',
      title: 'Rotulación de vehículos',
      description:
        'Diseñamos y aplicamos rotulaciones para furgonetas, coches comerciales y flotas. Branding completo con tu logo, copy y datos de contacto sobre vinilo de larga duración.',
      bullets: ['Diseño incluido', 'Aplicación en taller', 'Facturación a empresa'],
      icon: 'Type',
      featured: false,
    },
  ]

  const [, serviceCount] = await service.listAndCountServiceItems({}, { take: 1 })
  if (serviceCount > 0) {
    logger.info(
      `Seed site-content: ya hay ${serviceCount} servicio(s), se omite esa entidad.`,
    )
  } else {
    let rank = 0
    for (const item of services) {
      const { result } = await createServiceItemWorkflow(container).run({
        input: {
          ...item,
          cta_label: 'Solicitar presupuesto · Gratis',
          cta_href: '/contacto',
          image: null,
          rank,
          published: true,
        },
      })
      logger.info(`Seed site-content: servicio "${item.title}" (${result.id})`)
      rank += 1
    }
    logger.info(`Seed site-content: ${services.length} servicios insertados.`)
  }

  // ── 2 · Pasos del proceso ───────────────────────────────────────
  // Espejo del array STEPS de services-process.tsx. `meta` → badge.
  const steps = [
    {
      title: 'Briefing',
      description:
        'Cuéntanos qué buscas: foto del coche, referencias, idea. Te respondemos por WhatsApp o email con todas las preguntas clave.',
      badge: '< 24 h',
      icon: 'MessageSquare',
    },
    {
      title: 'Presupuesto + cita',
      description:
        'Recibes un presupuesto detallado por escrito. Si te encaja, cerramos día y hora en taller. Sin sorpresas posteriores.',
      badge: 'Sin compromiso',
      icon: 'CalendarCheck',
    },
    {
      title: 'Aplicación en taller',
      description:
        'Trabajamos en boxes cerrados, con calefacción y filtrado de polvo. Te avisamos cuando avanzamos para que veas el progreso.',
      badge: '1 a 5 días',
      icon: 'Hammer',
    },
    {
      title: 'Entrega + garantía',
      description:
        'Revisamos contigo el resultado, te damos las instrucciones de cuidado y firmamos la garantía oficial del material aplicado.',
      badge: 'Garantía 2 años',
      icon: 'Sparkles',
    },
  ]

  const [, stepCount] = await service.listAndCountProcessSteps({}, { take: 1 })
  if (stepCount > 0) {
    logger.info(`Seed site-content: ya hay ${stepCount} paso(s), se omite esa entidad.`)
  } else {
    let rank = 0
    for (const step of steps) {
      const { result } = await createProcessStepWorkflow(container).run({
        input: { ...step, rank, published: true },
      })
      logger.info(`Seed site-content: paso "${step.title}" (${result.id})`)
      rank += 1
    }
    logger.info(`Seed site-content: ${steps.length} pasos insertados.`)
  }

  // ── 3 · Categorías destacadas de la home ────────────────────────
  // No hay handles fijos en el storefront: category-grid.tsx coge las 4
  // primeras categorías reales. Por eso las deducimos de la BD en vez de
  // quemarlas. Si aún no hay categorías creadas, no se siembra nada y Nikita
  // las añade a mano desde el admin (Contenido web → Shop stickers).
  const [, featuredCount] = await service.listAndCountFeaturedCategories({}, { take: 1 })
  if (featuredCount > 0) {
    logger.info(
      `Seed site-content: ya hay ${featuredCount} categoría(s) destacada(s), se omite esa entidad.`,
    )
  } else {
    const { data: categories } = await query.graph({
      entity: 'product_category',
      fields: ['id', 'name', 'handle', 'rank'],
      filters: { is_active: true, is_internal: false },
      pagination: { take: 4, skip: 0, order: { rank: 'ASC', name: 'ASC' } },
    })

    if (!categories || categories.length === 0) {
      logger.info(
        'Seed site-content: no hay categorías de producto en la BD; se deja "Shop stickers" vacío (la home seguirá usando las 4 primeras automáticamente).',
      )
    } else {
      let rank = 0
      for (const cat of categories) {
        const { result } = await createFeaturedCategoryWorkflow(container).run({
          input: {
            category_handle: cat.handle as string,
            // label/image a null → el storefront usa el nombre real y la foto
            // del primer producto, igual que hoy.
            label: null,
            image: null,
            rank,
            published: true,
          },
        })
        logger.info(`Seed site-content: categoría destacada "${cat.handle}" (${result.id})`)
        rank += 1
      }
      logger.info(
        `Seed site-content: ${categories.length} categoría(s) destacada(s) insertada(s).`,
      )
    }
  }

  logger.info('Seed site-content completado.')
}
