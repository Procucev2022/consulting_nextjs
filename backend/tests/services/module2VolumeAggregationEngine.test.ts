/**
 * Module 2 — Lever 4: Volume Aggregation Engine, Controller & Excel Builder Unit Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import { Module2VolumeAggregationEngine } from '../../src/services/module2VolumeAggregationEngine';
import { Module2VolumeAggregationExcelBuilder } from '../../src/services/module2VolumeAggregationExcelBuilder';
import { Module2VolumeAggregationController } from '../../src/controllers/module2VolumeAggregation.controller';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import type { Request, Response } from 'express';

describe('Module2VolumeAggregationEngine', () => {
  beforeAll(() => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
  }, 180000);
  it('calculates full volume aggregation results for ABC Textile (AIC-2026-0002) reconciling 100%', () => {
    const result = Module2VolumeAggregationEngine.calculate('AIC-2026-0002');
    expect(result).toBeDefined();
    expect(result.assessmentId).toBe('AIC-2026-0002');

    const sum = result.coverageSummary;
    expect(sum.totalTransactionsCount).toBe(23570);
    expect(sum.totalIncurredSpendCr).toBe(613.8805);
    expect(sum.totalMaterialRecordsCount).toBe(12791);
    expect(sum.genuineTier1OpportunitiesCount).toBe(3833);
    expect(sum.genuineOpportunitiesCount).toBe(3833);
    expect(sum.singleIsolatedPurchaseCount).toBe(8958);
    expect(sum.limitedHistoryCount).toBe(8958);
    expect(sum.singleIsolatedPurchaseSpendCr).toBe(121.7762);
    expect(sum.limitedHistorySpendCr).toBe(121.7762);
    expect(sum.potentiallyAggregatableSpendCr).toBe(492.1043);
    expect(sum.genuineOpportunitySpendCr).toBe(492.1043);
    expect(sum.uomCompatibleSpendCr).toBe(613.8805);
    expect(sum.excludedPhysicalAggregationSpendCr).toBe(0);
    expect(sum.tier1SpendCr).toBe(613.8805);
    expect(sum.grossMaterialSpendCr).toBe(613.8805);
    expect(sum.netIncurredSpendCr).toBe(613.8805);
    expect(sum.unmatchedAdjustmentsCount).toBe(0);
    expect(sum.reconciliationDeltaInr).toBe(0.0);
    expect(sum.grossMaterialSpendInr).toBeCloseTo(6138805185.51, 1);
    expect(sum.netIncurredSpendInr).toBeCloseTo(6138805185.51, 1);
    expect(sum.totalMaterialRecordsCount).toBe(
      (sum.genuineOpportunitiesCount || 0) + (sum.limitedHistoryCount || 0) + (sum.excludedUnresolvedUomCount || 0)
    );

    expect(result.tier1Opportunities.length).toBe(12791);
    expect(result.plantProfiles.length).toBeGreaterThan(0);
    expect(result.materialProfiles.length).toBeGreaterThan(0);

    // Verify governance disclosures are attached
    expect(result.methodologyDisclosures.length).toBeGreaterThanOrEqual(5);
    expect(result.methodologyDisclosures[0]).toContain('Zero Arbitrary Savings');
  }, 60000);

  it('calculates full volume aggregation results for PQR Cement (AIC-2026-0003) reconciling 100%', () => {
    const result = Module2VolumeAggregationEngine.calculate('AIC-2026-0003');
    const sum = result.coverageSummary;
    expect(sum).toBeDefined();
    expect(sum.genuineTier1OpportunitiesCount).toBe(3623);
    expect(sum.genuineOpportunitiesCount).toBe(3623);
    expect(sum.singleIsolatedPurchaseCount).toBe(7341);
    expect(sum.limitedHistoryCount).toBe(7341);
    expect(sum.singleIsolatedPurchaseSpendCr).toBe(56.1676);
    expect(sum.limitedHistorySpendCr).toBe(56.1676);
    expect(sum.uomIncompatibleCount).toBe(125);
    expect(sum.excludedUnresolvedUomCount).toBe(125);
    expect(sum.uomIncompatibleSpendCr).toBe(22.9154);
    expect(sum.potentiallyAggregatableSpendCr).toBe(183.5607);
    expect(sum.genuineOpportunitySpendCr).toBe(183.5607);
    expect(sum.uomCompatibleSpendCr).toBe(239.7283);
    expect(sum.tier1SpendCr).toBe(262.6436);
    expect(sum.grossMaterialSpendCr).toBe(262.6436);
    expect(sum.netIncurredSpendCr).toBe(262.6412);
    expect(sum.eligiblePhysicalAggregationSpendCr).toBe(239.7283);
    expect(sum.excludedPhysicalAggregationSpendCr).toBe(22.9154);
    expect(sum.unmatchedAdjustmentsCount).toBe(1);
    expect(sum.unmatchedAdjustmentsSpendInr).toBe(-24570);
    expect(sum.reconciliationDeltaInr).toBe(0.0);
    expect(sum.grossMaterialSpendInr).toBeCloseTo(2626436340.62, 1);
    expect(sum.netIncurredSpendInr).toBeCloseTo(2626411770.62, 1);
    expect(sum.totalMaterialRecordsCount).toBe(
      (sum.genuineOpportunitiesCount || 0) + (sum.limitedHistoryCount || 0) + (sum.excludedUnresolvedUomCount || 0)
    );

    // Verify High Speed Diesel exists and density was audited with native KL preserved
    const hsd = result.tier1Opportunities.find((o) => /DIESEL|HSD/i.test(o.materialDesc));
    expect(hsd).toBeDefined();
    expect(hsd?.densityConversion?.applied).toBe(false);
    expect(hsd?.densityConversion?.supportingEvidenceAvailable).toBe(false);
    expect(hsd?.densityConversion?.validationStatus).toBe('TECHNICAL_VALIDATION_REQUIRED');
    expect(hsd?.baseUom).toBe('KL');
    expect(hsd?.totalHistoricalSpendCr).toBeCloseTo(83.9725, 2);
  }, 60000);
});

describe('Module2VolumeAggregationExcelBuilder', () => {
  it('generates an authoritative 8-sheet Excel workbook with complete transaction audit trail', () => {
    const result = Module2VolumeAggregationEngine.calculate('AIC-2026-0003');
    const testResult = { ...result, transactions: result.transactions.slice(0, 50) };
    const buffer = Module2VolumeAggregationExcelBuilder.buildWorkbook(testResult);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames.length).toBe(8);
    expect(wb.SheetNames).toContain('1. Executive Summary');
    expect(wb.SheetNames).toContain('2. Aggregation Opportunities');
    expect(wb.SheetNames).toContain('3. Plant Analysis');
    expect(wb.SheetNames).toContain('4. Material Analysis');
    expect(wb.SheetNames).toContain('5. Supplier Analysis');
    expect(wb.SheetNames).toContain('6. Purchase Transactions');
    expect(wb.SheetNames).toContain('7. Validation Requirements');
    expect(wb.SheetNames).toContain('8. Data Quality & Method');
  }, 60000);
});

describe('Module2VolumeAggregationController', () => {
  it('handles getVolumeAggregation request successfully', async () => {
    const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;
    let statusCode = 0;
    let jsonBody: unknown = null;
    const res = {
      status: vi.fn().mockImplementation((code: number) => {
        statusCode = code;
        return {
          json: vi.fn().mockImplementation((body: unknown) => {
            jsonBody = body;
          })
        };
      })
    } as unknown as Response;

    await Module2VolumeAggregationController.getVolumeAggregation(req, res);
    expect(statusCode).toBe(200);
    expect(jsonBody).toBeDefined();
    expect((jsonBody as { success: boolean }).success).toBe(true);
  });

  it('handles exportExcel request successfully', async () => {
    const req = { query: { assessmentId: 'AIC-2026-0003' } } as unknown as Request;
    let statusCode = 0;
    let sentData: unknown = null;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockImplementation((code: number) => {
        statusCode = code;
        return {
          send: vi.fn().mockImplementation((data: unknown) => {
            sentData = data;
          }),
          json: vi.fn()
        };
      })
    } as unknown as Response;

    await Module2VolumeAggregationController.exportExcel(req, res);
    expect(statusCode).toBe(200);
    expect(sentData).toBeDefined();
  }, 30000);

  it('handles internal errors gracefully and returns HTTP 500', async () => {
    const req = { query: { assessmentId: 'INVALID_CRASH_TEST' } } as unknown as Request;
    let statusCode = 0;
    let jsonBody: unknown = null;
    const res = {
      status: vi.fn().mockImplementation((code: number) => {
        statusCode = code;
        return {
          json: vi.fn().mockImplementation((body: unknown) => {
            jsonBody = body;
          })
        };
      })
    } as unknown as Response;

    // Spy on engine calculate to force throw
    vi.spyOn(Module2VolumeAggregationEngine, 'calculate').mockImplementationOnce(() => {
      throw new Error('Simulated database connection error');
    });

    await Module2VolumeAggregationController.getVolumeAggregation(req, res);
    expect(statusCode).toBe(500);
    expect((jsonBody as { success: boolean }).success).toBe(false);
  });
});
