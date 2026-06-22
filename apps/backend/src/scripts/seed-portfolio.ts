import type { ExecArgs } from '@medusajs/framework/types'

import { PORTFOLIO_MODULE } from '../modules/portfolio'
import { createPortfolioWorkWorkflow } from '../workflows/create-portfolio-work'

/**
 * Inserta los 6 trabajos placeholder del portafolio (espejo de
 * apps/storefront/src/lib/portfolio.ts) para que Nikita arranque con datos
 * editables desde el admin.
 *
 * Idempotente: si ya existe algún PortfolioWork, no hace nada.
 *
 * Mapeo de campos storefront → backend:
 *   serviceType → service_type
 *   date        → date_label
 *
 * Uso:
 *   npx medusa exec ./src/scripts/seed-portfolio.ts
 */
export default async function seedPortfolio({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const service: any = container.resolve(PORTFOLIO_MODULE)

  const [, count] = await service.listAndCountPortfolioWorks({}, { take: 1 })
  if (count > 0) {
    logger.info(
      `Seed portfolio: ya hay ${count} trabajo(s), no se inserta nada (idempotente).`,
    )
    return
  }

  // Espejo de PORTFOLIO en apps/storefront/src/lib/portfolio.ts.
  const works = [
    {
      service_type: 'wrapping',
      title: 'Mercedes-AMG G63 · Full Wrap negro mate',
      thumbnail: '/portfolio/wrapping-g63-1.jpg',
      images: [
        '/portfolio/wrapping-g63-1.jpg',
        '/portfolio/wrapping-g63-2.jpg',
        '/portfolio/wrapping-g63-3.jpg',
      ],
      description:
        'Cambio de color completo a negro mate con desmontaje de embellecedores y faldones. Acabado uniforme en todas las piezas, incluidos pilares y manetas.',
      car: 'Mercedes-AMG G63',
      materials: '3M 2080 Matte Black',
      date_label: '2025',
    },
    {
      service_type: 'car-design',
      title: 'Porsche 911 (992) · Stripes y diseño deportivo',
      thumbnail: '/portfolio/car-design-992-1.jpg',
      images: ['/portfolio/car-design-992-1.jpg', '/portfolio/car-design-992-2.jpg'],
      description:
        'Diseño de líneas deportivas a medida sobre carrocería original. Bandas centrales y laterales con corte preciso y bordes sellados.',
      car: 'Porsche 911 Carrera (992)',
      materials: 'KPMF impresión + laminado brillo',
      date_label: '2025',
    },
    {
      service_type: 'chrome-delete',
      title: 'BMW M3 · Chrome Delete integral',
      thumbnail: '/portfolio/chrome-m3-1.jpg',
      images: ['/portfolio/chrome-m3-1.jpg', '/portfolio/chrome-m3-2.jpg'],
      description:
        'Eliminado de todos los cromados (parrillas, marcos de ventanilla, molduras y logos) en negro brillo para un look más agresivo y limpio.',
      car: 'BMW M3 Competition',
      materials: '3M 2080 Gloss Black',
      date_label: '2025',
    },
    {
      service_type: 'ahumado',
      title: 'Volkswagen Golf R · Ahumado de faros 35%',
      thumbnail: '/portfolio/ahumado-golf-1.jpg',
      images: ['/portfolio/ahumado-golf-1.jpg', '/portfolio/ahumado-golf-2.jpg'],
      description:
        'Ahumado de pilotos delanteros y traseros con film homologado al 35% de transmisión. Mantiene la visibilidad nocturna y respeta la normativa.',
      car: 'Volkswagen Golf R',
      materials: 'Lámina de ahumado homologada 35%',
      date_label: '2024',
    },
    {
      service_type: 'rotulacion',
      title: 'Mercedes Sprinter · Rotulación de flota',
      thumbnail: '/portfolio/rotulacion-sprinter-1.jpg',
      images: [
        '/portfolio/rotulacion-sprinter-1.jpg',
        '/portfolio/rotulacion-sprinter-2.jpg',
      ],
      description:
        'Branding corporativo en furgoneta comercial: logotipo, datos de contacto y elementos gráficos de marca con vinilo de corte de larga duración.',
      car: 'Mercedes-Benz Sprinter',
      materials: 'Vinilo de corte premium',
      date_label: '2024',
    },
    {
      service_type: 'car-design',
      title: 'Audi RS6 · Capó en carbón vinílico',
      thumbnail: '/portfolio/car-design-rs6-1.jpg',
      images: ['/portfolio/car-design-rs6-1.jpg', '/portfolio/car-design-rs6-2.jpg'],
      description:
        'Detalle de capó y techo en textura carbono 4D para un acabado deportivo sin el coste de piezas de fibra. Bordes envueltos y sellados.',
      car: 'Audi RS6 Avant',
      materials: '3M Di-Noc Carbon 4D',
      date_label: '2024',
    },
  ]

  let rank = 0
  for (const work of works) {
    const { result } = await createPortfolioWorkWorkflow(container).run({
      input: { ...work, rank, published: true },
    })
    logger.info(`Seed portfolio: creado "${work.title}" (${result.id})`)
    rank += 1
  }

  logger.info(`Seed portfolio completado: ${works.length} trabajos insertados.`)
}
