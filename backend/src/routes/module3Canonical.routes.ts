/**
 * Module 3 PCBI Canonical Routes
 */

import { Router } from 'express';
import { module3CanonicalController } from '../controllers/module3Canonical.controller';

const router = Router();

router.get('/audit-report', (req, res) => module3CanonicalController.getAuditReport(req, res));
router.get('/spend-reconciliation', (req, res) => module3CanonicalController.getSpendReconciliation(req, res));
router.get('/independent-audit', (req, res) => module3CanonicalController.getIndependentAudit(req, res));
router.get('/test-matrix', (req, res) => module3CanonicalController.getTestMatrix(req, res));
router.get('/evidence-workbook', (req, res) => module3CanonicalController.downloadEvidenceWorkbook(req, res));

export default router;
