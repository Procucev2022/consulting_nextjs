import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiAnomalyService, aiAnomalyService } from '../../src/services/aiAnomalyService';
import { geminiService } from '../../src/services/geminiService';
import { EXTRACTION_STATUS } from '../../src/constants/ai';

describe('AiAnomalyService Unit Tests', () => {
  let service: AiAnomalyService;

  beforeEach(() => {
    service = new AiAnomalyService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return NO_CONTENT when records array is empty', async () => {
    const result = await service.analyzeAnomalies([]);
    expect(result.status).toBe(EXTRACTION_STATUS.NO_CONTENT);
    expect(result.anomalies).toEqual([]);
  });

  it('should analyze anomalies via Gemini when model returns valid response', async () => {
    const mockAnomalies = [
      {
        recordId: 'REC-101',
        issueFlag: 'Currency Discrepancy (USD/INR)',
        suggestedFix: 'Apply Yahoo Finance conversion rate',
        actionStatus: 'Fix Currency',
        confidence: 95
      }
    ];

    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: { anomalies: mockAnomalies, summary: 'Found 1 currency anomaly' },
      model: 'gemini-3.6-flash',
      error: null
    });

    const result = await service.analyzeAnomalies([
      {
        recordId: 'REC-101',
        poNumber: 'PO-101',
        vendorName: 'Global Corp',
        rawCurrency: 'USD',
        amount: 50000,
        issueFlag: 'Currency Discrepancy'
      }
    ]);

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.anomalies.length).toBe(1);
    expect(result.anomalies[0].recordId).toBe('REC-101');
  });

  it('should fall back to heuristic anomaly detection when Gemini fails', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.AI_FAILED,
      data: null,
      model: 'gemini-3.6-flash',
      error: 'Model offline'
    });

    const result = await service.analyzeAnomalies([
      {
        recordId: 'REC-202',
        poNumber: 'PO-202',
        vendorName: 'Supplier ABC',
        rawCurrency: 'EUR',
        amount: 25000,
        issueFlag: 'Currency Mismatch'
      }
    ]);

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.anomalies.length).toBe(1);
    expect(result.anomalies[0].actionStatus).toBe('Fix Currency');
  });
});
