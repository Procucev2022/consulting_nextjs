/**
 * Helper utilities for assessment dataset row normalization
 */

import {
  resolveHumanReadableCategory,
  UNMAPPED_CATEGORY_LABEL
} from '../utils/procurementCategoryResolver';

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

export function resolveCategoryAndGroup(row: Record<string, unknown>): {
  materialGroup: string;
  procurementCategory?: string;
  department?: string;
} {
  const rawMatGroup = findValueByKeys(row, ['Matl Group', 'Material Group', 'MATKL', 'Material_Group']);
  const rawDept = findValueByKeys(row, ['Department', 'Dept', 'Department Name']);
  const rawProcCat = findValueByKeys(row, [
    'Procurement Category',
    'PO Category',
    'PO_Category',
    'Purchasing Category',
    'Spend Category',
    'Category',
    'Commodity'
  ]);

  const department = rawDept != null && String(rawDept).trim().length > 0 ? String(rawDept).trim() : undefined;

  let materialGroup = 'UNKNOWN_CATEGORY';
  if (rawMatGroup != null && String(rawMatGroup).trim().length > 0) {
    materialGroup = String(rawMatGroup).trim();
  } else if (department) {
    materialGroup = department;
  }

  const rawCatCandidate =
    rawProcCat != null && String(rawProcCat).trim().length > 0 ? String(rawProcCat).trim() : department;

  const procurementCategory = resolveHumanReadableCategory(rawCatCandidate, materialGroup);

  if (materialGroup === 'UNKNOWN_CATEGORY' && procurementCategory && procurementCategory !== UNMAPPED_CATEGORY_LABEL) {
    materialGroup = procurementCategory;
  }

  return { materialGroup, procurementCategory, department };
}

export interface ResolvedEntities {
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
}

export function resolveEntities(row: Record<string, unknown>, idx: number): ResolvedEntities {
  const poNum = String(
    findValueByKeys(row, [
      'Purch.Doc.', 'Purchasing Document', 'Purchase Doc.',
      'PO Number', 'PO NO', 'PO', 'Document', 'EBELN'
    ]) || `PO-${idx + 1}`
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
    'Short Text', 'TXZ01', 'Material Description', 'Description', 'Item Description', 'Item Desc'
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
    poNum, poLine, vendorName, vendorCode, materialCode, shortText,
    materialGroup, procurementCategory, department, plant
  };
}

export interface RowSpendResult {
  rowSpendInr: number;
  rowRawSpend: number;
  qty: number;
  unit: string;
  netPrice: number;
}

function resolveRawSpendAmount(
  row: Record<string, unknown>,
  crVal: unknown,
  qty: number,
  netPrice: number,
  priceUnit: number,
  approvedFxRate: number
): number {
  const rawVal = findValueByKeys(row, [
    'Net Order Value', 'Basic Value', 'Net Value', 'Net value',
    'Original Net Value', 'Subtotal', 'Amount', 'Spend', 'Spend Value', 'Total Value'
  ]);
  if (rawVal != null && !isNaN(Number(rawVal))) {
    return Number(Number(rawVal).toFixed(2));
  }
  if (crVal != null && !isNaN(Number(crVal))) {
    const valCr = Number(crVal) * 10000000;
    return approvedFxRate > 0 ? Number((valCr / approvedFxRate).toFixed(2)) : Number(valCr.toFixed(2));
  }
  return Number(((qty * netPrice) / priceUnit).toFixed(2));
}

function resolvePriceAndUnit(row: Record<string, unknown>): {
  qty: number;
  unit: string;
  netPrice: number;
  priceUnit: number;
} {
  const qty = Number(findValueByKeys(row, ['Quantity', 'Order Quantity', 'Order Qty', 'Qty', 'MENGE']) || 0);
  const unit = String(findValueByKeys(row, ['Order Unit', 'Unit', 'Unit Code', 'UOM', 'MEINS']) || 'EA');
  const priceUnitRaw = findValueByKeys(row, ['Price unit', 'Price Unit', 'PEINH', 'PriceUnit']);
  const priceUnit = priceUnitRaw != null && !isNaN(Number(priceUnitRaw)) && Number(priceUnitRaw) > 0
    ? Number(priceUnitRaw)
    : 1;
  const netPriceRaw = findValueByKeys(row, ['Net price', 'Net Price', 'Basic Rate', 'Unit Price', 'Price', 'NETPR']);
  const netPrice = netPriceRaw != null && !isNaN(Number(netPriceRaw)) ? Number(netPriceRaw) : 0;
  return { qty, unit, netPrice, priceUnit };
}

function resolveInrSpendAmount(
  crVal: unknown,
  inrVal: unknown,
  rowRawSpend: number,
  approvedFxRate: number
): number {
  if (crVal != null && !isNaN(Number(crVal))) {
    return Number((Number(crVal) * 10000000).toFixed(2));
  }
  if (inrVal != null && !isNaN(Number(inrVal))) {
    return Number(Number(inrVal).toFixed(2));
  }
  return Number((rowRawSpend * approvedFxRate).toFixed(2));
}

export function computeRowSpend(
  row: Record<string, unknown>,
  currency: string,
  approvedFxRate: number
): RowSpendResult {
  const crVal = findValueByKeys(row, [
    'Basic Value in Crs', 'Basic Value in Crs.', 'Net Value in Crs.',
    'Net Value in Crs', 'Spend Cr', 'Amount Cr'
  ]);
  const inrCandidateKeys = currency === 'INR'
    ? ['Basic Value', 'LANDED Value', 'Basic Value (After Discount)', 'Net Value In INR', 'Net Order Value', 'Spend INR']
    : ['Net Value In INR', 'Net Value in INR', 'Total INR', 'Spend INR'];
  const inrVal = findValueByKeys(row, inrCandidateKeys);

  const { qty, unit, netPrice, priceUnit } = resolvePriceAndUnit(row);
  const rowRawSpend = resolveRawSpendAmount(row, crVal, qty, netPrice, priceUnit, approvedFxRate);
  const rowSpendInr = resolveInrSpendAmount(crVal, inrVal, rowRawSpend, approvedFxRate);

  return { rowSpendInr, rowRawSpend, qty, unit, netPrice };
}
