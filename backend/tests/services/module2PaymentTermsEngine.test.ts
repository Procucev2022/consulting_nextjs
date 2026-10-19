/**
 * Module 2 — Lever 5: Payment Terms Optimisation Engine, Controller & Excel Builder Unit Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import { Module2PaymentTermsEngine } from '../../src/services/module2PaymentTermsEngine';
import { Module2PaymentTermsCalculators } from '../../src/services/module2PaymentTermsCalculators';
import { Module2PaymentTermsExcelBuilder } from '../../src/services/module2PaymentTermsExcelBuilder';
import { Module2PaymentTermsController } from '../../src/controllers/module2PaymentTerms.controller';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import type { Request, Response } from 'express';

describe('Module2PaymentTermsCalculators', () => {
  it('verifies standard linear financing benefit formula matching Prompt 448 examples', () => {
    // Prompt 448 example: 120 Cr purchases, 30 additional days = 1.80 Cr
    const spend120CrInr = 120 * 10000000;
    const benefit30 = Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(spend120CrInr, 30, 0.015);
    expect(benefit30).toBe(1.8 * 10000000);
    expect(Number((benefit30 / 10000000).toFixed(4))).toBe(1.8);

    // Prompt 448 example: 120 Cr purchases, 60 additional days = 3.60 Cr
    const benefit60 = Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(spend120CrInr, 60, 0.015);
    expect(benefit60).toBe(3.6 * 10000000);
    expect(Number((benefit60 / 10000000).toFixed(4))).toBe(3.6);

    // Edge cases: non-positive inputs
    expect(Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(0, 30)).toBe(0);
    expect(Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(spend120CrInr, 0)).toBe(0);
    expect(Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(spend120CrInr, -10)).toBe(0);
    expect(Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(spend120CrInr, 30, 0)).toBe(0);
  });

  it('calculates working capital released separately from financing benefit', () => {
    const spend120CrInr = 120 * 10000000;
    const wc30 = Module2PaymentTermsCalculators.calculateWorkingCapitalReleased(spend120CrInr, 30);
    const wc60 = Module2PaymentTermsCalculators.calculateWorkingCapitalReleased(spend120CrInr, 60);

    expect(Number((wc30 / 10000000).toFixed(4))).toBeCloseTo(9.8630, 3);
    expect(Number((wc60 / 10000000).toFixed(4))).toBeCloseTo(19.7260, 3);

    // Edge cases
    expect(Module2PaymentTermsCalculators.calculateWorkingCapitalReleased(0, 30)).toBe(0);
    expect(Module2PaymentTermsCalculators.calculateWorkingCapitalReleased(spend120CrInr, 0)).toBe(0);
  });

  it('calculates early payment cash discount and annualized yield separately', () => {
    const spend10CrInr = 10 * 10000000;
    const disc = Module2PaymentTermsCalculators.calculateEarlyPaymentDiscount(spend10CrInr, 2.0, 10, 30);
    expect(disc.cashDiscountInr).toBe(2000000);
    expect(disc.annualizedYieldPct).toBeGreaterThan(30);

    // Edge cases
    const invalidDisc = Module2PaymentTermsCalculators.calculateEarlyPaymentDiscount(0, 2.0, 10, 30);
    expect(invalidDisc.cashDiscountInr).toBe(0);
    expect(invalidDisc.annualizedYieldPct).toBe(0);
    const badDays = Module2PaymentTermsCalculators.calculateEarlyPaymentDiscount(spend10CrInr, 2.0, 30, 30);
    expect(badDays.cashDiscountInr).toBe(0);
  });

  it('parses payment term strings accurately and detects missing data transparently', () => {
    expect(Module2PaymentTermsCalculators.parsePaymentTerms(undefined).status).toBe('DATA_UNAVAILABLE');
    expect(Module2PaymentTermsCalculators.parsePaymentTerms('').status).toBe('DATA_UNAVAILABLE');
    expect(Module2PaymentTermsCalculators.parsePaymentTerms('UNKNOWN').status).toBe('DATA_UNAVAILABLE');
    expect(Module2PaymentTermsCalculators.parsePaymentTerms('N/A').status).toBe('DATA_UNAVAILABLE');

    const net30 = Module2PaymentTermsCalculators.parsePaymentTerms('Net 30 Days');
    expect(net30.isParsed).toBe(true);
    expect(net30.creditDays).toBe(30);
    expect(net30.status).toBe('OPPORTUNITY_IDENTIFIED');

    const net45 = Module2PaymentTermsCalculators.parsePaymentTerms('45 Days');
    expect(net45.isParsed).toBe(true);
    expect(net45.creditDays).toBe(45);

    const discountTerm = Module2PaymentTermsCalculators.parsePaymentTerms('2/10 Net 30');
    expect(discountTerm.isParsed).toBe(true);
    expect(discountTerm.hasDiscount).toBe(true);
    expect(discountTerm.discountPct).toBe(2);
    expect(discountTerm.discountDays).toBe(10);
    expect(discountTerm.creditDays).toBe(30);

    const advanceTerm = Module2PaymentTermsCalculators.parsePaymentTerms('Advance Payment');
    expect(advanceTerm.status).toBe('AWAITING_VALIDATION');
    expect(advanceTerm.creditDays).toBe(0);

    const unparseable = Module2PaymentTermsCalculators.parsePaymentTerms('Special Milestone Agreement');
    expect(unparseable.status).toBe('NOT_YET_QUANTIFIABLE');
    expect(unparseable.isParsed).toBe(false);
  });
});

describe('Module2PaymentTermsEngine', () => {
  beforeAll(() => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
  }, 180000);

  it('analyses ABC Textile (AIC-2026-0002) transparently identifying missing terms with zero fabricated savings', () => {
    const result = Module2PaymentTermsEngine.calculate('AIC-2026-0002');
    expect(result).toBeDefined();
    expect(result.assessmentId).toBe('AIC-2026-0002');

    const sum = result.coverageSummary;
    expect(sum.totalRecordsCount).toBe(23570);
    expect(sum.totalSpendAnalysedCr).toBe(613.8805);
    expect(sum.totalSpendAnalysedInr).toBeCloseTo(6138805185.51, 2);
    expect(sum.overallDataAvailabilityStatus).toBe('DATA_UNAVAILABLE');
    expect(sum.missingRecordsCount).toBe(23570);
    expect(sum.completeRecordsCount).toBe(0);
    expect(sum.missingSpendCr).toBe(613.8805);
    expect(sum.verifiedSpendCr).toBe(0);
    expect(sum.missingSpendPct).toBe(100.0);
    expect(sum.verifiedSpendPct).toBe(0.0);

    // CRITICAL: Zero fabricated financing benefit or working capital released
    expect(sum.totalFinancingBenefitCr).toBe(0.0);
    expect(sum.totalWorkingCapitalReleasedCr).toBe(0.0);
    expect(sum.reconciliationDeltaInr).toBe(0.0);
    expect(result.opportunities.length).toBe(0);
    expect(result.supplierProfiles.length).toBeGreaterThan(0);
    expect(result.methodologyDisclosures.length).toBeGreaterThanOrEqual(5);
  }, 30000);

  it('analyses PQR Cement (AIC-2026-0003) reconciling coverage and spend exactly', () => {
    const result = Module2PaymentTermsEngine.calculate('AIC-2026-0003');
    expect(result).toBeDefined();
    expect(result.assessmentId).toBe('AIC-2026-0003');

    const sum = result.coverageSummary;
    expect(sum.totalRecordsCount).toBe(19670);
    expect(sum.totalSpendAnalysedCr).toBe(262.6412);
    expect(sum.totalSpendAnalysedInr).toBeCloseTo(2626411770.62, 2);
    expect(sum.overallDataAvailabilityStatus).toBe('DATA_UNAVAILABLE');
    expect(sum.reconciliationDeltaInr).toBe(0.0);
    expect(sum.totalFinancingBenefitCr).toBe(0.0);
    expect(sum.totalWorkingCapitalReleasedCr).toBe(0.0);
  }, 30000);
});

describe('Module2PaymentTermsExcelBuilder', () => {
  it('generates an authoritative 8-sheet Excel workbook with complete coverage audit', () => {
    const result = Module2PaymentTermsEngine.calculate('AIC-2026-0003');
    const buffer = Module2PaymentTermsExcelBuilder.buildWorkbook(result);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames.length).toBe(8);
    expect(wb.SheetNames[0]).toBe('1. Executive Summary');
    expect(wb.SheetNames[1]).toBe('2. Data Coverage & Audit');
    expect(wb.SheetNames[2]).toBe('3. Payment Terms Opportunities');
    expect(wb.SheetNames[3]).toBe('4. Supplier Terms Analysis');
    expect(wb.SheetNames[4]).toBe('5. Early Payment Discounts');
    expect(wb.SheetNames[5]).toBe('6. Working Capital Modeling');
    expect(wb.SheetNames[6]).toBe('7. Purchase Transactions');
    expect(wb.SheetNames[7]).toBe('8. Methodology & Governance');
  }, 30000);
});

describe('Module2PaymentTermsController', () => {
  it('handles getPaymentTerms request successfully with HTTP 200', async () => {
    const req: Partial<Request> = {
      query: { assessmentId: 'AIC-2026-0002' }
    };
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res: Partial<Response> = {
      status: statusMock
    };

    await Module2PaymentTermsController.getPaymentTerms(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Payment Terms analysis retrieved successfully'
      })
    );
  });

  it('handles exportExcel request successfully with HTTP 200 and workbook buffer', async () => {
    const req: Partial<Request> = {
      query: { assessmentId: 'AIC-2026-0003' }
    };
    const setHeaderMock = vi.fn();
    const sendMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ send: sendMock });
    const res: Partial<Response> = {
      setHeader: setHeaderMock,
      status: statusMock
    };

    await Module2PaymentTermsController.exportExcel(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(sendMock).toHaveBeenCalled();
  });

  it('handles internal errors gracefully and returns HTTP 500', async () => {
    const req: Partial<Request> = {
      query: { assessmentId: 'INVALID_CRASH_TEST' }
    };
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res: Partial<Response> = {
      status: statusMock
    };

    const spy = vi.spyOn(Module2PaymentTermsEngine, 'calculate').mockImplementationOnce(() => {
      throw new Error('Simulated database error');
    });

    await Module2PaymentTermsController.getPaymentTerms(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Internal server error while executing Payment Terms analysis',
        error: 'Simulated database error'
      })
    );

    spy.mockRestore();
  });
});
