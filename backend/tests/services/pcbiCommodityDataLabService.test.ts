/**
 * PCBI Commodity Data Lab Service Tests
 * Validating the 10 Prompt 218 Acceptance Criteria:
 * 1. PCBI Master upload remains functional.
 * 2. Commodity Data Lab upload remains separate.
 * 3. Commodity upload is linked to the selected PCBI_ID.
 * 4. Multiple sources can coexist.
 * 5. No commodity research upload modifies PCBI Master automatically.
 * 6. No production PCBI write occurs before Admin approval.
 * 7. Approved data enters the existing dynamic PCBI catalog.
 * 8. Wrong file type/domain is detected and routed to the correct module.
 * 9. Existing PCBI Master records remain immutable.
 * 10. Existing Module 3 tests continue to pass.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  pcbiCommodityDataLabService,
  PCBICommodityDataLabService
} from '../../src/services/pcbiCommodityDataLabService';
import { pcbiAdminService } from '../../src/services/pcbiAdminService';
import { pcbiPilotExpansionService } from '../../src/services/pcbiPilotExpansionService';
import {
  COMMODITY_DATA_UPLOAD_BANNER,
  DOMAIN_ERROR_MESSAGES
} from '../../src/constants/pcbiCommodityDataLab';

describe('PCBICommodityDataLabService — Acceptance & Unit Tests', () => {
  beforeEach(() => {
    pcbiCommodityDataLabService.resetForTesting();
  });

  describe('Prompt 218 Acceptance Test 1: PCBI Master upload remains functional', () => {
    it('should keep existing PCBI Master service operational and independent', () => {
      const activeVersion = pcbiAdminService.getActivePublishedVersion();
      expect(activeVersion).toBeDefined();
      expect(activeVersion?.version).toBe('V1.0');
      expect(activeVersion?.status).toBe('PUBLISHED');

      const versions = pcbiAdminService.getVersions();
      expect(versions.length).toBeGreaterThan(0);
      expect(versions.some((v) => v.version === 'V1.0')).toBe(true);
    });
  });

  describe('Prompt 218 Acceptance Test 2: Commodity Data Lab upload remains separate', () => {
    it('should stage files in Data Lab without modifying PCBI Master datasets or versions', () => {
      const initialMasterCount = pcbiAdminService.getVersions().length;

      const stagedSource = pcbiCommodityDataLabService.uploadCommoditySource({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        seriesId: 'SER-IND-FEMO-65-M',
        sourceName: 'AIFAA Secondary Metal Circular',
        publisher: 'All India Ferro Alloy Association',
        documentName: 'AIFAA_FeMo65_Circular_Q1_2024.pdf',
        fileType: 'PDF',
        geography: 'India National',
        gradeSpecification: 'FeMo 65% Min',
        unit: 'INR/KG',
        currency: 'INR',
        frequency: 'MONTHLY'
      });

      expect(stagedSource).toBeDefined();
      expect(stagedSource.sourceId).toMatch(/^SRC-MET-FMO-\d+/);
      expect(stagedSource.approvalStatus).toBe('UNDER_REVIEW');

      // PCBI Master versions must remain completely untouched
      const postMasterCount = pcbiAdminService.getVersions().length;
      expect(postMasterCount).toBe(initialMasterCount);
    });
  });

  describe('Prompt 218 Acceptance Test 3: Commodity upload is linked to the selected PCBI_ID', () => {
    it('should automatically associate uploaded sources with COMMODITY_ID, PCBI_ID, and SERIES_ID', () => {
      const source = pcbiCommodityDataLabService.uploadCommoditySource({
        commodityId: 'COM-EQP-SLP',
        pcbiId: 'PCBI-IND-EQP-SLP-001',
        seriesId: 'SER-IND-EQP-SLP-M',
        sourceName: 'Slurry Pump OEM Index Quarterly',
        publisher: 'Indian Pump Manufacturers Association',
        documentName: 'IPMA_Slurry_Pumps_Pricing_2025.csv',
        fileType: 'CSV'
      });

      expect(source.documentName).toBe('IPMA_Slurry_Pumps_Pricing_2025.csv');
      const workspace = pcbiCommodityDataLabService.getCommodityWorkspace('PCBI-IND-EQP-SLP-001');
      expect(workspace.overview.commodityId).toBe('COM-EQP-SLP');
      expect(workspace.overview.pcbiId).toBe('PCBI-IND-EQP-SLP-001');
      expect(workspace.overview.seriesId).toBe('SER-IND-EQP-SLP-M');
      expect(workspace.sources.some((s) => s.documentName === 'IPMA_Slurry_Pumps_Pricing_2025.csv')).toBe(true);
    });
  });

  describe('Prompt 218 Acceptance Test 4: Multiple sources can coexist without overwriting', () => {
    it('should maintain multiple independent source records for the same commodity', () => {
      const workspaceBefore = pcbiCommodityDataLabService.getCommodityWorkspace('COM-MET-FMO');
      const initialSourcesCount = workspaceBefore.sources.length;
      expect(initialSourcesCount).toBeGreaterThanOrEqual(3);

      pcbiCommodityDataLabService.uploadCommoditySource({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        sourceName: 'Fourth Independent Market Source',
        publisher: 'Metal Bulletin Daily',
        documentName: 'MBD_Historical_FeMo.xlsx',
        fileType: 'XLSX'
      });

      const workspaceAfter = pcbiCommodityDataLabService.getCommodityWorkspace('COM-MET-FMO');
      expect(workspaceAfter.sources.length).toBe(initialSourcesCount + 1);

      // Verify all earlier sources still exist untouched
      expect(workspaceAfter.sources.some((s) => s.sourceId === 'SRC-FMO-MMR-01')).toBe(true);
      expect(workspaceAfter.sources.some((s) => s.sourceId === 'SRC-FMO-STEELMINT-02')).toBe(true);
      expect(workspaceAfter.sources.some((s) => s.sourceId === 'SRC-FMO-FASTMARKETS-03')).toBe(true);
    });
  });

  describe('Prompt 218 Acceptance Test 5: No commodity research upload modifies PCBI Master automatically', () => {
    it('should have zero writes to PCBI Master when commodity research files are uploaded', () => {
      const initialMaster = pcbiAdminService.getVersion('V1.0');

      pcbiCommodityDataLabService.uploadCommoditySource({
        commodityId: 'COM-MET-TCI',
        pcbiId: 'PCBI-IND-MET-TCI-001',
        sourceName: 'Carbide Tooling Research Pack',
        publisher: 'Tooling Digest India',
        documentName: 'Tooling_Digest_Inserts_2024.json',
        fileType: 'JSON'
      });

      const postMaster = pcbiAdminService.getVersion('V1.0');
      expect(postMaster).toEqual(initialMaster);
    });
  });

  describe('Prompt 218 Acceptance Test 6: No production PCBI write occurs before Admin approval', () => {
    it('should lock catalog promotion and maintain UNDER_REVIEW status until Admin approves', () => {
      const workspace = pcbiCommodityDataLabService.getCommodityWorkspace('COM-MET-FMO');
      expect(workspace.approvalPackage.approvalGateStatus).toBe('LOCKED_PENDING_REVIEW');
      expect(workspace.approvalPackage.canWriteToCatalog).toBe(false);

      const queueItem = pcbiCommodityDataLabService
        .getCommodityResearchQueue()
        .find((q) => q.commodityId === 'COM-MET-FMO');
      expect(queueItem?.currentStatus).toBe('PARTIAL_HISTORY');
    });
  });

  describe('Prompt 218 Acceptance Test 7: Approved data enters the existing dynamic PCBI catalog', () => {
    it('should promote commodity data into the dynamic catalog upon explicit Admin approval', () => {
      const approvalResult = pcbiCommodityDataLabService.approveCommodityData({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approverName: 'Sriman Lead Admin',
        comments: 'Verified dual source evidence and gap remediation plan'
      });

      expect(approvalResult.success).toBe(true);
      expect(approvalResult.approvalStatus).toBe('ADMIN_APPROVED');
      expect(approvalResult.catalogVersionCreated).toBe(true);
      expect(approvalResult.catalogVersionId).toBeDefined();

      const workspace = pcbiCommodityDataLabService.getCommodityWorkspace('COM-MET-FMO');
      expect(workspace.approvalPackage.approvalGateStatus).toBe('APPROVED_READY_FOR_CATALOG');
      expect(workspace.approvalPackage.canWriteToCatalog).toBe(true);
      expect(workspace.overview.currentStatus).toBe('PRODUCTION_READY');
    });

    it('should throw error when approving a non-existent commodity', () => {
      expect(() => {
        pcbiCommodityDataLabService.approveCommodityData({
          commodityId: 'NON_EXISTENT_ID',
          pcbiId: 'PCBI-NON-EXISTENT',
          approverName: 'Admin'
        });
      }).toThrowError('Commodity NON_EXISTENT_ID not found in research queue');
    });
  });

  describe('Prompt 218 Acceptance Test 8: Wrong file type/domain is detected and routed to correct module', () => {
    it('should detect Customer Purchase History in Commodity Data Lab and reject it', () => {
      const result = pcbiCommodityDataLabService.validateUploadDomain(
        'Customer_PO_History_FY2025.xlsx',
        'Line Item, Vendor Name, Purchase Order, Actual Price',
        'COMMODITY_DATA_LAB'
      );

      expect(result.detectedDomain).toBe('CUSTOMER_PURCHASE_HISTORY');
      expect(result.isAllowedInTarget).toBe(false);
      expect(result.errorMessage).toBe(DOMAIN_ERROR_MESSAGES.CUSTOMER_DATA_IN_DATA_LAB.title);
      expect(result.guidanceMessage).toBe(DOMAIN_ERROR_MESSAGES.CUSTOMER_DATA_IN_DATA_LAB.message);
    });

    it('should detect Commodity Research files uploaded to PCBI Master and reject them', () => {
      const result = pcbiCommodityDataLabService.validateUploadDomain(
        'Ferro_Molybdenum_Raw_Observations_Research.csv',
        'source_register, raw_observations, reference_trend',
        'PCBI_MASTER'
      );

      expect(result.detectedDomain).toBe('COMMODITY_RESEARCH_EVIDENCE');
      expect(result.isAllowedInTarget).toBe(false);
      expect(result.errorMessage).toBe(DOMAIN_ERROR_MESSAGES.COMMODITY_RESEARCH_IN_MASTER.title);
      expect(result.guidanceMessage).toBe(DOMAIN_ERROR_MESSAGES.COMMODITY_RESEARCH_IN_MASTER.message);
    });

    it('should detect PCBI Master files uploaded to Commodity Data Lab and route them to PCBI Master', () => {
      const result = pcbiCommodityDataLabService.validateUploadDomain(
        'PCBI_Master_Catalog_Definitions_V2.0.xlsx',
        'master_catalog, pcbi_master_version, constituent_weights',
        'COMMODITY_DATA_LAB'
      );

      expect(result.detectedDomain).toBe('PCBI_MASTER_SYSTEM_DATA');
      expect(result.isAllowedInTarget).toBe(false);
      expect(result.errorMessage).toBe(DOMAIN_ERROR_MESSAGES.MASTER_DATA_IN_DATA_LAB.title);
    });

    it('should allow customer data in Module 1 ingestion', () => {
      const result = pcbiCommodityDataLabService.validateUploadDomain(
        'Customer_PO_Transactions.xlsx',
        'PO Number, Actual Price, Vendor Name',
        'MODULE_1_INGESTION'
      );
      expect(result.isAllowedInTarget).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should allow commodity research in Commodity Data Lab', () => {
      const result = pcbiCommodityDataLabService.validateUploadDomain(
        'FeMo_Source_Register.csv',
        'raw_observations, source_register',
        'COMMODITY_DATA_LAB'
      );
      expect(result.isAllowedInTarget).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail fast when attempting to upload customer data file into Commodity Data Lab', () => {
      expect(() => {
        pcbiCommodityDataLabService.uploadCommoditySource({
          commodityId: 'COM-MET-FMO',
          pcbiId: 'PCBI-FEMO-65-001',
          sourceName: 'Attempted Customer File',
          publisher: 'Customer ERP',
          documentName: 'Client_Purchase_Order_History_2025.xlsx',
          fileType: 'XLSX'
        });
      }).toThrowError(/CUSTOMER DATA DETECTED/);
    });

    it('should throw error for unsupported upload format', () => {
      expect(() => {
        pcbiCommodityDataLabService.uploadCommoditySource({
          commodityId: 'COM-MET-FMO',
          pcbiId: 'PCBI-FEMO-65-001',
          sourceName: 'Binary Executable',
          publisher: 'Unknown',
          documentName: 'file.exe',
          fileType: 'EXE' as unknown as 'PDF'
        });
      }).toThrowError(/Unsupported file format/);
    });
  });

  describe('Prompt 218 Acceptance Test 9: Existing PCBI Master records remain immutable', () => {
    it('should ensure PCBI Master V1.0 records are not mutated by any Commodity Data Lab operation', () => {
      const v1Master = pcbiAdminService.getVersion('V1.0');
      expect(v1Master?.status).toBe('PUBLISHED');
      expect(v1Master?.file_name).toBe('PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx');

      // Execute multiple Commodity Data Lab operations
      pcbiCommodityDataLabService.getDashboardMetrics();
      pcbiCommodityDataLabService.getCommodityResearchQueue();
      pcbiCommodityDataLabService.uploadCommoditySource({
        commodityId: 'COM-CHM-CSL',
        pcbiId: 'PCBI-IND-CHM-CSL-001',
        sourceName: 'Chemical Weekly Update',
        publisher: 'Chemical Weekly',
        documentName: 'CW_Caustic_Soda_2026.txt',
        fileType: 'TXT'
      });

      const v1MasterAfter = pcbiAdminService.getVersion('V1.0');
      expect(v1MasterAfter).toEqual(v1Master);
    });
  });

  describe('Prompt 218 Acceptance Test 10: Existing Module 3 tests continue to pass', () => {
    it('should maintain dynamic catalog compatibility and pilot expansion readiness', () => {
      const pilotMetrics = pcbiPilotExpansionService.getPilotDashboardMetrics();
      expect(pilotMetrics).toBeDefined();
      expect(pilotMetrics.totalCustomerSpendCr).toBeDefined();
      expect(pilotMetrics.totalCommodities).toBe(13);

      const pilotGapMatrix = pcbiPilotExpansionService.getLiveCustomerGapMatrix();
      expect(pilotGapMatrix.length).toBeGreaterThan(0);
    });
  });

  describe('Research Dashboard & Queue Metrics', () => {
    it('should compute comprehensive research dashboard metrics matching prompt requirements', () => {
      const metrics = pcbiCommodityDataLabService.getDashboardMetrics();
      expect(metrics.totalCommodities).toBe(10);
      expect(metrics.productionReadyCount).toBe(3);
      expect(metrics.partialHistoryCount).toBe(2);
      expect(metrics.noHistoryCount).toBe(2);
      expect(metrics.missingCount).toBe(1);
      expect(metrics.sourceUnverifiedCount).toBe(6);
      expect(metrics.methodologyPendingCount).toBe(7);
      expect(metrics.specificationMismatchCount).toBe(1);
      expect(metrics.frequencyMismatchCount).toBe(1);
      expect(metrics.highImpactGapsCount).toBe(2);
      expect(metrics.queueByPriority.p1Critical).toBe(2);
      expect(metrics.queueByPriority.p2High).toBe(3);
      expect(metrics.queueByPriority.p3Medium).toBe(2);
      expect(metrics.queueByPriority.p4Low).toBe(3);
    });

    it('should provide the 17-column queue with correct attributes', () => {
      const queue = pcbiCommodityDataLabService.getCommodityResearchQueue();
      expect(queue.length).toBe(10);

      const fmo = queue.find((q) => q.commodityId === 'COM-MET-FMO');
      expect(fmo).toBeDefined();
      expect(fmo?.commodity).toBe('Ferro Molybdenum 65%');
      expect(fmo?.module2Classification).toBe('METALS_AND_ALLOYS');
      expect(fmo?.unspsc).toBe('30102900');
      expect(fmo?.customerSpend).toBe(12500000);
      expect(fmo?.customerSpendCr).toBe('₹1.25 Cr');
      expect(fmo?.transactionCount).toBe(65);
      expect(fmo?.pcbiId).toBe('PCBI-FEMO-65-001');
      expect(fmo?.currentStatus).toBe('PARTIAL_HISTORY');
      expect(fmo?.requiredHistory).toContain('75 months');
      expect(fmo?.availableHistory).toContain('18 observations');
      expect(fmo?.requiredFrequency).toBe('WEEKLY');
      expect(fmo?.availableFrequency).toBe('MONTHLY');
      expect(fmo?.sourceStatus).toBe('SOURCE_UNVERIFIED');
      expect(fmo?.methodologyStatus).toBe('METHODOLOGY_PENDING');
      expect(fmo?.priority).toContain('P1');
      expect(fmo?.researchStatus).toBe('IN_PROGRESS');
      expect(fmo?.action).toBe('OPEN WORKSPACE');
    });
  });

  describe('12-Tab Commodity Workspace Details', () => {
    it('should return complete details for the 12 tabs for a commodity', () => {
      const workspace = pcbiCommodityDataLabService.getCommodityWorkspace('PCBI-FEMO-65-001', 'SOURCE_REGISTER');
      expect(workspace.activeTab).toBe('SOURCE_REGISTER');
      expect(workspace.overview.commodityName).toBe('Ferro Molybdenum 65%');
      expect(workspace.sources.length).toBeGreaterThanOrEqual(3);
      expect(workspace.extractedObservations.length).toBe(3);
      expect(workspace.methodologyDetails.methodologyId).toBe('METH-COM-MET-FMO');
      expect(workspace.validationSummary.passed).toBe(false);
      expect(workspace.validationSummary.criticalErrorsCount).toBe(2);
      expect(workspace.approvalPackage.isReadyForApproval).toBe(false);
    });

    it('should retrieve workspace by commodityId as well as pcbiId', () => {
      const byCommId = pcbiCommodityDataLabService.getCommodityWorkspace('COM-MET-FMO');
      const byPcbiId = pcbiCommodityDataLabService.getCommodityWorkspace('PCBI-FEMO-65-001');
      expect(byCommId.overview.pcbiId).toBe(byPcbiId.overview.pcbiId);
    });

    it('should throw error when requesting unknown commodity workspace', () => {
      expect(() => {
        pcbiCommodityDataLabService.getCommodityWorkspace('UNKNOWN-COMMODITY');
      }).toThrowError('Commodity / PCBI series not found: UNKNOWN-COMMODITY');
    });

    it('should return all 12 workspace tabs metadata', () => {
      const tabs = pcbiCommodityDataLabService.getWorkspaceTabs();
      expect(tabs.length).toBe(12);
      expect(tabs.map((t) => t.key)).toEqual([
        'OVERVIEW',
        'RESEARCH_QUEUE',
        'UPLOAD_DATA',
        'SOURCE_REGISTER',
        'EXTRACTED_OBSERVATIONS',
        'STANDARDIZATION_PREVIEW',
        'SOURCE_COMPARISON',
        'METHODOLOGY',
        'VALIDATION',
        'APPROVAL',
        'VERSION_HISTORY',
        'PCBI_HISTORY'
      ]);
    });
  });

  describe('Banner Prominence & UI Safety', () => {
    it('should provide the prominent upload banner string', () => {
      expect(COMMODITY_DATA_UPLOAD_BANNER).toBe('COMMODITY DATA UPLOAD — NOT PCBI MASTER');
    });
  });
});
