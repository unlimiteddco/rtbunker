import { MedusaService } from '@medusajs/framework/utils'

import Review from './models/review'
import ReviewRequest from './models/review-request'

class ReviewsModuleService extends MedusaService({
  Review,
  ReviewRequest,
}) {}

export default ReviewsModuleService
