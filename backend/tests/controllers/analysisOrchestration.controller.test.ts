import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import * as controller from '../../src/controllers/analysisOrchestration.controller';
import { analysisOrchestrationService } from '../../src/services/analysisOrchestrationService';

const defaultJob = analysisOrchestrationService.getJobs({})[0];
const defaultJobId = defaultJob.analysisJobId;
const defaultTenantId = defaultJob.tenantId;

const createMockReqRes = (overrides: Partial<Request> = {}): {
  req: Request;
  res: Response;
  jsonMock: any;
  statusMock: any;
  sendMock: any;
  setHeaderMock: any;
} => {
  const jsonMock = vi.fn();
  const sendMock = vi.fn();
  const setHeaderMock = vi.fn();
  const statusMock = vi.fn().mockReturnThis();

  const res = {
    status: statusMock,
    json: jsonMock,
    send: sendMock,
    setHeader: setHeaderMock
  } as unknown as Response;

  const req = {
    headers: {
      'x-user-role': 'ADMIN',
      'x-tenant-id': defaultTenantId,
      'x-user-id': 'usr-admin-1',
      'x-user-name': 'Sriman Admin'
    },
    params: {},
    query: {},
    body: {},
    ...overrides
  } as unknown as Request;

  return { req, res, jsonMock, statusMock, sendMock, setHeaderMock };
};

describe('AnalysisOrchestration Controller Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should get analysis jobs with success response', async () => {
    const { req, res, jsonMock } = createMockReqRes({
      query: { status: 'ALL' }
    });

    await controller.getJobs(req, res);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Array)
    }));
  });

  it('should handle error when getting jobs', async () => {
    vi.spyOn(analysisOrchestrationService, 'getJobs').mockImplementationOnce(() => {
      throw new Error('Database disconnected');
    });
    const { req, res, statusMock, jsonMock } = createMockReqRes();
    await controller.getJobs(req, res);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should get job details for existing job', async () => {
    const { req, res, jsonMock } = createMockReqRes({
      params: { jobId: defaultJobId }
    });

    await controller.getJobDetails(req, res);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        job: expect.objectContaining({ analysisJobId: defaultJobId })
      })
    }));
  });

  it('should return 404 for non-existent job details', async () => {
    const { req, res, statusMock, jsonMock } = createMockReqRes({
      params: { jobId: 'NON-EXISTENT' }
    });

    await controller.getJobDetails(req, res);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('not found')
    }));
  });

  it('should handle error in getJobDetails', async () => {
    vi.spyOn(analysisOrchestrationService, 'getJobById').mockImplementationOnce(() => {
      throw new Error('Disk read error');
    });
    const { req, res, statusMock, jsonMock } = createMockReqRes({ params: { jobId: defaultJobId } });
    await controller.getJobDetails(req, res);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should get readiness metrics for a job and handle errors', async () => {
    const { req, res, jsonMock } = createMockReqRes({
      params: { jobId: defaultJobId }
    });

    await controller.getReadiness(req, res);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Object)
    }));

    vi.spyOn(analysisOrchestrationService, 'calculateReadiness').mockImplementationOnce(() => {
      throw new Error('Readiness calculation failed');
    });
    const errReqRes = createMockReqRes({ params: { jobId: defaultJobId } });
    await controller.getReadiness(errReqRes.req, errReqRes.res);
    expect(errReqRes.statusMock).toHaveBeenCalledWith(500);
  });

  it('should forbid non-admin from resolving PCBI gap', async () => {
    const { req, res, statusMock, jsonMock } = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId, gapId: `gap-${defaultJobId}-01` },
      body: { action: 'EXCLUDE', exclusionReason: 'SERVICE' }
    });

    await controller.resolvePCBIGap(req, res);
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Forbidden')
    }));
  });

  it('should validate PCBI gap payload and handle resolution errors', async () => {
    const badBodyReq = createMockReqRes({
      params: { jobId: defaultJobId, gapId: `gap-${defaultJobId}-01` },
      body: { action: 'INVALID_ACTION' }
    });
    await controller.resolvePCBIGap(badBodyReq.req, badBodyReq.res);
    expect(badBodyReq.statusMock).toHaveBeenCalledWith(400);

    vi.spyOn(analysisOrchestrationService, 'resolvePCBIGap').mockImplementationOnce(() => {
      throw new Error('Gap resolve crash');
    });
    const errReqRes = createMockReqRes({
      params: { jobId: defaultJobId, gapId: `gap-${defaultJobId}-01` },
      body: { action: 'EXCLUDE', exclusionReason: 'CUSTOM_ENGINEERED_ITEM' }
    });
    await controller.resolvePCBIGap(errReqRes.req, errReqRes.res);
    expect(errReqRes.statusMock).toHaveBeenCalledWith(500);
  });

  it('should allow admin to resolve PCBI gap with map action', async () => {
    const { req, res, jsonMock } = createMockReqRes({
      params: { jobId: defaultJobId, gapId: `gap-${defaultJobId}-01` },
      body: {
        action: 'MAP_EXISTING',
        targetPcbiSeries: 'PCBI-CHEM-SPEC-01'
      }
    });

    await controller.resolvePCBIGap(req, res);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });

  it('should handle downloadWorkingDataset for admin and 404 for missing', async () => {
    const { req, res, sendMock, setHeaderMock } = createMockReqRes({
      params: { jobId: defaultJobId, versionId: 'v1' }
    });

    await controller.downloadWorkingDataset(req, res);
    expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(sendMock).toHaveBeenCalled();

    // 404 for missing version
    const notFoundReq = createMockReqRes({
      params: { jobId: defaultJobId, versionId: 'v999_missing' }
    });
    await controller.downloadWorkingDataset(notFoundReq.req, notFoundReq.res);
    expect(notFoundReq.statusMock).toHaveBeenCalledWith(404);

    // 403 for non-admin
    const nonAdminReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId, versionId: 'v1' }
    });
    await controller.downloadWorkingDataset(nonAdminReq.req, nonAdminReq.res);
    expect(nonAdminReq.statusMock).toHaveBeenCalledWith(403);

    // 500 error
    vi.spyOn(analysisOrchestrationService, 'downloadWorkingDataset').mockImplementationOnce(() => {
      throw new Error('Download crash');
    });
    const errReq = createMockReqRes({ params: { jobId: defaultJobId, versionId: 'v1' } });
    await controller.downloadWorkingDataset(errReq.req, errReq.res);
    expect(errReq.statusMock).toHaveBeenCalledWith(500);
  });

  it('should test uploadCorrectedDataset auth, validation, and error branches', async () => {
    // Non-admin 403
    const nonAdminReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId }
    });
    await controller.uploadCorrectedDataset(nonAdminReq.req, nonAdminReq.res);
    expect(nonAdminReq.statusMock).toHaveBeenCalledWith(403);

    // Invalid body 400
    const badBodyReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: { fileName: 'incomplete.csv' }
    });
    await controller.uploadCorrectedDataset(badBodyReq.req, badBodyReq.res);
    expect(badBodyReq.statusMock).toHaveBeenCalledWith(400);

    // Valid upload
    const validReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: {
        fileName: 'corrected.csv',
        fileBase64: Buffer.from('mock,csv,data').toString('base64'),
        fileSizeMb: 0.1,
        reason: 'INCORRECT_CATEGORY_MAPPING',
        notes: 'Fixed mapping'
      }
    });
    await controller.uploadCorrectedDataset(validReq.req, validReq.res);
    expect(validReq.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    // 500 error
    vi.spyOn(analysisOrchestrationService, 'uploadCorrectedDataset').mockImplementationOnce(() => {
      throw new Error('Upload crash');
    });
    const errReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: {
        fileName: 'corrected.csv',
        fileBase64: Buffer.from('mock,csv,data').toString('base64'),
        fileSizeMb: 0.1,
        reason: 'INCORRECT_CATEGORY_MAPPING',
        notes: 'Fixed mapping'
      }
    });
    await controller.uploadCorrectedDataset(errReq.req, errReq.res);
    expect(errReq.statusMock).toHaveBeenCalledWith(500);
  });

  it('should test generateReport auth, validation, and error branches', async () => {
    // Non-admin 403
    const nonAdminReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId }
    });
    await controller.generateReport(nonAdminReq.req, nonAdminReq.res);
    expect(nonAdminReq.statusMock).toHaveBeenCalledWith(403);

    // 500 error
    vi.spyOn(analysisOrchestrationService, 'generateReport').mockImplementationOnce(() => {
      throw new Error('Generate crash');
    });
    const errReq = createMockReqRes({ params: { jobId: defaultJobId } });
    await controller.generateReport(errReq.req, errReq.res);
    expect(errReq.statusMock).toHaveBeenCalledWith(500);
  });

  it('should confirm quality gate checklist and handle auth/validation errors', async () => {
    // Non-admin 403
    const nonAdminReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId }
    });
    await controller.confirmQualityGate(nonAdminReq.req, nonAdminReq.res);
    expect(nonAdminReq.statusMock).toHaveBeenCalledWith(403);

    // Incomplete checklist 400
    const badBodyReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: { dataQuality: { sourceDataValidated: false } }
    });
    await controller.confirmQualityGate(badBodyReq.req, badBodyReq.res);
    expect(badBodyReq.statusMock).toHaveBeenCalledWith(400);

    // Complete checklist
    const validBody = {
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
    const { req, res, jsonMock } = createMockReqRes({
      params: { jobId: defaultJobId },
      body: validBody
    });
    await controller.confirmQualityGate(req, res);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    // 500 error
    vi.spyOn(analysisOrchestrationService, 'confirmQualityGate').mockImplementationOnce(() => {
      throw new Error('Gate crash');
    });
    const errReq = createMockReqRes({ params: { jobId: defaultJobId }, body: validBody });
    await controller.confirmQualityGate(errReq.req, errReq.res);
    expect(errReq.statusMock).toHaveBeenCalledWith(500);
  });

  it('should test approveAndSubmitReport auth, missing version, and error handling', async () => {
    // Non-admin 403
    const nonAdminReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId }
    });
    await controller.approveAndSubmitReport(nonAdminReq.req, nonAdminReq.res);
    expect(nonAdminReq.statusMock).toHaveBeenCalledWith(403);

    // Missing reportVersionId 400
    const missingVerReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: {}
    });
    await controller.approveAndSubmitReport(missingVerReq.req, missingVerReq.res);
    expect(missingVerReq.statusMock).toHaveBeenCalledWith(400);

    // 500 error
    vi.spyOn(analysisOrchestrationService, 'approveAndSubmitReport').mockImplementationOnce(async () => {
      throw new Error('Approval crash');
    });
    const errReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: { reportVersionId: 'RPT-123' }
    });
    await controller.approveAndSubmitReport(errReq.req, errReq.res);
    expect(errReq.statusMock).toHaveBeenCalledWith(500);
  });

  it('should test resendNotification auth, failure, and error handling', async () => {
    // Non-admin 403
    const nonAdminReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId }
    });
    await controller.resendNotification(nonAdminReq.req, nonAdminReq.res);
    expect(nonAdminReq.statusMock).toHaveBeenCalledWith(403);

    // 500 error
    vi.spyOn(analysisOrchestrationService, 'resendReportNotification').mockImplementationOnce(async () => {
      throw new Error('Resend crash');
    });
    const errReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: { reportVersionId: 'RPT-123' }
    });
    await controller.resendNotification(errReq.req, errReq.res);
    expect(errReq.statusMock).toHaveBeenCalledWith(500);
  });

  it('should test supersedeReport auth, validation, and error handling', async () => {
    // Non-admin 403
    const nonAdminReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId }
    });
    await controller.supersedeReport(nonAdminReq.req, nonAdminReq.res);
    expect(nonAdminReq.statusMock).toHaveBeenCalledWith(403);

    // Bad body 400
    const badBodyReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: {}
    });
    await controller.supersedeReport(badBodyReq.req, badBodyReq.res);
    expect(badBodyReq.statusMock).toHaveBeenCalledWith(400);

    // 500 error
    vi.spyOn(analysisOrchestrationService, 'supersedeReport').mockImplementationOnce(() => {
      throw new Error('Supersede crash');
    });
    const errReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: { reportVersionId: 'RPT-123', reason: 'Error identified in taxonomy' }
    });
    await controller.supersedeReport(errReq.req, errReq.res);
    expect(errReq.statusMock).toHaveBeenCalledWith(500);
  });

  it('should record customer view, acknowledgement, and correction request with error handling', async () => {
    const viewReqRes = createMockReqRes({
      headers: { 'x-user-role': 'USER', 'x-tenant-id': defaultTenantId, 'x-user-id': 'usr-cfo' },
      params: { jobId: defaultJobId },
      body: { reportVersionId: `RPT-${defaultTenantId}-v1` }
    });
    await controller.recordCustomerView(viewReqRes.req, viewReqRes.res);
    expect(viewReqRes.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    // View error 500
    vi.spyOn(analysisOrchestrationService, 'recordCustomerView').mockImplementationOnce(() => {
      throw new Error('View crash');
    });
    const errViewReq = createMockReqRes({
      params: { jobId: defaultJobId },
      body: { reportVersionId: `RPT-${defaultTenantId}-v1` }
    });
    await controller.recordCustomerView(errViewReq.req, errViewReq.res);
    expect(errViewReq.statusMock).toHaveBeenCalledWith(500);

    // Ack validation 400
    const badAckReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId },
      body: {}
    });
    await controller.acknowledgeReport(badAckReq.req, badAckReq.res);
    expect(badAckReq.statusMock).toHaveBeenCalledWith(400);

    // Ack success
    const ackReqRes = createMockReqRes({
      headers: { 'x-user-role': 'USER', 'x-tenant-id': defaultTenantId, 'x-user-id': 'usr-cfo', 'x-user-name': 'CFO' },
      params: { jobId: defaultJobId },
      body: { reportVersionId: `RPT-${defaultTenantId}-v1`, notes: 'Report reviewed & acknowledged' }
    });
    await controller.acknowledgeReport(ackReqRes.req, ackReqRes.res);
    expect(ackReqRes.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    // Correction request validation 400
    const badCorrReq = createMockReqRes({
      headers: { 'x-user-role': 'USER' },
      params: { jobId: defaultJobId },
      body: {}
    });
    await controller.requestCorrection(badCorrReq.req, badCorrReq.res);
    expect(badCorrReq.statusMock).toHaveBeenCalledWith(400);

    // Correction request success
    const corrReqRes = createMockReqRes({
      headers: { 'x-user-role': 'USER', 'x-tenant-id': defaultTenantId, 'x-user-id': 'usr-cfo' },
      params: { jobId: defaultJobId },
      body: {
        category: 'CLASSIFICATION_DISPUTE',
        description: 'Plant 2 fuel oil was recorded under consumables',
        supportingFileName: 'fuel_oil_grn.pdf'
      }
    });
    await controller.requestCorrection(corrReqRes.req, corrReqRes.res);
    expect(corrReqRes.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should retrieve admin KPIs, notifications, and audit trail with auth/error handling', async () => {
    // Non-admin KPI 403
    const nonAdminKpi = createMockReqRes({ headers: { 'x-user-role': 'USER' } });
    await controller.getAdminKPIs(nonAdminKpi.req, nonAdminKpi.res);
    expect(nonAdminKpi.statusMock).toHaveBeenCalledWith(403);

    const kpiReqRes = createMockReqRes();
    await controller.getAdminKPIs(kpiReqRes.req, kpiReqRes.res);
    expect(kpiReqRes.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Object) }));

    // Customer notifications
    const customerNotifReq = createMockReqRes({ headers: { 'x-user-role': 'USER', 'x-tenant-id': defaultTenantId } });
    await controller.getNotifications(customerNotifReq.req, customerNotifReq.res);
    expect(customerNotifReq.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const notifReqRes = createMockReqRes();
    await controller.getNotifications(notifReqRes.req, notifReqRes.res);
    expect(notifReqRes.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));

    // Audit trail for customer
    const custAuditReq = createMockReqRes({ headers: { 'x-user-role': 'USER', 'x-tenant-id': defaultTenantId } });
    await controller.getAuditTrail(custAuditReq.req, custAuditReq.res);
    expect(custAuditReq.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const auditReqRes = createMockReqRes();
    await controller.getAuditTrail(auditReqRes.req, auditReqRes.res);
    expect(auditReqRes.jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));

    // Error handling
    vi.spyOn(analysisOrchestrationService, 'getAdminKPIs').mockImplementationOnce(() => {
      throw new Error('KPI crash');
    });
    const errKpi = createMockReqRes();
    await controller.getAdminKPIs(errKpi.req, errKpi.res);
    expect(errKpi.statusMock).toHaveBeenCalledWith(500);

    vi.spyOn(analysisOrchestrationService, 'getNotifications').mockImplementationOnce(() => {
      throw new Error('Notif crash');
    });
    const errNotif = createMockReqRes();
    await controller.getNotifications(errNotif.req, errNotif.res);
    expect(errNotif.statusMock).toHaveBeenCalledWith(500);

    vi.spyOn(analysisOrchestrationService, 'getAuditTrail').mockImplementationOnce(() => {
      throw new Error('Audit crash');
    });
    const errAudit = createMockReqRes();
    await controller.getAuditTrail(errAudit.req, errAudit.res);
    expect(errAudit.statusMock).toHaveBeenCalledWith(500);
  });
});
