import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { savingsApiClient } from '../../src/utils/savingsApi';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import frontendLogger from '../../src/utils/logger';

describe('savingsApiClient Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
  });

  it('rejects an unavailable action-plan route instead of reporting an unsaved change as successful', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, message: 'Action-plan persistence is not configured' }), {
      status: 501, headers: { 'Content-Type': 'application/json', 'x-request-id': 'REQUEST-501' }
    }));
    await expect(savingsApiClient.updateActionPlan('ACT-001', { status: 'Completed' })).rejects.toThrow(
      UI_STRINGS.module4.apiRequestFailed(UI_STRINGS.module4.apiOperations.actionPlan, 501, 'Action-plan persistence is not configured', 'REQUEST-501')
    );
  });

  it('rejects an unsuccessful opportunity response even if its HTTP status is 200', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, message: 'Status transition rejected' }), { status: 200 }));
    await expect(savingsApiClient.updateSavingsOpportunityStatus('OPP-101', 'APPROVED')).rejects.toThrow('Status transition rejected');
  });

  it('rejects missing data and a non-JSON gateway response with actionable savings context', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response('Gateway unavailable', { status: 502 }));
    await expect(savingsApiClient.getConsolidatedSavings('AIC-1')).rejects.toThrow(UI_STRINGS.module4.apiNoDetails);
    await expect(savingsApiClient.getConsolidatedSavings('AIC-1')).rejects.toThrow(
      UI_STRINGS.module4.apiRequestFailed(UI_STRINGS.module4.apiOperations.load, 502, UI_STRINGS.module4.apiNoDetails, UI_STRINGS.common.notAvailable)
    );
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
