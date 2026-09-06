import { describe, it, expect, vi } from 'vitest';
import { getExecutiveReport } from '../../src/controllers/report.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('report.controller', () => {
  it('should generate executive report successfully', async () => {
    const req: any = {};
    const res = mockResponse();

    await getExecutiveReport(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.executiveSummary).toBeDefined();
    expect(body.data.categoryHighlights).toBeDefined();
    expect(body.data.topVendorRisks).toBeDefined();
  });

  it('should fallback to 428.5 and Direct Materials when tenant spend and categories are missing', async () => {
    const req: any = {};
    const res = mockResponse();
    const spyTenant = vi.spyOn(db, 'getTenant').mockReturnValueOnce({
      ...db.getTenant(),
      total_spend_evaluated_inr: 0 as any
    });
    const spyCats = vi.spyOn(db, 'getCategories').mockReturnValueOnce([]);

    await getExecutiveReport(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.executiveSummary.totalSpendEvaluatedCr).toBe(428.5);
    expect(body.data.executiveSummary.topSavingsCategory).toBe('Direct Materials');
    spyTenant.mockRestore();
    spyCats.mockRestore();
  });

  it('should handle empty opportunities gracefully', async () => {
    const req: any = {};
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getOpportunities').mockReturnValueOnce([]);

    await getExecutiveReport(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.executiveSummary.avgSavingsPct).toBe(0);
    spy.mockRestore();
  });

  it('should handle report generation error with message', async () => {
    const req: any = {};
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getTenant').mockImplementationOnce(() => {
      throw new Error('Report query crash');
    });

    await getExecutiveReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('should handle report generation error without message fallback', async () => {
    const req: any = {};
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getTenant').mockImplementationOnce(() => {
      throw {};
    });

    await getExecutiveReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to generate report' }));
    spy.mockRestore();
  });
});
