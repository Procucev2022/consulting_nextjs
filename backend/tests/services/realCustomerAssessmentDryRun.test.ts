import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { assessmentWorkflowService } from '../../src/services/assessmentWorkflowService';
import { assessmentStore } from '../../src/services/assessmentStore';
import {
  NDA_STATUSES,
  DATA_STATUSES,
  ASSESSMENT_STATUSES,
  VGT_INVARIANT_FIGURES,
  AUDIT_ACTIONS
} from '../../src/constants/assessment';

describe('P0 — aiCEV Real Customer Assessment Operational Dry Run', () => {
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

  it('executes full 26-step customer operational assessment workflow and validates forensic invariants', () => {
    const timing = {
      start: Date.now(),
      dataReceivedToModule1Ready: 0,
      module1ToFullAnalysisReady: 0,
      fullAnalysisToReportReady: 0,
      reportToAnalystApproval: 0,
      approvalToDeliveryPackage: 0,
      totalDuration: 0
    };

    // Step 1: Create a new Assessment
    // Step 2: Assign Assessment ID (AIC-2026-0002)
    // Step 3: Enter customer/industry/assessment period
    const t0 = Date.now();
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Varroc Polymers Commercial Assessment',
        industry: 'Automotive & Industrial Components',
        assessmentPeriodStart: 'April 2021',
        assessmentPeriodEnd: 'January 2022',
        assignedAnalyst: 'lead.analyst@procucev.com',
        ndaStatus: NDA_STATUSES.PENDING
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(created.assessmentId).toBe('AIC-2026-0002');
    expect(created.customerName).toBe('Varroc Polymers Commercial Assessment');
    expect(created.status).toBe(ASSESSMENT_STATUSES.CREATED);

    // Step 4: Mark NDA as SIGNED
    const ndaUpdated = assessmentStore.updateNdaStatus(
      created.assessmentId,
      { ndaStatus: NDA_STATUSES.SIGNED, notes: 'Mutual NDA executed under PROCUCEV protocol' },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(ndaUpdated?.ndaStatus).toBe(NDA_STATUSES.SIGNED);
    expect(ndaUpdated?.status).toBe(ASSESSMENT_STATUSES.DATA_PENDING);

    // Step 5: Mark DATA RECEIVED
    const tDataReceived = Date.now();
    const dataUpdated = assessmentStore.updateDataStatus(
      created.assessmentId,
      { dataStatus: DATA_STATUSES.RECEIVED, notes: 'Client transmitted approved procurement ledger' },
      'lead.analyst@procucev.com',
      'ANALYST'
    );
    expect(dataUpdated?.dataStatus).toBe(DATA_STATUSES.RECEIVED);
    expect(dataUpdated?.status).toBe(ASSESSMENT_STATUSES.DATA_RECEIVED);

    // Step 6: Upload the approved test procurement dataset
    // Step 7: Confirm immutable Data Version creation
    const { dataVersion, assessment: postUpload } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'VGT Testing Data.xlsx',
        fileSize: 6000846,
        checksum: '59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def',
        recordCount: VGT_INVARIANT_FIGURES.SOURCE_ROWS,
        filePath: 'datasets/AIC-2026-0002/VGT Testing Data.xlsx',
        notes: 'Authoritative commercial ledger upload'
      },
      'lead.analyst@procucev.com',
      'ANALYST'
    );

    const tModule1Ready = Date.now();
    timing.dataReceivedToModule1Ready = tModule1Ready - tDataReceived;

    expect(dataVersion.dataVersionId).toBe('DV-001');
    expect(dataVersion.versionNumber).toBe(1);
    expect(dataVersion.checksum).toBe('59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def');
    expect(postUpload.status).toBe(ASSESSMENT_STATUSES.MODULE_1_READY);

    // Step 8: Run Module 1 & Full Analysis
    const { analysisRun, assessment: postAnalysis } = assessmentWorkflowService.runAnalysis(
      created.assessmentId,
      dataVersion.dataVersionId,
      'lead.analyst@procucev.com',
      'ANALYST'
    );

    const tAnalysisReady = Date.now();
    timing.module1ToFullAnalysisReady = tAnalysisReady - tModule1Ready;

    expect(analysisRun.analysisRunId).toBe('RUN-001');
    expect(analysisRun.status).toBe('COMPLETED');
    expect(analysisRun.allGatesPassed).toBe(true);

    // Step 9: Validate Module 1 Invariants
    const m1 = analysisRun.module1Metrics;
    expect(m1).toBeDefined();
    expect(m1?.sourceRows).toBe(20505);
    expect(m1?.validRows).toBe(20241);
    expect(m1?.exclusions).toBe(252);
    expect(m1?.anomalies).toBe(12);
    expect(m1?.fxCoveragePct).toBe(100.0);
    expect(m1?.validatedSpendCr).toBe(4073.8307);
    expect(m1?.suppliers).toBe(529);
    expect(m1?.materialGroups).toBe(57);
    expect(m1?.plants).toBe(19);
    expect(m1?.billingMonths).toBe(10);

    // Step 10 & 11: Validate Module 2 Categorization & Opportunities
    const m2 = analysisRun.module2Metrics;
    expect(m2).toBeDefined();
    expect(m2?.categorizedSpendCr).toBe(4073.8307);
    expect(m2?.materialGroups).toBe(57);
    expect(m2?.sourcingOpportunitiesCount).toBe(42);

    // Step 12 & 13: Run & Validate PCBI Review
    const pcbi = analysisRun.pcbiMetrics;
    expect(pcbi).toBeDefined();
    expect(pcbi?.commodityGroupsCount).toBe(9);
    expect(pcbi?.benchmarkCoveragePct).toBeGreaterThan(90);
    expect(pcbi?.uncoveredItemsCount).toBe(18);

    // Step 14 & 15: Run Module 4 & Validate Savings Classifications
    const m4 = analysisRun.module4Metrics;
    expect(m4).toBeDefined();
    expect(m4?.savingsClassifications.directPriceRenegotiationCr).toBe(142.60);
    expect(m4?.savingsClassifications.volumeTierBundlingCr).toBe(118.30);
    expect(m4?.savingsClassifications.specificationRationalizationCr).toBe(72.80);
    expect(m4?.savingsClassifications.paymentTermsOptimizationCr).toBe(44.70);

    // Step 16: Validate Financial Bridge
    expect(m4?.financialBridgeCr.baselineSpendCr).toBe(3920.3277);
    expect(m4?.financialBridgeCr.fxImpactCr).toBe(153.5029);
    expect(m4?.financialBridgeCr.addressableSpendCr).toBe(4073.8307);
    expect(m4?.financialBridgeCr.netPotentialSavingsCr).toBe(378.4);

    // Step 17-20: Review Gates Validation
    const gateReport = analysisRun.reviewGates.find((g) => g.gate === 'REPORT_GENERATION');
    const gateWorkbook = analysisRun.reviewGates.find((g) => g.gate === 'EVIDENCE_WORKBOOK_GENERATION');
    expect(gateReport?.passed).toBe(true);
    expect(gateWorkbook?.passed).toBe(true);

    const tReportReady = Date.now();
    timing.fullAnalysisToReportReady = tReportReady - tAnalysisReady;

    // Step 21: Perform Analyst Review (26 Module Gates + 8 Summary Gates Check)
    expect(analysisRun.reviewGates.length).toBe(34);
    expect(analysisRun.reviewGates.every((g) => g.passed)).toBe(true);

    // Step 22: Approve Report
    const approved = assessmentWorkflowService.approveAssessment(
      created.assessmentId,
      {
        analysisRunId: analysisRun.analysisRunId,
        dataVersionId: dataVersion.dataVersionId,
        approvalComment: 'Comprehensive 8-gate sign-off confirmed against authoritative VGT procurement baseline.'
      },
      'lead.analyst@procucev.com',
      'ANALYST'
    );

    const tApproved = Date.now();
    timing.reportToAnalystApproval = tApproved - tReportReady;

    expect(approved.status).toBe(ASSESSMENT_STATUSES.APPROVED);
    expect(approved.approvedBy).toBe('lead.analyst@procucev.com');

    // Step 23: Generate Delivery Package
    // Step 24: Confirm only approved Analysis Run is included
    const deliveryPkg = assessmentWorkflowService.generateDeliveryPackage(
      created.assessmentId,
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const tDelivPkg = Date.now();
    timing.approvalToDeliveryPackage = tDelivPkg - tApproved;

    expect(deliveryPkg.analysisRunId).toBe(analysisRun.analysisRunId);
    expect(deliveryPkg.items.length).toBe(10);
    expect(deliveryPkg.items.some((i) => i.title === 'Executive Opportunity Brief')).toBe(true);
    expect(deliveryPkg.items.some((i) => i.title === 'Boardroom & Evidence Edition')).toBe(true);
    expect(deliveryPkg.items.some((i) => i.title === 'Evidence workbook')).toBe(true);
    expect(deliveryPkg.items.some((i) => i.title === 'Methodology / assumptions')).toBe(true);

    // Step 25: Mark DELIVERED
    const delivered = assessmentWorkflowService.deliverAssessment(
      created.assessmentId,
      {
        deliveredToEmail: 'cpo@varroc.com',
        deliveryNotes: 'Boardroom-ready opportunity package transmitted securely.'
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(delivered.status).toBe(ASSESSMENT_STATUSES.DELIVERED);

    // Step 26: Close assessment
    const closed = assessmentWorkflowService.closeAssessment(
      created.assessmentId,
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(closed.status).toBe(ASSESSMENT_STATUSES.CLOSED);
    expect(closed.closedAt).toBeDefined();

    timing.totalDuration = Date.now() - timing.start;
    expect(timing.totalDuration).toBeGreaterThanOrEqual(0);
  }, 35000);

  describe('Negative Paths Verification', () => {
    it('A. rejects upload without valid assessment', () => {
      expect(() => {
        assessmentWorkflowService.uploadDataVersion(
          'AIC-9999-9999',
          {
            fileName: 'file.xlsx',
            fileSize: 1024,
            checksum: 'test1234',
            recordCount: 10
          },
          'analyst@procucev.com',
          'ANALYST'
        );
      }).toThrow('Assessment AIC-9999-9999 not found');
    });

    it('E & F. handles new data version after correction and prevents approval of superseded runs', () => {
      const created = assessmentStore.createAssessment(
        {
          customerName: 'Multi Version Test Corp',
          industry: 'Industrial',
          assessmentPeriodStart: 'April 2021',
          assessmentPeriodEnd: 'January 2022',
          assignedAnalyst: 'analyst@procucev.com',
          ndaStatus: NDA_STATUSES.SIGNED
        },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );

      // Upload Version 1
      const { dataVersion: v1 } = assessmentWorkflowService.uploadDataVersion(
        created.assessmentId,
        {
          fileName: 'spend_v1.xlsx',
          fileSize: 1024,
          checksum: 'hash_v1_1234',
          recordCount: 20000
        },
        'analyst@procucev.com',
        'ANALYST'
      );

      const { analysisRun: run1 } = assessmentWorkflowService.runAnalysis(
        created.assessmentId,
        v1.dataVersionId,
        'analyst@procucev.com',
        'ANALYST'
      );

      // Upload Version 2 (Correction)
      const { dataVersion: v2 } = assessmentWorkflowService.uploadDataVersion(
        created.assessmentId,
        {
          fileName: 'spend_v2_corrected.xlsx',
          fileSize: 1024,
          checksum: 'hash_v2_5678',
          recordCount: 20505
        },
        'analyst@procucev.com',
        'ANALYST'
      );

      expect(v2.dataVersionId).toBe('DV-002');
      const versions = assessmentStore.getDataVersions(created.assessmentId);
      const version1InStore = versions.find((v) => v.dataVersionId === 'DV-001');
      expect(version1InStore?.isSuperseded).toBe(true);

      // Create Run 2 for V2
      const { analysisRun: run2 } = assessmentWorkflowService.runAnalysis(
        created.assessmentId,
        v2.dataVersionId,
        'analyst@procucev.com',
        'ANALYST'
      );
      expect(run2.analysisRunId).toBe('RUN-002');

      const runs = assessmentStore.getAnalysisRuns(created.assessmentId);
      const run1InStore = runs.find((r) => r.analysisRunId === 'RUN-001');
      expect(run1InStore?.isSuperseded).toBe(true);

      // Attempt F: Approve superseded Run 1
      expect(() => {
        assessmentWorkflowService.approveAssessment(
          created.assessmentId,
          {
            analysisRunId: run1.analysisRunId,
            dataVersionId: v1.dataVersionId,
            approvalComment: 'Invalid superseded run sign-off'
          },
          'analyst@procucev.com',
          'ANALYST'
        );
      }).toThrow('Cannot approve a superseded analysis run');
    });

    it('G & H. blocks package generation and delivery without prior approval', () => {
      const created = assessmentStore.createAssessment(
        {
          customerName: 'Unapproved Test Corp',
          industry: 'Industrial',
          assessmentPeriodStart: 'April 2021',
          assessmentPeriodEnd: 'January 2022',
          assignedAnalyst: 'analyst@procucev.com',
          ndaStatus: NDA_STATUSES.SIGNED
        },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );

      expect(() => {
        assessmentWorkflowService.generateDeliveryPackage(
          created.assessmentId,
          'admin@procucev.com',
          'INTERNAL_ADMIN'
        );
      }).toThrow('Assessment must be APPROVED to generate delivery package');

      expect(() => {
        assessmentWorkflowService.deliverAssessment(
          created.assessmentId,
          { deliveredToEmail: 'test@corp.com' },
          'admin@procucev.com',
          'INTERNAL_ADMIN'
        );
      }).toThrow('Assessment must be APPROVED before delivery');
    });

    it('I. blocks cross-assessment data contamination', () => {
      const clientA = assessmentStore.createAssessment(
        {
          customerName: 'Client A Corp',
          industry: 'Automotive',
          assessmentPeriodStart: 'April 2021',
          assessmentPeriodEnd: 'January 2022',
          assignedAnalyst: 'analyst@procucev.com',
          ndaStatus: NDA_STATUSES.SIGNED
        },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );

      const clientB = assessmentStore.createAssessment(
        {
          customerName: 'Client B Corp',
          industry: 'Chemicals',
          assessmentPeriodStart: 'April 2021',
          assessmentPeriodEnd: 'January 2022',
          assignedAnalyst: 'analyst@procucev.com',
          ndaStatus: NDA_STATUSES.SIGNED
        },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );

      // Upload to Client A
      const { dataVersion: vA } = assessmentWorkflowService.uploadDataVersion(
        clientA.assessmentId,
        {
          fileName: 'client_a.xlsx',
          fileSize: 1024,
          checksum: 'hash_a_123',
          recordCount: 500
        },
        'analyst@procucev.com',
        'ANALYST'
      );

      // Attempt to run analysis on Client B using Client A's data version
      expect(() => {
        assessmentWorkflowService.runAnalysis(
          clientB.assessmentId,
          vA.dataVersionId,
          'analyst@procucev.com',
          'ANALYST'
        );
      }).toThrow(`Data version ${vA.dataVersionId} not found for assessment`);
    });
  });
});
