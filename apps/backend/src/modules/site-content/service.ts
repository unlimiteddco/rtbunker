import { MedusaService } from '@medusajs/framework/utils'

import FeaturedCategory from './models/featured-category'
import ProcessStep from './models/process-step'
import ServiceItem from './models/service-item'

/**
 * Servicio del módulo `siteContent`: CRUD generado para las tres entidades de
 * contenido editable de la web (tarjetas de servicios, pasos del proceso y
 * categorías destacadas de la home).
 *
 * Métodos generados por MedusaService:
 *   ServiceItem      → create/update/delete/list/listAndCountServiceItems,
 *                      retrieveServiceItem
 *   ProcessStep      → create/update/delete/list/listAndCountProcessSteps,
 *                      retrieveProcessStep
 *   FeaturedCategory → create/update/delete/list/listAndCountFeaturedCategories,
 *                      retrieveFeaturedCategory
 */
class SiteContentModuleService extends MedusaService({
  ServiceItem,
  ProcessStep,
  FeaturedCategory,
}) {}

export default SiteContentModuleService
