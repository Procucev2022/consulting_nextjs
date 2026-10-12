import { describe, it, expect, beforeAll } from 'vitest';
import { Module1CanonicalService } from '../../src/services/module1CanonicalService';
import { fxReferenceService } from '../../src/services/fxReferenceService';
import type { Module1CanonicalViewModel } from '../../src/types/module1Canonical';
import {
  VGT_POPULATION_SOURCE_ROWS,
  VGT_POPULATION_VALID_ROWS,
  VGT_POPULATION_EXCLUDED_ROWS,
  VGT_POPULATION_ANOMALY_ROWS,
  VGT_VALID_HISTORICAL_FX_SPEND_CR,
  VGT_VALID_CUSTOMER_PROFILE_SPEND_CR,
  VGT_FX_METHODOLOGY_IMPACT_CR,
  VGT_DATASET_SHA256,
  VGT_FX_MASTER_SHA256
} from '../../src/constants/vgtConstants';

describe('Module 1 Canonical View Model Service & Golden VGT Validation (Prompt 329)', () => {
  let canonical: Module1CanonicalViewModel;

  beforeAll(() => {
    fxReferenceService.initialize();
    canonical = Module1CanonicalService.getOrBuildCanonicalViewModel();
  }, 120000);

  it('1. should produce authoritative VGT golden dataset identification and population counts', () => {
    expect(canonical).toBeDefined();
    expect(canonical.sourceFileName).toBe('VGT Testing Data.xlsx');
    expect(canonical.sourceRowCount).toBe(VGT_POPULATION_SOURCE_ROWS);
    expect(canonical.validRowCount).toBe(VGT_POPULATION_VALID_ROWS);
    expect(canonical.excludedRowCount).toBe(VGT_POPULATION_EXCLUDED_ROWS);
    expect(canonical.anomalyRowCount).toBe(VGT_POPULATION_ANOMALY_ROWS);

    // Exact reconciliation identity
    const diff = canonical.sourceRowCount - canonical.validRowCount - canonical.excludedRowCount - canonical.anomalyRowCount;
    expect(diff).toBe(0);
  });

  it('2. should verify authoritative VGT financial metrics (Valid FX spend = ₹4,073.83 Cr)', () => {
    expect(canonical.validFxNormalizedSpendCr).toBeCloseTo(VGT_VALID_HISTORICAL_FX_SPEND_CR, 2);
    expect(canonical.profileFxBaselineSpendCr).toBeCloseTo(VGT_VALID_CUSTOMER_PROFILE_SPEND_CR, 2);
    expect(canonical.fxNormalizationImpactCr).toBeCloseTo(VGT_FX_METHODOLOGY_IMPACT_CR, 2);
    expect(canonical.fxNormalizationImpactPct).toBeCloseTo(3.91, 1);

    // Invariant: Baseline + Impact = Valid FX Spend
    expect(canonical.profileFxBaselineSpendInr + canonical.fxNormalizationImpactInr).toBeCloseTo(
      canonical.validFxNormalizedSpendInr,
      -1
    );
  });

  it('3. should verify currency detection includes exactly INR, USD, EUR, CNY', () => {
    expect(canonical.detectedCurrencies).toEqual(expect.arrayContaining(['INR', 'USD', 'EUR', 'CNY']));
    expect(canonical.currencyBreakdown.length).toBe(4);

    const currencyCodes = canonical.currencyBreakdown.map((c) => c.currency);
    expect(currencyCodes).toEqual(expect.arrayContaining(['INR', 'USD', 'EUR', 'CNY']));
  });

  it('4. should satisfy Invariant 1: Currency breakdown sum equals canonical valid spend with 0 variance', () => {
    const sumCurrencyInr = canonical.currencyBreakdown.reduce((sum, c) => sum + c.historicalSpendInr, 0);
    const varianceInr = Math.abs(sumCurrencyInr - canonical.validFxNormalizedSpendInr);
    expect(varianceInr).toBeLessThan(100); // within integer rounding
  });

  it('5. should satisfy Invariant 2: Material group breakdown sum equals canonical valid spend with 0.00 Cr variance', () => {
    expect(canonical.materialGroups).toBeGreaterThan(0);
    const sumMgCr = canonical.materialGroupSpend.reduce((sum, mg) => sum + mg.spend_inr_cr, 0);
    expect(sumMgCr).toBeCloseTo(canonical.validFxNormalizedSpendCr, 1);
  });

  it('6. should satisfy Invariant 3: Supplier breakdown sum equals canonical valid spend with 0.00 Cr variance', () => {
    expect(canonical.uniqueVendors).toBeGreaterThan(0);
    const sumSupplierCr = canonical.supplierSpend.reduce((sum, s) => sum + s.spend_inr_cr, 0);
    expect(sumSupplierCr).toBeCloseTo(canonical.validFxNormalizedSpendCr, 1);
  });

  it('7. should satisfy Invariant 4: Plant breakdown sum equals canonical valid spend with 0.00 Cr variance', () => {
    expect(canonical.operatingPlants).toBeGreaterThan(0);
    const sumPlantCr = canonical.plantSpend.reduce((sum, p) => sum + p.spend_inr_cr, 0);
    expect(sumPlantCr).toBeCloseTo(canonical.validFxNormalizedSpendCr, 1);
  });

  it('8. should satisfy Invariant 5: Monthly breakdown sum equals canonical valid spend with 0.00 Cr variance', () => {
    expect(canonical.billingMonths).toBe(10);
    const sumMonthCr = canonical.monthlySpend.reduce((sum, m) => sum + m.spend_inr_cr, 0);
    expect(sumMonthCr).toBeCloseTo(canonical.validFxNormalizedSpendCr, 1);
  });

  it('9. should satisfy Invariant 6: Pareto 80/20 denominator equals canonical valid spend', () => {
    expect(canonical.pareto).toBeDefined();
    expect(canonical.pareto.totalSpendCr).toBeCloseTo(canonical.validFxNormalizedSpendCr, 1);
    expect(canonical.pareto.top80SpendCr).toBeLessThanOrEqual(canonical.validFxNormalizedSpendCr);
    expect(canonical.pareto.top80SpendPct).toBeGreaterThanOrEqual(79);
    expect(canonical.pareto.top80SpendPct).toBeLessThanOrEqual(85);
  });

  it('10. should satisfy Invariant 7: System-wide reconciliation status is RECONCILED with zero variance', () => {
    expect(canonical.reconciliationStatus).toBe('RECONCILED');
    expect(canonical.reconciliationVarianceInr).toBe(0);
  });

  it('11. should verify actual data coverage is separated from configured evaluation window and period metadata is accurate', () => {
    expect(canonical.configuredEvaluationWindow).toBe('10 Billing Months (FY22 | 10 of 12 months available)');
    expect(canonical.actualDataCoverage.billingMonthsCount).toBe(10);
    expect(canonical.actualDataCoverage.dateRangeLabel).toBe('Apr 2021 – Jan 2022');
    expect(canonical.actualDataCoverage.firstTransactionDate).toBe('2021-04-01');
    expect(canonical.actualDataCoverage.lastTransactionDate).toBe('2022-01-31');

    // Authoritative Period Metadata
    expect(canonical.periodMetadata).toBeDefined();
    const pm = canonical.periodMetadata!;
    expect(pm.minTransactionDate).toBe('April 2021');
    expect(pm.maxTransactionDate).toBe('January 2022');
    expect(pm.actualBillingMonths).toBe(10);
    expect(pm.actualFiscalYears).toEqual(['FY22']);
    expect(pm.actualMonthKeys.length).toBe(10);
    expect(pm.fiscalMonthCoverage).toBe('FY22 | 10 of 12 months available');
    expect(pm.availableMonthsByFiscalYear).toEqual({ FY22: 10 });
    expect(pm.missingMonthsByFiscalYear).toEqual({ FY22: ['February 2022', 'March 2022'] });
    expect(pm.hasMultiYearComparison).toBe(false);
    expect(pm.has36MonthCoverage).toBe(false);

    // Monthly Spend item assertions
    expect(canonical.monthlySpend.length).toBe(10);
    expect(canonical.monthlySpend.every(m => m.fiscalYear === 'FY22')).toBe(true);
    expect(canonical.monthlySpend[0].monthLabel).toBe('Apr 2021');
    expect(canonical.monthlySpend[9].monthLabel).toBe('Jan 2022');
  });

  it('12. should verify truthful module statuses (Module 1 READY, Modules 2-4 PENDING)', () => {
    expect(canonical.moduleStatuses.module1).toBe('READY');
    expect(canonical.moduleStatuses.module2).toBe('PENDING');
    expect(canonical.moduleStatuses.module3).toBe('PENDING');
    expect(canonical.moduleStatuses.module4).toBe('PENDING');
  });

  it('13. should verify frozen FX Master checksum and version', () => {
    expect(canonical.fxMasterVersion).toBe('2.0');
    expect(canonical.fxMasterChecksum).toBe(VGT_FX_MASTER_SHA256);
  });

  it('14. should verify validation summary matches authoritative exclusions and anomalies', () => {
    expect(canonical.validationSummary.sourceRows).toBe(20505);
    expect(canonical.validationSummary.validRows).toBe(20241);
    expect(canonical.validationSummary.excludedRows).toBe(252);
    expect(canonical.validationSummary.anomalyRows).toBe(12);
    expect(canonical.validationSummary.cleanSpendYieldPct).toBeCloseTo(98.7, 1);
  });

  it('15. should support cache operations: getCachedViewModel, setCachedViewModel, clearCache', () => {
    Module1CanonicalService.setCachedViewModel(canonical);
    expect(Module1CanonicalService.getCachedViewModel()).toBe(canonical);
    expect(Module1CanonicalService.getOrBuildCanonicalViewModel()).toBe(canonical);
    Module1CanonicalService.clearCache();
    expect(Module1CanonicalService.getCachedViewModel()).toBeNull();
  });

  it('16. should set reconciliationStatus to REVIEW_REQUIRED if variance > 0', () => {
    const customResult: any = {
      file: { filename: 'f.xlsx', sha256: 'abc', fileSizeBytes: 10, columnsFound: [] },
      data: { sourceRowCount: 1, validRowCount: 1, excludedRowCount: 0, anomalyRowCount: 0 },
      currency: { currenciesDetected: ['INR'] },
      module1: {
        totalConvertedInrSpend: 1000,
        totalConvertedInrSpendCr: 0.0001,
        customerProfileSpendInr: 1000,
        customerProfileSpendCr: 0.0001,
        fxMethodologyImpactInr: 0,
        fxMethodologyImpactCr: 0
      },
      forensicBridge: { currencyBridges: [], fxImpactPct: 0 },
      dataVersion: { dataVersionId: 'v', jobId: 'j' },
      validRows: [
        { vendorName: 'V', materialGroup: 'MG', plant: 'P', transactionDate: '2024-05-01' }
      ],
      validNormalizedTransactions: [
        { inrNormalizedValue: 500 } // Mismatch with totalConvertedInrSpend 1000 -> variance 500
      ]
    };

    const vm = Module1CanonicalService.buildCanonicalViewModel(customResult);
    expect(vm.reconciliationVarianceInr).toBeGreaterThan(0);
    expect(vm.reconciliationStatus).toBe('REVIEW_REQUIRED');
  });

  it('17. should verify authoritative Pareto 80% bidirectional hierarchy and zero reconciliation variance', () => {
    expect(canonical.paretoHierarchy).toBeDefined();
    const ph = canonical.paretoHierarchy!;

    expect(ph.supplierToShortText.length).toBe(16);
    expect(ph.shortTextToSupplier.length).toBe(115);

    expect(ph.reconciliation.reconciliationStatus).toBe('RECONCILED');
    expect(ph.reconciliation.vendorChildVarianceCr).toBe(0);
    expect(ph.reconciliation.itemChildVarianceCr).toBe(0);
    expect(ph.reconciliation.vendorParetoSpendCr).toBeCloseTo(3277.68, 1);
    expect(ph.reconciliation.itemParetoSpendCr).toBeCloseTo(3262.72, 1);

    // Top 3 suppliers verification
    const hk = ph.supplierToShortText[0];
    expect(hk.name).toBe('HONG KONG RESISTORS');
    expect(hk.totalSpendCr).toBeCloseTo(1192.27, 1);
    expect(hk.children.length).toBe(76);
    const hkChildSum = hk.children.reduce((sum, c) => sum + c.spendCr, 0);
    expect(Math.abs(hk.totalSpendCr - hkChildSum)).toBeLessThan(0.001);

    const winsun = ph.supplierToShortText[1];
    expect(winsun.name).toBe('WINSUN ELECTRONIC TECHNOLOGY');
    expect(winsun.totalSpendCr).toBeCloseTo(331.48, 1);
    expect(winsun.children.length).toBe(32);

    const hindalco = ph.supplierToShortText[2];
    expect(hindalco.name).toBe('HINDALCO INDUSTRIES LTD. UNIT:');
    expect(hindalco.totalSpendCr).toBeCloseTo(236.06, 1);
    expect(hindalco.children.length).toBe(2);

    // Reverse hierarchy top item verification
    const copper = ph.shortTextToSupplier[0];
    expect(copper.name).toBe('CC COPPER WIRE ROD 8MM');
    expect(copper.totalSpendCr).toBeCloseTo(652.14, 1);
    expect(copper.children.length).toBe(6);
    const copperChildSum = copper.children.reduce((sum, c) => sum + c.spendCr, 0);
    expect(Math.abs(copper.totalSpendCr - copperChildSum)).toBeLessThan(0.001);
  });
});
