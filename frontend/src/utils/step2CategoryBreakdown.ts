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
    const fy24 = data.spendFY24;
    const fy25 = data.spendFY25;
    const fy26 = data.spendFY26;
    const yoy = (fy25 > 0 && fy26 > 0)
      ? Number((((fy26 - fy25) / fy25) * 100).toFixed(1))
      : undefined;

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
      vendor_count: data.vendors.size || /* c8 ignore next */ 1,
      item_count: data.items.size || /* c8 ignore next */ 1,
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

function extractFallbackYearSpends(c: SpendCategorySummary): { fy24: number; fy25: number; fy26: number } {
  const fy24 = c.spend_fy24_cr ?? (c.spend_inr_2023 ? c.spend_inr_2023 / 10000000 : 0);
  const fy25 = c.spend_fy25_cr ?? (c.spend_inr_2024 ? c.spend_inr_2024 / 10000000 : 0);
  const fy26 = c.spend_fy26_cr ?? (c.spend_inr_2025_26 ? c.spend_inr_2025_26 / 10000000 : 0);
  return {
    fy24: Number(fy24.toFixed(2)),
    fy25: Number(fy25.toFixed(2)),
    fy26: Number(fy26.toFixed(2))
  };
}

function calculateFallbackYoY(fy25: number, fy26: number): number | undefined {
  if (fy25 > 0 && fy26 > 0) {
    return Number((((fy26 - fy25) / fy25) * 100).toFixed(1));
  }
  return undefined;
}

function buildFallbackCategoryDetail(
  c: SpendCategorySummary,
  idx: number,
  total: number
): CategoryYearDetail {
  const spend = c.spend_inr_crores ?? c.total_3yr_spend_inr_cr ?? 0;
  const catName = c.name ?? c.category ?? 'Direct Materials';
  const bucket = getFallbackBucket(catName);
  const { fy24, fy25, fy26 } = extractFallbackYearSpends(c);
  const yoyGrowth = calculateFallbackYoY(fy25, fy26);

  return {
    id: c.id || `CAT-${idx + 1}`,
    category: catName,
    core_bucket: bucket,
    sample_column_l_code: c.column_l_code || '00000000',
    spend_fy24_cr: fy24,
    spend_fy25_cr: fy25,
    spend_fy26_cr: fy26,
    total_3yr_spend_inr_cr: Number(spend.toFixed(2)),
    spend_share_pct: Number(((spend / total) * 100).toFixed(1)),
    yoy_growth_pct: yoyGrowth,
    vendor_count: c.supplier_count ?? 0,
    item_count: c.lineItemsCount ?? 0,
    top_items: [],
    is_balance_category: false,
    rank: idx + 1
  };
}

function transformFallbackCategories(fallbackCategories: SpendCategorySummary[]): CategoryYearDetail[] {
  if (!fallbackCategories || fallbackCategories.length === 0) return [];
  const total = fallbackCategories.reduce((s, c) => s + (c.spend_inr_crores || 0), 0) || 1;
  return fallbackCategories.map((c, idx) => buildFallbackCategoryDetail(c, idx, total));
}

function createCategoryEntry(item: LineItemMapping): CategoryAggregate {
  const descMatch = lookupUNSPSCByDescription(item.raw_desc);
  const isClassified = descMatch?.classificationStatus === 'CLASSIFIED';
  const fallback = lookupUNSPSCDetails(item.raw_desc, item.core_bucket);
  return {
    spendFY24: 0,
    spendFY25: 0,
    spendFY26: 0,
    totalSpend: 0,
    vendors: new Set(),
    items: new Map(),
    coreBucket: item.core_bucket || 'Direct Materials',
    sampleColumnL: item.unspsc_code || (isClassified ? descMatch?.commodityCode : '00000000') || '00000000',
    sampleColumnLTitle:
      item.unspsc_commodity_title || (isClassified ? descMatch?.commodityTitle : 'Unclassified Commodity') || fallback.commodityTitle
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

  const rawDesc = item.raw_desc || item.material_desc || /* c8 ignore next */ 'Material Line Item';
  const code = item.unspsc_code || entry.sampleColumnL;
  upsertTopItem(entry.items, item, rawDesc, vendor || 'Supplier', spendCr, code);
}
