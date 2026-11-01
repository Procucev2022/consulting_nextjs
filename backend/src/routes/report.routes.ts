import { Router } from 'express';
import { getExecutiveReport, downloadExecutiveReportPdf } from '../controllers/report.controller';
import { requireFeature } from '../utils/entitlementMiddleware';
import { FEATURE_PERMISSIONS } from '../constants/subscription';

const router = Router();

router.get('/', requireFeature(FEATURE_PERMISSIONS.MANAGEMENT_QUICK_SUMMARY), getExecutiveReport);
router.get('/pdf', requireFeature(FEATURE_PERMISSIONS.MANAGEMENT_QUICK_SUMMARY), downloadExecutiveReportPdf);

export default router;
