/**
 * Row normalizer for assessment datasets
 */

import path from 'path';
import type {
  ValidatedTransactionLedgerRecord,
  FxNormalizedTransaction,
  CurrencyProvenance,
  TransactionInclusionStatus
} from '../types';
import type { ParseOptions } from './assessmentDatasetParser';
import {
  parseExcelDate,
  findValueByKeys,
  isRowDeleted,
  resolveEntities,
  computeRowSpend
} from './assessmentDatasetRowNormalizerUtils';
import { getYahooFinanceRateAsOfDate, yahooFinanceFXRates } from '../utils/currencyConverter';

export { parseExcelDate, findValueByKeys, isRowDeleted };

export interface RowNormalizedResult {
  isDeleted?: boolean;
  isAnomaly?: boolean;
  rowSpendInr: number;
  rowRawSpend: number;
  currency: string;
  currencyProvenance?: CurrencyProvenance;
  approvedFxRate: number;
  validRecord?: ValidatedTransactionLedgerRecord;
  normalizedRecord?: FxNormalizedTransaction;
}

function resolveRowCurrency(
  row: Record<string, unknown>,
  options: ParseOptions
): { currency: string; currencyProvenance: CurrencyProvenance } {
  const currencyRaw = findValueByKeys(row, ['Crcy', 'Currency', 'WAERS', 'Doc Currency']);
  if (currencyRaw != null && String(currencyRaw).trim().length > 0) {
    return {
      currency: String(currencyRaw).trim().toUpperCase(),
      currencyProvenance: 'SOURCE_PROVIDED'
    };
  }
  if (options.analystConfirmedCurrency || options.baseCurrency) {
    return {
      currency: String(options.analystConfirmedCurrency || options.baseCurrency).trim().toUpperCase(),
      currencyProvenance: 'ANALYST_CONFIRMED_BASE_CURRENCY'
    };
  }
  return {
    currency: 'UNRESOLVED',
    currencyProvenance: 'UNRESOLVED'
  };
}

function resolveApprovedFx(
  currency: string,
  isoDate: string,
  row: Record<string, unknown>
): { approvedFxRate: number; fxRateSource: string } {
  if (currency === 'INR') {
    return { approvedFxRate: 1.0, fxRateSource: 'BASE_CURRENCY' };
  }
  const rateVal = findValueByKeys(row, ['CR', 'Exchange Rate', 'FX Rate', 'Conversion Rate']);
  if (rateVal != null && !isNaN(Number(rateVal)) && Number(rateVal) > 0 && Number(rateVal) !== 1.0) {
    return { approvedFxRate: Number(rateVal), fxRateSource: 'SOURCE_PROVIDED' };
  }
  if (!yahooFinanceFXRates[currency]) {
    return { approvedFxRate: 0, fxRateSource: 'UNAVAILABLE' };
  }
  const fxInfo = getYahooFinanceRateAsOfDate(currency, isoDate);
  if (fxInfo && fxInfo.rate > 0) {
    return { approvedFxRate: fxInfo.rate, fxRateSource: 'YAHOO_FINANCE_BENCHMARK_2026' };
  }
  return { approvedFxRate: 0, fxRateSource: 'UNAVAILABLE' };
}

interface StatusClassification {
  transactionClassification:
    | 'ORDINARY_PROCUREMENT'
    | 'INTERNAL_TRANSFER_STO'
    | 'NEGATIVE_RETURN_CREDIT'
    | 'DELETED_OR_BLOCKED_LINE';
  inclusionStatus: TransactionInclusionStatus;
  exclusionReason?: string;
}

function resolveClassificationAndStatus(
  row: Record<string, unknown>,
  rowSpendInr: number,
  approvedFxRate: number,
  currency: string
): StatusClassification {
  const delVal = findValueByKeys(row, ['Deletion Indicator', 'Deletion indicator', 'LOEKZ']);
  const delInd = delVal != null ? String(delVal).trim().toUpperCase() : '';
  const docType = String(
    findValueByKeys(row, ['Purchasing Document Type', 'Purchasing Doc. Type', 'Doc Type', 'BSART']) || ''
  ).trim().toUpperCase();

  if (delInd === 'L' || delInd === 'S') {
    return {
      transactionClassification: 'DELETED_OR_BLOCKED_LINE',
      inclusionStatus: 'REQUIRES_REVIEW',
      exclusionReason: delInd === 'S' ? 'SAP_BLOCKED_LINE_S' : 'SAP_DELETED_LINE_L'
    };
  }
  if (docType === 'UB') {
    return {
      transactionClassification: 'INTERNAL_TRANSFER_STO',
      inclusionStatus: 'REQUIRES_REVIEW',
      exclusionReason: 'INTERNAL_STOCK_TRANSPORT_ORDER'
    };
  }
  if (rowSpendInr < 0) {
    return {
      transactionClassification: 'NEGATIVE_RETURN_CREDIT',
      inclusionStatus: 'VALID'
    };
  }
  if (approvedFxRate <= 0 && currency !== 'INR') {
    return {
      transactionClassification: 'ORDINARY_PROCUREMENT',
      inclusionStatus: 'REQUIRES_REVIEW',
      exclusionReason: 'UNAVAILABLE_FX_RATE'
    };
  }
  return {
    transactionClassification: 'ORDINARY_PROCUREMENT',
    inclusionStatus: 'VALID'
  };
}

export function normalizeAssessmentRow(
  row: Record<string, unknown>,
  idx: number,
  validCount: number,
  filePath: string,
  options: ParseOptions
): RowNormalizedResult {
  if (isRowDeleted(row)) {
    return { isDeleted: true, rowSpendInr: 0, rowRawSpend: 0, currency: 'INR', approvedFxRate: 1.0 };
  }

  const { currency, currencyProvenance } = resolveRowCurrency(row, options);
  const ent = resolveEntities(row, idx);
  const dateRaw = findValueByKeys(row, [
    'Purchase Month', 'Doc. Date', 'Document Date', 'Posting Date', 'PO Date', 'Date', 'BEDAT'
  ]);
  const dateInfo = parseExcelDate(dateRaw);

  const { approvedFxRate, fxRateSource } = resolveApprovedFx(currency, dateInfo.isoDate, row);
  const { rowSpendInr, rowRawSpend, qty, unit, netPrice } = computeRowSpend(row, currency, approvedFxRate);

  if (currency === 'UNRESOLVED' || isNaN(rowSpendInr)) {
    return { isAnomaly: true, rowSpendInr: 0, rowRawSpend: 0, currency, currencyProvenance, approvedFxRate };
  }

  const { transactionClassification, inclusionStatus, exclusionReason } = resolveClassificationAndStatus(
    row, rowSpendInr, approvedFxRate, currency
  );

  const recordId = `${options.assessmentId}-ROW-${String(validCount + 1).padStart(6, '0')}`;

  const validRecord: ValidatedTransactionLedgerRecord = {
    recordId,
    sourceRow: idx + 2,
    sourceFile: options.fileName || path.basename(filePath),
    rawRecordId: recordId,
    poNumber: ent.poNum,
    poLine: ent.poLine,
    transactionDate: dateInfo.isoDate,
    billingMonth: dateInfo.monthKey,
    fiscalYear: dateInfo.fiscalYear,
    vendorCode: ent.vendorCode,
    vendorName: ent.vendorName,
    normalizedVendor: ent.vendorName,
    vendorConfidence: 100,
    itemCode: ent.materialCode,
    itemDescription: ent.shortText,
    normalizedItem: ent.shortText,
    materialGroup: ent.materialGroup,
    procurementCategory: ent.procurementCategory,
    department: ent.department,
    plant: ent.plant,
    quantity: qty,
    uom: unit,
    netPrice,
    currency,
    currencyProvenance,
    approvedFxRate,
    fxRateDate: dateInfo.isoDate,
    fxRateSource,
    inrUnitPrice: Number((netPrice * approvedFxRate).toFixed(4)),
    lineSpendInr: rowSpendInr,
    lineSpendCr: Number((rowSpendInr / 10000000).toFixed(6)),
    inclusionStatus,
    transactionClassification,
    exclusionReason,
    duplicateStatus: 'LEGITIMATE_REPEAT_TRANSACTION'
  };

  const normalizedRecord: FxNormalizedTransaction = {
    transactionId: recordId,
    originalValue: rowRawSpend,
    originalCurrency: currency,
    currencyProvenance,
    transactionDate: dateInfo.isoDate,
    fxRate: approvedFxRate,
    fxRateDate: dateInfo.isoDate,
    fxSource: fxRateSource,
    fxSourceId: 'YAHOO_FINANCE_REF',
    fxRateType: 'DAILY',
    fxConversionMethod: currency === 'INR' ? 'BASE_CURRENCY' : 'DIRECT_REFERENCE',
    fxConversionStatus: approvedFxRate > 0 ? 'CONVERTED' : 'BLOCKED',
    inrNormalizedValue: rowSpendInr,
    fxMasterVersion: '2020-2026-v2'
  };

  return {
    rowSpendInr, rowRawSpend, currency, currencyProvenance,
    approvedFxRate, validRecord, normalizedRecord
  };
}
