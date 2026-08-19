import { Module } from '@medusajs/framework/utils'

import SiteContentModuleService from './service'

/**
 * ⚠ El nombre del módulo NO puede llevar guiones (rompe la resolución en
 * runtime). Carpeta `site-content`, nombre `siteContent` — igual que
 * `customOrders`.
 */
export const SITE_CONTENT_MODULE = 'siteContent'

export default Module(SITE_CONTENT_MODULE, {
  service: SiteContentModuleService,
})
