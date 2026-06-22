import { MedusaService } from '@medusajs/framework/utils'

import PortfolioWork from './models/portfolio-work'

class PortfolioModuleService extends MedusaService({
  PortfolioWork,
}) {}

export default PortfolioModuleService
