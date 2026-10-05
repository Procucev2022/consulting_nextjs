import { describe, it, expect, beforeEach } from 'vitest';
import { AnalysisOrchestrationService } from '../../src/services/analysisOrchestrationService';
import type { AdminQualityGateChecklist } from '../../src/types/analysisOrchestration';

describe('AnalysisOrchestrationService Unit Tests', () => {
  let service: AnalysisOrchestrationService;

  beforeEach(() => {
    service = new AnalysisOrchestrationService();
  });

  it('should initialize with baseline default analysis job and seed gaps', () => {
    const jobs = service.getJobs({});
    expect(jobs.length).toBeGreaterThanOrEqual(1);

    const defaultJob = jobs[0];
    expect(defaultJob.analysisJobId).toBe('job-init-default-001');

    const details = service.getJobById(defaultJob.analysisJobId);
    expect(details).not.toBeNull();
    expect(details?.pcbiGaps.length).toBeGreaterThan(0);
    expect(details?.readiness).toBeDefined();
  });

  it('should create a new persistent analysis job from customer upload', () => {
    const job = service.createAnalysisJob({
      tenantId: 'tenant-test-123',
      customerName: 'Acme Corp',
      uploadedBy: 'user-ops@acme.com',
      originalUploadId: 'UPL-101',
      fileName: 'Spend_Data_2026.xlsx',
      fileSizeMb: 12.5,
      totalSpendCr: 450.0,
      totalTransactions: 1200
    });

    expect(job).toBeDefined();
    expect(job.tenantId).toBe('tenant-test-123');
    expect(job.status).toBe('PCBI_REVIEW_REQUIRED');
    expect(job.currentDataVersionId).toBe('v1');

    const details = service.getJobById(job.analysisJobId, 'tenant-test-123', 'USER');
    expect(details?.job.analysisJobId).toBe(job.analysisJobId);
  });

  it('should enforce tenant isolation when fetching jobs and details', () => {
    service.createAnalysisJob({
      tenantId: 'tenant-alpha',
      customerName: 'Alpha Corp',
      uploadedBy: 'user-alpha@alpha.com',
      originalUploadId: 'UPL-A',
      fileName: 'Alpha.xlsx'
    });

    service.createAnalysisJob({
      tenantId: 'tenant-beta',
      customerName: 'Beta Corp',
      uploadedBy: 'user-beta@beta.com',
      originalUploadId: 'UPL-B',
      fileName: 'Beta.xlsx'
    });

    // Customer from tenant-alpha should only see tenant-alpha jobs
    const alphaJobs = service.getJobs({ tenantId: 'tenant-alpha', role: 'USER' });
    expect(alphaJobs.every((j) => j.tenantId === 'tenant-alpha')).toBe(true);

    // Customer from tenant-beta cannot view tenant-alpha job details
    const alphaJob = alphaJobs[0];
    const deniedDetails = service.getJobById(alphaJob.analysisJobId, 'tenant-beta', 'USER');
    expect(deniedDetails).toBeNull();

    // Admin can view all jobs
    const adminJobs = service.getJobs({ role: 'ADMIN' });
    expect(adminJobs.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter jobs by status and search terms', () => {
    const filteredByStatus = service.getJobs({ status: 'PCBI_REVIEW_REQUIRED' });
    expect(filteredByStatus.every((j) => j.status === 'PCBI_REVIEW_REQUIRED')).toBe(true);

    const filteredBySearch = service.getJobs({ search: 'job-init' });
    expect(filteredBySearch.length).toBeGreaterThanOrEqual(1);
  });

  it('should calculate transparent analysis readiness summary', () => {
    const defaultJobId = 'job-init-default-001';
    const readiness = service.calculateReadiness(defaultJobId);
    expect(readiness).toBeDefined();
    expect(readiness.categoryCoveragePct).toBeGreaterThanOrEqual(0);
    expect(readiness.spendCoveragePct).toBeGreaterThanOrEqual(0);
    expect(['READY_TO_GENERATE', 'ACTION_REQUIRED']).toContain(readiness.overallReadiness);
  });

  it('should resolve PCBI gap via mapping to existing series', () => {
    const defaultJob = service.getJobs({})[0];
    const defaultJobId = defaultJob.analysisJobId;
    const gaps = service.generatePCBIGapAnalysis(defaultJobId, defaultJob.tenantId);
    const pendingGap = gaps.find((g) => g.resolutionStatus === 'PENDING') || gaps[0];

    const result = service.resolvePCBIGap(defaultJobId, pendingGap.gapId, 'MAP_EXISTING', {
      targetPcbiSeries: 'PCBI-SERIES-CAUSTIC-SODA-48',
      adminId: 'admin-1'
    });

    expect(result.success).toBe(true);
    expect(result.gap?.resolutionStatus).toBe('MAPPED');
    expect(result.gap?.status).toBe('PCBI_COVERED');
  });

  it('should resolve PCBI gap via exclusion with mandatory reason and validate notes', () => {
    const defaultJob = service.getJobs({})[0];
    const defaultJobId = defaultJob.analysisJobId;
    const gaps = service.generatePCBIGapAnalysis(defaultJobId, defaultJob.tenantId);
    const gap = gaps[0];

    // Fails without exclusion reason
    const failMissing = service.resolvePCBIGap(defaultJobId, gap.gapId, 'EXCLUDE', {
      adminId: 'admin-1'
    });
    expect(failMissing.success).toBe(false);

    // Fails when reason is OTHER without notes
    const failOtherWithoutNotes = service.resolvePCBIGap(defaultJobId, gap.gapId, 'EXCLUDE', {
      exclusionReason: 'OTHER',
      exclusionNotes: '',
      adminId: 'admin-1'
    });
    expect(failOtherWithoutNotes.success).toBe(false);

    // Succeeds when reason is valid
    const successExclude = service.resolvePCBIGap(defaultJobId, gap.gapId, 'EXCLUDE', {
      exclusionReason: 'SERVICE',
      exclusionNotes: 'Non-commodity service contract',
      adminId: 'admin-1'
    });
    expect(successExclude.success).toBe(true);
    expect(successExclude.gap?.resolutionStatus).toBe('EXCLUDED');

    // Research requested action
    const reqResearch = service.resolvePCBIGap(defaultJobId, gap.gapId, 'REQUEST_RESEARCH', {
      researchNotes: 'Initiate commodity research for grade 65%',
      adminId: 'admin-1'
    });
    expect(reqResearch.success).toBe(true);
    expect(reqResearch.gap?.resolutionStatus).toBe('RESEARCH_REQUESTED');
  });

  it('should download working dataset for correction', () => {
    const defaultJobId = 'job-init-default-001';
    const file = service.downloadWorkingDataset(defaultJobId, 'v1', 'admin-1');
    expect(file).not.toBeNull();
    expect(file?.contentType).toBe('text/csv');
    expect(file?.fileName).toContain('v1');
    expect(file?.contentBuffer.length).toBeGreaterThan(0);

    const nonExistent = service.downloadWorkingDataset('NON-EXISTENT', 'v1', 'admin-1');
    expect(nonExistent).toBeNull();
  });

  it('should upload corrected dataset, generate diff, re-run Module 1, and supersede older reports', () => {
    const defaultJobId = 'job-init-default-001';

    const result = service.uploadCorrectedDataset(defaultJobId, {
      fileName: 'Corrected_Spend.xlsx',
      reason: 'INCORRECT_CATEGORY_MAPPING',
      notes: 'Corrected MRO subcategories and updated plant mapping',
      adminId: 'admin-1'
    });

    expect(result.success).toBe(true);
    expect(result.newVersion.versionId).toBe('v2');
    expect(result.newVersion.source).toBe('ADMIN_CORRECTION');
    expect(result.diff).toBeDefined();
    expect(result.diff.previousVersionId).toBe('v1');
    expect(result.diff.newVersionId).toBe('v2');

    const job = service.getJobById(defaultJobId)?.job;
    expect(job?.currentDataVersionId).toBe('v2');
    expect(job?.module1VersionId).toBe('m1-v2');
  });

  it('should block report generation if gaps are pending, and succeed once gaps are resolved', () => {
    const defaultJob = service.getJobs({})[0];
    const defaultJobId = defaultJob.analysisJobId;
    const defaultTenantId = defaultJob.tenantId;

    // When there are pending gaps, generation should be blocked
    const gaps = service.generatePCBIGapAnalysis(defaultJobId, defaultTenantId);
    const hasPending = gaps.some((g) => g.resolutionStatus === 'PENDING');
    if (hasPending) {
      const blockedResult = service.generateReport(defaultJobId, 'admin-1');
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.message).toContain('Cannot generate report');
    }

    // Resolve all gaps
    gaps.forEach((g) => {
      service.resolvePCBIGap(defaultJobId, g.gapId, 'MAP_EXISTING', {
        targetPcbiSeries: 'PCBI-SERIES-FE-MOLY-65',
        adminId: 'admin-1'
      });
    });

    const successResult = service.generateReport(defaultJobId, 'admin-1');
    expect(successResult.success).toBe(true);
    expect(successResult.report).toBeDefined();
    expect(successResult.report?.isCustomerVisible).toBe(false); // Customer CANNOT see unapproved report
    expect(successResult.report?.status).toBe('GENERATED_PENDING_ADMIN_REVIEW');

    // Customer query should not see the unapproved report
    const customerView = service.getJobById(defaultJobId, defaultTenantId, 'USER');
    expect(customerView?.reports.length).toBe(0);

    // Admin query sees the report
    const adminView = service.getJobById(defaultJobId, defaultTenantId, 'ADMIN');
    expect(adminView?.reports.length).toBeGreaterThan(0);
  });

  it('should confirm quality gate and approve/submit report to customer', async () => {
    const defaultJob = service.getJobs({})[0];
    const defaultJobId = defaultJob.analysisJobId;
    const defaultTenantId = defaultJob.tenantId;

    // Resolve all gaps and generate report
    const gaps = service.generatePCBIGapAnalysis(defaultJobId, defaultTenantId);
    gaps.forEach((g) => {
      service.resolvePCBIGap(defaultJobId, g.gapId, 'MAP_EXISTING', {
        targetPcbiSeries: 'PCBI-SERIES-FE-MOLY-65',
        adminId: 'admin-1'
      });
    });

    const genResult = service.generateReport(defaultJobId, 'admin-1');
    const reportVersionId = genResult.report!.reportVersionId;

    // Approving before confirming checklist should fail
    const unconfirmedSubmit = await service.approveAndSubmitReport(defaultJobId, reportVersionId, 'admin-1');
    expect(unconfirmedSubmit.success).toBe(false);
    expect(unconfirmedSubmit.message).toContain('Quality Gate checklist must be confirmed first');

    // Confirm Quality Gate Checklist
    const fullChecklist: AdminQualityGateChecklist = {
      dataQuality: {
        sourceDataValidated: true,
        spendReconciles: true,
        duplicateChecksCompleted: true,
        classificationReviewed: true
      },
      pcbi: {
        requiredPcbiCategoriesResolved: true,
        benchmarkSourcesValidated: true,
        exclusionsDocumented: true,
        pcbiCoverageAcceptable: true
      },
      financial: {
        savingsCalculationsValidated: true,
        noDoubleCounting: true,
        overlapsHandled: true,
        exclusionsApplied: true,
        totalsReconcile: true
      },
      report: {
        module1Reviewed: true,
        module2Reviewed: true,
        module3Reviewed: true,
        module4Reviewed: true,
        executiveSummaryReviewed: true
      }
    };
    const confirmResult = service.confirmQualityGate(defaultJobId, fullChecklist, 'admin-1');
    expect(confirmResult.success).toBe(true);

    // Now approval should succeed and notify customer
    const submitResult = await service.approveAndSubmitReport(defaultJobId, reportVersionId, 'admin-1');
    expect(submitResult.success).toBe(true);

    // Customer can now view the submitted report
    const customerView = service.getJobById(defaultJobId, defaultTenantId, 'USER');
    expect(customerView?.reports.length).toBe(1);
    expect(customerView?.reports[0].isCustomerVisible).toBe(true);

    // Resend email notification
    const resendResult = await service.resendReportNotification(defaultJobId, reportVersionId, 'admin-1');
    expect(resendResult.success).toBe(true);
  });

  it('should record customer view, acknowledgement, and customer correction request', async () => {
    const defaultJob = service.getJobs({})[0];
    const defaultJobId = defaultJob.analysisJobId;
    const defaultTenantId = defaultJob.tenantId;

    // Resolve gaps, generate report and submit so report is ready
    const gaps = service.generatePCBIGapAnalysis(defaultJobId, defaultTenantId);
    gaps.forEach((g) => {
      service.resolvePCBIGap(defaultJobId, g.gapId, 'MAP_EXISTING', {
        targetPcbiSeries: 'PCBI-SERIES-FE-MOLY-65',
        adminId: 'admin-1'
      });
    });
    const genResult = service.generateReport(defaultJobId, 'admin-1');
    const reportVersionId = genResult.report!.reportVersionId;

    service.confirmQualityGate(defaultJobId, {
      dataQuality: { sourceDataValidated: true, spendReconciles: true, duplicateChecksCompleted: true, classificationReviewed: true },
      pcbi: { requiredPcbiCategoriesResolved: true, benchmarkSourcesValidated: true, exclusionsDocumented: true, pcbiCoverageAcceptable: true },
      financial: { savingsCalculationsValidated: true, noDoubleCounting: true, overlapsHandled: true, exclusionsApplied: true, totalsReconcile: true },
      report: { module1Reviewed: true, module2Reviewed: true, module3Reviewed: true, module4Reviewed: true, executiveSummaryReviewed: true }
    }, 'admin-1');

    await service.approveAndSubmitReport(defaultJobId, reportVersionId, 'admin-1');

    // Record customer view
    service.recordCustomerView(defaultJobId, reportVersionId, 'usr-cfo', defaultTenantId);
    const jobAfterView = service.getJobById(defaultJobId)?.job;
    expect(jobAfterView?.status).toBe('CUSTOMER_VIEWED');

    // Record acknowledgement
    const ackResult = service.acknowledgeReport(defaultJobId, {
      reportVersionId,
      userId: 'usr-cfo',
      userName: 'CFO Enterprise',
      tenantId: defaultTenantId,
      notes: 'Reviewed and confirmed receipt'
    });
    expect(ackResult.success).toBe(true);
    expect(ackResult.acknowledgement.status).toBe('ACKNOWLEDGED');

    // Customer correction request
    const corrResult = service.requestCorrection(defaultJobId, {
      userId: 'usr-cfo',
      tenantId: defaultTenantId,
      category: 'SUPPLIER_MAPPING',
      description: 'Vendor ABC was classified under logistics instead of raw material',
      supportingFileName: 'vendor_annexure.pdf'
    });
    expect(corrResult.success).toBe(true);
    expect(corrResult.request.status).toBe('OPEN');
  });

  it('should supersede report upon admin request', () => {
    const defaultJob = service.getJobs({})[0];
    const defaultJobId = defaultJob.analysisJobId;
    const defaultTenantId = defaultJob.tenantId;

    const gaps = service.generatePCBIGapAnalysis(defaultJobId, defaultTenantId);
    gaps.forEach((g) => {
      service.resolvePCBIGap(defaultJobId, g.gapId, 'MAP_EXISTING', {
        targetPcbiSeries: 'PCBI-SERIES-FE-MOLY-65',
        adminId: 'admin-1'
      });
    });
    const genResult = service.generateReport(defaultJobId, 'admin-1');
    const reportVersionId = genResult.report!.reportVersionId;

    const result = service.supersedeReport(defaultJobId, reportVersionId, 'Client data amendment', 'admin-1');
    expect(result.success).toBe(true);
  });

  it('should retrieve admin KPIs, notifications, and audit trail', () => {
    const kpis = service.getAdminKPIs();
    expect(kpis.totalAnalyses).toBeGreaterThanOrEqual(1);

    const adminNotifs = service.getNotifications('ADMIN');
    expect(adminNotifs.length).toBeGreaterThanOrEqual(1);

    const auditTrail = service.getAuditTrail();
    expect(auditTrail.length).toBeGreaterThan(0);
  });
});
