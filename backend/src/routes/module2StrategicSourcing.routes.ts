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
import {
  getOpportunityLedger,
  getBridge as getMathematicalBridge,
  getCanonicalInput,
  getTop50Vendors,
  getSupplierRisk,
  getPoConsolidation,
  getRecurringSpend,
  getLineItems
} from '../controllers/module2Canonical.controller';
import { requireFeature } from '../utils/entitlementMiddleware';
import { FEATURE_PERMISSIONS } from '../constants/subscription';

const router = Router();

router.get('/dashboard', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getDashboardSummary);
router.get('/categories', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getCategoryProfiles);
router.get('/category/:id', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getCategoryProfileById);
router.get('/suppliers', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getSupplierDeepDive);
router.get('/handoff', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getHandoffPackages);
router.get('/export', requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT), exportSourcingReport);

router.get('/opportunity-ledger', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getOpportunityLedger);
router.get('/bridge', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getMathematicalBridge);
router.get('/canonical-input', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getCanonicalInput);
router.get('/top50-vendors', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getTop50Vendors);
router.get('/supplier-risk', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getSupplierRisk);
router.get('/po-consolidation', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getPoConsolidation);
router.get('/recurring-spend', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getRecurringSpend);
router.get('/line-items', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getLineItems);

export default router;

