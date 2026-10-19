import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  getDashboardSummary,
  getCategoryProfiles,
  getCategoryProfileById,
  getSupplierDeepDive,
  getHandoffPackages,
  exportSourcingReport
} from '../../src/controllers/module2StrategicSourcing.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('module2StrategicSourcing.controller', () => {
  beforeAll(() => {
    db.getModule2StrategicSourcingAnalysis('AIC-2026-0001');
  }, 30000);

  it('getDashboardSummary: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getDashboardSummary(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('assessmentId');
  });

  it('getDashboardSummary: successfully returns 10 KPI summary cards with assessmentId', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getDashboardSummary(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.totalAddressableSpendInr).toBeGreaterThan(0);
    expect(body.data.netQuantifiableOpportunityInr).toBeGreaterThan(0);
  });

  it('getCategoryProfiles: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getCategoryProfiles(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getCategoryProfiles: returns all profiles and count with assessmentId', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getCategoryProfiles(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.profiles.length).toBeGreaterThan(0);
  });

  it('getCategoryProfileById: returns 400 when id is missing', async () => {
    const req: any = { params: {}, query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getCategoryProfileById: returns 400 when assessmentId is missing', async () => {
    const req: any = { params: { id: 'CAT-1' }, query: {} };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getCategoryProfileById: returns 404 when category not found', async () => {
    const req: any = {
      params: { id: 'NON_EXISTENT_CATEGORY' },
      query: { assessmentId: 'AIC-2026-0001' }
    };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getCategoryProfileById: returns profile when valid identifier is given', async () => {
    const analysis = db.getModule2StrategicSourcingAnalysis('AIC-2026-0001');
    const validProfile = analysis.profiles[0];
    const req: any = {
      params: { id: validProfile.categoryId },
      query: { assessmentId: 'AIC-2026-0001' }
    };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.categoryName).toBe(validProfile.categoryName);
  });

  it('getSupplierDeepDive: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getSupplierDeepDive(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getSupplierDeepDive: aggregates suppliers across categories', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getSupplierDeepDive(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.suppliers.length).toBeGreaterThan(0);
  });

  it('getHandoffPackages: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getHandoffPackages(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getHandoffPackages: returns Module 4 packages', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getHandoffPackages(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.packages.length).toBeGreaterThan(0);
  });

  it('exportSourcingReport: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await exportSourcingReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('exportSourcingReport: exports full immutable audit dossier', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await exportSourcingReport(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.exportVersion).toBe('MODULE_2_SOURCING_LOGIC_V1.0');
    expect(body.data.summary).toBeDefined();
    expect(body.data.profiles.length).toBeGreaterThan(0);
  });

  it('handles error in getDashboardSummary gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Database connection failed');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getDashboardSummary(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles not found error gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error("Assessment 'AIC-9999-9999' was not found in persistence store.");
    });
    const req: any = { query: { assessmentId: 'AIC-9999-9999' } };
    const res = mockResponse();

    await getDashboardSummary(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    spy.mockRestore();
  });

  it('handles error in getCategoryProfiles gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getCategoryProfiles(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in getCategoryProfileById gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicProfile').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = { params: { id: 'CAT-1' }, query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in getSupplierDeepDive gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getSupplierDeepDive(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in getHandoffPackages gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2HandoffPackages').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await getHandoffPackages(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in exportSourcingReport gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();

    await exportSourcingReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});
