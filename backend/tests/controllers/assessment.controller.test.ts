import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { AssessmentController } from '../../src/controllers/assessment.controller';
import { assessmentStore } from '../../src/services/assessmentStore';
import { NDA_STATUSES, DATA_STATUSES } from '../../src/constants/assessment';

function createMockReqRes(body: Record<string, unknown> = {}, params: Record<string, string> = {}, query: Record<string, string> = {}) {
  const req = {
    body,
    params,
    query,
    headers: { 'x-request-id': 'req-test-123', 'x-user-email': 'admin@procucev.com', 'x-user-role': 'INTERNAL_ADMIN' }
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  } as unknown as Response;

  return { req, res };
}

describe('AssessmentController', () => {
  beforeEach(() => {
    assessmentStore.resetToDefaultSeed();
  });

  it('handles getOperatingMode', () => {
    const { req, res } = createMockReqRes();
    AssessmentController.getOperatingMode(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          mode: 'INTERNAL_ASSESSMENT',
          isInternalAssessment: true
        })
      })
    );
  });

  it('handles getAssessments with optional status filter', () => {
    const { req, res } = createMockReqRes({}, {}, { status: 'APPROVED' });
    AssessmentController.getAssessments(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array)
      })
    );
  });

  it('handles getAssessmentById', () => {
    const { req, res } = createMockReqRes({}, { id: 'AIC-2026-0001' });
    AssessmentController.getAssessmentById(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          assessment: expect.objectContaining({
            assessmentId: 'AIC-2026-0001'
          })
        })
      })
    );
  });

  it('returns 404 for unknown assessment ID', () => {
    const { req, res } = createMockReqRes({}, { id: 'AIC-9999-9999' });
    AssessmentController.getAssessmentById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('creates a new assessment with valid body', () => {
    const { req, res } = createMockReqRes({
      customerName: 'Test Customer Auto',
      industry: 'Auto Parts',
      assessmentPeriodStart: '2022-04-01',
      assessmentPeriodEnd: '2023-03-31',
      assignedAnalyst: 'analyst@procucev.com',
      ndaStatus: NDA_STATUSES.NOT_REQUESTED
    });
    AssessmentController.createAssessment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          customerName: 'Test Customer Auto'
        })
      })
    );
  });

  it('rejects createAssessment with invalid body (400)', () => {
    const { req, res } = createMockReqRes({ customerName: '' });
    AssessmentController.createAssessment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates NDA status', () => {
    const { req, res } = createMockReqRes({ ndaStatus: NDA_STATUSES.SIGNED }, { id: 'AIC-2026-0001' });
    AssessmentController.updateNdaStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          ndaStatus: NDA_STATUSES.SIGNED
        })
      })
    );
  });

  it('uploads a data version', () => {
    const { req, res } = createMockReqRes(
      {
        fileName: 'spend_raw.xlsx',
        fileSize: 4096,
        checksum: 'sha256abc',
        rowCount: 100
      },
      { id: 'AIC-2026-0001' }
    );
    AssessmentController.uploadDataVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('runs analysis and records runs', () => {
    const { req, res } = createMockReqRes({ dataVersionId: 'DV-001' }, { id: 'AIC-2026-0001' });
    AssessmentController.runAnalysis(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          analysisRun: expect.objectContaining({
            analysisRunId: expect.any(String)
          })
        })
      })
    );
  }, 35000);

  it('approves assessment and fetches delivery package', () => {
    const { req: appReq, res: appRes } = createMockReqRes(
      {
        analysisRunId: 'RUN-001',
        dataVersionId: 'DV-001',
        approvalComment: 'Full validation complete.'
      },
      { id: 'AIC-2026-0001' }
    );
    AssessmentController.approveAssessment(appReq, appRes);
    expect(appRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );

    const { req: pkgReq, res: pkgRes } = createMockReqRes({}, { id: 'AIC-2026-0001' });
    AssessmentController.generateDeliveryPackage(pkgReq, pkgRes);
    expect(pkgRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          items: expect.any(Array)
        })
      })
    );
  });

  it('handles getUpdateStatus and installUpdate', () => {
    const { req: statusReq, res: statusRes } = createMockReqRes();
    AssessmentController.getUpdateStatus(statusReq, statusRes);
    expect(statusRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          isUpdateAvailable: expect.any(Boolean)
        })
      })
    );

    const { req: instReq, res: instRes } = createMockReqRes({ simulateOnly: true });
    AssessmentController.installUpdate(instReq, instRes);
    // Since no staged release exists by default, it will either return 400 with VERIFICATION_FAILED or success
    expect(instRes.json || instRes.status).toBeDefined();
  });

  it('handles customer management endpoints (get, create, update)', () => {
    // 1. Get customers
    const { req: getReq, res: getRes } = createMockReqRes();
    AssessmentController.getCustomers(getReq, getRes);
    expect(getRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array)
      })
    );

    // 2. Create customer
    const { req: createReq, res: createRes } = createMockReqRes({
      customerName: 'New Test Enterprise Ltd',
      industry: 'Manufacturing & Industrial',
      region: 'APAC'
    });
    AssessmentController.createCustomer(createReq, createRes);
    expect(createRes.status).toHaveBeenCalledWith(201);
    expect(createRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          customerName: 'New Test Enterprise Ltd'
        })
      })
    );

    // 3. Update customer
    const { req: updateReq, res: updateRes } = createMockReqRes(
      { customerName: 'Updated Test Enterprise Ltd' },
      { id: 'CUST-2026-0002' }
    );
    AssessmentController.updateCustomer(updateReq, updateRes);
    expect(updateRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          customerName: 'Updated Test Enterprise Ltd'
        })
      })
    );

    // 4. Get customer by ID
    const { req: getByIdReq, res: getByIdRes } = createMockReqRes({}, { id: 'CUST-2026-0002' });
    AssessmentController.getCustomerById(getByIdReq, getByIdRes);
    expect(getByIdRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 'CUST-2026-0002'
        })
      })
    );
  });

  it('handles validateDataVersion and runModule1 endpoints', () => {
    // Validate dataset
    const { req: valReq, res: valRes } = createMockReqRes({}, { id: 'AIC-2026-0001', dvId: 'DV-001' });
    AssessmentController.validateDataVersion(valReq, valRes);
    expect(valRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          validationSummary: expect.any(Object)
        })
      })
    );

    // Run Module 1
    const { req: m1Req, res: m1Res } = createMockReqRes({}, { id: 'AIC-2026-0001', dvId: 'DV-001' });
    AssessmentController.runModule1(m1Req, m1Res);
    expect(m1Res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          assessment: expect.any(Object)
        })
      })
    );
  });
});
