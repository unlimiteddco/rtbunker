import { Module } from '@medusajs/framework/utils'

import CustomOrdersModuleService from './service'

export const CUSTOM_ORDERS_MODULE = 'customOrders'

export default Module(CUSTOM_ORDERS_MODULE, {
  service: CustomOrdersModuleService,
})
