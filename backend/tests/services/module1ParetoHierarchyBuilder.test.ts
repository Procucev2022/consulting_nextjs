import { describe, it, expect } from 'vitest';
import { Module1ParetoHierarchyBuilder } from '../../src/services/module1ParetoHierarchyBuilder';
import type { VgtProcessingResult } from '../../src/types/vgt';

describe('Module1ParetoHierarchyBuilder Unit Tests', () => {
  const mockResult: VgtProcessingResult = {
    file: { filename: 'test.xlsx', sha256: 'abc', fileSizeBytes: 100, columnsFound: [] },
    data: { sourceRowCount: 2, validRowCount: 2, excludedRowCount: 0, anomalyRowCount: 0, duplicateRowCount: 0 },
    currency: {
      currenciesDetected: ['INR'],
      transactionCountByCurrency: { INR: 2 },
      originalSpendByCurrency: { INR: 2000 },
      convertedSpendInrByCurrency: { INR: 2000 },
      customerProfileSpendByCurrency: { INR: 2000 },
      fxImpactByCurrency: { INR: 0 },
      allRowTransactionCountByCurrency: { INR: 2 },
      fxCoveragePct: 100,
      fxValidationStatus: 'PASS'
    },
    module1: {
      totalUploadedSpend: 2000,
      totalConvertedInrSpend: 2000,
      totalConvertedInrSpendCr: 0.0002,
      customerProfileSpendInr: 2000,
      customerProfileSpendCr: 0.0002,
      fxMethodologyImpactInr: 0,
      fxMethodologyImpactCr: 0,
      rawAllRowSpendInr: 2000,
      rawAllRowSpendCr: 0.0002,
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
      profileFxValidSpendCr: 0.0002,
      historicalFxValidSpendCr: 0.0002,
      fxMethodologyImpactCr: 0,
      fxImpactPct: 0,
      reconciliationVariance: 0,
      profileRates: { INR: 1 },
      rawAllRowHistoricalSpendCr: 0.0002,
      excludedSpendCr: 0,
      anomalySpendCr: 0,
      currencyBridges: []
    },
    evidence: { workbookPath: '/ev.xlsx', workbookSha256: 'def', sheetsCount: 1, sheets: [] },
    dataVersion: { dataVersionId: 'v1', jobId: 'j1', createdAt: '2026-03-01' },
    validRows: [
      {
        recordId: 'R1',
        sourceRow: 1,
        sourceFile: 'test.xlsx',
        rawRecordId: 'RAW1',
        poNumber: 'P1',
        poLine: 1,
        transactionDate: '2021-04-10',
        billingMonth: '2021-04',
        fiscalYear: 'FY22',
        vendorCode: 'V1',
        vendorName: 'Supplier A',
        normalizedVendor: 'Supplier A',
        vendorConfidence: 1,
        itemCode: 'I1',
        itemDescription: 'Resin Alpha',
        normalizedItem: 'Resin Alpha',
        materialGroup: 'MG1',
        plant: '1000',
        quantity: 1,
        uom: 'KG',
        netPrice: 1200,
        currency: 'INR',
        approvedFxRate: 1,
        fxRateDate: '2021-04-10',
        fxRateSource: 'RBI',
        inrUnitPrice: 1200,
        lineSpendInr: 1200,
        lineSpendCr: 0.00012,
        inclusionStatus: 'VALID_INCLUDED',
        duplicateStatus: 'UNIQUE'
      },
      {
        recordId: 'R2',
        sourceRow: 2,
        sourceFile: 'test.xlsx',
        rawRecordId: 'RAW2',
        poNumber: 'P2',
        poLine: 1,
        transactionDate: '2021-05-15',
        billingMonth: '2021-05',
        fiscalYear: 'FY22',
        vendorCode: 'V2',
        vendorName: 'Supplier B',
        normalizedVendor: 'Supplier B',
        vendorConfidence: 1,
        itemCode: 'I2',
        itemDescription: 'Resin Beta',
        normalizedItem: 'Resin Beta',
        materialGroup: 'MG1',
        plant: '1000',
        quantity: 1,
        uom: 'KG',
        netPrice: 800,
        currency: 'INR',
        approvedFxRate: 1,
        fxRateDate: '2021-05-15',
        fxRateSource: 'RBI',
        inrUnitPrice: 800,
        lineSpendInr: 800,
        lineSpendCr: 0.00008,
        inclusionStatus: 'VALID_INCLUDED',
        duplicateStatus: 'UNIQUE'
      }
    ],
    validNormalizedTransactions: [
      {
        recordId: 'R1',
        rawRecordId: 'RAW1',
        vendor: 'Supplier A',
        description: 'Resin Alpha',
        date: '2021-04-10',
        originalValue: 1200,
        currency: 'INR',
        inrRateApplied: 1,
        inrNormalizedValue: 1200,
        normalizationMethod: 'HISTORICAL_TRANSACTION_DATE',
        sourcePrecisionRate: 1
      },
      {
        recordId: 'R2',
        rawRecordId: 'RAW2',
        vendor: 'Supplier B',
        description: 'Resin Beta',
        date: '2021-05-15',
        originalValue: 800,
        currency: 'INR',
        inrRateApplied: 1,
        inrNormalizedValue: 800,
        normalizationMethod: 'HISTORICAL_TRANSACTION_DATE',
        sourcePrecisionRate: 1
      }
    ]
  };

  it('1. builds bidirectional Pareto hierarchies with zero child variance', () => {
    const hierarchy = Module1ParetoHierarchyBuilder.build(mockResult, 2000);
    expect(hierarchy.supplierToShortText.length).toBeGreaterThan(0);
    expect(hierarchy.shortTextToSupplier.length).toBeGreaterThan(0);
    expect(hierarchy.reconciliation.reconciliationStatus).toBe('RECONCILED');
    expect(hierarchy.reconciliation.vendorChildVarianceCr).toBe(0);
    expect(hierarchy.reconciliation.itemChildVarianceCr).toBe(0);
  });

  it('2. preserves blank Short Text as [Blank / Unspecified] without data loss', () => {
    const customResult: any = {
      ...mockResult,
      validRows: [
        { ...mockResult.validRows[0], itemDescription: '   ' },
        mockResult.validRows[1]
      ]
    };

    const hierarchy = Module1ParetoHierarchyBuilder.build(customResult, 2000);
    const blankNode = hierarchy.shortTextToSupplier.find((it) => it.name === '[Blank / Unspecified]');
    expect(blankNode).toBeDefined();
    expect(blankNode?.totalSpendCr).toBeGreaterThan(0);
  });

  it('3. handles empty valid rows gracefully', () => {
    const emptyResult: any = {
      ...mockResult,
      validRows: [],
      validNormalizedTransactions: []
    };

    const hierarchy = Module1ParetoHierarchyBuilder.build(emptyResult, 0);
    expect(hierarchy.supplierToShortText).toEqual([]);
    expect(hierarchy.shortTextToSupplier).toEqual([]);
    expect(hierarchy.reconciliation.vendorEntitiesCount).toBe(0);
    expect(hierarchy.reconciliation.itemEntitiesCount).toBe(0);
    expect(hierarchy.reconciliation.reconciliationStatus).toBe('RECONCILED');
  });

  it('4. handles totalInr = 0 with valid rows without division by zero', () => {
    const zeroSpendResult: any = {
      ...mockResult,
      validRows: [
        { ...mockResult.validRows[0], lineSpendInr: 0 },
        { ...mockResult.validRows[1], lineSpendInr: 0 }
      ],
      validNormalizedTransactions: [
        { ...mockResult.validNormalizedTransactions[0], inrNormalizedValue: 0 },
        { ...mockResult.validNormalizedTransactions[1], inrNormalizedValue: 0 }
      ]
    };

    const hierarchy = Module1ParetoHierarchyBuilder.build(zeroSpendResult, 0);
    expect(hierarchy.reconciliation.vendorParetoSpendPct).toBe(0);
    expect(hierarchy.reconciliation.itemParetoSpendPct).toBe(0);
  });

  it('5. handles missing validNormalizedTransactions and falls back to lineSpendInr', () => {
    const noTxResult: any = {
      ...mockResult,
      validNormalizedTransactions: []
    };

    const hierarchy = Module1ParetoHierarchyBuilder.build(noTxResult, 2000);
    expect(hierarchy.supplierToShortText.length).toBeGreaterThan(0);
  });
});
