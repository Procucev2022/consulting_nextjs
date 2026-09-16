import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiReportService, aiReportService } from '../../src/services/aiReportService';
import { geminiService } from '../../src/services/geminiService';
import { EXTRACTION_STATUS } from '../../src/constants/ai';

describe('AiReportService Unit Tests', () => {
  let service: AiReportService;

  beforeEach(() => {
    service = new AiReportService();
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

    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
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
    });

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.data?.executiveSummary).toBe('AI generated strategic spend executive summary.');
    expect(result.data?.savingsOpportunities.length).toBe(1);
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
    });

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.data?.executiveSummary).toContain('Strategic sourcing analysis evaluated');
    expect(result.data?.totalSpendEvaluated).toBe(200.0);
    expect(result.data?.strategicRoadmapPhases.length).toBe(3);
  });
});
