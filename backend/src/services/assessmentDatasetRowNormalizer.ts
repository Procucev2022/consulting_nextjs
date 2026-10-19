/**
 * Row normalizer for assessment datasets
 */

import path from 'path';
import type {
  ValidatedTransactionLedgerRecord,
  FxNormalizedTransaction,
  CurrencyProvenance
} from '../types';
import type { ParseOptions } from './assessmentDatasetParser';
import {
  parseExcelDate,
  findValueByKeys,
  isRowDeleted
} from './assessmentDatasetRowNormalizerUtils';

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
  const crVal = findValueByKeys(row, [
    'Basic Value in Crs',
    'Basic Value in Crs.',
    'Net Value in Crs.',
    'Net Value in Crs',
    'Spend Cr',
    'Amount Cr'
  ]);
  const inrVal = findValueByKeys(row, [
    'Basic Value',
    'LANDED Value',
    'Basic Value (After Discount)',
    'Net Value In INR',
    'Net Value in INR',
    'Net Order Value',
    'Total INR',
    'Spend INR'
  ]);
  const rawVal = findValueByKeys(row, [
    'Basic Value',
    'Net Value',
    'Net value',
    'Original Net Value',
    'Subtotal',
    'Amount',
    'Spend',
    'Spend Value',
    'Total Value'
  ]);

  const qty = Number(findValueByKeys(row, ['Quantity', 'Order Quantity', 'Order Qty', 'Qty', 'MENGE']) || 0);
  const unit = String(findValueByKeys(row, ['Order Unit', 'Unit', 'Unit Code', 'UOM', 'MEINS']) || 'EA');
  const netPriceRaw = findValueByKeys(row, ['Net price', 'Net Price', 'Basic Rate', 'Unit Price', 'Price', 'NETPR']);
  const netPrice = netPriceRaw != null && !isNaN(Number(netPriceRaw)) ? Number(netPriceRaw) : 0;

  const rowSpendInr = computeRowInrSpend(crVal, inrVal, rawVal, qty, netPrice, approvedFxRate);

  let rowRawSpend = 0;
  if (rawVal != null && !isNaN(Number(rawVal))) {
    rowRawSpend = Number(Number(rawVal).toFixed(2));
  } else if (approvedFxRate > 0) {
    rowRawSpend = Number((rowSpendInr / approvedFxRate).toFixed(2));
  } else {
    rowRawSpend = rowSpendInr;
  }

  return { rowSpendInr, rowRawSpend, qty, unit, netPrice };
}

function resolveCategoryAndGroup(row: Record<string, unknown>): {
  materialGroup: string;
  procurementCategory?: string;
  department?: string;
} {
  const rawMatGroup = findValueByKeys(row, ['Matl Group', 'Material Group', 'MATKL', 'Material_Group']);
  const rawDept = findValueByKeys(row, ['Department', 'Dept', 'Department Name']);
  const rawProcCat = findValueByKeys(row, ['Procurement Category', 'Spend Category', 'Category', 'Commodity']);

  const department = rawDept != null && String(rawDept).trim().length > 0 ? String(rawDept).trim() : undefined;
  const procurementCategory =
    rawProcCat != null && String(rawProcCat).trim().length > 0 ? String(rawProcCat).trim() : department;

  let materialGroup = 'UNKNOWN_CATEGORY';
  if (rawMatGroup != null && String(rawMatGroup).trim().length > 0) {
    materialGroup = String(rawMatGroup).trim();
  } else if (department) {
    // Preserve source department when no separate material-group field exists
    materialGroup = department;
  } else if (procurementCategory) {
    materialGroup = procurementCategory;
  }

  return { materialGroup, procurementCategory, department };
}

function resolveEntities(row: Record<string, unknown>, idx: number): {
  poNum: string;
  poLine: string;
  vendorName: string;
  vendorCode: string;
  materialCode: string;
  shortText: string;
  materialGroup: string;
  procurementCategory?: string;
  department?: string;
  plant: string;
} {
  const poNum = String(
    findValueByKeys(row, ['Purch.Doc.', 'Purchasing Document', 'PO Number', 'PO NO', 'PO', 'Document', 'EBELN']) ||
      `PO-${idx + 1}`
  );
  const poLine = String(findValueByKeys(row, ['Item', 'Line', 'PO Line', 'EBELP']) || '10');
  const vendorName = String(
    findValueByKeys(row, ['Vendor Name', 'Name of Supplier', 'Supplier Name', 'Supplier Desc', 'Vendor']) ||
      'UNKNOWN VENDOR'
  ).trim();
  const vendorCode = String(
    findValueByKeys(row, ['vendor code', 'Vendor Code', 'Vendor', 'Supplier Code']) || `VND-${vendorName.slice(0, 6)}`
  ).trim();

  const rawMatCode = findValueByKeys(row, ['Material', 'Material Code', 'Item Code', 'Part Number', 'MATNR']);
  const materialCode = rawMatCode != null && String(rawMatCode).trim().length > 0 ? String(rawMatCode).trim() : '';

  const rawShortText = findValueByKeys(row, [
    'Short Text',
    'TXZ01',
    'Material Description',
    'Description',
    'Item Description',
    'Item Desc'
  ]);
  const shortText =
    rawShortText != null && String(rawShortText).trim().length > 0
      ? String(rawShortText).trim()
      : (materialCode || `Item-${idx + 1}`);

  const { materialGroup, procurementCategory, department } = resolveCategoryAndGroup(row);
  const plant = String(
    findValueByKeys(row, ['Plnt', 'Plant', 'PLANT', 'WERKS', 'Location', 'Site']) || '1000'
  ).trim();

  return {
    poNum,
    poLine,
    vendorName,
    vendorCode,
    materialCode,
    shortText,
    materialGroup,
    procurementCategory,
    department,
    plant
  };
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
  const rateVal = findValueByKeys(row, ['CR', 'Exchange Rate', 'FX Rate', 'Conversion Rate']);
  const approvedFxRate = rateVal != null && !isNaN(Number(rateVal)) && Number(rateVal) > 0 ? Number(rateVal) : 1.0;
  const { rowSpendInr, rowRawSpend, qty, unit, netPrice } = computeRowSpend(row, approvedFxRate);

  if (currency === 'UNRESOLVED' || isNaN(rowSpendInr) || (rowSpendInr < 0 && netPrice <= 0)) {
    return { isAnomaly: true, rowSpendInr: 0, rowRawSpend: 0, currency, currencyProvenance, approvedFxRate };
  }

  const ent = resolveEntities(row, idx);
  const dateRaw = findValueByKeys(row, ['Purchase Month', 'Doc. Date', 'Document Date', 'Posting Date', 'PO Date', 'Date', 'BEDAT']);
  const dateInfo = parseExcelDate(dateRaw);
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
    currencyProvenance,
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

  return {
    rowSpendInr,
    rowRawSpend,
    currency,
    currencyProvenance,
    approvedFxRate,
    validRecord,
    normalizedRecord
  };
}
