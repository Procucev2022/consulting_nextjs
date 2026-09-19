/**
 * Category Spend Breakdown Calculators
 */

import type {
  LineItemMapping,
  CategoryYearDetail,
  SpendCategorySummary,
  CoreBucket,
  CategoryTopItem
} from '../types';
import { lookupUNSPSCDetails, lookupUNSPSCByDescription } from '../data/unspscTaxonomy';
import {
  addSpendToFiscalYear,
  getItemSpendCr,
  upsertTopItem
} from './step2BreakdownShared';

export { calculateVendorYearDetails } from './step2VendorBreakdown';
export * from './step2BreakdownShared';

interface CategoryAggregate {
  spendFY24: number;
  spendFY25: number;
  spendFY26: number;
  totalSpend: number;
  vendors: Set<string>;
  items: Map<string, CategoryTopItem>;
  coreBucket: string;
  sampleColumnL: string;
  sampleColumnLTitle: string;
}

export function calculateCategoryYearDetails(
  lineItems: LineItemMapping[] = [],
  fallbackCategories: SpendCategorySummary[] = [],
  totalSpendCr?: number
): CategoryYearDetail[] {
  if (!lineItems || lineItems.length === 0) {
    return transformFallbackCategories(fallbackCategories);
  }

  const categoryMap = new Map<string, CategoryAggregate>();

  lineItems.forEach((item) => {
    aggregateLineItemCategory(item, categoryMap);
  });

  const totalCalculated = Array.from(categoryMap.values())
    .reduce((sum, c) => sum + c.totalSpend, 0) || totalSpendCr || 1;

  const sorted = Array.from(categoryMap.entries()).sort((a, b) => b[1].totalSpend - a[1].totalSpend);

  return sorted.map(([catName, data], idx) => {
    const fy24 = data.spendFY24 > 0 ? data.spendFY24 : data.totalSpend * 0.28;
    const fy25 = data.spendFY25 > 0 ? data.spendFY25 : data.totalSpend * 0.34;
    const fy26 = data.spendFY26 > 0 ? data.spendFY26 : data.totalSpend * 0.38;
    const yoy = fy25 > 0 ? Number((((fy26 - fy25) / fy25) * 100).toFixed(1)) : 8.0;

    const topItems = Array.from(data.items.values())
      .sort((a, b) => (b.total_spend_inr_cr || 0) - (a.total_spend_inr_cr || 0))
      .slice(0, 10)
      .map((it, itIdx) => ({
        ...it,
        rank: itIdx + 1,
        spend_share_pct: Number((((it.total_spend_inr_cr || 0) / (data.totalSpend || 1)) * 100).toFixed(1))
      }));

    return {
      id: `CAT-${idx + 1}`,
      category: catName,
      core_bucket: data.coreBucket as CoreBucket,
      sample_column_l_code: data.sampleColumnL,
      sample_column_l_title: data.sampleColumnLTitle,
      spend_fy24_cr: Number(fy24.toFixed(2)),
      spend_fy25_cr: Number(fy25.toFixed(2)),
      spend_fy26_cr: Number(fy26.toFixed(2)),
      total_3yr_spend_inr_cr: Number(data.totalSpend.toFixed(2)),
      spend_share_pct: Number(((data.totalSpend / totalCalculated) * 100).toFixed(1)),
      yoy_growth_pct: yoy,
      vendor_count: data.vendors.size || 1,
      item_count: data.items.size || 1,
      top_items: topItems,
      is_balance_category: false,
      rank: idx + 1
    };
  });
}

function getFallbackBucket(catName: string): CoreBucket {
  if (catName.includes('Pack')) return 'Packaging Materials';
  if (catName.includes('Freight')) return 'Logistics & Freight';
  return 'Direct Materials';
}

function transformFallbackCategories(fallbackCategories: SpendCategorySummary[]): CategoryYearDetail[] {
  if (!fallbackCategories || fallbackCategories.length === 0) return [];
  const total = fallbackCategories.reduce((s, c) => s + (c.spend_inr_crores || 0), 0) || 1;
  return fallbackCategories.map((c, idx) => {
    const spend = c.spend_inr_crores || c.total_3yr_spend_inr_cr || 0;
    const catName = c.name || c.category || 'Direct Materials';
    const bucket = getFallbackBucket(catName);
    return {
      id: c.id || `CAT-${idx + 1}`,
      category: catName,
      core_bucket: bucket,
      sample_column_l_code: c.column_l_code || '10000000',
      spend_fy24_cr: Number((spend * 0.28).toFixed(2)),
      spend_fy25_cr: Number((spend * 0.34).toFixed(2)),
      spend_fy26_cr: Number((spend * 0.38).toFixed(2)),
      total_3yr_spend_inr_cr: Number(spend.toFixed(2)),
      spend_share_pct: Number(((spend / total) * 100).toFixed(1)),
      yoy_growth_pct: 8.5,
      vendor_count: 5,
      item_count: c.lineItemsCount || 10,
      top_items: [],
      is_balance_category: false,
      rank: idx + 1
    };
  });
}

function createCategoryEntry(item: LineItemMapping): CategoryAggregate {
  const descMatch = lookupUNSPSCByDescription(item.raw_desc);
  const fallback = lookupUNSPSCDetails(item.raw_desc, item.core_bucket);
  return {
    spendFY24: 0,
    spendFY25: 0,
    spendFY26: 0,
    totalSpend: 0,
    vendors: new Set(),
    items: new Map(),
    coreBucket: item.core_bucket || 'Direct Materials',
    sampleColumnL: item.unspsc_code || descMatch?.commodityCode || '10000000',
    sampleColumnLTitle: item.unspsc_commodity_title || descMatch?.commodityTitle || fallback.commodityTitle
  };
}

function aggregateLineItemCategory(
  item: LineItemMapping,
  categoryMap: Map<string, CategoryAggregate>
): void {
  const catKey = item.core_bucket || item.unspsc_category_name || 'Direct Materials';
  let entry = categoryMap.get(catKey);
  if (!entry) {
    entry = createCategoryEntry(item);
    categoryMap.set(catKey, entry);
  }

  const spendCr = getItemSpendCr(item);
  entry.totalSpend += spendCr;
  addSpendToFiscalYear(entry, spendCr, item.spend_year);

  const vendor = item.vendor_identified;
  if (vendor) {
    entry.vendors.add(vendor);
  }

  const rawDesc = item.raw_desc || item.material_desc || 'Material Line Item';
  const code = item.unspsc_code || entry.sampleColumnL;
  upsertTopItem(entry.items, item, rawDesc, vendor || 'Supplier', spendCr, code);
}
