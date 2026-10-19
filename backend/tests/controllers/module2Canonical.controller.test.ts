import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  getCanonicalInput,
  getOpportunityLedger,
  getBridge,
  getTop50Vendors,
  getSupplierRisk,
  getPoConsolidation,
  getRecurringSpend,
  getLineItems
} from '../../src/controllers/module2Canonical.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('module2Canonical.controller unit tests', () => {
  beforeAll(() => {
    db.getModule2CanonicalInput('AIC-2026-0001');
  }, 30000);

  it('getCanonicalInput: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getCanonicalInput(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getCanonicalInput: returns data when assessmentId is provided', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getCanonicalInput(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.sourceRowCount).toBeGreaterThan(0);
  });

  it('getOpportunityLedger: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getOpportunityLedger(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getOpportunityLedger: returns ledger when assessmentId is provided', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getOpportunityLedger(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.ledger.length).toBeGreaterThan(0);
  });

  it('getBridge: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getBridge(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getBridge: returns bridge when assessmentId is provided', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getBridge(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.totalValidatedSpendCr).toBeGreaterThan(0);
  });

  it('getTop50Vendors: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getTop50Vendors(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getTop50Vendors: returns vendors when assessmentId is provided', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getTop50Vendors(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.vendors.length).toBeGreaterThan(0);
  });

  it('getSupplierRisk: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getSupplierRisk(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getSupplierRisk: returns risk items when assessmentId is provided', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getSupplierRisk(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.risk.length).toBeGreaterThan(0);
  });

  it('getPoConsolidation: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getPoConsolidation(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getPoConsolidation: returns poItems when assessmentId is provided', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getPoConsolidation(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.poItems.length).toBeGreaterThan(0);
  });

  it('getRecurringSpend: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getRecurringSpend(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getRecurringSpend: returns recurring items when assessmentId is provided', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getRecurringSpend(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.recurring.length).toBeGreaterThan(0);
  });

  it('getLineItems: returns 400 when assessmentId is missing', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    await getLineItems(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getLineItems: returns mapped line items with pagination', async () => {
    const req: any = { query: { assessmentId: 'AIC-2026-0001', limit: '10', offset: '5' } };
    const res = mockResponse();
    await getLineItems(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.lineItems.length).toBe(10);
    expect(body.data.offset).toBe(5);
    expect(body.data.totalCount).toBeGreaterThan(0);
  });

  it('handles error in getCanonicalInput gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2CanonicalInput').mockImplementationOnce(() => {
      throw new Error("Assessment 'AIC-9999-9999' was not found in persistence store.");
    });
    const req: any = { query: { assessmentId: 'AIC-9999-9999' } };
    const res = mockResponse();
    await getCanonicalInput(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    spy.mockRestore();
  });

  it('handles unexpected 500 error in getOpportunityLedger gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2OpportunityLedger').mockImplementationOnce(() => {
      throw new Error('Database I/O error');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getOpportunityLedger(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles unexpected 500 error in getBridge gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2MathematicalBridge').mockImplementationOnce(() => {
      throw new Error('Database I/O error');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getBridge(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles unexpected 500 error in getTop50Vendors gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2Top50Vendors').mockImplementationOnce(() => {
      throw new Error('Database I/O error');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getTop50Vendors(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles unexpected 500 error in getSupplierRisk gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2SupplierRisk').mockImplementationOnce(() => {
      throw new Error('Database I/O error');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getSupplierRisk(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles unexpected 500 error in getPoConsolidation gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2PoConsolidation').mockImplementationOnce(() => {
      throw new Error('Database I/O error');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getPoConsolidation(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles unexpected 500 error in getRecurringSpend gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2RecurringSpend').mockImplementationOnce(() => {
      throw new Error('Database I/O error');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getRecurringSpend(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('handles unexpected 500 error in getLineItems gracefully', async () => {
    const spy = vi.spyOn(db, 'getModule2StrategicTransactions').mockImplementationOnce(() => {
      throw new Error('Database I/O error');
    });
    const req: any = { query: { assessmentId: 'AIC-2026-0001' } };
    const res = mockResponse();
    await getLineItems(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});
