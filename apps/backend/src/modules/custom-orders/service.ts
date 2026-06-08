import { MedusaService } from '@medusajs/framework/utils'

import CustomOrder from './models/custom-order'

class CustomOrdersModuleService extends MedusaService({
  CustomOrder,
}) {}

export default CustomOrdersModuleService
