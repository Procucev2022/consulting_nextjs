/**
 * PCBI Master Admin Controller
 */

import type { Request, Response } from 'express';
import { pcbiAdminService } from '../services/pcbiAdminService';
import { pcbiDynamicE2EService } from '../services/pcbiDynamicE2EService';
import { pcbiCustomerDataLoader } from '../services/pcbiCustomerDataLoader';
import { pcbiUploadPipelineService } from '../services/pcbiUploadPipelineService';
import { pcbiCatalogGovernanceService } from '../services/pcbiCatalogGovernanceService';
import { pcbiControlledValidationService } from '../services/pcbiControlledValidationService';
import { pcbiPilotExpansionService } from '../services/pcbiPilotExpansionService';
import { pcbiProductionPilotService } from '../services/pcbiProductionPilotService';
import { PCBIProductionReadyService } from '../services/pcbiProductionReadyService';
import { PCBICommodityCoverageService } from '../services/pcbiCommodityCoverageService';
import { PCBIPlatformIntegrationService } from '../services/pcbiPlatformIntegrationService';
import logger from '../utils/logger';

const pcbiProductionReadyService = PCBIProductionReadyService.getInstance();
const pcbiCommodityCoverageService = PCBICommodityCoverageService.getInstance();
const pcbiPlatformIntegrationService = PCBIPlatformIntegrationService.getInstance();
import type { PCBIImportPayload } from '../types/pcbiAdmin';
import type { PCBIExtractionFormat } from '../types/pcbiDynamicE2E';

export class PCBIAdminController {
  public async getVersions(_req: Request, res: Response): Promise<void> {
    try {
      const versions = pcbiAdminService.getVersions();
      const active = pcbiAdminService.getActivePublishedVersion();
      res.json({
        success: true,
        total: versions.length,
        active_version: active?.version || null,
        versions
      });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI versions', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI versions' });
    }
  }

  public async getVersion(req: Request, res: Response): Promise<void> {
    try {
      const { version } = req.params;
      const record = pcbiAdminService.getVersion(version);
      if (!record) {
        res.status(404).json({ success: false, message: `Version ${version} not found` });
        return;
      }
      res.json({ success: true, version: record });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI version details', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI version details' });
    }
  }

  public async importMaster(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as PCBIImportPayload;
      if (!payload?.file_name) {
        res.status(400).json({ success: false, message: 'Invalid PCBI import payload: file_name is required' });
        return;
      }

      const result = await pcbiAdminService.importMaster(payload);
      res.status(201).json(result);
    } catch (err: unknown) {
      logger.error('Failed to import PCBI Master', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to import PCBI Master dataset' });
    }
  }

  public async publishVersion(req: Request, res: Response): Promise<void> {
    try {
      const version = req.params.version || (req.body?.version as string);
      const publishedBy = (req.body?.published_by as string) || 'Admin';

      const result = await pcbiAdminService.publishVersion(version, publishedBy);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Failed to publish PCBI version', { error: msg });
      res.status(400).json({ success: false, message: msg });
    }
  }

  public async getValidationReport(req: Request, res: Response): Promise<void> {
    try {
      const { version } = req.params;
      const report = pcbiAdminService.getValidationReport(version);
      if (!report) {
        res.status(404).json({ success: false, message: `Validation report for version ${version} not found` });
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="PCBI_Validation_Report_${version}.json"`);
      res.send(report);
    } catch (err: unknown) {
      logger.error('Failed to get validation report', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve validation report' });
    }
  }

  public async getGapMatrix(_req: Request, res: Response): Promise<void> {
    try {
      const matrix = pcbiAdminService.getGapMatrix();
      res.json({
        success: true,
        total: matrix.length,
        matrix
      });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI Gap Matrix', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI Gap Matrix' });
    }
  }

  public async getSyntheticQATests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiAdminService.getSyntheticQATestResults();
      const allPassed = tests.every((t) => t.passed);
      res.json({
        success: true,
        total: tests.length,
        all_passed: allPassed,
        tests
      });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI Synthetic QA Test Results', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve QA test results' });
    }
  }

  public async executePreviewSandbox(_req: Request, res: Response): Promise<void> {
    try {
      const safetyRecord = pcbiAdminService.runPreviewSandbox();
      res.json({
        success: true,
        safety_record: safetyRecord
      });
    } catch (err: unknown) {
      logger.error('Failed to execute preview sandbox', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to execute preview sandbox' });
    }
  }

  public async getE2ESuite(_req: Request, res: Response): Promise<void> {
    try {
      const suiteResult = pcbiDynamicE2EService.executeFullE2ESuite();
      res.json({
        success: true,
        ...suiteResult
      });
    } catch (err: unknown) {
      logger.error('Failed to execute E2E suite', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to execute E2E suite' });
    }
  }

  public async getE2EGapAlerts(_req: Request, res: Response): Promise<void> {
    try {
      const alerts = pcbiCustomerDataLoader.generateGapAlerts();
      res.json({
        success: true,
        total: alerts.length,
        alerts
      });
    } catch (err: unknown) {
      logger.error('Failed to get E2E gap alerts', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to get E2E gap alerts' });
    }
  }

  public async executeDynamicUpload(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, format, rawContent } = req.body || {};
      const result = pcbiUploadPipelineService.executeUploadExtractionPipeline({
        fileName: fileName || 'PCBI_SOURCE_FEED.xlsx',
        format: (format as PCBIExtractionFormat) || 'XLSX',
        rawContent
      });
      res.json({
        success: true,
        result
      });
    } catch (err: unknown) {
      logger.error('Failed to execute dynamic upload pipeline', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Dynamic upload pipeline failed' });
    }
  }

  public async getFrequencyTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiUploadPipelineService.runFrequencyNormalizationTests();
      res.json({
        success: true,
        total: tests.length,
        tests
      });
    } catch (err: unknown) {
      logger.error('Failed to get frequency normalization tests', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to get frequency normalization tests' });
    }
  }

  public async executeAdminGate(req: Request, res: Response): Promise<void> {
    try {
      const { adminUser, action, sourceChecksum, methodologyId, version, changeReason } = req.body || {};
      const audit = pcbiCatalogGovernanceService.executeAdminConfirmationGate({
        adminUser: adminUser || 'Sriman Admin',
        action: action === 'APPROVE' ? 'APPROVE' : 'REJECT',
        sourceChecksum: sourceChecksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        methodologyId: methodologyId || 'METH-UNIT-SCALE-1000',
        version: version || 'V1.4',
        changeReason: changeReason || 'Administrator certified complete historical series'
      });
      res.json({
        success: true,
        audit
      });
    } catch (err: unknown) {
      logger.error('Failed to execute admin gate', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to execute admin gate' });
    }
  }

  public async getCatalogOperations(_req: Request, res: Response): Promise<void> {
    try {
      const operations = pcbiCatalogGovernanceService.testCatalogOperations();
      res.json({
        success: true,
        total: operations.length,
        operations
      });
    } catch (err: unknown) {
      logger.error('Failed to get catalog operations', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve catalog operations' });
    }
  }

  public async getRerunSimulation(_req: Request, res: Response): Promise<void> {
    try {
      const result = pcbiCatalogGovernanceService.executeRerunCustomerDataSimulation();
      res.json({
        success: true,
        result
      });
    } catch (err: unknown) {
      logger.error('Failed to get rerun simulation', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve rerun simulation' });
    }
  }

  public async getMismatchTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiCatalogGovernanceService.runMismatchDetectionTests();
      res.json({
        success: true,
        total: tests.length,
        all_passed: tests.every((t) => t.passed && t.benchmarkBlocked),
        tests
      });
    } catch (err: unknown) {
      logger.error('Failed to get mismatch tests', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve mismatch tests' });
    }
  }

  // Phase 1: Pre-Flight Audit
  public async getControlledPreflight(_req: Request, res: Response): Promise<void> {
    try {
      const preflight = pcbiControlledValidationService.getDatasetPreflight();
      res.json({ success: true, preflight });
    } catch (err: unknown) {
      logger.error('Failed to get controlled preflight', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve preflight audit' });
    }
  }

  // Phase 2: Controlled 12-Series
  public async getControlled12Series(_req: Request, res: Response): Promise<void> {
    try {
      const series = pcbiControlledValidationService.getControlled12Series();
      res.json({ success: true, total: series.length, series });
    } catch (err: unknown) {
      logger.error('Failed to get controlled 12-series', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve controlled 12-series' });
    }
  }

  // Phase 3 & 4: Observations & Standardization
  public async getControlledObservationsAndTransformations(_req: Request, res: Response): Promise<void> {
    try {
      const observations = pcbiControlledValidationService.getRawSourceObservations();
      const transformations = pcbiControlledValidationService.getStandardizationTransformations();
      res.json({ success: true, observations, transformations });
    } catch (err: unknown) {
      logger.error('Failed to get observations/transformations', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve observations and transformations' });
    }
  }

  // Phase 5 & 6: Calculations & Base-Period Validations
  public async getControlledCalculations(_req: Request, res: Response): Promise<void> {
    try {
      const calculations = pcbiControlledValidationService.calculateEligiblePCBI();
      const basePeriodValidations = pcbiControlledValidationService.validateBasePeriods();
      res.json({ success: true, calculations, basePeriodValidations });
    } catch (err: unknown) {
      logger.error('Failed to get controlled calculations', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve controlled calculations' });
    }
  }

  // Phase 7: Negative Tests
  public async getControlledNegativeTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiControlledValidationService.executeNegativeTests();
      res.json({
        success: true,
        total: tests.length,
        all_passed: tests.every((t) => t.passed && !t.pcbiGenerated),
        tests
      });
    } catch (err: unknown) {
      logger.error('Failed to get controlled negative tests', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve negative tests' });
    }
  }

  // Phase 8: Analytical Preview
  public async getControlledAnalyticalPreview(_req: Request, res: Response): Promise<void> {
    try {
      const preview = pcbiControlledValidationService.generateAnalyticalPreview();
      res.json({ success: true, preview });
    } catch (err: unknown) {
      logger.error('Failed to get analytical preview', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve analytical preview' });
    }
  }

  // Phase 10: Summary Report
  public async getControlledValidationSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = pcbiControlledValidationService.generateValidationSummary();
      res.json({ success: true, summary });
    } catch (err: unknown) {
      logger.error('Failed to get controlled validation summary', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve validation summary' });
    }
  }

  // PCBI V1.6: Pilot Finalization & Dynamic Expansion Endpoints
  public async getPilotGapMatrix(_req: Request, res: Response): Promise<void> {
    try {
      const matrix = pcbiPilotExpansionService.getLiveCustomerGapMatrix();
      res.json({ success: true, count: matrix.length, matrix });
    } catch (err: unknown) {
      logger.error('Failed to get pilot customer gap matrix', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve gap matrix' });
    }
  }

  public async getPilotDashboardMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = pcbiPilotExpansionService.getPilotDashboardMetrics();
      res.json({ success: true, metrics });
    } catch (err: unknown) {
      logger.error('Failed to get pilot dashboard metrics', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics' });
    }
  }

  public async getPilotAnalyticalPreview(_req: Request, res: Response): Promise<void> {
    try {
      const preview = pcbiPilotExpansionService.getNormalizedAnalyticalPreview();
      res.json({ success: true, preview });
    } catch (err: unknown) {
      logger.error('Failed to get pilot analytical preview', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve analytical preview' });
    }
  }

  public async detectUploadFile(req: Request, res: Response): Promise<void> {
    try {
      const { format, fileName, content } = req.body;
      const detected = pcbiPilotExpansionService.detectUploadedFile(format, fileName, content);
      res.json({ success: true, detected });
    } catch (err: unknown) {
      logger.error('Failed to detect uploaded file', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Detection failed' });
    }
  }

  public async executeCatalogAction(req: Request, res: Response): Promise<void> {
    try {
      const { action, payload } = req.body;
      const result = pcbiPilotExpansionService.manageCatalog(action, payload || {});
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to execute catalog action', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Catalog action failed' });
    }
  }

  public async recalculateIsolatedCommodity(req: Request, res: Response): Promise<void> {
    try {
      const { commodityId } = req.params;
      const result = pcbiPilotExpansionService.recalculateTargetedCommodity(commodityId);
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to recalculate isolated commodity', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Recalculation failed' });
    }
  }

  public async executeProductAcceptanceTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiPilotExpansionService.executeProductAcceptanceTests();
      res.json({
        success: true,
        total: tests.length,
        allPassed: tests.every((t) => t.passed),
        tests
      });
    } catch (err: unknown) {
      logger.error('Failed to execute product acceptance tests', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Tests execution failed' });
    }
  }

  public async getControlledPilotReadiness(_req: Request, res: Response): Promise<void> {
    try {
      const readiness = pcbiPilotExpansionService.getControlledPilotReadiness();
      res.json({ success: true, readiness });
    } catch (err: unknown) {
      logger.error('Failed to get controlled pilot readiness', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Readiness evaluation failed' });
    }
  }

  // PCBI V1.7: Production Pilot Activation & Dynamic Library Endpoints
  public async getProductionPilotDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const dashboard = pcbiProductionPilotService.getCoverageDashboardMetrics();
      res.json({ success: true, dashboard });
    } catch (err: unknown) {
      logger.error('Failed to get production pilot coverage dashboard', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve coverage dashboard' });
    }
  }

  public async getHighImpactGaps(req: Request, res: Response): Promise<void> {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;
      const alerts = pcbiProductionPilotService.getHighImpactGapAlerts(threshold);
      res.json({ success: true, count: alerts.length, alerts });
    } catch (err: unknown) {
      logger.error('Failed to get high impact gap alerts', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve high-impact alerts' });
    }
  }

  public async getDataConsistencyCheck(_req: Request, res: Response): Promise<void> {
    try {
      const check = pcbiProductionPilotService.performDataConsistencyCheck();
      res.json({ success: true, check });
    } catch (err: unknown) {
      logger.error('Failed to perform data consistency check', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to perform consistency check' });
    }
  }

  public async detectUniversalMapping(req: Request, res: Response): Promise<void> {
    try {
      const { format, fileName, unmappedHeaders } = req.body;
      const mapping = pcbiProductionPilotService.detectUniversalFile(format, fileName, unmappedHeaders);
      res.json({ success: true, mapping });
    } catch (err: unknown) {
      logger.error('Failed to detect universal file mapping', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to detect universal mapping' });
    }
  }

  public async auditDuplicateObservations(req: Request, res: Response): Promise<void> {
    try {
      const { seriesId, observations, resolution } = req.body;
      const duplicates = pcbiProductionPilotService.checkDuplicateObservations(seriesId, observations || [], resolution);
      res.json({ success: true, duplicatesCount: duplicates.length, duplicates });
    } catch (err: unknown) {
      logger.error('Failed to audit duplicate observations', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to audit duplicates' });
    }
  }

  public async manageDynamicCatalogV17(req: Request, res: Response): Promise<void> {
    try {
      const { action, payload } = req.body;
      const result = pcbiProductionPilotService.manageDynamicCatalog(action, payload || {});
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to manage dynamic catalog V1.7', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Catalog management failed' });
    }
  }

  public async recalculateTargetedSeries(req: Request, res: Response): Promise<void> {
    try {
      const { seriesId } = req.params;
      const result = pcbiProductionPilotService.recalculateTargetedImpact(seriesId);
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to execute targeted recalculation', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Targeted recalculation failed' });
    }
  }

  public async executeProductionPilotAcceptanceTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiProductionPilotService.executeAcceptanceTests();
      res.json({
        success: true,
        total: tests.length,
        allPassed: tests.every((t) => t.passed),
        tests
      });
    } catch (err: unknown) {
      logger.error('Failed to execute production pilot acceptance tests', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Tests execution failed' });
    }
  }

  public async getProductionPilotReleaseReport(_req: Request, res: Response): Promise<void> {
    try {
      const report = pcbiProductionPilotService.getProductionPilotReleaseReport();
      res.json({ success: true, report });
    } catch (err: unknown) {
      logger.error('Failed to get production pilot release report', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve release report' });
    }
  }

  public async getDashboardV16(_req: Request, res: Response): Promise<void> {
    try {
      const dashboard = pcbiProductionReadyService.getDashboardV16();
      res.json({ success: true, dashboard });
    } catch (err: unknown) {
      logger.error('Failed to get V1.6 dashboard', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve dashboard' });
    }
  }

  public async getCustomerDataMismatchesV16(_req: Request, res: Response): Promise<void> {
    try {
      const mismatches = pcbiProductionReadyService.getCustomerDataMismatches();
      res.json({ success: true, total: mismatches.length, mismatches });
    } catch (err: unknown) {
      logger.error('Failed to get customer data mismatches V1.6', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve mismatches' });
    }
  }

  public async getHighImpactAlertsV16(_req: Request, res: Response): Promise<void> {
    try {
      const alerts = pcbiProductionReadyService.getHighImpactGapAlerts();
      res.json({ success: true, total: alerts.length, alerts });
    } catch (err: unknown) {
      logger.error('Failed to get high-impact alerts V1.6', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve high-impact alerts' });
    }
  }

  public async uploadAndNormalizeV16(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, fileContent, format } = req.body;
      const result = pcbiProductionReadyService.uploadAndNormalize({
        fileName: fileName || 'dataset.xlsx',
        fileContent: fileContent || '',
        format: format || 'XLSX'
      });
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to upload and normalize V1.6', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Upload normalization failed' });
    }
  }

  public async executeVersionControlV16(req: Request, res: Response): Promise<void> {
    try {
      const { operation, pcbiId, newVersion, targetVersionId, approvedBy, changeReason } = req.body;
      const result = pcbiProductionReadyService.executeVersionControl({
        operation,
        pcbiId,
        newVersion,
        targetVersionId,
        approvedBy: approvedBy || 'ADMIN_SUPERVISOR',
        changeReason: changeReason || 'Standard version action'
      });
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to execute version control V1.6', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Version control operation failed' });
    }
  }

  public async approveAndRerunV16(req: Request, res: Response): Promise<void> {
    try {
      const { pcbiId, approvedBy, approvalId } = req.body;
      const result = pcbiProductionReadyService.approveAndRerun({
        pcbiId: pcbiId || 'PCBI-IND-MET-FMO-001',
        approvedBy: approvedBy || 'ADMIN_SUPERVISOR',
        approvalId: approvalId || `APP-${Date.now()}`
      });
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to execute approve and rerun V1.6', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Approve and rerun failed' });
    }
  }

  public async runAcceptanceTestsV16(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiProductionReadyService.runAcceptanceTests();
      res.json({
        success: true,
        total: tests.length,
        allPassed: tests.every((t) => t.passed),
        tests
      });
    } catch (err: unknown) {
      logger.error('Failed to run acceptance tests V1.6', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Acceptance tests execution failed' });
    }
  }

  public async getProductionReadySummaryV16(_req: Request, res: Response): Promise<void> {
    try {
      const summary = pcbiProductionReadyService.getProductionReadySummary();
      res.json({ success: true, summary });
    } catch (err: unknown) {
      logger.error('Failed to get production ready summary V1.6', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve summary' });
    }
  }

  public async getCoverageGapQueue(_req: Request, res: Response): Promise<void> {
    try {
      const queue = pcbiCommodityCoverageService.getGapQueue();
      res.json({ success: true, total: queue.length, queue });
    } catch (err: unknown) {
      logger.error('Failed to get coverage gap queue', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve gap queue' });
    }
  }

  public async overrideCoveragePriority(req: Request, res: Response): Promise<void> {
    try {
      const { commodityId, newPriority } = req.body;
      const updated = pcbiCommodityCoverageService.overridePriority(commodityId, newPriority);
      res.json({ success: true, item: updated });
    } catch (err: unknown) {
      logger.error('Failed to override coverage priority', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Priority override failed' });
    }
  }

  public async getCommodityMultiSources(req: Request, res: Response): Promise<void> {
    try {
      const { commodityId } = req.params;
      const sources = pcbiCommodityCoverageService.getMultiSources(commodityId);
      res.json({ success: true, commodityId, total: sources.length, sources });
    } catch (err: unknown) {
      logger.error('Failed to get multi-sources', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve sources' });
    }
  }

  public async addCommoditySourceCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { commodityId } = req.params;
      const source = pcbiCommodityCoverageService.addSourceCandidate(commodityId, req.body);
      res.json({ success: true, commodityId, source });
    } catch (err: unknown) {
      logger.error('Failed to add source candidate', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to add source candidate' });
    }
  }

  public async compareCommoditySources(req: Request, res: Response): Promise<void> {
    try {
      const { commodityId } = req.params;
      const { period } = req.query;
      const comparison = pcbiCommodityCoverageService.compareSources(
        commodityId,
        typeof period === 'string' ? period : undefined
      );
      res.json({ success: true, comparison });
    } catch (err: unknown) {
      logger.error('Failed to compare sources', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to compare sources' });
    }
  }

  public async getCommodityCoverageDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const dashboard = pcbiCommodityCoverageService.getCoverageDashboard();
      res.json({ success: true, dashboard });
    } catch (err: unknown) {
      logger.error('Failed to get coverage dashboard', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve coverage dashboard' });
    }
  }

  public async validateUnitCurrencyDisplayQA(req: Request, res: Response): Promise<void> {
    try {
      const { customerValue, customerUnit, customerCurrency, pcbiValue, pcbiUnit, pcbiCurrency } = req.body;
      const qaResult = pcbiCommodityCoverageService.validateUnitCurrencyDisplay(
        Number(customerValue) || 0,
        customerUnit || 'MT',
        customerCurrency || 'INR',
        Number(pcbiValue) || 0,
        pcbiUnit || 'MT',
        pcbiCurrency || 'INR'
      );
      res.json({ success: true, qaResult });
    } catch (err: unknown) {
      logger.error('Failed to validate unit currency display', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Display QA validation failed' });
    }
  }

  public async generateCommodityCoverageMasterExcel(_req: Request, res: Response): Promise<void> {
    try {
      const filePath = pcbiCommodityCoverageService.generateMasterExcel();
      res.json({ success: true, filePath, message: 'PCBI_COMMODITY_COVERAGE_MASTER.xlsx generated' });
    } catch (err: unknown) {
      logger.error('Failed to generate master Excel', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to generate master Excel' });
    }
  }

  public async checkFrequencyCompatibility(req: Request, res: Response): Promise<void> {
    try {
      const { sourceFreq, requiredFreq, availableHistory, missingPeriod } = req.body;
      const result = pcbiCommodityCoverageService.checkFrequencyCompatibility(
        sourceFreq,
        requiredFreq,
        availableHistory,
        missingPeriod
      );
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to check frequency compatibility', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to check frequency compatibility' });
    }
  }

  public async validateDynamicExtraction(req: Request, res: Response): Promise<void> {
    try {
      const result = pcbiCommodityCoverageService.validateDynamicExtraction(req.body);
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to validate dynamic extraction', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to validate dynamic extraction' });
    }
  }

  public async getPlatformPreProductionAudit(_req: Request, res: Response): Promise<void> {
    try {
      const audit = pcbiPlatformIntegrationService.getPreProductionAuditReport();
      res.json({ success: true, audit });
    } catch (err: unknown) {
      logger.error('Failed to get platform audit', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve pre-production audit' });
    }
  }

  public async getPlatformDeploymentChecklist(_req: Request, res: Response): Promise<void> {
    try {
      const checklist = pcbiPlatformIntegrationService.getDeploymentChecklist();
      res.json({ success: true, checklist });
    } catch (err: unknown) {
      logger.error('Failed to get deployment checklist', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve deployment checklist' });
    }
  }

  public async runPlatformContinuityReconciliation(_req: Request, res: Response): Promise<void> {
    try {
      const reconciliation = pcbiPlatformIntegrationService.runContinuityReconciliation();
      res.json({ success: true, reconciliation });
    } catch (err: unknown) {
      logger.error('Failed to run reconciliation', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Reconciliation failed' });
    }
  }

  public async evaluatePlatformModule4Opportunity(req: Request, res: Response): Promise<void> {
    try {
      const result = pcbiPlatformIntegrationService.evaluateModule4Opportunity(req.body);
      res.json({ success: true, result });
    } catch (err: unknown) {
      logger.error('Failed to evaluate opportunity', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Opportunity evaluation failed' });
    }
  }

  public async runPlatformControlledPortfolio(_req: Request, res: Response): Promise<void> {
    try {
      const portfolio = pcbiPlatformIntegrationService.runControlledTestPortfolio();
      res.json({ success: true, portfolio });
    } catch (err: unknown) {
      logger.error('Failed to run portfolio', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Portfolio test failed' });
    }
  }

  public async runPlatformAcceptanceTests(_req: Request, res: Response): Promise<void> {
    try {
      const tests = pcbiPlatformIntegrationService.runTwentyAcceptanceTests();
      res.json({ success: true, total: tests.length, tests });
    } catch (err: unknown) {
      logger.error('Failed to run acceptance tests', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Acceptance tests failed' });
    }
  }

  public async getPlatformManagementDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const dashboard = pcbiPlatformIntegrationService.getPlatformManagementDashboardMetrics();
      res.json({ success: true, dashboard });
    } catch (err: unknown) {
      logger.error('Failed to get management dashboard', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve management dashboard' });
    }
  }

  public async generatePlatformAuditJson(_req: Request, res: Response): Promise<void> {
    try {
      const filePath = pcbiPlatformIntegrationService.generateAuditJson();
      res.json({ success: true, filePath, message: 'PCBI_V1_7_FULL_PLATFORM_AUDIT.json generated' });
    } catch (err: unknown) {
      logger.error('Failed to generate audit JSON', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to generate audit JSON' });
    }
  }
}

export const pcbiAdminController = new PCBIAdminController();
