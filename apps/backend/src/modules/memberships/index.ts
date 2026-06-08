import { Module } from '@medusajs/framework/utils'

import MembershipsModuleService from './service'

export const MEMBERSHIPS_MODULE = 'memberships'

export default Module(MEMBERSHIPS_MODULE, {
  service: MembershipsModuleService,
})
