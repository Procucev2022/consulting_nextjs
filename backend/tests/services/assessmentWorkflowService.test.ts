import crypto from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { assessmentWorkflowService } from '../../src/services/assessmentWorkflowService';
import { assessmentStore } from '../../src/services/assessmentStore';
import { Module1CanonicalService } from '../../src/services/module1CanonicalService';
import { NDA_STATUSES, SYSTEM_BUILD_IDENTITY } from '../../src/constants/assessment';


describe('AssessmentWorkflowService', () => {
  beforeEach(() => {
    assessmentStore.resetToDefaultSeed();
  });

  it('uploads a data version and transitions status to MODULE_1_READY', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Gamma Parts',
        industry: 'Precision',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const { dataVersion, assessment } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'gamma_spend.xlsx',
        fileSize: 2048,
        checksum: 'deadbeef123',
        rowCount: 1000
      },
      'analyst@procucev.com',
      'ANALYST'
    );
    expect(dataVersion.dataVersionId).toBe('DV-001');
    expect(assessment.status).toBe('MODULE_1_READY');
  });

  it('runs analysis and records review gate checklist', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Delta Industries',
        industry: 'Heavy Eng',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const { dataVersion } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'delta_spend.xlsx',
        fileSize: 2048,
        checksum: 'hash123',
        rowCount: 20505
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    const { analysisRun, assessment } = assessmentWorkflowService.runAnalysis(
      created.assessmentId,
      dataVersion.dataVersionId,
      'analyst@procucev.com',
      'ANALYST'
    );

    expect(analysisRun.analysisRunId).toBe('RUN-001');
    expect(analysisRun.reviewGates.length).toBe(34);
    expect(analysisRun.allGatesPassed).toBe(true);
    expect(assessment.status).toBe('ANALYST_REVIEW');
  });

  it('approves assessment only when review gates are satisfied and generates delivery package', () => {
    const seed = assessmentStore.getById('AIC-2026-0001');
    expect(seed).toBeDefined();

    const { dataVersion } = assessmentWorkflowService.uploadDataVersion(
      'AIC-2026-0001',
      {
        fileName: 'vgt.xlsx',
        fileSize: 5000,
        checksum: 'sha-vgt',
        rowCount: 20505
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    const { analysisRun } = assessmentWorkflowService.runAnalysis(
      'AIC-2026-0001',
      dataVersion.dataVersionId,
      'analyst@procucev.com',
      'ANALYST'
    );

    const approved = assessmentWorkflowService.approveAssessment(
      'AIC-2026-0001',
      {
        analysisRunId: analysisRun.analysisRunId,
        dataVersionId: dataVersion.dataVersionId,
        approvalComment: 'Quality checks certified with zero variance.'
      },
      'lead.analyst@procucev.com',
      'ANALYST'
    );

    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('lead.analyst@procucev.com');

    // Generating delivery package
    const pkg = assessmentWorkflowService.generateDeliveryPackage(
      'AIC-2026-0001',
      'lead.analyst@procucev.com',
      'ANALYST'
    );

    expect(pkg.items.length).toBe(10);
    expect(pkg.assessmentPeriod).toContain('FY2023-24');
    expect(pkg.releaseVersion).toBe(SYSTEM_BUILD_IDENTITY.APP_VERSION);
    expect(pkg.checksums?.vgtDataset).toBeDefined();
    expect(pkg.items.map((i) => i.id)).toEqual([
      'EXECUTIVE_OPPORTUNITY_BRIEF',
      'BOARDROOM_EVIDENCE_EDITION',
      'MODULE_1_REPORT',
      'MODULE_2_REPORT',
      'PCBI_REPORT',
      'MODULE_4_REPORT',
      'EVIDENCE_WORKBOOK',
      'METHODOLOGY_ASSUMPTIONS',
      'DATA_QUALITY_OBSERVATIONS',
      'RECOMMENDED_WAVE_1_ACTIONS'
    ]);
  }, 35000);

  it('rejects delivery package generation if assessment is not approved', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Epsilon Tech',
        industry: 'Electronics',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.NOT_REQUESTED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(() => {
      assessmentWorkflowService.generateDeliveryPackage(
        created.assessmentId,
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Assessment must be APPROVED/);
  });

  it('rejects uploads with unsupported file format', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Bad Format Co',
        industry: 'Software',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(() => {
      assessmentWorkflowService.uploadDataVersion(
        created.assessmentId,
        {
          fileName: 'malicious.exe',
          fileSize: 1024,
          checksum: 'abc12345678'
        },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Invalid file format/);
  });

  it('handles duplicate file upload idempotently', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Idempotency Co',
        industry: 'Textiles',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const first = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'spend.xlsx',
        fileSize: 2048,
        checksum: 'unique-hash-12345'
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    const second = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'spend.xlsx',
        fileSize: 2048,
        checksum: 'unique-hash-12345'
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    expect(second.dataVersion.dataVersionId).toBe(first.dataVersion.dataVersionId);
    expect(assessmentStore.getDataVersions(created.assessmentId).length).toBe(1);
  });

  it('handles base64 file payload and runs analysis immediately when requested', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Immediate Analysis Co',
        industry: 'Automotive',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const testContent = 'Vendor,Category,Spend,Currency\nSupplierA,Steel,1000000,INR\n';
    const base64 = Buffer.from(testContent, 'utf8').toString('base64');
    const sha = crypto.createHash('sha256').update(Buffer.from(testContent, 'utf8')).digest('hex').toLowerCase();

    const result = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'immediate_spend.csv',
        fileSize: testContent.length,
        checksum: sha,
        fileBase64: base64,
        runAnalysisImmediately: true
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    expect(result.dataVersion.dataVersionId).toBe('DV-001');
    expect(result.analysisRun).toBeDefined();
    expect(result.assessment.validatedSpendCr).toBeDefined();
    expect(result.assessment.status).toBe('ANALYST_REVIEW');
  });

  it('delivers approved assessment and closes assessment', () => {
    // Approve AIC-2026-0001
    const approved = assessmentWorkflowService.approveAssessment(
      'AIC-2026-0001',
      { approvalComment: 'Final validation signoff' },
      'lead@procucev.com',
      'ANALYST'
    );
    expect(approved.status).toBe('APPROVED');

    // Deliver with test delivery flag because AIC-2026-0001 is test data
    const delivered = assessmentWorkflowService.deliverAssessment(
      'AIC-2026-0001',
      {
        deliveredToEmail: 'customer.exec@varroc.com',
        deliveryNotes: 'Comprehensive evaluation delivery',
        isTestDelivery: true
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(delivered.status).toBe('DELIVERED');
    expect(delivered.deliveredAt).toBeDefined();

    // Close assessment
    const closed = assessmentWorkflowService.closeAssessment(
      'AIC-2026-0001',
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(closed.status).toBe('CLOSED');
    expect(closed.closedAt).toBeDefined();
  });

  it('blocks delivering unapproved assessment or test delivery without flag', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Delivery Guard Co',
        industry: 'Metals',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED,
        isTestData: true
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    // Blocked: not approved
    expect(() => {
      assessmentWorkflowService.deliverAssessment(
        created.assessmentId,
        { deliveredToEmail: 'exec@metals.com', isTestDelivery: true },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
    }).toThrow(/must be APPROVED/);

    // Blocked: isTestData but isTestDelivery is false
    const vgt = assessmentStore.getAssessmentById('AIC-2026-0001')!;
    vgt.status = 'APPROVED';
    expect(() => {
      assessmentWorkflowService.deliverAssessment(
        'AIC-2026-0001',
        { deliveredToEmail: 'exec@varroc.com', isTestDelivery: false },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
    }).toThrow(/Ordinary customer delivery blocked for TEST DATA/);
  });

  it('rejects upload and analysis when assessment or version is missing or unauthorized', () => {
    // 1. Upload for missing assessment
    expect(() => {
      assessmentWorkflowService.uploadDataVersion(
        'AIC-9999-9999',
        { fileName: 'test.xlsx', fileSize: 100, checksum: 'hash12345' },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/not found/);

    // 2. Upload with checksum mismatch
    expect(() => {
      assessmentWorkflowService.uploadDataVersion(
        'AIC-2026-0001',
        {
          fileName: 'test.xlsx',
          fileSize: 100,
          checksum: 'hash12345',
          expectedChecksum: 'differenthash'
        },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Dataset hash mismatch rejection/);

    // 3. Upload with base64 hash mismatch
    expect(() => {
      assessmentWorkflowService.uploadDataVersion(
        'AIC-2026-0001',
        {
          fileName: 'test.xlsx',
          fileSize: 100,
          checksum: 'wrongsha12345',
          fileBase64: Buffer.from('data').toString('base64')
        },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Dataset hash mismatch rejection/);

    // 4. Run analysis unauthorized role
    expect(() => {
      assessmentWorkflowService.runAnalysis(
        'AIC-2026-0001',
        'DV-001',
        'hacker@procucev.com',
        'CUSTOMER'
      );
    }).toThrow(/Unauthorized role rejection/);

    // 5. Run analysis missing assessment
    expect(() => {
      assessmentWorkflowService.runAnalysis(
        'AIC-9999-9999',
        'DV-001',
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/not found/);

    // 6. Run analysis missing version
    expect(() => {
      assessmentWorkflowService.runAnalysis(
        'AIC-2026-0001',
        'DV-999',
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/not found/);

    // 7. Run analysis on superseded version
    const versions = assessmentStore.getDataVersions('AIC-2026-0001');
    versions[0].isSuperseded = true;
    expect(() => {
      assessmentWorkflowService.runAnalysis(
        'AIC-2026-0001',
        'DV-001',
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/cannot run analysis on superseded version/);
  });

  it('rejects approval, package generation, delivery, and closure for missing entities', () => {
    // Approve missing assessment
    expect(() => {
      assessmentWorkflowService.approveAssessment(
        'AIC-9999-9999',
        { approvalComment: 'ok' },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/not found/);

    // Package for missing assessment
    expect(() => {
      assessmentWorkflowService.generateDeliveryPackage(
        'AIC-9999-9999',
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/not found/);

    // Deliver missing assessment
    expect(() => {
      assessmentWorkflowService.deliverAssessment(
        'AIC-9999-9999',
        { deliveredToEmail: 'test@test.com' },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
    }).toThrow(/not found/);

    // Close missing assessment
    expect(() => {
      assessmentWorkflowService.closeAssessment(
        'AIC-9999-9999',
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
    }).toThrow(/not found/);

    // Package when assessment has no active run
    const createdNoRun = assessmentStore.createAssessment(
      {
        customerName: 'No Run Co',
        industry: 'Plastics',
        assessmentPeriodStart: '2021-04-01',
        assessmentPeriodEnd: '2022-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    createdNoRun.status = 'APPROVED';
    expect(() => {
      assessmentWorkflowService.generateDeliveryPackage(
        createdNoRun.assessmentId,
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/No active analysis run found/);

    // Package when active run is not approved
    const vgtRuns = assessmentStore.getAnalysisRuns('AIC-2026-0001');
    vgtRuns[0].isApproved = false;
    expect(() => {
      assessmentWorkflowService.generateDeliveryPackage(
        'AIC-2026-0001',
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Unapproved delivery packaging denial/);

    // Package when active run is superseded
    vgtRuns[0].isApproved = true;
    vgtRuns[0].isSuperseded = true;
    expect(() => {
      assessmentWorkflowService.generateDeliveryPackage(
        'AIC-2026-0001',
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/cannot generate report or package from superseded analysis run/);

    // Approve when assessment has no active run
    expect(() => {
      assessmentWorkflowService.approveAssessment(
        createdNoRun.assessmentId,
        { approvalComment: 'no run signoff' },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/No analysis run/);

    // Approve when active run is superseded
    const vgtRunsApproval = assessmentStore.getAnalysisRuns('AIC-2026-0001');
    vgtRunsApproval[0].isSuperseded = true;
    expect(() => {
      assessmentWorkflowService.approveAssessment(
        'AIC-2026-0001',
        { approvalComment: 'superseded signoff' },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/superseded analysis run/i);

    // Approve when gates failed
    vgtRunsApproval[0].isSuperseded = false;
    vgtRunsApproval[0].allGatesPassed = false;
    expect(() => {
      assessmentWorkflowService.approveAssessment(
        'AIC-2026-0001',
        { approvalComment: 'failed gate signoff' },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/mandatory review gates have not passed/i);
  });

  it('validates a dataset version without executing full analysis', () => {
    const valResult = assessmentWorkflowService.validateDataset(
      'AIC-2026-0001',
      'DV-001',
      'analyst@procucev.com',
      'ANALYST'
    );
    expect(valResult.success).toBe(true);
    expect(valResult.validationSummary.rowCount).toBeGreaterThan(0);
    const updated = assessmentStore.getById('AIC-2026-0001');
    expect(updated?.dataStatus).toBe('VALIDATED');
  });

  it('explicitly runs Module 1 after validation', () => {
    const m1Result = assessmentWorkflowService.runModule1(
      'AIC-2026-0001',
      'DV-001',
      'analyst@procucev.com',
      'ANALYST'
    );
    expect(m1Result.success).toBe(true);
    expect(m1Result.assessment.validatedSpendCr).toBeGreaterThan(0);
    expect(m1Result.assessment.canonicalModule1).toBeDefined();
    expect(m1Result.assessment.status).toBe('ANALYSIS_IN_PROGRESS');
  });

  it('Prompt 400: runModule1() embeds canonicalModule1 in the persisted AssessmentAnalysisRun', () => {
    // Run Module 1 on the VGT assessment (always available in seed)
    const m1Result = assessmentWorkflowService.runModule1(
      'AIC-2026-0001',
      'DV-001',
      'analyst@procucev.com',
      'ANALYST'
    );
    expect(m1Result.success).toBe(true);

    // Verify the run in the store has canonicalModule1 embedded
    const runs = assessmentStore.getAnalysisRuns('AIC-2026-0001');
    const activeRun = runs.find((r) => r.analysisRunId === m1Result.analysisRun.analysisRunId);
    expect(activeRun).toBeDefined();
    expect(activeRun?.canonicalModule1).toBeDefined();
    expect(activeRun?.canonicalModule1?.validFxNormalizedSpendCr).toBeGreaterThan(0);
    expect(activeRun?.canonicalModule1?.sourceRowCount).toBeGreaterThan(0);
    expect(activeRun?.canonicalModule1?.dataVersionId).toBeTruthy();
  });

  it('Prompt 400: Module1CanonicalService restores canonicalViewModel from persisted run after store reload (cold-restart simulation)', () => {
    // Step 1: Run Module 1 (populates in-memory cache AND persisted run)
    const m1Result = assessmentWorkflowService.runModule1(
      'AIC-2026-0001',
      'DV-001',
      'analyst@procucev.com',
      'ANALYST'
    );
    expect(m1Result.success).toBe(true);
    const originalSpend = m1Result.canonicalModule1.validFxNormalizedSpendCr;
    expect(originalSpend).toBeGreaterThan(0);

    // Step 2: Simulate cold restart — wipe the in-memory canonical cache entirely
    Module1CanonicalService.clearCache();
    const afterClearCached = Module1CanonicalService.getCachedViewModel();
    expect(afterClearCached).toBeNull();

    // Step 3: Reload store from disk (simulates process restart reading assessments.json)
    assessmentStore.reloadFromDisk();

    // Step 4: Attempt canonical restoration — must succeed using persisted run data
    const restored = Module1CanonicalService.getCanonicalViewModelForAssessment('AIC-2026-0001');
    expect(restored).not.toBeNull();
    expect(restored?.validFxNormalizedSpendCr).toBe(originalSpend);
    expect(restored?.sourceRowCount).toBeGreaterThan(0);
    expect(restored?.assessmentId).toBe('AIC-2026-0001');
  });
});
