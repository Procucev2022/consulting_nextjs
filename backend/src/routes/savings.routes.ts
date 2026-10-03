import { Router } from 'express';
import {
  getSavings,
  deployOpportunity,
  getConsolidatedSavings,
  updateActionPlan,
  updateOpportunityStatus
} from '../controllers/savings.controller';
import { validateBody } from '../utils/validation';
import { requireFeature } from '../utils/entitlementMiddleware';
import { FEATURE_PERMISSIONS } from '../constants/subscription';
import {
  deployOpportunitySchema,
  updateActionPlanSchema,
  updateOpportunityStatusSchema
} from '../constants/validation';

const router = Router();

router.get('/', requireFeature(FEATURE_PERMISSIONS.TOTAL_SAVINGS), getSavings);
router.post('/', requireFeature(FEATURE_PERMISSIONS.MODULE_4_FULL), validateBody(deployOpportunitySchema), deployOpportunity);

// Module 4 Consolidated Savings & De-Duplication Routes (Prompt 100)
router.get('/consolidated', requireFeature(FEATURE_PERMISSIONS.TOTAL_SAVINGS), getConsolidatedSavings);
router.post('/action-plan/update', requireFeature(FEATURE_PERMISSIONS.ACTION_TRACKER), validateBody(updateActionPlanSchema), updateActionPlan);
router.post('/opportunity/status', requireFeature(FEATURE_PERMISSIONS.MODULE_4_FULL), validateBody(updateOpportunityStatusSchema), updateOpportunityStatus);

export default router;
