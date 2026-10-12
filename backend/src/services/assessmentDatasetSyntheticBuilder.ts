/**
 * Synthetic Dataset Fixture Builder for Assessment Verification
 */

import path from 'path';
import type {
  VgtProcessingResult,
  ValidatedTransactionLedgerRecord,
  FxNormalizedTransaction
} from '../types';
import type { ParseOptions } from './assessmentDatasetParser';

export class AssessmentDatasetSyntheticBuilder {
  public static buildSyntheticDataset(filePath: string, options: ParseOptions): VgtProcessingResult {
    const count = 1000;
    const totalSpendCr = 125.40;
    const totalInr = totalSpendCr * 10000000;
    const rowInr = totalInr / count;

    const validRows: ValidatedTransactionLedgerRecord[] = [];
    const validNormalized: FxNormalizedTransaction[] = [];

    for (let i = 0; i < count; i++) {
      const recordId = `${options.assessmentId}-ROW-${String(i + 1).padStart(6, '0')}`;
      const vendorName = `Supplier ${((i % 25) + 1).toString().padStart(2, '0')}`;
      const materialGroup = `Category ${((i % 8) + 1).toString()}`;
      const plant = `Plant ${((i % 4) + 1) * 1000}`;
      const mNum = (i % 12) + 1;
      const billingMonth = `2023-${String(mNum).padStart(2, '0')}`;

      validRows.push({
        recordId,
        sourceRow: i + 2,
        sourceFile: options.fileName || path.basename(filePath),
        rawRecordId: recordId,
        poNumber: `PO-${100000 + i}`,
        poLine: '10',
        transactionDate: `${billingMonth}-15`,
        billingMonth,
        fiscalYear: 'FY24',
        vendorCode: `VND-${(i % 25) + 1}`,
        vendorName,
        normalizedVendor: vendorName,
        vendorConfidence: 100,
        itemCode: `MAT-${(i % 50) + 1}`,
        itemDescription: `Component ${(i % 50) + 1} for ${materialGroup}`,
        normalizedItem: `Component ${(i % 50) + 1} for ${materialGroup}`,
        materialGroup,
        plant,
        quantity: 100,
        uom: 'EA',
        netPrice: rowInr / 100,
        currency: 'INR',
        approvedFxRate: 1.0,
        fxRateDate: `${billingMonth}-15`,
        fxRateSource: 'RBI_OFFICIAL',
        inrUnitPrice: rowInr / 100,
        lineSpendInr: rowInr,
        lineSpendCr: Number((rowInr / 10000000).toFixed(6)),
        inclusionStatus: 'VALID',
        duplicateStatus: 'LEGITIMATE_REPEAT_TRANSACTION'
      });

      validNormalized.push({
        transactionId: recordId,
        originalValue: rowInr,
        originalCurrency: 'INR',
        transactionDate: `${billingMonth}-15`,
        fxRate: 1.0,
        fxRateDate: `${billingMonth}-15`,
        fxSource: 'RBI_OFFICIAL',
        fxSourceId: 'RBI_REF',
        fxRateType: 'DAILY',
        fxConversionMethod: 'BASE_CURRENCY',
        fxConversionStatus: 'CONVERTED',
        inrNormalizedValue: rowInr,
        fxMasterVersion: '2020-2026-v2'
      });
    }

    return {
      file: {
        filename: options.fileName || path.basename(filePath),
        sha256: 'mock-synthetic-sha256',
        sourceRowCount: count,
        sheetNames: ['Sheet1'],
        columnsFound: ['PO', 'Vendor', 'Material', 'Spend']
      },
      data: {
        sourceRowCount: count,
        ingestedRowCount: count,
        validRowCount: count,
        excludedRowCount: 0,
        anomalyRowCount: 0,
        duplicateRowCount: 0
      },
      currency: {
        currenciesDetected: ['INR'],
        transactionCountByCurrency: { INR: count },
        originalSpendByCurrency: { INR: totalInr },
        convertedSpendInrByCurrency: { INR: totalInr },
        customerProfileSpendByCurrency: { INR: totalInr * 0.94 },
        fxImpactByCurrency: { INR: totalInr * 0.06 },
        allRowTransactionCountByCurrency: { INR: count },
        fxCoveragePct: 100.0,
        fxValidationStatus: 'PASS'
      },
      module1: {
        totalUploadedSpend: totalInr,
        totalConvertedInrSpend: totalInr,
        totalConvertedInrSpendCr: totalSpendCr,
        customerProfileSpendInr: totalInr * 0.94,
        customerProfileSpendCr: totalSpendCr * 0.94,
        fxMethodologyImpactInr: totalInr * 0.06,
        fxMethodologyImpactCr: totalSpendCr * 0.06,
        rawAllRowSpendInr: totalInr,
        rawAllRowSpendCr: totalSpendCr,
        excludedSpendInr: 0,
        excludedSpendCr: 0,
        anomalySpendInr: 0,
        anomalySpendCr: 0,
        pendingSpend: 0,
        reconciliationVariance: 0,
        duplicateCount: 0,
        validCount: count,
        excludedCount: 0,
        anomalyCount: 0,
        populationVariance: 0,
        reconciliationPassed: true
      },
      rootCauseAnalysis: {
        primaryCause: 'None - Synthetic dataset fixture',
        fieldLevelEvidence: [],
        fxConversionEvidence: {
          erpStaticRatesUsed: { INR: 1.0 },
          authoritativeDailyRatesRange: { INR: '1.0' },
          erpStaticTotalInrCr: totalSpendCr * 0.94,
          authoritativeConvertedInrCr: totalSpendCr,
          deltaInrCr: totalSpendCr * 0.06
        },
        conclusion: 'Synthetic dataset processed without cross-customer leakage'
      },
      forensicBridge: {
        profileFxValidSpendCr: totalSpendCr * 0.94,
        historicalFxValidSpendCr: totalSpendCr,
        fxMethodologyImpactCr: totalSpendCr * 0.06,
        fxImpactPct: 6.0,
        reconciliationVariance: 0,
        profileRates: { INR: 1.0 },
        rawAllRowHistoricalSpendCr: totalSpendCr,
        excludedSpendCr: 0,
        anomalySpendCr: 0,
        currencyBridges: []
      },
      evidence: {
        workbookPath: filePath,
        workbookSha256: 'mock-synthetic-sha256',
        sheetsCount: 1,
        sheets: ['Sheet1']
      },
      dataVersion: {
        dataVersionId: options.dataVersionId,
        jobId: `JOB-${options.assessmentId}`,
        createdAt: new Date().toISOString()
      },
      validRows,
      validNormalizedTransactions: validNormalized
    };
  }
}
