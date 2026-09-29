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

const router = Router();

router.get('/dashboard', getDashboardSummary);
router.get('/categories', getCategoryProfiles);
router.get('/category/:id', getCategoryProfileById);
router.get('/suppliers', getSupplierDeepDive);
router.get('/handoff', getHandoffPackages);
router.get('/export', exportSourcingReport);

export default router;
