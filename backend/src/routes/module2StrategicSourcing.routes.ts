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
  getTransactionAttributionLedger,
  getBridge as getMathematicalBridge,
  getCanonicalInput,
  getTop50Vendors,
  getSupplierRisk,
  getPoConsolidation,
  getRecurringSpend,
  getLineItems
} from '../controllers/module2Canonical.controller';
import {
  getDirectPriceImprovement,
  exportDirectPriceExcel
} from '../controllers/module2DirectPriceImprovement.controller';
import {
  getEAuctionDynamicBidding,
  exportEAuctionExcel,
  saveEAuctionPlanningAssumption
} from '../controllers/module2EAuction.controller';
import {
  getVendorConsolidation,
  exportVendorConsolidationExcel,
  updateMaterialMapping
} from '../controllers/module2VendorConsolidation.controller';
import { Module2VolumeAggregationController } from '../controllers/module2VolumeAggregation.controller';
import { Module2PaymentTermsController } from '../controllers/module2PaymentTerms.controller';
import { Module2CategorySpecialisationController } from '../controllers/module2CategorySpecialisation.controller';
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
router.get('/attribution-ledger', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getTransactionAttributionLedger);
router.get('/bridge', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getMathematicalBridge);
router.get('/canonical-input', requireFeature(FEATURE_PERMISSIONS.MODULE_2_SUMMARY), getCanonicalInput);
router.get('/top50-vendors', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getTop50Vendors);
router.get('/supplier-risk', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getSupplierRisk);
router.get('/po-consolidation', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getPoConsolidation);
router.get('/recurring-spend', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getRecurringSpend);
router.get('/line-items', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getLineItems);

// Lever 1: Direct Price Improvement
router.get('/direct-price-improvement', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getDirectPriceImprovement);
router.get('/direct-price-improvement/export-excel', requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT), exportDirectPriceExcel);

// Lever 2: E-Auction / Dynamic Bidding
router.get('/e-auction', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getEAuctionDynamicBidding);
router.post('/e-auction/planning-assumptions', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), saveEAuctionPlanningAssumption);
router.get('/e-auction/export-excel', requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT), exportEAuctionExcel);

// Lever 3: Vendor Base Consolidation
router.get('/vendor-consolidation', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), getVendorConsolidation);
router.post('/vendor-consolidation/mappings/update', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), updateMaterialMapping);
router.get('/vendor-consolidation/export-excel', requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT), exportVendorConsolidationExcel);

// Lever 4: Volume Aggregation
router.get('/volume-aggregation', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), Module2VolumeAggregationController.getVolumeAggregation);
router.get('/volume-aggregation/export-excel', requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT), Module2VolumeAggregationController.exportExcel);

// Lever 5: Payment Terms Optimisation
router.get('/payment-terms', requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL), Module2PaymentTermsController.getPaymentTerms);
router.get('/payment-terms/export-excel', requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT), Module2PaymentTermsController.exportExcel);

// Lever 6: Category Specialisation
router.get(
  '/category-specialisation',
  requireFeature(FEATURE_PERMISSIONS.MODULE_2_FULL),
  Module2CategorySpecialisationController.getCategorySpecialisation
);
router.get(
  '/category-specialisation/export-excel',
  requireFeature(FEATURE_PERMISSIONS.DETAILED_DATA_EXPORT),
  Module2CategorySpecialisationController.exportExcel
);

export default router;



