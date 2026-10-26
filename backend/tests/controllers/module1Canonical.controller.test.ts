import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCanonicalModule1 } from '../../src/controllers/module1Canonical.controller';
import { Module1CanonicalService } from '../../src/services/module1CanonicalService';
import { AssessmentStore } from '../../src/services/assessmentStore';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('module1Canonical.controller (Prompt 381 Section 5)', () => {
  const assessmentStore = AssessmentStore.getInstance();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects with HTTP 400 when assessment identifier is omitted (zero VGT fallback)', async () => {
    const req: any = { headers: {}, query: {} };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.message).toContain('Missing assessment identifier');
  });

  it('rejects with HTTP 400 when assessment identifier is malformed', async () => {
    const req: any = { headers: { 'x-assessment-id': 'INVALID@@IDENTIFIER' } };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.message).toContain('Malformed assessment identifier');
  });

  it('rejects with HTTP 404 when assessment is unknown', async () => {
    const req: any = { headers: { 'x-assessment-id': 'AIC-9999-9999' } };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.message).toContain("Assessment 'AIC-9999-9999' not found");
  });

  it('returns HTTP 200 with data: null when assessment exists but has no analysis run', async () => {
    vi.spyOn(assessmentStore, 'getAssessmentById').mockReturnValueOnce({
      assessmentId: 'AIC-2026-9999',
      customerName: 'Pending Customer',
      status: 'INTAKE'
    } as any);
    vi.spyOn(Module1CanonicalService, 'getCanonicalViewModelForAssessment').mockReturnValueOnce(null);

    const req: any = { headers: { 'x-assessment-id': 'AIC-2026-9999' } };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
    expect(body.message).toContain("No analysis run executed for assessment 'AIC-2026-9999'");
  });

  it('returns ABC Textile canonical data for AIC-2026-0002 without cross-contamination', async () => {
    vi.spyOn(assessmentStore, 'getAssessmentById').mockReturnValueOnce({
      assessmentId: 'AIC-2026-0002',
      customerName: 'ABC Textile Ltd',
      status: 'IN_ANALYSIS'
    } as any);

    const mockAbcVm: any = {
      assessmentId: 'AIC-2026-0002',
      sourceFileName: 'Textile1.xlsx',
      sourceRowCount: 23570,
      validRowCount: 23570,
      validFxNormalizedSpendCr: 613.8805,
      profileFxBaselineSpendCr: 613.8805,
      fxNormalizationImpactCr: 0.0,
      fxNormalizationImpactStatus: 'NOT_CALCULATED'
    };
    vi.spyOn(Module1CanonicalService, 'getCanonicalViewModelForAssessment').mockReturnValueOnce(mockAbcVm);

    const req: any = { headers: { 'x-assessment-id': 'AIC-2026-0002' } };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.assessmentId).toBe('AIC-2026-0002');
    expect(body.data.sourceFileName).toBe('Textile1.xlsx');
    expect(body.data.validRowCount).toBe(23570);
    expect(body.data.validFxNormalizedSpendCr).toBeCloseTo(613.8805, 3);
    // Strict isolation assertion: must not contain VGT test fixture data
    expect(body.data.sourceFileName).not.toBe('VGT Testing Data.xlsx');
    expect(body.data.validRowCount).not.toBe(20241);
  });

  it('returns VGT canonical data for AIC-2026-0001 with explicit header', async () => {
    vi.spyOn(assessmentStore, 'getAssessmentById').mockReturnValueOnce({
      assessmentId: 'AIC-2026-0001',
      customerName: 'VGT Test Benchmark',
      isTestData: true,
      status: 'COMPLETED'
    } as any);

    const mockVgtVm: any = {
      assessmentId: 'AIC-2026-0001',
      sourceFileName: 'VGT Testing Data.xlsx',
      sourceRowCount: 20241,
      validRowCount: 20241,
      validFxNormalizedSpendCr: 4073.83,
      profileFxBaselineSpendCr: 3920.33,
      fxNormalizationImpactCr: 153.5,
      isTestData: true
    };
    vi.spyOn(Module1CanonicalService, 'getCanonicalViewModelForAssessment').mockReturnValueOnce(mockVgtVm);

    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.assessmentId).toBe('AIC-2026-0001');
    expect(body.data.validRowCount).toBe(20241);
    expect(body.data.validFxNormalizedSpendCr).toBeCloseTo(4073.83, 1);
    // Strict isolation assertion: must not contain ABC Textile data
    expect(body.data.sourceFileName).not.toBe('Textile1.xlsx');
    expect(body.data.validRowCount).not.toBe(23570);
  });

  it('handles unexpected exceptions and returns HTTP 500', async () => {
    vi.spyOn(assessmentStore, 'getAssessmentById').mockImplementationOnce(() => {
      throw new Error('Database connection failure');
    });

    const req: any = { headers: { 'x-assessment-id': 'AIC-2026-0002' } };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('Database connection failure');
  });

  it('handles non-Error throw gracefully with HTTP 500', async () => {
    vi.spyOn(assessmentStore, 'getAssessmentById').mockImplementationOnce(() => {
      throw 'string exception';
    });

    const req: any = { headers: { 'x-assessment-id': 'AIC-2026-0002' } };
    const res = mockResponse();

    await getCanonicalModule1(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('Unknown error');
  });
});
