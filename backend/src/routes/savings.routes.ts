import { Router } from 'express';
import {
  getSavings,
  deployOpportunity,
  getConsolidatedSavings,
  updateActionPlan,
  updateOpportunityStatus
} from '../controllers/savings.controller';
import { validateBody } from '../utils/validation';
import {
  deployOpportunitySchema,
  updateActionPlanSchema,
  updateOpportunityStatusSchema
} from '../constants/validation';

const router = Router();

router.get('/', getSavings);
router.post('/', validateBody(deployOpportunitySchema), deployOpportunity);

// Module 4 Consolidated Savings & De-Duplication Routes (Prompt 100)
router.get('/consolidated', getConsolidatedSavings);
router.post('/action-plan/update', validateBody(updateActionPlanSchema), updateActionPlan);
router.post('/opportunity/status', validateBody(updateOpportunityStatusSchema), updateOpportunityStatus);

export default router;
