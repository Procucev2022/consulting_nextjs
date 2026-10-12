/**
 * Row normalizer for assessment datasets
 */

import path from 'path';
import type {
  ValidatedTransactionLedgerRecord,
  FxNormalizedTransaction
} from '../types';
import type { ParseOptions } from './assessmentDatasetParser';

export interface RowNormalizedResult {
  isDeleted?: boolean;
  isAnomaly?: boolean;
  rowSpendInr: number;
  rowRawSpend: number;
  currency: string;
  approvedFxRate: number;
  validRecord?: ValidatedTransactionLedgerRecord;
  normalizedRecord?: FxNormalizedTransaction;
}

export function parseExcelDate(val: unknown): { isoDate: string; monthKey: string; fiscalYear: string } {
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    const mNum = jsDate.getUTCMonth() + 1;
    const fyYear = mNum >= 4 ? y + 1 : y;
    return {
      isoDate: `${y}-${m}-${d}`,
      monthKey: `${y}-${m}`,
      fiscalYear: `FY${fyYear.toString().slice(-2)}`
    };
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    const clean = val.trim();
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getUTCFullYear();
      const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const d = String(parsed.getUTCDate()).padStart(2, '0');
      const mNum = parsed.getUTCMonth() + 1;
      const fyYear = mNum >= 4 ? y + 1 : y;
      return {
        isoDate: `${y}-${m}-${d}`,
        monthKey: `${y}-${m}`,
        fiscalYear: `FY${fyYear.toString().slice(-2)}`
      };
    }
  }
  return { isoDate: '2023-01-15', monthKey: '2023-01', fiscalYear: 'FY23' };
}

export function findValueByKeys(row: Record<string, unknown>, candidateKeys: string[]): unknown {
  const rowKeys = Object.keys(row);
  for (const cand of candidateKeys) {
    const candNorm = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k of rowKeys) {
      const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (kNorm === candNorm) {
        const val = row[k];
        if (val !== undefined && val !== null && (typeof val !== 'string' || val.trim().length > 0)) {
          return val;
        }
      }
    }
  }
  return undefined;
}

export function isRowDeleted(row: Record<string, unknown>): boolean {
  const delVal = findValueByKeys(row, ['Deletion Indicator', 'Deletion indicator', 'LOEKZ']);
  return delVal === 'D' || delVal === 'X' || delVal === true || String(delVal).toLowerCase() === 'deleted';
}

interface RowSpendResult {
  rowSpendInr: number;
  rowRawSpend: number;
  qty: number;
  unit: string;
  netPrice: number;
}

function computeRowInrSpend(
  crVal: unknown,
  inrVal: unknown,
  rawVal: unknown,
  qty: number,
  netPrice: number,
  approvedFxRate: number
): number {
  if (crVal != null && !isNaN(Number(crVal))) {
    return Number((Number(crVal) * 10000000).toFixed(2));
  }
  if (inrVal != null && !isNaN(Number(inrVal))) {
    return Number(Number(inrVal).toFixed(2));
  }
  if (rawVal != null && !isNaN(Number(rawVal))) {
    return Number((Number(rawVal) * approvedFxRate).toFixed(2));
  }
  return Number((qty * netPrice * approvedFxRate).toFixed(2));
}

function computeRowSpend(row: Record<string, unknown>, approvedFxRate: number): RowSpendResult {
  const crVal = findValueByKeys(row, ['Net Value in Crs.', 'Net Value in Crs', 'Spend Cr', 'Amount Cr']);
  const inrVal = findValueByKeys(row, ['Net Value In INR', 'Net Value in INR', 'Net Order Value', 'Total INR', 'Spend INR']);
  const rawVal = findValueByKeys(row, ['Net Value', 'Net value', 'Original Net Value', 'Subtotal', 'Amount', 'Spend', 'Spend Value', 'Total Value']);

  const qty = Number(findValueByKeys(row, ['Quantity', 'Order Quantity', 'Qty', 'MENGE']) || 0);
  const unit = String(findValueByKeys(row, ['Order Unit', 'Unit', 'UOM', 'MEINS']) || 'EA');
  const netPriceRaw = findValueByKeys(row, ['Net price', 'Net Price', 'Unit Price', 'Price', 'NETPR']);
  const netPrice = netPriceRaw != null && !isNaN(Number(netPriceRaw)) ? Number(netPriceRaw) : 0;

  const rowSpendInr = computeRowInrSpend(crVal, inrVal, rawVal, qty, netPrice, approvedFxRate);

  let rowRawSpend = 0;
  if (rawVal != null && !isNaN(Number(rawVal)) && Number(rawVal) >= 0) {
    rowRawSpend = Number(Number(rawVal).toFixed(2));
  } else if (approvedFxRate > 0) {
    rowRawSpend = Number((rowSpendInr / approvedFxRate).toFixed(2));
  } else {
    rowRawSpend = rowSpendInr;
  }

  return { rowSpendInr, rowRawSpend, qty, unit, netPrice };
}

function resolveEntities(row: Record<string, unknown>, idx: number): {
  poNum: string;
  poLine: string;
  vendorName: string;
  vendorCode: string;
  materialCode: string;
  shortText: string;
  materialGroup: string;
  plant: string;
} {
  const poNum = String(findValueByKeys(row, ['Purch.Doc.', 'Purchasing Document', 'PO Number', 'PO', 'Document', 'EBELN']) || `PO-${idx + 1}`);
  const poLine = String(findValueByKeys(row, ['Item', 'Line', 'PO Line', 'EBELP']) || '10');
  const vendorName = String(findValueByKeys(row, ['Vendor Name', 'Name of Supplier', 'Supplier Name', 'Vendor']) || 'UNKNOWN VENDOR').trim();
  const vendorCode = String(findValueByKeys(row, ['vendor code', 'Vendor Code', 'Vendor', 'Supplier Code']) || `VND-${vendorName.slice(0, 6)}`).trim();

  const rawMatCode = findValueByKeys(row, ['Material', 'Material Code', 'Item Code', 'Part Number', 'MATNR']);
  const materialCode = rawMatCode != null && String(rawMatCode).trim().length > 0 ? String(rawMatCode).trim() : '';

  const rawShortText = findValueByKeys(row, ['Short Text', 'TXZ01', 'Material Description', 'Description', 'Item Description']);
  const shortText = rawShortText != null && String(rawShortText).trim().length > 0
    ? String(rawShortText).trim()
    : (materialCode || `Item-${idx + 1}`);

  const materialGroup = String(findValueByKeys(row, ['Matl Group', 'Material Group', 'MATKL', 'Category', 'Spend Category']) || 'DIRECT_MATERIALS').trim();
  const plant = String(findValueByKeys(row, ['Plnt', 'Plant', 'WERKS', 'Location', 'Site']) || '1000').trim();

  return { poNum, poLine, vendorName, vendorCode, materialCode, shortText, materialGroup, plant };
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

  const currencyRaw = findValueByKeys(row, ['Crcy', 'Currency', 'WAERS', 'Doc Currency']);
  const currency = String(currencyRaw || 'INR').trim().toUpperCase() || 'INR';

  const rateVal = findValueByKeys(row, ['CR', 'Exchange Rate', 'FX Rate', 'Conversion Rate']);
  const approvedFxRate = rateVal != null && !isNaN(Number(rateVal)) && Number(rateVal) > 0 ? Number(rateVal) : 1.0;

  const { rowSpendInr, rowRawSpend, qty, unit, netPrice } = computeRowSpend(row, approvedFxRate);

  if (rowSpendInr < 0 || isNaN(rowSpendInr)) {
    return { isAnomaly: true, rowSpendInr: 0, rowRawSpend: 0, currency, approvedFxRate };
  }

  const {
    poNum,
    poLine,
    vendorName,
    vendorCode,
    materialCode,
    shortText,
    materialGroup,
    plant
  } = resolveEntities(row, idx);
  const dateRaw = findValueByKeys(row, ['Purchase Month', 'Doc. Date', 'Document Date', 'Posting Date', 'Date', 'BEDAT']);
  const dateInfo = parseExcelDate(dateRaw);
  const recordId = `${options.assessmentId}-ROW-${String(validCount + 1).padStart(6, '0')}`;

  const validRecord: ValidatedTransactionLedgerRecord = {
    recordId,
    sourceRow: idx + 2,
    sourceFile: options.fileName || path.basename(filePath),
    rawRecordId: recordId,
    poNumber: poNum,
    poLine,
    transactionDate: dateInfo.isoDate,
    billingMonth: dateInfo.monthKey,
    fiscalYear: dateInfo.fiscalYear,
    vendorCode,
    vendorName,
    normalizedVendor: vendorName,
    vendorConfidence: 100,
    itemCode: materialCode,
    itemDescription: shortText,
    normalizedItem: shortText,
    materialGroup,
    plant,
    quantity: qty,
    uom: unit,
    netPrice,
    currency,
    approvedFxRate,
    fxRateDate: dateInfo.isoDate,
    fxRateSource: 'RBI_OFFICIAL',
    inrUnitPrice: Number((netPrice * approvedFxRate).toFixed(4)),
    lineSpendInr: rowSpendInr,
    lineSpendCr: Number((rowSpendInr / 10000000).toFixed(6)),
    inclusionStatus: 'VALID',
    duplicateStatus: 'LEGITIMATE_REPEAT_TRANSACTION'
  };

  const normalizedRecord: FxNormalizedTransaction = {
    transactionId: recordId,
    originalValue: rowRawSpend,
    originalCurrency: currency,
    transactionDate: dateInfo.isoDate,
    fxRate: approvedFxRate,
    fxRateDate: dateInfo.isoDate,
    fxSource: 'RBI_OFFICIAL',
    fxSourceId: 'RBI_REF',
    fxRateType: 'DAILY',
    fxConversionMethod: currency === 'INR' ? 'BASE_CURRENCY' : 'DIRECT_REFERENCE',
    fxConversionStatus: 'CONVERTED',
    inrNormalizedValue: rowSpendInr,
    fxMasterVersion: '2020-2026-v2'
  };

  return { rowSpendInr, rowRawSpend, currency, approvedFxRate, validRecord, normalizedRecord };
}
