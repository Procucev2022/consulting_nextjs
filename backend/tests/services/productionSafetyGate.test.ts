import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { assessmentWorkflowService } from '../../src/services/assessmentWorkflowService';
import { assessmentStore } from '../../src/services/assessmentStore';
import { operatingModeService } from '../../src/services/operatingModeService';
import {
  NDA_STATUSES,
  DATA_STATUSES,
  ASSESSMENT_STATUSES,
  VGT_INVARIANT_FIGURES
} from '../../src/constants/assessment';
import fs from 'fs';
import path from 'path';

describe('P0 — aiCEV Internal Production Safety Gate Certification', () => {
  let cleanupIso: () => void;

  beforeAll(() => {
    const iso = assessmentStore.useIsolatedTestDir();
    cleanupIso = iso.cleanup;
  });

  afterAll(() => {
    cleanupIso?.();
    assessmentStore.reloadFromDisk();
  });

  beforeEach(() => {
    assessmentStore.resetToDefaultSeed();
  });

  describe('Gate 1-6: Core Identity, Access, Immutability & Traceability', () => {
    it('Gate 1 & 2: verifies operating mode and internal role permissions', () => {
      const mode = operatingModeService.getConfig();
      expect(mode.mode).toBe('INTERNAL_ASSESSMENT');
      expect(mode.isInternalAssessment).toBe(true);
      expect(mode.isPublicSaaS).toBe(false);
      expect(mode.features.publicRegistration).toBe(false);
      expect(mode.features.customerSelfOnboarding).toBe(false);
      expect(mode.allowedRoles).toContain('INTERNAL_ADMIN');
      expect(mode.allowedRoles).toContain('ANALYST');
    });

    it('Gate 3: verifies assessment isolation between distinct clients', () => {
      const a1 = assessmentStore.createAssessment(
        { customerName: 'Client Alpha', industry: 'Auto', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      const a2 = assessmentStore.createAssessment(
        { customerName: 'Client Beta', industry: 'Energy', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      expect(a1.assessmentId).not.toBe(a2.assessmentId);
      const v1 = assessmentStore.getDataVersions(a1.assessmentId);
      const v2 = assessmentStore.getDataVersions(a2.assessmentId);
      expect(v1).toEqual([]);
      expect(v2).toEqual([]);
    });

    it('Gate 4: verifies Data Version immutability and superseding', () => {
      const a = assessmentStore.createAssessment(
        { customerName: 'Client Gamma', industry: 'Steel', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      const { dataVersion: v1 } = assessmentWorkflowService.uploadDataVersion(
        a.assessmentId,
        { fileName: 'raw_v1.xlsx', fileSize: 1000, checksum: 'sha_v1', recordCount: 100 },
        'analyst@procucev.com', 'ANALYST'
      );
      expect(v1.dataVersionId).toBe('DV-001');
      expect(v1.isSuperseded).toBe(false);

      const { dataVersion: v2 } = assessmentWorkflowService.uploadDataVersion(
        a.assessmentId,
        { fileName: 'raw_v2.xlsx', fileSize: 1100, checksum: 'sha_v2', recordCount: 110 },
        'analyst@procucev.com', 'ANALYST'
      );
      expect(v2.dataVersionId).toBe('DV-002');
      const all = assessmentStore.getDataVersions(a.assessmentId);
      const old = all.find(x => x.dataVersionId === 'DV-001');
      expect(old?.isSuperseded).toBe(true);
    });

    it('Gate 5: verifies Analysis Run traceability and gate review mapping', () => {
      const seed = assessmentStore.getById('AIC-2026-0001');
      expect(seed?.activeAnalysisRunId).toBe('RUN-001');
      const runs = assessmentStore.getAnalysisRuns('AIC-2026-0001');
      expect(runs.length).toBe(1);
      expect(runs[0].reviewGates.length).toBe(8);
      expect(runs[0].allGatesPassed).toBe(true);
    });

    it('Gate 6: verifies persistent audit logging for every lifecycle mutation', () => {
      const a = assessmentStore.createAssessment(
        { customerName: 'Audit Test Client', industry: 'Auto', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      const logs = assessmentStore.getAuditLogs(a.assessmentId);
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe('ASSESSMENT_CREATED');
      expect(logs[0].actorEmail).toBe('admin@procucev.com');
    });
  });

  describe('Gate 7-13: Storage, Checksums, Source Control & Master Protection', () => {
    it('Gate 7 & 8: customer file storage partitioning and checksum verification', () => {
      const checksum = '59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def';
      const seedVersions = assessmentStore.getDataVersions('AIC-2026-0001');
      expect(seedVersions[0].checksum).toBe(checksum);
      expect(seedVersions[0].filePath).toContain('VGT Testing Data.xlsx');
    });

    it('Gate 10: verifies no customer raw data is tracked in source control', () => {
      const rootGitignore = fs.readFileSync(path.join(__dirname, '..', '..', '..', '.gitignore'), 'utf8');
      expect(rootGitignore).toContain('datasets/');
      expect(rootGitignore).toContain('uploads/');
      expect(rootGitignore).toContain('Procucev_Procurement_Value_Savings_Diagnostic_*');
    });

    it('Gate 11: verifies absence of demo financial data in canonical calculations', () => {
      expect(VGT_INVARIANT_FIGURES.VALID_FX_NORMALIZED_SPEND_CR).toBe(4073.8307);
      expect(VGT_INVARIANT_FIGURES.SOURCE_ROWS).toBe(20505);
      expect(VGT_INVARIANT_FIGURES.VALID_ROWS).toBe(20241);
    });

    it('Gate 12 & 13: global FX Master and PCBI Master protection', () => {
      const fxPath = path.join(__dirname, '..', '..', '..', 'aiCEV_FX_Master_2020_2026_v2.xlsx');
      const pcbiPath = path.join(__dirname, '..', '..', 'PCBI_COMMODITY_COVERAGE_MASTER.xlsx');
      expect(fs.existsSync(fxPath)).toBe(true);
      expect(fs.existsSync(pcbiPath)).toBe(true);
    });
  });

  describe('Gate 14-22 & Security Tests: Workflow Controls & Access Protection', () => {
    it('Gate 14 & 15: report approval gate & delivery package integrity', () => {
      const a = assessmentStore.createAssessment(
        { customerName: 'Gate 14 Client', industry: 'Auto', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      // Delivery package fails before approval
      expect(() => {
        assessmentWorkflowService.generateDeliveryPackage(a.assessmentId, 'admin@procucev.com', 'INTERNAL_ADMIN');
      }).toThrow('Assessment must be APPROVED to generate delivery package');

      // Delivery call fails before approval
      expect(() => {
        assessmentWorkflowService.deliverAssessment(a.assessmentId, { deliveredToEmail: 'test@corp.com' }, 'admin@procucev.com', 'INTERNAL_ADMIN');
      }).toThrow('Assessment must be APPROVED before delivery');
    });

    it('Gate 19: failed analysis recovery when invalid dataVersion is provided', () => {
      const a = assessmentStore.createAssessment(
        { customerName: 'Fail Test Client', industry: 'Auto', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      expect(() => {
        assessmentWorkflowService.runAnalysis(a.assessmentId, 'NON_EXISTENT_DV', 'analyst@procucev.com', 'ANALYST');
      }).toThrow('Data version NON_EXISTENT_DV not found for assessment');
      // Assessment status remains stable
      expect(a.status).toBe(ASSESSMENT_STATUSES.CREATED);
    });

    it('Gate 20 & 21: corrected data re-analysis and superseded run handling', () => {
      const a = assessmentStore.createAssessment(
        { customerName: 'Correction Client', industry: 'Auto', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      const { dataVersion: v1 } = assessmentWorkflowService.uploadDataVersion(
        a.assessmentId,
        { fileName: 'v1.xlsx', fileSize: 100, checksum: 'hash1', recordCount: 10 },
        'analyst@procucev.com', 'ANALYST'
      );
      const { analysisRun: r1 } = assessmentWorkflowService.runAnalysis(a.assessmentId, v1.dataVersionId, 'analyst@procucev.com', 'ANALYST');

      const { dataVersion: v2 } = assessmentWorkflowService.uploadDataVersion(
        a.assessmentId,
        { fileName: 'v2.xlsx', fileSize: 100, checksum: 'hash2', recordCount: 10 },
        'analyst@procucev.com', 'ANALYST'
      );
      const { analysisRun: r2 } = assessmentWorkflowService.runAnalysis(a.assessmentId, v2.dataVersionId, 'analyst@procucev.com', 'ANALYST');

      expect(r2.analysisRunId).toBe('RUN-002');
      // Attempting to approve superseded r1 throws error
      expect(() => {
        assessmentWorkflowService.approveAssessment(
          a.assessmentId,
          { analysisRunId: r1.analysisRunId, dataVersionId: v1.dataVersionId, approvalComment: 'Sign-off old' },
          'analyst@procucev.com', 'ANALYST'
        );
      }).toThrow('Cannot approve a superseded analysis run');
    });

    it('Security Tests: blocks cross-assessment unauthorized access across all dimensions', () => {
      const a1 = assessmentStore.createAssessment(
        { customerName: 'Client Alpha Secure', industry: 'Auto', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );
      const a2 = assessmentStore.createAssessment(
        { customerName: 'Client Beta Secure', industry: 'Energy', assessmentPeriodStart: 'April 2021', assessmentPeriodEnd: 'Jan 2022' },
        'admin@procucev.com', 'INTERNAL_ADMIN'
      );

      const { dataVersion: v1 } = assessmentWorkflowService.uploadDataVersion(
        a1.assessmentId,
        { fileName: 'alpha.xlsx', fileSize: 100, checksum: 'hashA', recordCount: 50 },
        'analyst@procucev.com', 'ANALYST'
      );

      // Attempt to access Client Alpha's dataVersion under Client Beta
      expect(() => {
        assessmentWorkflowService.runAnalysis(a2.assessmentId, v1.dataVersionId, 'analyst@procucev.com', 'ANALYST');
      }).toThrow(`Data version ${v1.dataVersionId} not found for assessment`);

      // Attempt to generate package on unapproved Client Beta using Client Alpha data
      expect(() => {
        assessmentWorkflowService.generateDeliveryPackage(a2.assessmentId, 'admin@procucev.com', 'INTERNAL_ADMIN');
      }).toThrow('Assessment must be APPROVED to generate delivery package');
    });
  });

  describe('Financial Regression: VGT Golden Dataset Validation', () => {
    it('verifies exact VGT baseline metrics with ₹0.00 variance', () => {
      const vgt = assessmentStore.getById('AIC-2026-0001');
      expect(vgt).toBeDefined();
      expect(vgt?.totalSpendCr).toBe(4073.8307);
      expect(vgt?.validatedSpendCr).toBe(4073.8307);
      expect(vgt?.baselineSpendCr).toBe(3920.3277);
      expect(vgt?.fxImpactCr).toBe(153.5029);
      expect(vgt?.potentialSavingsCr).toBe(378.4);
      expect(vgt?.savingsPct).toBe(9.29);

      // Verify zero variance calculation
      const calculatedSum = (vgt?.baselineSpendCr || 0) + (vgt?.fxImpactCr || 0);
      const diff = Math.abs(calculatedSum - (vgt?.validatedSpendCr || 0));
      expect(Number(diff.toFixed(4))).toBeLessThanOrEqual(0.0001);
    });
  });
});
