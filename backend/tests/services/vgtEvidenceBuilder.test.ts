import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { VgtEvidenceBuilder } from '../../src/services/vgtEvidenceBuilder';
import type { VgtEvidenceInput } from '../../src/types/vgt';
import { VGT_SHEET_11_NAME } from '../../src/constants/vgtConstants';

describe('VgtEvidenceBuilder Unit Tests', () => {
  it('should build complete evidence workbook and cover all branches', () => {
    const mockInput: VgtEvidenceInput = {
      analysisJobId: 'JOB-TEST-001',
      dataVersionId: 'DATA-VER-001',
      nowIso: '2026-10-07T12:00:00.000Z',
      fileSha256: 'mock_sha256_hash',
      sourceRowCount: 3,
      ingestedRowCount: 3,
      validRowsCount: 2,
      excludedRowsCount: 1,
      anomalyRowsCount: 0,
      validConvertedSpendInr: 10000000,
      validConvertedSpendCr: 1.0,
      customerProfileValidSpendInr: 9500000,
      customerProfileValidSpendCr: 0.95,
      fxMethodologyImpactInr: 500000,
      fxMethodologyImpactCr: 0.05,
      rawAllRowSpendInr: 10500000,
      rawAllRowSpendCr: 1.05,
      excludedSpendInr: 500000,
      excludedSpendCr: 0.05,
      anomalySpendInr: 0,
      anomalySpendCr: 0,
      totalNormalizedInr: 10000000,
      reconciliationVariance: 0,
      txCountByCurrency: { INR: 1, USD: 1, EUR: 0, CNY: 0 },
      originalSpendByCurr: { INR: 5000000, USD: 5000000, EUR: 0, CNY: 0 },
      convertedSpendByCurr: { INR: 5000000, USD: 5000000, EUR: 0, CNY: 0 },
      customerProfileSpendByCurr: { INR: 5000000, USD: 4500000, EUR: 0, CNY: 0 },
      fxImpactByCurr: { INR: 0, USD: 500000, EUR: 0, CNY: 0 },
      allRowTxCountByCurr: { INR: 1, USD: 1, EUR: 0, CNY: 0 },
      fxSummary: {
        totalUploadedSpend: 10000000,
        convertedSpendInr: 10000000,
        fxMasterVersion: 'v2.0',
        fxMasterChecksum: 'mock_checksum',
        fxCoveragePct: 100,
        fxValidationStatus: 'PASS',
        currenciesDetected: ['INR', 'USD'],
        transactionCountByCurrency: { INR: 1, USD: 1 },
        convertedSpendByCurrency: { INR: 5000000, USD: 5000000 },
        pendingFxSpendByCurrency: { INR: 0, USD: 0 }
      },
      validRows: [
        {
          recordId: 'VGT-1',
          sourceRow: 2,
          poNumber: 'PO-1',
          poLine: '10',
          transactionDate: '2024-01-01',
          vendorName: 'SUPPLIER A',
          itemCode: 'ITEM-1',
          itemDescription: 'Desc 1',
          quantity: 10,
          uom: 'EA',
          netPrice: 500000,
          currency: 'INR',
          plant: '1000',
          materialGroup: 'RAW',
          inclusionStatus: 'VALID',
          exclusionReason: undefined
        },
        {
          recordId: 'VGT-2',
          sourceRow: 3,
          poNumber: 'PO-2',
          poLine: '20',
          transactionDate: '2024-01-02',
          vendorName: 'SUPPLIER B',
          itemCode: 'ITEM-2',
          itemDescription: 'Desc 2',
          quantity: 5,
          uom: 'EA',
          netPrice: 1000000,
          currency: 'USD',
          plant: '2000',
          materialGroup: 'PACK',
          inclusionStatus: 'VALID',
          exclusionReason: 'None'
        }
      ],
      validNormalizedTransactions: [
        {
          transactionId: 'VGT-1',
          originalValue: 5000000,
          originalCurrency: 'INR',
          transactionDate: '2024-01-01',
          inrNormalizedValue: 5000000,
          fxRate: 1.0,
          fxRateDate: '2024-01-01',
          status: 'SUCCESS'
        },
        {
          transactionId: 'VGT-2',
          originalValue: 5000000,
          originalCurrency: 'USD',
          transactionDate: '2024-01-02',
          inrNormalizedValue: 5000000,
          fxRate: 80.0,
          fxRateDate: '2024-01-02',
          status: 'SUCCESS'
        }
      ],
      currencyBridges: [
        {
          currency: 'INR',
          profileRate: 1.0,
          validTxCount: 1,
          originalValue: 5000000,
          profileInrValue: 5000000,
          profileInrCr: 0.5,
          historicalInrValue: 5000000,
          historicalInrCr: 0.5,
          fxImpactInr: 0,
          fxImpactCr: 0,
          fxImpactPct: 0
        },
        {
          currency: 'USD',
          profileRate: 75.0,
          validTxCount: 1,
          originalValue: 5000000,
          profileInrValue: 4500000,
          profileInrCr: 0.45,
          historicalInrValue: 5000000,
          historicalInrCr: 0.5,
          fxImpactInr: 500000,
          fxImpactCr: 0.05,
          fxImpactPct: 11.11
        },
        {
          currency: 'CNY',
          profileRate: 6.5,
          validTxCount: 0,
          originalValue: 0,
          profileInrValue: 0,
          profileInrCr: 0,
          historicalInrValue: 0,
          historicalInrCr: 0,
          fxImpactInr: 0,
          fxImpactCr: 0,
          fxImpactPct: 0
        }
      ],
      foreignTransactionsBridge: [
        {
          transactionId: 'VGT-2',
          documentDate: '2024-01-02',
          currency: 'USD',
          originalValue: 5000000,
          profileRate: 75.0,
          profileInrValue: 4500000,
          historicalRate: 80.0,
          historicalRateDate: '2024-01-02',
          historicalInrValue: 5000000,
          fxImpactInr: 500000,
          fxImpactPct: 11.11
        }
      ]
    };

    const out = VgtEvidenceBuilder.buildVgtEvidenceWorkbook(mockInput);
    expect(fs.existsSync(out.workbookPath)).toBe(true);
    expect(out.sheetsCount).toBe(11);
    expect(out.sheets).toContain(VGT_SHEET_11_NAME);
  });

  it('should exercise edge case branches (variance mismatch, zero total spend, missing normalized tx, Pareto B)', () => {
    const mockInput: VgtEvidenceInput = {
      analysisJobId: 'JOB-EDGE',
      dataVersionId: 'DATA-EDGE',
      nowIso: '2026-10-07T12:00:00.000Z',
      fileSha256: 'mock_sha256_edge',
      sourceRowCount: 10,
      ingestedRowCount: 10,
      validRowsCount: 5,
      excludedRowsCount: 1,
      anomalyRowsCount: 1, // 10 - 5 - 1 - 1 = 3 != 0 (popVariance !== 0)
      validConvertedSpendInr: 0, // validConvertedSpendInr == 0
      validConvertedSpendCr: 0,
      customerProfileValidSpendInr: 1000,
      customerProfileValidSpendCr: 0.0001,
      fxMethodologyImpactInr: -1000,
      fxMethodologyImpactCr: -0.0001,
      rawAllRowSpendInr: 0,
      rawAllRowSpendCr: 0,
      excludedSpendInr: 0,
      excludedSpendCr: 0,
      anomalySpendInr: 0,
      anomalySpendCr: 0,
      totalNormalizedInr: 0,
      reconciliationVariance: 0,
      txCountByCurrency: { INR: 5, USD: 0, EUR: 0, CNY: 0 },
      originalSpendByCurr: { INR: 0, USD: 0, EUR: 0, CNY: 0 },
      convertedSpendByCurr: { INR: 0, USD: 0, EUR: 0, CNY: 0 },
      customerProfileSpendByCurr: { INR: 1000, USD: 0, EUR: 0, CNY: 0 },
      fxImpactByCurr: { INR: -1000, USD: 0, EUR: 0, CNY: 0 },
      allRowTxCountByCurr: { INR: 5, USD: 0, EUR: 0, CNY: 0 },
      fxSummary: {
        totalUploadedSpend: 0,
        convertedSpendInr: 0,
        fxMasterVersion: 'v2.0',
        fxMasterChecksum: 'mock',
        fxCoveragePct: 100,
        fxValidationStatus: 'PASS',
        currenciesDetected: ['INR'],
        transactionCountByCurrency: { INR: 5 },
        convertedSpendByCurrency: { INR: 0 },
        pendingFxSpendByCurrency: { INR: 0 }
      },
      validRows: [
        {
          recordId: 'VGT-E1',
          sourceRow: 2,
          poNumber: 'PO-E1',
          poLine: '10',
          transactionDate: '2024-01-01',
          vendorName: 'VEND-A',
          itemCode: 'ITEM-E1',
          itemDescription: 'Desc E1',
          quantity: 1,
          uom: 'EA',
          netPrice: 100,
          currency: 'INR',
          plant: '1000',
          materialGroup: 'G1',
          inclusionStatus: 'VALID',
          exclusionReason: 'Reason 1'
        },
        {
          recordId: 'VGT-E2',
          sourceRow: 3,
          poNumber: 'PO-E2',
          poLine: '20',
          transactionDate: '2024-01-02',
          vendorName: 'VEND-B',
          itemCode: 'ITEM-E2',
          itemDescription: 'Desc E2',
          quantity: 2,
          uom: 'EA',
          netPrice: 200,
          currency: 'INR',
          plant: '2000',
          materialGroup: 'G2',
          inclusionStatus: 'VALID'
        }
      ],
      validNormalizedTransactions: [], // Empty to test normTx undefined fallbacks
      currencyBridges: [
        {
          currency: 'EUR',
          profileRate: 85.0,
          validTxCount: 1,
          originalValue: 100,
          profileInrValue: 8500,
          profileInrCr: 0.00085,
          historicalInrValue: 9000,
          historicalInrCr: 0.0009,
          fxImpactInr: 500,
          fxImpactCr: 0.00005,
          fxImpactPct: 5.88
        }
      ],
      foreignTransactionsBridge: []
    };

    const out = VgtEvidenceBuilder.buildVgtEvidenceWorkbook(mockInput);
    expect(fs.existsSync(out.workbookPath)).toBe(true);
    expect(out.sheetsCount).toBe(11);
  });
});
