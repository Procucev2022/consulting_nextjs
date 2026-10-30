/**
 * Vendor Spend Breakdown Calculators
 */

import type { LineItemMapping, VendorYearDetail, CategoryTopItem } from '../types';
import {
  addSpendToFiscalYear,
  getItemSpendCr,
  upsertTopItem
} from './step2BreakdownShared';
import { resolveHumanReadableCategory } from './procurementCategoryResolver';

interface VendorAggregate {
  spendFY24: number;
  spendFY25: number;
  spendFY26: number;
  totalSpend: number;
  categories: Map<string, number>;
  items: Map<string, CategoryTopItem>;
  masterId: string;
  vendorName: string;
  lineItemsCount: number;
}

function createVendorEntry(item: LineItemMapping, idx: number, vName: string): VendorAggregate {
  return {
    spendFY24: 0,
    spendFY25: 0,
    spendFY26: 0,
    totalSpend: 0,
    categories: new Map(),
    items: new Map(),
    masterId: item.master_supplier_id || `VND-M-${1000 + idx}`,
    vendorName: vName,
    lineItemsCount: 0
  };
}

function aggregateLineItemVendor(
  item: LineItemMapping,
  idx: number,
  vendorMap: Map<string, VendorAggregate>
): void {
  const vName = item.vendor_identified?.trim() || 'Unknown Supplier';
  const vKey = item.master_supplier_id ? `ID_${item.master_supplier_id}` : `NAME_${vName.toUpperCase()}`;
  let entry = vendorMap.get(vKey);
  if (!entry) {
    entry = createVendorEntry(item, idx, vName);
    vendorMap.set(vKey, entry);
  }

  const spendCr = getItemSpendCr(item);
  entry.totalSpend += spendCr;
  entry.lineItemsCount += 1;
  addSpendToFiscalYear(entry, spendCr, item.spend_year);

  const rawCat = item.core_bucket || item.unspsc_category_name || 'Direct Materials';
  const cat = resolveHumanReadableCategory(rawCat, item.material_code);
  entry.categories.set(cat, (entry.categories.get(cat) || 0) + spendCr);

  const rawDesc = item.raw_desc || item.material_desc || 'Item';
  const code = item.unspsc_code || '10000000';
  upsertTopItem(entry.items, item, rawDesc, vName, spendCr, code);
}

function getPrimaryCategory(categories: Map<string, number>): string {
  let primaryCat = 'Direct Materials';
  let maxCatSpend = -1;
  categories.forEach((cSpend, cName) => {
    if (cSpend > maxCatSpend) {
      maxCatSpend = cSpend;
      primaryCat = cName;
    }
  });
  return primaryCat;
}

function mapVendorToDetail(
  data: VendorAggregate,
  idx: number,
  totalCalculated: number
): VendorYearDetail {
  const fy24 = data.spendFY24;
  const fy25 = data.spendFY25;
  const fy26 = data.spendFY26;
  const yoy = (fy25 > 0 && fy26 > 0)
    ? Number((((fy26 - fy25) / fy25) * 100).toFixed(1))
    : (fy24 > 0 && fy25 > 0)
      ? Number((((fy25 - fy24) / fy24) * 100).toFixed(1))
      : undefined;
  const primaryCat = getPrimaryCategory(data.categories);

  const topItems = Array.from(data.items.values())
    .sort((a, b) => (b.total_spend_inr_cr || 0) - (a.total_spend_inr_cr || 0))
    .slice(0, 10)
    .map((it, itIdx) => ({
      ...it,
      rank: itIdx + 1,
      spend_share_pct: Number(
        (((it.total_spend_inr_cr || 0) / (data.totalSpend || /* c8 ignore next */ 1)) * 100).toFixed(1)
      )
    }));

  return {
    id: `VND-${idx + 1}`,
    rank: idx + 1,
    vendor_name: data.vendorName,
    master_vendor_id: data.masterId,
    primary_category: primaryCat,
    spend_fy24_cr: Number(fy24.toFixed(2)),
    spend_fy25_cr: Number(fy25.toFixed(2)),
    spend_fy26_cr: Number(fy26.toFixed(2)),
    total_3yr_spend_inr_cr: Number(data.totalSpend.toFixed(2)),
    spend_share_pct: Number(((data.totalSpend / totalCalculated) * 100).toFixed(1)),
    yoy_growth_pct: yoy,
    line_items_count: data.lineItemsCount || data.items.size,
    item_count: data.lineItemsCount || data.items.size,
    risk_status: data.totalSpend > 15 ? 'HIGH CREEP' : 'ALIGNED',
    top_items: topItems,
    is_balance_vendor: false
  };
}

export function calculateVendorYearDetails(
  lineItems: LineItemMapping[] = [],
  totalSpendCr?: number
): VendorYearDetail[] {
  if (!lineItems || lineItems.length === 0) {
    return [];
  }

  const vendorMap = new Map<string, VendorAggregate>();

  lineItems.forEach((item, idx) => {
    aggregateLineItemVendor(item, idx, vendorMap);
  });

  const totalCalculated = Array.from(vendorMap.values())
    .reduce((sum, v) => sum + v.totalSpend, 0) || /* c8 ignore next 2 */
    totalSpendCr ||
    1;

  const sorted = Array.from(vendorMap.entries()).sort((a, b) => b[1].totalSpend - a[1].totalSpend);

  return sorted.slice(0, 50).map(([, data], idx) =>
    mapVendorToDetail(data, idx, totalCalculated)
  );
}
