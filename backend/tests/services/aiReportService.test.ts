import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiReportService, aiReportService } from '../../src/services/aiReportService';
import { geminiService } from '../../src/services/geminiService';
import { AI_LOG_ACTIONS, EXTRACTION_STATUS } from '../../src/constants/ai';
import logger from '../../src/utils/logger';

// Logging is replaced so the suite neither writes backend/logs nor floods the console.
vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

type SpendSummary = Parameters<AiReportService['generateExecutiveSummary']>[0];

const REPORT_DATA = {
  executiveSummary: 'Gemini summary',
  totalSpendEvaluated: 12.5,
  topRiskObservations: ['Concentration risk'],
  savingsOpportunities: [],
  vendorConsolidationRoadmap: [],
  strategicRoadmapPhases: []
};

describe('AiReportService Unit Tests', () => {
  let service: AiReportService;

  beforeEach(() => {
    service = new AiReportService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate executive summary via Gemini when model call succeeds', async () => {
    const mockReport = {
      executiveSummary: 'AI generated strategic spend executive summary.',
      totalSpendEvaluated: 120.5,
      topRiskObservations: ['Single source risk identified in Category A'],
      savingsOpportunities: [
        {
          category: 'Pumps & Valves',
          currentSpendInrCr: 45.2,
          targetSavingsPct: 9.0,
          estSavingsInrCr: 4.06,
          actionableStrategy: 'E-auction framework'
        }
      ],
      vendorConsolidationRoadmap: ['Consolidate tier 2 suppliers'],
      strategicRoadmapPhases: [
        {
          phase: 'Phase 1',
          actions: ['Deploy e-auctions']
        }
      ]
    };

    const generateSpy = vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: mockReport,
      model: 'gemini-3.6-flash',
      error: null
    });

    const result = await service.generateExecutiveSummary({
      tenantName: 'Acme Corp',
      totalSpendInrCr: 120.5,
      categories: [{ name: 'Pumps & Valves', spendInrCr: 45.2, targetReductionPct: 9.0 }],
      vendors: [{ vendorName: 'Vendor A', totalSpendInrCr: 30.0, priceCreepPct: 5.2 }],
      currency: 'INR'
    }, 'report-request-1');

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.data?.executiveSummary).toBe('AI generated strategic spend executive summary.');
    expect(result.data?.savingsOpportunities.length).toBe(1);
    expect(generateSpy.mock.calls[0][0].requestId).toBe('report-request-1');
  });

  it('should fall back to deterministic summary when Gemini call fails', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.AI_FAILED,
      data: null,
      model: 'gemini-3.6-flash',
      error: 'Network connection timeout'
    });

    const result = await service.generateExecutiveSummary({
      tenantName: 'Acme Corp',
      totalSpendInrCr: 200.0,
      categories: [{ name: 'Chemicals', spendInrCr: 80.0, targetReductionPct: 10.0 }],
      vendors: [{ vendorName: 'Supplier X', totalSpendInrCr: 50.0 }],
      currency: 'INR'
    }, 'report-fallback-1');

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.data?.executiveSummary).toContain('Strategic sourcing analysis evaluated');
    expect(result.data?.totalSpendEvaluated).toBe(200.0);
    expect(result.data?.strategicRoadmapPhases.length).toBe(3);
    expect(logger.warn).toHaveBeenCalledWith('AI executive report generation fell back to deterministic summary',
      expect.objectContaining({ action: AI_LOG_ACTIONS.reportFallback, requestId: 'report-fallback-1' }));
  });

  it('should use enterprise, currency, and empty-data placeholders when context is missing', async () => {
    const generateSpy = vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: REPORT_DATA,
      model: 'gemini-test',
      error: null
    });

    const result = await service.generateExecutiveSummary({
      totalSpendInrCr: 12.5,
      categories: undefined as unknown as SpendSummary['categories'],
      vendors: undefined as unknown as SpendSummary['vendors']
    });

    const { prompt } = generateSpy.mock.calls[0][0];
    expect(prompt).toContain('- Enterprise: Global Enterprise Client');
    expect(prompt).toContain('- Total Evaluated Spend: ₹12.50 Cr');
    expect(prompt).toContain('- Currency: INR');
    expect(prompt).toContain('(No category data)');
    expect(prompt).toContain('(No vendor data)');
    expect(result).toEqual({ status: EXTRACTION_STATUS.SUCCESS, data: REPORT_DATA, model: 'gemini-test', error: null });
  });

  it('should include the supplied tenant, currency, and reported price creep in the prompt', async () => {
    const generateSpy = vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: REPORT_DATA,
      model: 'gemini-test',
      error: null
    });

    await service.generateExecutiveSummary({
      tenantName: 'Acme Corp',
      totalSpendInrCr: 30,
      categories: [],
      vendors: [{ vendorName: 'Supplier Y', totalSpendInrCr: 3, priceCreepPct: 4.5 }],
      currency: 'USD'
    });

    const { prompt } = generateSpy.mock.calls[0][0];
    expect(prompt).toContain('- Enterprise: Acme Corp');
    expect(prompt).toContain('- Currency: USD');
    expect(prompt).toContain('- Supplier Y: ₹3.00 Cr (Price Creep: 4.5%)');
    expect(prompt).toContain('(No category data)');
  });

  it('should list at most fifteen categories and vendors in the prompt', async () => {
    const generateSpy = vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: REPORT_DATA,
      model: 'gemini-test',
      error: null
    });
    const categories = Array.from({ length: 20 }, (_, index) => ({
      name: `Category ${index}`,
      spendInrCr: 1,
      targetReductionPct: 5
    }));
    const vendors = Array.from({ length: 20 }, (_, index) => ({ vendorName: `Vendor ${index}`, totalSpendInrCr: 2 }));

    await service.generateExecutiveSummary({ totalSpendInrCr: 40, categories, vendors });

    const { prompt } = generateSpy.mock.calls[0][0];
    expect(prompt).toContain('- Category 14: ₹1.00 Cr (Target Reduction: 5%)');
    expect(prompt).not.toContain('- Category 15:');
    expect(prompt).toContain('- Vendor 14: ₹2.00 Cr (Price Creep: 0%)');
    expect(prompt).not.toContain('- Vendor 15:');
  });

  it('should fall back to the deterministic summary when a successful call returns no data', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: null,
      model: 'gemini-test',
      error: 'Empty body'
    });

    const result = await service.generateExecutiveSummary({
      totalSpendInrCr: 50,
      categories: [{ name: 'Tools', spendInrCr: 20, targetReductionPct: 5 }],
      vendors: []
    });

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.model).toBe('gemini-test');
    expect(result.error).toBe('Empty body');
    expect(result.data?.executiveSummary).toContain('₹50.00 Cr');
    expect(logger.warn).toHaveBeenCalledWith('AI executive report generation fell back to deterministic summary', expect.objectContaining({
      action: AI_LOG_ACTIONS.reportFallback,
      status: EXTRACTION_STATUS.SUCCESS,
      error: 'Empty body',
      requestId: undefined
    }));
  });

  it('should compute estimated savings and cap fallback opportunities at five categories', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.AI_FAILED,
      data: null,
      model: null,
      error: 'Timeout'
    });
    const categories = [
      { name: 'Chemicals', spendInrCr: 80, targetReductionPct: 10 },
      { name: 'Packaging', spendInrCr: 50, targetReductionPct: 3 },
      { name: 'Tools', spendInrCr: 10, targetReductionPct: 0 },
      { name: 'Freight', spendInrCr: 5, targetReductionPct: 2 },
      { name: 'Utilities', spendInrCr: 4, targetReductionPct: 5 },
      { name: 'Consumables', spendInrCr: 1, targetReductionPct: 1 }
    ];

    const result = await service.generateExecutiveSummary({ totalSpendInrCr: 150, categories, vendors: [] });

    const opportunities = result.data?.savingsOpportunities ?? [];
    expect(opportunities).toHaveLength(5);
    expect(opportunities[0]).toEqual({
      category: 'Chemicals',
      currentSpendInrCr: 80,
      targetSavingsPct: 10,
      estSavingsInrCr: 8,
      actionableStrategy: 'Implement reverse auctions and consolidated frame agreements with dynamic index-linked pricing.'
    });
    expect(opportunities[1].estSavingsInrCr).toBe(1.5);
    expect(result.data?.executiveSummary).toContain('across 6 key spend categories');
    expect(result.data?.totalSpendEvaluated).toBe(150);
  });

  it('should return no fallback savings opportunities when categories are missing', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.AI_FAILED,
      data: null,
      model: null,
      error: 'Timeout'
    });

    const result = await service.generateExecutiveSummary({
      totalSpendInrCr: 0,
      categories: undefined as unknown as SpendSummary['categories'],
      vendors: undefined as unknown as SpendSummary['vendors']
    });

    expect(result.data?.savingsOpportunities).toEqual([]);
    expect(result.data?.executiveSummary).toContain('across 0 key spend categories');
  });
});
