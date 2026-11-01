import { describe, it, expect, vi } from 'vitest';
import { getExecutiveReport } from '../../src/controllers/report.controller';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('report.controller', () => {
  it('should reject request when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getExecutiveReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('Assessment ID is required');
  });

  it('should return 404 when assessment does not exist', async () => {
    const req: any = { query: { assessmentId: 'AIC-NON-EXISTENT-9999' } };
    const res = mockResponse();

    await getExecutiveReport(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('not found in persistence store');
  });

  it('should generate authoritative report for Borosil Ltd (AIC-2026-0002)', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0002' } };
    const res = mockResponse();

    await getExecutiveReport(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);

    const report = body.data;
    expect(report.tenant.tenant_id).toBe('CUST-2026-0002');
    expect(report.tenant.enterprise_name).toBe('Borosil Ltd');
    expect(report.tenant.assessment_id).toBe('AIC-2026-0002');

    // Module 1 verification
    expect(report.executiveSummary.totalSpendEvaluatedCr).toBeCloseTo(556.5346, 2);
    expect(report.executiveSummary.totalLineItemsAudited).toBe(27777);
    expect(report.executiveSummary.totalMaterialsCatalogCount).toBe(8976);

    // Module 3 verification
    expect(report.pcbiBenchmarkCoverage.approvedPct).toBe(0);
    expect(report.pcbiBenchmarkCoverage.status).toBe('Assessment Completed — Benchmark Data Unavailable for Assessment Period');

    // Module 4 verification
    expect(report.module4SavingsStatus.status).toBe('ACTIVATED');
    expect(report.module4SavingsStatus.isActivated).toBe(true);
    expect(report.module4SavingsStatus.netOpportunityCr).toBe(87.1);
  }, 90000);

  it('should generate authoritative report for VGT (AIC-2026-0001) with activated Module 4', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getExecutiveReport(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);

    const report = body.data;
    expect(report.tenant.tenant_id).toBeDefined();
    expect(report.tenant.assessment_id).toBe('AIC-2026-0001');
    expect(report.module4SavingsStatus.status).toBe('ACTIVATED');
    expect(report.module4SavingsStatus.isActivated).toBe(true);
  }, 90000);

  it('should handle unexpected service errors gracefully with 500 status', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0002' } };
    const res = mockResponse();
    const spy = vi.spyOn(Module2CanonicalService, 'getSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Database connection failed');
    });

    await getExecutiveReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe('Database connection failed');
    spy.mockRestore();
  });

  it('should handle non-Error throw gracefully', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0002' } };
    const res = mockResponse();
    const spy = vi.spyOn(Module2CanonicalService, 'getSourcingAnalysis').mockImplementationOnce(() => {
      throw 'Raw string exception';
    });

    await getExecutiveReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe('Failed to generate report');
    spy.mockRestore();
  });
});
