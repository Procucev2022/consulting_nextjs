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
router.get('/benchmark-requirements', (req, res) => module3CanonicalController.getBenchmarkRequirements(req, res));
router.get('/mappings', (req, res) => module3CanonicalController.getMaterialMappings(req, res));
router.post('/mappings/approval', (req, res) => module3CanonicalController.updateMappingApproval(req, res));
router.post('/mappings/propose', (req, res) => module3CanonicalController.proposeMaterialMapping(req, res));
router.get('/coverage-summary', (req, res) => module3CanonicalController.getCoverageSummary(req, res));
router.get('/coverage-reconciliation', (req, res) => module3CanonicalController.getReconciledCoverage(req, res));
router.get('/coverage-reconciliation/cross-phase', (req, res) =>
  module3CanonicalController.getCrossPhaseReconciliation(req, res)
);
router.get('/observations', (req, res) => module3CanonicalController.getAcquiredObservations(req, res));
router.get('/observations/quarantined', (req, res) => module3CanonicalController.getQuarantinedObservations(req, res));
router.post('/observations/validate', (req, res) => module3CanonicalController.validateCandidateObservation(req, res));
router.get('/gap-list', (req, res) => module3CanonicalController.getMissingIndexGapList(req, res));
router.get('/gap-list/export', (req, res) => module3CanonicalController.exportMissingIndexGapList(req, res));

export default router;
