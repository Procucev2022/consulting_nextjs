import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { savingsApiClient } from '../../src/utils/savingsApi';

describe('savingsApiClient Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getConsolidatedSavings', () => {
    it('fetches consolidated savings with assessmentId query parameter', async () => {
      const mockData = {
        assessmentId: 'ASS-100',
        identifiedOpportunityInrCr: 85.64,
        levers: []
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await savingsApiClient.getConsolidatedSavings('ASS-100');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/savings/consolidated?assessmentId=ASS-100'));
    });

    it('fetches consolidated savings without assessmentId query parameter', async () => {
      const mockData = {
        identifiedOpportunityInrCr: 50.0,
        levers: []
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await savingsApiClient.getConsolidatedSavings();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/savings/consolidated'));
      expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('?assessmentId='));
    });
  });

  describe('updateActionPlan', () => {
    it('successfully updates action plan item when payload is valid', async () => {
      const mockUpdated = {
        actionId: 'ACT-001',
        status: 'In Progress',
        owner: 'Procurement',
        priority: 'HIGH',
        comments: 'Initiated negotiation'
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUpdated })
      });

      const result = await savingsApiClient.updateActionPlan('ACT-001', {
        status: 'In Progress',
        owner: 'Procurement',
        priority: 'HIGH',
        comments: 'Initiated negotiation'
      });

      expect(result).toEqual(mockUpdated);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/savings/action-plan/update'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId: 'ACT-001',
            status: 'In Progress',
            owner: 'Procurement',
            priority: 'HIGH',
            comments: 'Initiated negotiation'
          })
        })
      );
    });

    it('throws validation error when action plan payload is invalid', async () => {
      await expect(
        savingsApiClient.updateActionPlan('', { status: 'Invalid' as any })
      ).rejects.toThrow('Invalid action plan update');
    });
  });

  describe('updateSavingsOpportunityStatus', () => {
    it('successfully updates savings opportunity status when payload is valid', async () => {
      const mockUpdated = {
        opp_id: 'OPP-101',
        status: 'APPROVED'
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUpdated })
      });

      const result = await savingsApiClient.updateSavingsOpportunityStatus('OPP-101', 'APPROVED');
      expect(result).toEqual(mockUpdated);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/savings/opportunity/status'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opp_id: 'OPP-101',
            status: 'APPROVED'
          })
        })
      );
    });

    it('throws validation error when opportunity status payload is invalid', async () => {
      await expect(
        savingsApiClient.updateSavingsOpportunityStatus('', 'INVALID_STATUS' as any)
      ).rejects.toThrow('Invalid opportunity status update');
    });
  });
});
