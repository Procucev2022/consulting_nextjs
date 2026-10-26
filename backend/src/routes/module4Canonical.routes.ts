/**
 * Module 4 Savings Canonical Routes
 * Exposes authoritative audit endpoints, opportunity ledger, independent recalculation, and workbook download.
 */

import { Router } from 'express';
import { module4CanonicalController } from '../controllers/module4Canonical.controller';

const router = Router();

router.get('/audit-report', (req, res) => module4CanonicalController.getAuditReport(req, res));
router.get('/opportunity-ledger', (req, res) => module4CanonicalController.getOpportunityLedger(req, res));
router.get('/financial-bridge', (req, res) => module4CanonicalController.getFinancialBridge(req, res));
router.get('/independent-audit', (req, res) => module4CanonicalController.getIndependentAudit(req, res));
router.get('/test-matrix', (req, res) => module4CanonicalController.getTestMatrix(req, res));
router.get('/evidence-workbook', (req, res) => module4CanonicalController.downloadEvidenceWorkbook(req, res));
router.get('/transaction-lineage', (req, res) => module4CanonicalController.getTransactionLineage(req, res));
router.get('/transaction-lineage-tests', (req, res) => module4CanonicalController.getTransactionLineageTests(req, res));
router.get('/lineage-reconciliation', (req, res) => module4CanonicalController.getLineageSetReconciliation(req, res));
router.get('/lineage-contradiction-tests', (req, res) => module4CanonicalController.getLineageContradictionTests(req, res));

export default router;
