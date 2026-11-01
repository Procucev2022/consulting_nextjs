/**
 * Assessment Dataset Aggregation Helpers
 * 
 * Aggregates raw procurement records and calculates forensic currency bridges.
 */

import type {
  ValidatedTransactionLedgerRecord,
  FxNormalizedTransaction,
  VgtCurrencyForensicBridge
} from '../types';
import { normalizeAssessmentRow } from './assessmentDatasetRowNormalizer';
import type { ParseOptions } from './assessmentDatasetParser';

export interface AggregatedDatasetRows {
  validRows: ValidatedTransactionLedgerRecord[];
  validNormalized: FxNormalizedTransaction[];
  excludedRowCount: number;
  anomalyRowCount: number;
  totalNormalizedInr: number;
  totalRawInr: number;
  currenciesDetectedSet: Set<string>;
  currencyStats: Record<string, { count: number; rawVal: number; normInr: number; fxRate: number }>;
}

export function aggregateDatasetRows(
  rawRows: Record<string, unknown>[],
  filePath: string,
  options: ParseOptions
): AggregatedDatasetRows {
  const validRows: ValidatedTransactionLedgerRecord[] = [];
  const validNormalized: FxNormalizedTransaction[] = [];
  let excludedRowCount = 0;
  let anomalyRowCount = 0;
  let totalNormalizedInr = 0;
  let totalRawInr = 0;

  const currenciesDetectedSet = new Set<string>();
  const currencyStats: Record<string, { count: number; rawVal: number; normInr: number; fxRate: number }> = {};

  rawRows.forEach((r, idx) => {
    const res = normalizeAssessmentRow(r, idx, validRows.length, filePath, options);
    if (res.isDeleted) {
      excludedRowCount++;
      return;
    }
    if (res.isAnomaly) {
      anomalyRowCount++;
      return;
    }
    if (res.validRecord && res.normalizedRecord) {
      validRows.push(res.validRecord);
      validNormalized.push(res.normalizedRecord);
      currenciesDetectedSet.add(res.currency);
      totalNormalizedInr += res.rowSpendInr;
      totalRawInr += res.rowRawSpend;

      if (!currencyStats[res.currency]) {
        currencyStats[res.currency] = { count: 0, rawVal: 0, normInr: 0, fxRate: res.approvedFxRate };
      }
      currencyStats[res.currency].count++;
      currencyStats[res.currency].rawVal += res.rowRawSpend;
      currencyStats[res.currency].normInr += res.rowSpendInr;
    }
  });

  return {
    validRows,
    validNormalized,
    excludedRowCount,
    anomalyRowCount,
    totalNormalizedInr,
    totalRawInr,
    currenciesDetectedSet,
    currencyStats
  };
}

export interface CurrencyForensicDetails {
  currenciesDetected: string[];
  transactionCountByCurrency: Record<string, number>;
  originalSpendByCurrency: Record<string, number>;
  convertedSpendInrByCurrency: Record<string, number>;
  customerProfileSpendByCurrency: Record<string, number>;
  fxImpactByCurrency: Record<string, number>;
  currencyBridges: VgtCurrencyForensicBridge[];
}

export function buildCurrencyForensicDetails(
  currenciesDetectedSet: Set<string>,
  currencyStats: Record<string, { count: number; rawVal: number; normInr: number; fxRate: number }>,
  isSyntheticTest: boolean
): CurrencyForensicDetails {
  const currenciesDetected = Array.from(currenciesDetectedSet);
  const transactionCountByCurrency: Record<string, number> = {};
  const originalSpendByCurrency: Record<string, number> = {};
  const convertedSpendInrByCurrency: Record<string, number> = {};
  const customerProfileSpendByCurrency: Record<string, number> = {};
  const fxImpactByCurrency: Record<string, number> = {};
  const currencyBridges: VgtCurrencyForensicBridge[] = [];

  currenciesDetected.forEach((c) => {
    const s = currencyStats[c] || { count: 0, rawVal: 0, normInr: 0, fxRate: 1.0 };
    transactionCountByCurrency[c] = s.count;
    originalSpendByCurrency[c] = Number(s.rawVal.toFixed(2));
    convertedSpendInrByCurrency[c] = Number(s.normInr.toFixed(2));

    const cProfileInr = isSyntheticTest ? s.rawVal : s.normInr;
    const cNormCr = Number((s.normInr / 10000000).toFixed(4));
    const cProfileCr = isSyntheticTest ? Number((s.rawVal / 10000000).toFixed(4)) : cNormCr;
    const cImpactInr = isSyntheticTest ? Number((s.normInr - s.rawVal).toFixed(2)) : 0.0;
    const cImpactCr = isSyntheticTest ? Number((cImpactInr / 10000000).toFixed(4)) : 0.0;
    const cImpactPct = isSyntheticTest && s.rawVal > 0 ? Number(((cImpactInr / s.rawVal) * 100).toFixed(2)) : 0.0;

    customerProfileSpendByCurrency[c] = Number(cProfileInr.toFixed(2));
    fxImpactByCurrency[c] = cImpactInr;

    currencyBridges.push({
      currency: c,
      profileRate: s.fxRate || 1.0,
      validTxCount: s.count,
      originalValue: Number(s.rawVal.toFixed(2)),
      profileInrValue: Number(cProfileInr.toFixed(2)),
      profileInrCr: cProfileCr,
      historicalInrValue: Number(s.normInr.toFixed(2)),
      historicalInrCr: cNormCr,
      fxImpactInr: cImpactInr,
      fxImpactCr: cImpactCr,
      fxImpactPct: cImpactPct
    });
  });

  return {
    currenciesDetected,
    transactionCountByCurrency,
    originalSpendByCurrency,
    convertedSpendInrByCurrency,
    customerProfileSpendByCurrency,
    fxImpactByCurrency,
    currencyBridges
  };
}

export interface SpendImpactMetrics {
  customerProfileSpendInr: number;
  customerProfileSpendCr: number;
  fxImpactInr: number;
  fxImpactCr: number;
  fxImpactPct: number;
}

export function calculateSpendImpactMetrics(
  totalNormalizedInr: number,
  totalRawInr: number,
  totalSpendCr: number,
  isSyntheticTest: boolean
): SpendImpactMetrics {
  if (!isSyntheticTest) {
    return {
      customerProfileSpendInr: totalNormalizedInr,
      customerProfileSpendCr: totalSpendCr,
      fxImpactInr: 0.0,
      fxImpactCr: 0.0,
      fxImpactPct: 0.0
    };
  }
  const delta = totalNormalizedInr - totalRawInr;
  const pct = totalRawInr > 0 ? Number(((delta / totalRawInr) * 100).toFixed(2)) : 0.0;
  return {
    customerProfileSpendInr: Number(totalRawInr.toFixed(2)),
    customerProfileSpendCr: Number((totalRawInr / 10000000).toFixed(4)),
    fxImpactInr: Number(delta.toFixed(2)),
    fxImpactCr: Number((delta / 10000000).toFixed(4)),
    fxImpactPct: pct
  };
}

function extractPoNumber(r: Record<string, unknown>): string {
  const keys = ['Purchasing Document', 'Purch.Doc.', 'Purchase Doc.', 'PO Number', 'PO NO', 'PO', 'Document', 'EBELN'];
  for (const k of keys) {
    const val = r[k];
    if (val !== undefined && val !== null && String(val).trim().length > 0) {
      return String(val).trim();
    }
  }
  return '';
}

function extractPoItem(r: Record<string, unknown>): string {
  const keys = ['Item', 'Line Item', 'Line', 'PO Line', 'EBELP'];
  for (const k of keys) {
    const val = r[k];
    if (val !== undefined && val !== null && String(val).trim().length > 0) {
      return String(val).trim();
    }
  }
  return '';
}

export function countSuspectedDuplicates(rawRows: Record<string, unknown>[]): number {
  const poLineKeyCount = new Map<string, number>();
  for (const r of rawRows) {
    const key = `${extractPoNumber(r)}|${extractPoItem(r)}`;
    poLineKeyCount.set(key, (poLineKeyCount.get(key) ?? 0) + 1);
  }
  return [...poLineKeyCount.values()].reduce((sum, cnt) => sum + Math.max(0, cnt - 1), 0);
}
