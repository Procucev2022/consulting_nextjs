/**
 * Module 2 — Strategic Sourcing Intelligence Routes
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import { Router } from 'express';
import {
  getDashboardSummary,
  getCategoryProfiles,
  getCategoryProfileById,
  getSupplierDeepDive,
  getHandoffPackages,
  exportSourcingReport
} from '../controllers/module2StrategicSourcing.controller';
import { requireFeature } from '../utils/entitlementMiddleware';
import { FEATURE_PERMISSIONS } from '../constants/subscription';

const router = Router();

router.get('/dashboard', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getDashboardSummary);
router.get('/categories', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getCategoryProfiles);
router.get('/category/:id', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getCategoryProfileById);
router.get('/suppliers', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getSupplierDeepDive);
router.get('/handoff', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getHandoffPackages);
router.get('/export', requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT), exportSourcingReport);

export default router;
