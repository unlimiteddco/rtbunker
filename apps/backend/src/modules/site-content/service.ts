import { MedusaService } from '@medusajs/framework/utils'

import ContentBlock from './models/content-block'
import FeaturedCategory from './models/featured-category'
import ProcessStep from './models/process-step'
import ServiceItem from './models/service-item'

/**
 * Servicio del módulo `siteContent`: CRUD generado para las entidades de
 * contenido editable de la web (tarjetas de servicios, pasos del proceso,
 * categorías destacadas de la home y piezas genéricas por colección).
 *
 * Métodos generados por MedusaService:
 *   ServiceItem      → create/update/delete/list/listAndCountServiceItems,
 *                      retrieveServiceItem
 *   ProcessStep      → create/update/delete/list/listAndCountProcessSteps,
 *                      retrieveProcessStep
 *   FeaturedCategory → create/update/delete/list/listAndCountFeaturedCategories,
 *                      retrieveFeaturedCategory
 *   ContentBlock     → create/update/delete/list/listAndCountContentBlocks,
 *                      retrieveContentBlock (piezas genéricas por colección)
 */
class SiteContentModuleService extends MedusaService({
  ServiceItem,
  ProcessStep,
  FeaturedCategory,
  ContentBlock,
}) {}

export default SiteContentModuleService
