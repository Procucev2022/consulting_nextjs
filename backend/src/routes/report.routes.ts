import { Router } from 'express';
import { getExecutiveReport } from '../controllers/report.controller';
import { requireFeature } from '../utils/entitlementMiddleware';
import { FEATURE_PERMISSIONS } from '../constants/subscription';

const router = Router();

router.get('/', requireFeature(FEATURE_PERMISSIONS.MANAGEMENT_QUICK_SUMMARY), getExecutiveReport);

export default router;
