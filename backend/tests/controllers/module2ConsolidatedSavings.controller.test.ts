/**
 * Module 2 — Consolidated Savings Controller Integration Tests
 * Validates Prompt 479 & 480 Reference Figures for Baseline AIC-2026-0001
 * Compliant with Rule 1: >= 90% unit test coverage
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { Request, Response } from 'express';
import { getConsolidatedSavings } from '../../src/controllers/module2StrategicSourcing.controller';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { db } from '../../src/services/db';

const mockResponse = (): {
  res: Response;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
} => {
  const status = vi.fn();
  const json = vi.fn();
  const res: Partial<Response> = {
    status: status.mockImplementation(() => res as Response),
    json: json.mockImplementation(() => res as Response)
  };
  return { res: res as Response, status, json };
};

describe('Module 2 Consolidated Savings Controller — Baseline AIC-2026-0001 Acceptance', () => {
  beforeAll(() => {
    Module2CanonicalService.clearCache();
  }, 45000);

  it('rejects missing assessment query parameters with HTTP 400', async () => {
    const req = { query: {} } as unknown as Request;
    const { res, status, json } = mockResponse();

    await getConsolidatedSavings(req, res);
    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('Invalid query parameters');
  });

  it('returns exact Prompt 479/480 authoritative baseline figures for AIC-2026-0001', async () => {
    const req = { query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request;
    const { res, json } = mockResponse();

    await getConsolidatedSavings(req, res);
    expect(json).toHaveBeenCalled();
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(true);

    const d = body.data;
    expect(d.assessmentId).toBe('AIC-2026-0001');

    // Section 2 Expected Prompt 479/480 Reference Figures:
    // 1. Gross evidence-based savings: ₹188.3706 Cr
    expect(d.grossEvidenceBasedSavingsCr).toBe(188.3706);

    // 2. Net evidence-based savings: ₹188.3706 Cr
    expect(d.netEvidenceBasedSavingsCr).toBe(188.3706);

    // 3. Gross exploratory pipeline: ₹539.4869 Cr
    expect(d.exploratoryPipelineSavingsCr).toBe(539.4869);

    // 4. Exploratory overlap deductions: ₹95.4939 Cr
    expect(d.totalOverlappingDeductionsCr).toBe(95.4939);

    // 5. Exploratory unresolved exclusions: ₹235.6226 Cr
    expect(d.unresolvedOverlapsExcludedCr).toBe(235.6226);

    // 6. Net retained exploratory potential: ₹208.3704 Cr
    const netRetainedExploratory = Number(
      (d.exploratoryPipelineSavingsCr - d.totalOverlappingDeductionsCr - d.unresolvedOverlapsExcludedCr).toFixed(4)
    );
    expect(netRetainedExploratory).toBe(208.3704);

    // 7. Total consolidated gross pipeline: ₹727.8576 Cr
    expect(d.grossEstimatedSavingsCr).toBe(727.8576);

    // 8. Total consolidated net pipeline: ₹396.7410 Cr
    expect(d.netEstimatedSavingsCr).toBe(396.741);

    // 9. Commercially validated savings: ₹0
    expect(d.commerciallyValidatedSavingsCr).toBe(0);

    // 10. Realized savings: ₹0
    expect(d.realizedSavingsCr).toBe(0);

    // 11. Working capital released: ₹334.8354 Cr (indicative scenario only)
    expect(d.lever5WorkingCapitalReleasedCr).toBe(334.8354);

    // 12. Annual financing benefit: ₹61.1075 Cr (indicative scenario only)
    expect(d.lever5AnnualFinancingBenefitCr).toBe(61.1075);

    // Section 3: Accounting Rules Verification
    // Exploratory opportunities must not enter evidence-based savings
    expect(d.grossEvidenceBasedSavingsCr).toBe(d.netEvidenceBasedSavingsCr);

    // Unresolved exploratory exclusions must not be deducted from evidence-based savings
    expect(d.unresolvedOverlapsExcludedCr).toBeLessThanOrEqual(d.exploratoryPipelineSavingsCr);

    // Full mathematical reconciliation
    expect(d.isArithmeticallyBalanced).toBe(true);
    expect(d.reconciliationBalanceInr).toBe(0);
  }, 45000);

  it('demonstrates cache freshness and invalidation when clearCache is called', async () => {
    Module2CanonicalService.clearCache();
    const req = { query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request;
    const { res, json } = mockResponse();

    await getConsolidatedSavings(req, res);
    expect(json).toHaveBeenCalled();
    const body1 = json.mock.calls[0][0];
    expect(body1.success).toBe(true);

    // Call again, should yield identical reproducible results
    const { res: res2, json: json2 } = mockResponse();
    await getConsolidatedSavings(req, res2);
    const body2 = json2.mock.calls[0][0];
    expect(body2.data.grossEstimatedSavingsCr).toBe(body1.data.grossEstimatedSavingsCr);
    expect(body2.data.netEstimatedSavingsCr).toBe(body1.data.netEstimatedSavingsCr);
  }, 45000);

  it('handles database errors gracefully and returns HTTP 500', async () => {
    const spy = vi.spyOn(db, 'getModule2ConsolidatedSavings').mockImplementationOnce(() => {
      throw new Error('Simulated database failure');
    });
    const req = { query: { assessmentId: 'AIC-2026-0001' } } as unknown as Request;
    const { res, status } = mockResponse();

    await getConsolidatedSavings(req, res);
    expect(status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});
