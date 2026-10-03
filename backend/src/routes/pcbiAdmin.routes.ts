/**
 * PCBI Master Admin Routes
 */

import { Router } from 'express';
import { pcbiAdminController } from '../controllers/pcbiAdmin.controller';

const router = Router();

// Version History & Queries
router.get('/versions', (req, res) => pcbiAdminController.getVersions(req, res));
router.get('/versions/:version', (req, res) => pcbiAdminController.getVersion(req, res));

// Import Master Dataset
router.post('/import', (req, res) => pcbiAdminController.importMaster(req, res));

// Publish Version to Production
router.post('/publish', (req, res) => pcbiAdminController.publishVersion(req, res));
router.post('/publish/:version', (req, res) => pcbiAdminController.publishVersion(req, res));

// Download Validation Report
router.get('/validation-report/:version', (req, res) => pcbiAdminController.getValidationReport(req, res));
router.get('/reports/validation/:version', (req, res) => pcbiAdminController.getValidationReport(req, res));

// Architecture QA & Gap Governance (PCBI V1.3.1)
router.get('/gap-matrix', (req, res) => pcbiAdminController.getGapMatrix(req, res));
router.get('/qa-tests', (req, res) => pcbiAdminController.getSyntheticQATests(req, res));
router.post('/preview-sandbox', (req, res) => pcbiAdminController.executePreviewSandbox(req, res));

// End-to-End Dynamic PCBI Testing & Governance (PCBI V1.4)
router.get('/e2e/suite', (req, res) => pcbiAdminController.getE2ESuite(req, res));
router.get('/e2e/gap-alerts', (req, res) => pcbiAdminController.getE2EGapAlerts(req, res));
router.post('/e2e/upload', (req, res) => pcbiAdminController.executeDynamicUpload(req, res));
router.get('/e2e/frequency-tests', (req, res) => pcbiAdminController.getFrequencyTests(req, res));
router.post('/e2e/admin-gate', (req, res) => pcbiAdminController.executeAdminGate(req, res));
router.get('/e2e/catalog-operations', (req, res) => pcbiAdminController.getCatalogOperations(req, res));
router.get('/e2e/rerun-simulation', (req, res) => pcbiAdminController.getRerunSimulation(req, res));
router.get('/e2e/mismatch-tests', (req, res) => pcbiAdminController.getMismatchTests(req, res));

// Controlled Benchmark Engine Validation (PCBI V1.5)
router.get('/controlled/preflight', (req, res) => pcbiAdminController.getControlledPreflight(req, res));
router.get('/controlled/12-series', (req, res) => pcbiAdminController.getControlled12Series(req, res));
router.get('/controlled/observations', (req, res) => pcbiAdminController.getControlledObservationsAndTransformations(req, res));
router.get('/controlled/calculations', (req, res) => pcbiAdminController.getControlledCalculations(req, res));
router.get('/controlled/negative-tests', (req, res) => pcbiAdminController.getControlledNegativeTests(req, res));
router.get('/controlled/analytical-preview', (req, res) => pcbiAdminController.getControlledAnalyticalPreview(req, res));
router.get('/controlled/summary', (req, res) => pcbiAdminController.getControlledValidationSummary(req, res));

// Controlled Pilot Finalization & Dynamic Commodity Expansion (PCBI V1.6)
router.get('/pilot/gap-matrix', (req, res) => pcbiAdminController.getPilotGapMatrix(req, res));
router.get('/pilot/dashboard', (req, res) => pcbiAdminController.getPilotDashboardMetrics(req, res));
router.get('/pilot/analytical-preview', (req, res) => pcbiAdminController.getPilotAnalyticalPreview(req, res));
router.post('/pilot/detect-upload', (req, res) => pcbiAdminController.detectUploadFile(req, res));
router.post('/pilot/catalog-action', (req, res) => pcbiAdminController.executeCatalogAction(req, res));
router.post('/pilot/recalculate/:commodityId', (req, res) => pcbiAdminController.recalculateIsolatedCommodity(req, res));
router.get('/pilot/acceptance-tests', (req, res) => pcbiAdminController.executeProductAcceptanceTests(req, res));
router.get('/pilot/readiness', (req, res) => pcbiAdminController.getControlledPilotReadiness(req, res));

// Production Pilot Activation & Dynamic PCBI Library (PCBI V1.7)
router.get('/v17/dashboard', (req, res) => pcbiAdminController.getProductionPilotDashboard(req, res));
router.get('/v17/high-impact-gaps', (req, res) => pcbiAdminController.getHighImpactGaps(req, res));
router.get('/v17/data-consistency', (req, res) => pcbiAdminController.getDataConsistencyCheck(req, res));
router.post('/v17/detect-mapping', (req, res) => pcbiAdminController.detectUniversalMapping(req, res));
router.post('/v17/audit-duplicates', (req, res) => pcbiAdminController.auditDuplicateObservations(req, res));
router.post('/v17/manage-catalog', (req, res) => pcbiAdminController.manageDynamicCatalogV17(req, res));
router.post('/v17/recalculate/:seriesId', (req, res) => pcbiAdminController.recalculateTargetedSeries(req, res));
router.get('/v17/acceptance-tests', (req, res) => pcbiAdminController.executeProductionPilotAcceptanceTests(req, res));
router.get('/v17/release-report', (req, res) => pcbiAdminController.getProductionPilotReleaseReport(req, res));

// Production-Ready Dynamic PCBI Architecture (PCBI V1.6 Productionization)
router.get('/v16/dashboard', (req, res) => pcbiAdminController.getDashboardV16(req, res));
router.get('/v16/mismatches', (req, res) => pcbiAdminController.getCustomerDataMismatchesV16(req, res));
router.get('/v16/high-impact-gaps', (req, res) => pcbiAdminController.getHighImpactAlertsV16(req, res));
router.post('/v16/upload-and-normalize', (req, res) => pcbiAdminController.uploadAndNormalizeV16(req, res));
router.post('/v16/version-control', (req, res) => pcbiAdminController.executeVersionControlV16(req, res));
router.post('/v16/approve-and-rerun', (req, res) => pcbiAdminController.approveAndRerunV16(req, res));
router.get('/v16/acceptance-tests', (req, res) => pcbiAdminController.runAcceptanceTestsV16(req, res));
router.get('/v16/production-readiness', (req, res) => pcbiAdminController.getProductionReadySummaryV16(req, res));

// PCBI Commodity Coverage Expansion (Prompt 202 & 203)
router.get('/coverage/queue', (req, res) => pcbiAdminController.getCoverageGapQueue(req, res));
router.post('/coverage/queue/override-priority', (req, res) => pcbiAdminController.overrideCoveragePriority(req, res));
router.get('/coverage/sources/:commodityId', (req, res) => pcbiAdminController.getCommodityMultiSources(req, res));
router.post('/coverage/sources/:commodityId', (req, res) => pcbiAdminController.addCommoditySourceCandidate(req, res));
router.get('/coverage/compare-sources/:commodityId', (req, res) => pcbiAdminController.compareCommoditySources(req, res));
router.get('/coverage/dashboard', (req, res) => pcbiAdminController.getCommodityCoverageDashboard(req, res));
router.post('/coverage/validate-display', (req, res) => pcbiAdminController.validateUnitCurrencyDisplayQA(req, res));
router.post('/coverage/generate-master-excel', (req, res) =>
  pcbiAdminController.generateCommodityCoverageMasterExcel(req, res)
);
router.post('/coverage/check-frequency', (req, res) => pcbiAdminController.checkFrequencyCompatibility(req, res));
router.post('/coverage/validate-extraction', (req, res) => pcbiAdminController.validateDynamicExtraction(req, res));

// PCBI Full Platform Productionization (Prompt 204: Module 1 -> 2 -> 3 -> 4)
router.get('/platform/audit', (req, res) => pcbiAdminController.getPlatformPreProductionAudit(req, res));
router.get('/platform/checklist', (req, res) => pcbiAdminController.getPlatformDeploymentChecklist(req, res));
router.get('/platform/reconciliation', (req, res) => pcbiAdminController.runPlatformContinuityReconciliation(req, res));
router.post('/platform/evaluate-opportunity', (req, res) =>
  pcbiAdminController.evaluatePlatformModule4Opportunity(req, res)
);
router.get('/platform/portfolio', (req, res) => pcbiAdminController.runPlatformControlledPortfolio(req, res));
router.get('/platform/acceptance-tests', (req, res) => pcbiAdminController.runPlatformAcceptanceTests(req, res));
router.get('/platform/dashboard', (req, res) => pcbiAdminController.getPlatformManagementDashboard(req, res));
router.post('/platform/generate-audit-json', (req, res) => pcbiAdminController.generatePlatformAuditJson(req, res));

// PCBI Commodity Data Lab (Prompt 218: Dedicated Commodity Research Workspace)
router.get('/data-lab/dashboard', (req, res) => pcbiAdminController.getCommodityDataLabDashboard(req, res));
router.get('/data-lab/queue', (req, res) => pcbiAdminController.getCommodityResearchQueue(req, res));
router.get('/data-lab/commodity/:pcbiId', (req, res) => pcbiAdminController.getCommodityWorkspaceDetail(req, res));
router.post('/data-lab/detect-domain', (req, res) => pcbiAdminController.detectUploadDomain(req, res));
router.post('/data-lab/upload-source', (req, res) => pcbiAdminController.uploadCommoditySource(req, res));
router.post('/data-lab/approve', (req, res) => pcbiAdminController.approveCommodityData(req, res));

export default router;

