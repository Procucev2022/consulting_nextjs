import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../../src/services/db';
import {
  getSavings,
  deployOpportunity,
  getConsolidatedSavings,
  updateActionPlan,
  updateOpportunityStatus
} from '../../src/controllers/savings.controller';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('savings.controller', () => {
  beforeEach(() => {
    db.setOpportunities([{
      opp_id: 'OPP-1',
      title: 'Resin Volume Rebate',
      category: 'Direct Materials',
      est_savings_inr_cr: 1.5,
      current_spend_inr_cr: 10.0,
      target_savings_pct: 15.0,
      push_to_module: 'proCPX',
      status: 'Identified',
      contract_leak_type: 'Rebate Leakage',
      confidence_score: 95
    } as any]);
  });

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

  describe('getConsolidatedSavings', () => {
    it('should return consolidated savings, waterfall metrics, and action plans', async () => {
      const req: any = {};
      const res = mockResponse();

      await getConsolidatedSavings(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.waterfallMetrics).toBeDefined();
      expect(body.data.opportunities.length).toBeGreaterThan(0);
      expect(body.data.actionPlans.length).toBeGreaterThan(0);
    });

    it('should handle getConsolidatedSavings failure with error message', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getConsolidatedSavings').mockImplementationOnce(() => {
        throw new Error('Consolidation calculation crashed');
      });

      await getConsolidatedSavings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Consolidation calculation crashed' }));
      spy.mockRestore();
    });

    it('should handle getConsolidatedSavings error without message fallback', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getConsolidatedSavings').mockImplementationOnce(() => {
        throw {};
      });

      await getConsolidatedSavings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to generate consolidated savings' }));
      spy.mockRestore();
    });
  });

  describe('updateActionPlan', () => {
    it('should update action plan status, owner, priority and comments', async () => {
      // First ensure consolidated savings is initialized
      const initReq: any = {};
      const initRes = mockResponse();
      await getConsolidatedSavings(initReq, initRes);
      const actionPlanId = initRes.json.mock.calls[0][0].data.actionPlans[0].id;

      const req: any = {
        body: {
          actionId: actionPlanId,
          status: 'In Progress',
          owner: 'SCM',
          priority: 'HIGH',
          comments: 'Negotiations ongoing'
        }
      };
      const res = mockResponse();

      await updateActionPlan(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('In Progress');
      expect(body.data.owner).toBe('SCM');
    });

    it('should return 404 if action plan not found', async () => {
      const req: any = { body: { actionId: 'non-existent-action-id', status: 'Completed' } };
      const res = mockResponse();

      await updateActionPlan(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle updateActionPlan error with message', async () => {
      const req: any = { body: { actionId: 'act-1', status: 'Completed' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'updateActionPlan').mockImplementationOnce(() => {
        throw new Error('Update plan failed');
      });

      await updateActionPlan(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle updateActionPlan error without message fallback', async () => {
      const req: any = { body: { actionId: 'act-1', status: 'Completed' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'updateActionPlan').mockImplementationOnce(() => {
        throw {};
      });

      await updateActionPlan(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update action plan' }));
      spy.mockRestore();
    });
  });

  describe('updateOpportunityStatus', () => {
    it('should update opportunity status to VALIDATED, APPROVED, or REALIZED', async () => {
      const initReq: any = {};
      const initRes = mockResponse();
      await getConsolidatedSavings(initReq, initRes);
      const oppId = initRes.json.mock.calls[0][0].data.opportunities[0].opportunity_id;

      const req: any = { body: { opp_id: oppId, status: 'VALIDATED' } };
      const res = mockResponse();

      await updateOpportunityStatus(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('VALIDATED');
    });

    it('should return 404 if opportunity not found', async () => {
      const req: any = { body: { opp_id: 'non-existent-opp-id', status: 'APPROVED' } };
      const res = mockResponse();

      await updateOpportunityStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle updateOpportunityStatus error with message', async () => {
      const req: any = { body: { opp_id: 'OPP-1', status: 'APPROVED' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'updateSavingsOpportunityStatus').mockImplementationOnce(() => {
        throw new Error('Status update crash');
      });

      await updateOpportunityStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle updateOpportunityStatus error without message fallback', async () => {
      const req: any = { body: { opp_id: 'OPP-1', status: 'APPROVED' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'updateSavingsOpportunityStatus').mockImplementationOnce(() => {
        throw {};
      });

      await updateOpportunityStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update opportunity status' }));
      spy.mockRestore();
    });
  });
});
