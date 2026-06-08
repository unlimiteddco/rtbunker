import { MedusaService } from '@medusajs/framework/utils'

import Membership from './models/membership'

class MembershipsModuleService extends MedusaService({
  Membership,
}) {}

export default MembershipsModuleService
