import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiAnomalyService, aiAnomalyService } from '../../src/services/aiAnomalyService';
import { geminiService } from '../../src/services/geminiService';
import { AI_LOG_ACTIONS, EXTRACTION_STATUS, ANOMALY_DETECTION_SYSTEM_PROMPT } from '../../src/constants/ai';
import logger from '../../src/utils/logger';

// Logging is replaced so the suite neither writes backend/logs nor floods the console.
vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

type AnomalyRecords = Parameters<AiAnomalyService['analyzeAnomalies']>[0];

describe('AiAnomalyService Unit Tests', () => {
  let service: AiAnomalyService;

  beforeEach(() => {
    service = new AiAnomalyService();
    vi.clearAllMocks();
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

    const generateSpy = vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
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
    ], 'anomaly-request-1');

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.anomalies.length).toBe(1);
    expect(result.anomalies[0].recordId).toBe('REC-101');
    expect(generateSpy.mock.calls[0][0].requestId).toBe('anomaly-request-1');
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
    ], 'anomaly-fallback-1');

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.anomalies.length).toBe(1);
    expect(result.anomalies[0].actionStatus).toBe('Fix Currency');
    expect(logger.warn).toHaveBeenCalledWith('AI anomaly analysis fallback to heuristic suggestions',
      expect.objectContaining({ action: AI_LOG_ACTIONS.anomalyFallback, requestId: 'anomaly-fallback-1' }));
  });

  it('should return NO_CONTENT when records is not an array', async () => {
    const result = await service.analyzeAnomalies(null as unknown as AnomalyRecords);

    expect(result).toEqual({
      status: EXTRACTION_STATUS.NO_CONTENT,
      anomalies: [],
      summary: 'No pre-check records provided for anomaly analysis.',
      model: null,
      error: null
    });
  });

  it('should label missing currency as INR and missing issue flags as None in the prompt', async () => {
    const generateSpy = vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: { anomalies: [], summary: 'Clean data' },
      model: 'gemini-test',
      error: null
    });

    await service.analyzeAnomalies([{ recordId: 'REC-7', poNumber: 'PO-7', vendorName: 'Vendor Seven', amount: 75 }]);

    expect(generateSpy).toHaveBeenCalledWith(expect.objectContaining({ label: 'AI Pre-Check Anomaly Detection' }));
    const { prompt } = generateSpy.mock.calls[0][0];
    expect(prompt).toContain(ANOMALY_DETECTION_SYSTEM_PROMPT);
    expect(prompt).toContain(
      'Record ID: REC-7 | PO: PO-7 | Vendor: Vendor Seven | Currency: INR | Amount: 75 | Current Issue: None'
    );
  });

  it('should include only the first fifty records in the prompt', async () => {
    const generateSpy = vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: { anomalies: [], summary: 'Clean data' },
      model: 'gemini-test',
      error: null
    });
    const records = Array.from({ length: 60 }, (_, index) => ({
      recordId: `REC-${index}`,
      poNumber: `PO-${index}`,
      vendorName: 'Vendor',
      amount: index
    }));

    await service.analyzeAnomalies(records);

    const { prompt } = generateSpy.mock.calls[0][0];
    expect(prompt).toContain('Record ID: REC-49 | ');
    expect(prompt).not.toContain('Record ID: REC-50 | ');
  });

  it('should use heuristic suggestions when a successful call returns no data', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: null,
      model: 'gemini-test',
      error: null
    });

    const result = await service.analyzeAnomalies([
      { recordId: 'REC-8', poNumber: 'PO-8', vendorName: 'Vendor Eight', amount: 10, issueFlag: 'Currency Mismatch' }
    ]);

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.model).toBe('gemini-test');
    expect(result.anomalies).toEqual([
      {
        recordId: 'REC-8',
        issueFlag: 'Currency Mismatch',
        suggestedFix: 'Apply official daily Yahoo Finance exchange rate conversion to INR',
        actionStatus: 'Fix Currency',
        confidence: 88
      }
    ]);
    expect(logger.warn).toHaveBeenCalledWith('AI anomaly analysis fallback to heuristic suggestions', expect.objectContaining({
      action: AI_LOG_ACTIONS.anomalyFallback,
      status: EXTRACTION_STATUS.SUCCESS,
      error: null,
      requestId: undefined
    }));
  });

  it('should default anomalies and summary when the model returns malformed fields', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: { anomalies: 'none', summary: 42 } as unknown as { anomalies: never[]; summary: string },
      model: 'gemini-test',
      error: null
    });

    const result = await service.analyzeAnomalies([{ recordId: 'REC-9', poNumber: 'PO-9', vendorName: 'V9', amount: 5 }]);

    expect(result).toEqual({
      status: EXTRACTION_STATUS.SUCCESS,
      anomalies: [],
      summary: 'Anomaly analysis complete.',
      model: 'gemini-test',
      error: null
    });
  });

  it('should build heuristic anomalies only for flagged records and classify each fix', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.AI_FAILED,
      data: null,
      model: null,
      error: 'Model offline'
    });
    const base = { poNumber: 'PO-1', vendorName: 'Vendor', amount: 100 };

    const result = await service.analyzeAnomalies([
      { ...base, recordId: 'R-1', issueFlag: 'Currency Mismatch' },
      { ...base, recordId: 'R-2', issueFlag: 'Vendor Duplicate' },
      { ...base, recordId: 'R-3', issueFlag: 'Price Variance' },
      { ...base, recordId: 'R-4', issueFlag: 'Valid' },
      { ...base, recordId: 'R-5' },
      { ...base, recordId: 'R-6', issueFlag: '' }
    ]);

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.anomalies).toEqual([
      {
        recordId: 'R-1',
        issueFlag: 'Currency Mismatch',
        suggestedFix: 'Apply official daily Yahoo Finance exchange rate conversion to INR',
        actionStatus: 'Fix Currency',
        confidence: 88
      },
      {
        recordId: 'R-2',
        issueFlag: 'Vendor Duplicate',
        suggestedFix: 'Merge duplicate vendor legal names into unified master entity',
        actionStatus: 'Merge Vendor',
        confidence: 88
      },
      {
        recordId: 'R-3',
        issueFlag: 'Price Variance',
        suggestedFix: 'Review line item price and unit of measure specification',
        actionStatus: 'Merge Vendor',
        confidence: 88
      }
    ]);
    expect(result.summary).toBe('Identified 3 validation anomalies requiring review.');
    expect(result.model).toBeNull();
    expect(result.error).toBe('Model offline');
  });
});
