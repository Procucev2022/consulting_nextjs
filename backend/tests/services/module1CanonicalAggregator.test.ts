import { describe, it, expect } from 'vitest';
import { Module1CanonicalAggregator } from '../../src/services/module1CanonicalAggregator';
import type { VgtProcessingResult } from '../../src/types/vgt';

describe('Module1CanonicalAggregator Unit Tests', () => {
  const mockResult: VgtProcessingResult = {
    file: {
      filename: 'test.xlsx',
      sha256: 'abc123',
      fileSizeBytes: 1000,
      columnsFound: ['po', 'qty']
    },
    data: {
      sourceRowCount: 2,
      validRowCount: 2,
      excludedRowCount: 0,
      anomalyRowCount: 0,
      duplicateRowCount: 0
    },
    currency: {
      currenciesDetected: ['INR', 'USD'],
      transactionCountByCurrency: { INR: 1, USD: 1 },
      originalSpendByCurrency: { INR: 1000, USD: 10 },
      convertedSpendInrByCurrency: { INR: 1000, USD: 838 },
      customerProfileSpendByCurrency: { INR: 1000, USD: 750 },
      fxImpactByCurrency: { INR: 0, USD: 88 },
      allRowTransactionCountByCurrency: { INR: 1, USD: 1 },
      fxCoveragePct: 100,
      fxValidationStatus: 'PASS'
    },
    module1: {
      totalUploadedSpend: 1838,
      totalConvertedInrSpend: 1838,
      totalConvertedInrSpendCr: 0.0001838,
      customerProfileSpendInr: 1750,
      customerProfileSpendCr: 0.000175,
      fxMethodologyImpactInr: 88,
      fxMethodologyImpactCr: 0.0000088,
      rawAllRowSpendInr: 1838,
      rawAllRowSpendCr: 0.0001838,
      excludedSpendInr: 0,
      excludedSpendCr: 0,
      anomalySpendInr: 0,
      anomalySpendCr: 0,
      pendingSpend: 0,
      reconciliationVariance: 0,
      duplicateCount: 0,
      validCount: 2,
      excludedCount: 0,
      anomalyCount: 0,
      populationVariance: 0,
      reconciliationPassed: true
    },
    rootCauseAnalysis: {
      primaryCause: 'None',
      fieldLevelEvidence: [],
      fxConversionEvidence: {
        erpStaticRatesUsed: {},
        authoritativeDailyRatesRange: {},
        erpStaticTotalInrCr: 0,
        authoritativeConvertedInrCr: 0,
        deltaInrCr: 0
      },
      conclusion: 'Reconciled'
    },
    forensicBridge: {
      profileFxValidSpendCr: 0.000175,
      historicalFxValidSpendCr: 0.0001838,
      fxMethodologyImpactCr: 0.0000088,
      fxImpactPct: 5.0,
      reconciliationVariance: 0,
      profileRates: { USD: 75 },
      rawAllRowHistoricalSpendCr: 0.0001838,
      excludedSpendCr: 0,
      anomalySpendCr: 0,
      currencyBridges: [
        {
          currency: 'USD',
          validTxCount: 1,
          originalValue: 10,
          profileRate: 75,
          profileInrValue: 750,
          profileInrCr: 0.000075,
          historicalInrValue: 838,
          historicalInrCr: 0.0000838,
          fxImpactInr: 88,
          fxImpactCr: 0.0000088,
          fxImpactPct: 11.73
        }
      ]
    },
    evidence: {
      workbookPath: '/evidence.xlsx',
      workbookSha256: 'def456',
      sheetsCount: 1,
      sheets: ['README']
    },
    dataVersion: {
      dataVersionId: 'v1',
      jobId: 'job1',
      createdAt: '2026-03-01'
    },
    validRows: [
      {
        recordId: 'R1',
        sourceRow: 1,
        sourceFile: 'test.xlsx',
        rawRecordId: 'RAW1',
        poNumber: 'PO1',
        poLine: 1,
        transactionDate: '2024-05-15',
        billingMonth: '2024-05',
        fiscalYear: 'FY25',
        vendorCode: 'V01',
        vendorName: 'Supplier Alpha',
        normalizedVendor: 'Supplier Alpha',
        vendorConfidence: 0.99,
        itemCode: 'ITEM1',
        itemDescription: 'Direct Resin',
        normalizedItem: 'Direct Resin',
        materialGroup: 'Resins',
        plant: '1000',
        quantity: 10,
        uom: 'KG',
        netPrice: 100,
        currency: 'INR',
        approvedFxRate: 1.0,
        fxRateDate: '2024-05-15',
        fxRateSource: 'RBI',
        inrUnitPrice: 100,
        lineSpendInr: 1000,
        lineSpendCr: 0.0001,
        inclusionStatus: 'VALID_INCLUDED',
        duplicateStatus: 'UNIQUE'
      },
      {
        recordId: 'R2',
        sourceRow: 2,
        sourceFile: 'test.xlsx',
        rawRecordId: 'RAW2',
        poNumber: 'PO2',
        poLine: 1,
        transactionDate: '2024-06-20',
        billingMonth: '2024-06',
        fiscalYear: 'FY25',
        vendorCode: 'V02',
        vendorName: 'Supplier Beta',
        normalizedVendor: 'Supplier Beta',
        vendorConfidence: 0.99,
        itemCode: 'ITEM2',
        itemDescription: 'Packaging Box',
        normalizedItem: 'Packaging Box',
        materialGroup: 'Packaging',
        plant: '2000',
        quantity: 1,
        uom: 'EA',
        netPrice: 10,
        currency: 'USD',
        approvedFxRate: 83.8,
        fxRateDate: '2024-06-20',
        fxRateSource: 'Yahoo Finance',
        inrUnitPrice: 838,
        lineSpendInr: 838,
        lineSpendCr: 0.0000838,
        inclusionStatus: 'VALID_INCLUDED',
        duplicateStatus: 'UNIQUE'
      }
    ],
    validNormalizedTransactions: [
      {
        recordId: 'R1',
        rawRecordId: 'RAW1',
        vendor: 'Supplier Alpha',
        description: 'Direct Resin',
        date: '2024-05-15',
        originalValue: 1000,
        currency: 'INR',
        inrRateApplied: 1.0,
        inrNormalizedValue: 1000,
        normalizationMethod: 'HISTORICAL_TRANSACTION_DATE',
        sourcePrecisionRate: 1.0
      },
      {
        recordId: 'R2',
        rawRecordId: 'RAW2',
        vendor: 'Supplier Beta',
        description: 'Packaging Box',
        date: '2024-06-20',
        originalValue: 10,
        currency: 'USD',
        inrRateApplied: 83.8,
        inrNormalizedValue: 838,
        normalizationMethod: 'HISTORICAL_TRANSACTION_DATE',
        sourcePrecisionRate: 83.8
      }
    ]
  };

  it('aggregates supplier spend with correct ranks and pareto classes', () => {
    const suppliers = Module1CanonicalAggregator.buildSupplierSpend(mockResult, 1838);
    expect(suppliers).toHaveLength(2);
    expect(suppliers[0].supplierName).toBe('Supplier Alpha');
    expect(suppliers[0].rank).toBe(1);
    expect(suppliers[0].paretoClass).toBe('A');
    expect(suppliers[1].supplierName).toBe('Supplier Beta');
    expect(suppliers[1].rank).toBe(2);
  });

  it('aggregates material group spend correctly', () => {
    const mgs = Module1CanonicalAggregator.buildMaterialGroupSpend(mockResult, 1838);
    expect(mgs).toHaveLength(2);
    expect(mgs[0].groupCode).toBe('Resins');
    expect(mgs[1].groupCode).toBe('Packaging');
  });

  it('aggregates plant spend correctly', () => {
    const plants = Module1CanonicalAggregator.buildPlantSpend(mockResult, 1838);
    expect(plants).toHaveLength(2);
    expect(plants[0].plantCode).toBe('1000');
    expect(plants[1].plantCode).toBe('2000');
  });

  it('aggregates monthly spend and determines fiscal years', () => {
    const months = Module1CanonicalAggregator.buildMonthlySpend(mockResult);
    expect(months).toHaveLength(2);
    expect(months[0].monthKey).toBe('2024-05');
    expect(months[0].fiscalYear).toBe('FY25');
    expect(months[1].monthKey).toBe('2024-06');
  });

  it('builds currency breakdown from forensic bridge', () => {
    const curr = Module1CanonicalAggregator.buildCurrencyBreakdown(mockResult);
    expect(curr).toHaveLength(1);
    expect(curr[0].currency).toBe('USD');
    expect(curr[0].fxImpactInr).toBe(88);
  });

  it('builds actual data coverage and handles empty monthly spend gracefully', () => {
    const coverage = Module1CanonicalAggregator.buildDataCoverage(
      Module1CanonicalAggregator.buildMonthlySpend(mockResult)
    );
    expect(coverage.billingMonthsCount).toBe(2);
    expect(coverage.dateRangeLabel).toBe('May 2024 – Jun 2024');

    const emptyCoverage = Module1CanonicalAggregator.buildDataCoverage([]);
    expect(emptyCoverage.billingMonthsCount).toBe(0);
    expect(emptyCoverage.startDate).toBe('N/A');
  });

  it('verifies financial invariants with 0 variance when matching', () => {
    const totalInr = 1838;
    const supps = Module1CanonicalAggregator.buildSupplierSpend(mockResult, totalInr);
    const mgs = Module1CanonicalAggregator.buildMaterialGroupSpend(mockResult, totalInr);
    const plants = Module1CanonicalAggregator.buildPlantSpend(mockResult, totalInr);
    const months = Module1CanonicalAggregator.buildMonthlySpend(mockResult);

    const variance = Module1CanonicalAggregator.verifyFinancialInvariants(
      totalInr,
      supps,
      mgs,
      plants,
      months
    );
    expect(variance).toBe(0);
  });

  it('returns maximum variance when invariant threshold is exceeded', () => {
    const totalInr = 1838;
    const supps = Module1CanonicalAggregator.buildSupplierSpend(mockResult, totalInr);
    const mgs = Module1CanonicalAggregator.buildMaterialGroupSpend(mockResult, totalInr);
    const plants = Module1CanonicalAggregator.buildPlantSpend(mockResult, totalInr);
    const months = Module1CanonicalAggregator.buildMonthlySpend(mockResult);

    // Provide mismatched total
    const variance = Module1CanonicalAggregator.verifyFinancialInvariants(
      9999,
      supps,
      mgs,
      plants,
      months
    );
    expect(variance).toBeGreaterThan(1.0);
  });

  it('handles zero totalInr without throwing divisions by zero', () => {
    const suppliers = Module1CanonicalAggregator.buildSupplierSpend(mockResult, 0);
    expect(suppliers[0].sharePct).toBe(0);
    expect(suppliers[0].cumulativePct).toBe(0);

    const mgs = Module1CanonicalAggregator.buildMaterialGroupSpend(mockResult, 0);
    expect(mgs[0].sharePct).toBe(0);

    const plants = Module1CanonicalAggregator.buildPlantSpend(mockResult, 0);
    expect(plants[0].sharePct).toBe(0);
  });

  it('handles missing materialGroup and diverse transaction dates for fiscal years', () => {
    const customResult: any = {
      ...mockResult,
      validRows: [
        {
          ...mockResult.validRows[0],
          materialGroup: '',
          transactionDate: '2024-02-10' // FY24
        },
        {
          ...mockResult.validRows[1],
          transactionDate: '2025-05-15' // FY26
        }
      ]
    };

    const mgs = Module1CanonicalAggregator.buildMaterialGroupSpend(customResult, 1838);
    expect(mgs.some((m) => m.groupCode === 'Direct Material')).toBe(true);

    const months = Module1CanonicalAggregator.buildMonthlySpend(customResult);
    expect(months.find((m) => m.monthKey === '2024-02')?.fiscalYear).toBe('FY24');
    expect(months.find((m) => m.monthKey === '2025-05')?.fiscalYear).toBe('FY26');
  });

  it('handles fallback to spend_inr_cr in verifyFinancialInvariants when spendInr is missing', () => {
    const supps: any = [{ spend_inr_cr: 0.0001, spendInr: undefined }];
    const mgs: any = [{ spend_inr_cr: 0.0001, spendInr: undefined }];
    const plants: any = [{ spend_inr_cr: 0.0001, spendInr: undefined }];
    const months: any = [{ spend_inr_cr: 0.0001, spendInr: undefined }];

    const variance = Module1CanonicalAggregator.verifyFinancialInvariants(
      1000,
      supps,
      mgs,
      plants,
      months
    );
    expect(variance).toBe(0);
  });

  describe('buildParetoHierarchy', () => {
    it('builds bidirectional Pareto hierarchies and reconciles child spend to parent spend with 0 variance', () => {
      const hierarchy = Module1CanonicalAggregator.buildParetoHierarchy(mockResult, 1838);

      expect(hierarchy).toBeDefined();
      expect(hierarchy.supplierToShortText.length).toBeGreaterThan(0);
      expect(hierarchy.shortTextToSupplier.length).toBeGreaterThan(0);
      expect(hierarchy.reconciliation.reconciliationStatus).toBe('RECONCILED');
      expect(hierarchy.reconciliation.vendorChildVarianceCr).toBe(0);
      expect(hierarchy.reconciliation.itemChildVarianceCr).toBe(0);

      // Verify Supplier -> Short Text
      const supplierAlpha = hierarchy.supplierToShortText.find((s) => s.name === 'Supplier Alpha');
      expect(supplierAlpha).toBeDefined();
      expect(supplierAlpha?.children.length).toBeGreaterThan(0);
      const childSum = supplierAlpha?.children.reduce((sum, c) => sum + c.spendCr, 0) || 0;
      expect(Math.abs((supplierAlpha?.totalSpendCr || 0) - childSum)).toBeLessThan(0.0001);

      // Verify Short Text -> Supplier
      const resinItem = hierarchy.shortTextToSupplier.find((it) => it.name === 'Direct Resin');
      expect(resinItem).toBeDefined();
      expect(resinItem?.children.length).toBeGreaterThan(0);
      const suppChildSum = resinItem?.children.reduce((sum, c) => sum + c.spendCr, 0) || 0;
      expect(Math.abs((resinItem?.totalSpendCr || 0) - suppChildSum)).toBeLessThan(0.0001);
    });

    it('preserves blank Short Text as [Blank / Unspecified] without silent data loss', () => {
      const customResult: any = {
        ...mockResult,
        validRows: [
          {
            ...mockResult.validRows[0],
            itemDescription: '   ' // Blank/whitespace
          },
          mockResult.validRows[1]
        ]
      };

      const hierarchy = Module1CanonicalAggregator.buildParetoHierarchy(customResult, 1838);
      const unspecifiedNode = hierarchy.shortTextToSupplier.find((it) => it.name === '[Blank / Unspecified]');
      expect(unspecifiedNode).toBeDefined();
      expect(unspecifiedNode?.totalSpendCr).toBeGreaterThan(0);
      expect(hierarchy.reconciliation.reconciliationStatus).toBe('RECONCILED');
    });

    it('handles empty valid rows gracefully', () => {
      const emptyResult: any = {
        ...mockResult,
        validRows: [],
        validNormalizedTransactions: []
      };

      const hierarchy = Module1CanonicalAggregator.buildParetoHierarchy(emptyResult, 0);
      expect(hierarchy.supplierToShortText).toEqual([]);
      expect(hierarchy.shortTextToSupplier).toEqual([]);
      expect(hierarchy.reconciliation.vendorEntitiesCount).toBe(0);
      expect(hierarchy.reconciliation.itemEntitiesCount).toBe(0);
      expect(hierarchy.reconciliation.reconciliationStatus).toBe('RECONCILED');
    });
  });

  describe('Indian Fiscal Year & Period Metadata Scenarios (Prompt 334)', () => {
    it('1. maps calendar months to Indian Fiscal Years correctly (Apr-Mar cycle)', () => {
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2021-04')).toBe('FY22');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2021-09')).toBe('FY22');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2021-12')).toBe('FY22');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2022-01')).toBe('FY22');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2022-02')).toBe('FY22');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2022-03')).toBe('FY22');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2022-04')).toBe('FY23');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('2023-03')).toBe('FY23');
      expect(Module1CanonicalAggregator.getIndianFiscalYear('invalid-key')).toBe('FY22');
    });

    it('2. Scenario A (Authoritative VGT 10-Month Dataset): verifies Apr 2021 - Jan 2022 is strictly FY22 with 10 of 12 months', () => {
      const vgtMonthKeys = [
        '2021-04', '2021-05', '2021-06', '2021-07', '2021-08',
        '2021-09', '2021-10', '2021-11', '2021-12', '2022-01'
      ];
      const monthlySpendItems = vgtMonthKeys.map((mk, idx) => ({
        monthKey: mk,
        monthLabel: mk,
        fiscalYear: 'FY22',
        spend_inr: 1000 * (idx + 1),
        spend_inr_cr: (1000 * (idx + 1)) / 1e7,
        spendCr: (1000 * (idx + 1)) / 1e7,
        recordCount: 100,
        mom_change_pct: idx === 0 ? 0 : 10.0
      }));

      const meta = Module1CanonicalAggregator.buildPeriodMetadata(monthlySpendItems);
      expect(meta.minTransactionDate).toBe('April 2021');
      expect(meta.maxTransactionDate).toBe('January 2022');
      expect(meta.actualBillingMonths).toBe(10);
      expect(meta.actualFiscalYears).toEqual(['FY22']);
      expect(meta.actualMonthKeys).toEqual(vgtMonthKeys);
      expect(meta.fiscalMonthCoverage).toBe('FY22 | 10 of 12 months available');
      expect(meta.availableMonthsByFiscalYear).toEqual({ FY22: 10 });
      expect(meta.missingMonthsByFiscalYear).toEqual({ FY22: ['February 2022', 'March 2022'] });
      expect(meta.hasMultiYearComparison).toBe(false);
      expect(meta.has36MonthCoverage).toBe(false);
    });

    it('3. Scenario B (Synthetic 36-Month Fixture): verifies 36 months enables multi-year comparison and 36-month coverage', () => {
      const all36Months: any[] = [];
      let y = 2021;
      let m = 4;
      for (let i = 0; i < 36; i++) {
        const mStr = m.toString().padStart(2, '0');
        const mk = `${y}-${mStr}`;
        const fy = Module1CanonicalAggregator.getIndianFiscalYear(mk);
        all36Months.push({
          monthKey: mk,
          monthLabel: mk,
          fiscalYear: fy,
          spend_inr: 1000,
          spend_inr_cr: 0.0001,
          spendCr: 0.0001,
          recordCount: 50,
          mom_change_pct: 0
        });
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }

      const meta = Module1CanonicalAggregator.buildPeriodMetadata(all36Months);
      expect(meta.actualBillingMonths).toBe(36);
      expect(meta.actualFiscalYears).toEqual(['FY22', 'FY23', 'FY24']);
      expect(meta.hasMultiYearComparison).toBe(true);
      expect(meta.has36MonthCoverage).toBe(true);
      expect(meta.missingMonthsByFiscalYear).toEqual({ FY22: [], FY23: [], FY24: [] });
    });

    it('4. Scenario C (Partial Multi-Year Dataset): handles 2 fiscal years without full 36 months', () => {
      const partialMonths: any[] = [
        { monthKey: '2021-04', monthLabel: 'Apr 2021', fiscalYear: 'FY22', spend_inr: 100, spend_inr_cr: 0.00001, spendCr: 0.00001, recordCount: 1, mom_change_pct: 0 },
        { monthKey: '2021-05', monthLabel: 'May 2021', fiscalYear: 'FY22', spend_inr: 100, spend_inr_cr: 0.00001, spendCr: 0.00001, recordCount: 1, mom_change_pct: 0 },
        { monthKey: '2022-04', monthLabel: 'Apr 2022', fiscalYear: 'FY23', spend_inr: 100, spend_inr_cr: 0.00001, spendCr: 0.00001, recordCount: 1, mom_change_pct: 0 }
      ];

      const meta = Module1CanonicalAggregator.buildPeriodMetadata(partialMonths);
      expect(meta.actualBillingMonths).toBe(3);
      expect(meta.actualFiscalYears).toEqual(['FY22', 'FY23']);
      expect(meta.hasMultiYearComparison).toBe(true);
      expect(meta.has36MonthCoverage).toBe(false);
      expect(meta.availableMonthsByFiscalYear).toEqual({ FY22: 2, FY23: 1 });
    });

    it('5. Scenario D (Zero-Data / Empty-State): handles zero months gracefully', () => {
      const meta = Module1CanonicalAggregator.buildPeriodMetadata([]);
      expect(meta.actualBillingMonths).toBe(0);
      expect(meta.actualFiscalYears).toEqual([]);
      expect(meta.actualMonthKeys).toEqual([]);
      expect(meta.minTransactionDate).toBe('N/A');
      expect(meta.maxTransactionDate).toBe('N/A');
      expect(meta.fiscalMonthCoverage).toBe('0 months');
      expect(meta.hasMultiYearComparison).toBe(false);
      expect(meta.has36MonthCoverage).toBe(false);
    });

    it('6. Scenario E (Financial Invariant & MoM Calculations): buildMonthlySpend computes monthLabel, FY, and MoM correctly', () => {
      const rowsWithMonths: any = {
        ...mockResult,
        validRows: [
          { ...mockResult.validRows[0], transactionDate: '2021-04-10', billingMonth: '2021-04', lineSpendInr: 1000 },
          { ...mockResult.validRows[1], transactionDate: '2021-05-15', billingMonth: '2021-05', lineSpendInr: 2000 }
        ]
      };

      const monthly = Module1CanonicalAggregator.buildMonthlySpend(rowsWithMonths, 1838);
      expect(monthly.length).toBe(2);
      expect(monthly[0].monthKey).toBe('2021-04');
      expect(monthly[0].monthLabel).toBe('Apr 2021');
      expect(monthly[0].fiscalYear).toBe('FY22');
      expect(monthly[0].mom_change_pct).toBe(0);

      expect(monthly[1].monthKey).toBe('2021-05');
      expect(monthly[1].monthLabel).toBe('May 2021');
      expect(monthly[1].fiscalYear).toBe('FY22');
      // 1000 in Apr -> 838 in May = ((838 - 1000) / 1000) * 100 = -16.2%
      expect(monthly[1].mom_change_pct).toBe(-16.2);

      // Financial invariant: sum matches total spend
      const sumInr = monthly.reduce((s, m) => s + (m.spendInr || 0), 0);
      expect(sumInr).toBe(1838);
    });
  });
});
