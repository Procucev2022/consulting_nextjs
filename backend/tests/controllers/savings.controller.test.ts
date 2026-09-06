import { describe, it, expect, vi } from 'vitest';
import { getSavings, deployOpportunity } from '../../src/controllers/savings.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('savings.controller', () => {
  describe('getSavings', () => {
    it('should return opportunities and total savings', async () => {
      const req: any = {};
      const res = mockResponse();

      await getSavings(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.opportunities.length).toBeGreaterThan(0);
      expect(body.data.totalPotentialSavingsCr).toBeGreaterThan(0);
    });

    it('should calculate total with 0 fallback when opportunity has 0 savings', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getOpportunities').mockReturnValueOnce([
        { est_savings_inr_cr: 0 } as any
      ]);

      await getSavings(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.data.totalPotentialSavingsCr).toBe(0);
      spy.mockRestore();
    });

    it('should handle getSavings error with message', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getOpportunities').mockImplementationOnce(() => {
        throw new Error('Savings failure');
      });

      await getSavings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle getSavings error without message fallback', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getOpportunities').mockImplementationOnce(() => {
        throw {};
      });

      await getSavings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch savings opportunities' }));
      spy.mockRestore();
    });
  });

  describe('deployOpportunity', () => {
    it('should deploy opportunity to proCPX successfully', async () => {
      const firstId = db.getOpportunities()[0].opp_id;
      const req: any = { body: { opp_id: firstId, targetModule: 'proCPX' } };
      const res = mockResponse();

      await deployOpportunity(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('Pushed to proCPX');
    });

    it('should return 400 if opp_id is missing', async () => {
      const req: any = { body: { targetModule: 'proCPX' } };
      const res = mockResponse();
      await deployOpportunity(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if targetModule is missing', async () => {
      const req: any = { body: { opp_id: 'OPP-1' } };
      const res = mockResponse();
      await deployOpportunity(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if opportunity not found', async () => {
      const req: any = { body: { opp_id: 'NON_EXISTENT_OPP', targetModule: 'proCPX' } };
      const res = mockResponse();

      await deployOpportunity(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle deployOpportunity error with message', async () => {
      const req: any = { body: { opp_id: 'OPP-1', targetModule: 'proCPX' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'deployOpportunity').mockImplementationOnce(() => {
        throw new Error('Deploy error');
      });

      await deployOpportunity(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      spy.mockRestore();
    });

    it('should handle deployOpportunity error without message fallback', async () => {
      const req: any = { body: { opp_id: 'OPP-1', targetModule: 'proCPX' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'deployOpportunity').mockImplementationOnce(() => {
        throw {};
      });

      await deployOpportunity(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to deploy opportunity' }));
      spy.mockRestore();
    });
  });
});
