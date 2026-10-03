import { describe, it, expect, vi } from 'vitest';
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
  it('getDashboardSummary: successfully returns 10 KPI summary cards', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getDashboardSummary(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.totalAddressableSpendInr).toBeGreaterThan(0);
    expect(body.data.netQuantifiableOpportunityInr).toBeGreaterThan(0);
  });

  it('getCategoryProfiles: returns all profiles and count', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getCategoryProfiles(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.profiles.length).toBeGreaterThan(0);
  });

  it('getCategoryProfileById: returns 400 when id is missing', async () => {
    const req: any = { params: {} };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getCategoryProfileById: returns 404 when category not found', async () => {
    const req: any = { params: { id: 'NON_EXISTENT_CATEGORY' } };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getCategoryProfileById: returns profile when valid identifier is given', async () => {
    const analysis = db.getModule2StrategicSourcingAnalysis();
    const validProfile = analysis.profiles[0];
    const req: any = { params: { id: validProfile.categoryId } };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.categoryName).toBe(validProfile.categoryName);
  });

  it('getSupplierDeepDive: aggregates suppliers across categories', async () => {
    const req: any = {};
    const res = mockResponse();

    await getSupplierDeepDive(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.suppliers.length).toBeGreaterThan(0);
  });

  it('getHandoffPackages: returns Module 4 packages', async () => {
    const req: any = {};
    const res = mockResponse();

    await getHandoffPackages(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.packages.length).toBeGreaterThan(0);
  });

  it('exportSourcingReport: exports full immutable audit dossier', async () => {
    const req: any = {};
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
    const req: any = { query: {} };
    const res = mockResponse();

    await getDashboardSummary(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in getCategoryProfiles gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = { query: {} };
    const res = mockResponse();

    await getCategoryProfiles(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in getCategoryProfileById gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicProfile').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = { params: { id: 'CAT-1' } };
    const res = mockResponse();

    await getCategoryProfileById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in getSupplierDeepDive gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = {};
    const res = mockResponse();

    await getSupplierDeepDive(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in getHandoffPackages gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2HandoffPackages').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = {};
    const res = mockResponse();

    await getHandoffPackages(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles error in exportSourcingReport gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicSourcingAnalysis').mockImplementationOnce(() => {
      throw new Error('Failed');
    });
    const req: any = {};
    const res = mockResponse();

    await exportSourcingReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});
