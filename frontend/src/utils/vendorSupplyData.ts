import { VENDOR_SUPPLY_THRESHOLDS } from '../constants/vendorSupply';
import { UI_STRINGS } from '../constants/uiStrings';
import type { LineItemMapping } from '../types/models';
import type { VendorItemYoYDetail, VendorSupplyRecord } from '../types/vendorSupply';
import { addSpendToFiscalYear, getItemSpendCr } from './step2BreakdownShared';

interface VendorAggregate {
  vendorName: string;
  masterId?: string;
  totalSpend: number;
  fiscalSpend: { spendFY24: number; spendFY25: number; spendFY26: number };
  categories: Map<string, number>;
  items: Array<{ detail: VendorItemYoYDetail; spend: number }>;
  lineItemsCount: number;
}

const getVendorKey = (item: LineItemMapping, vendorName: string): string => {
  const supplierId = item.master_supplier_id?.trim();
  return supplierId ? `ID:${supplierId}` : `NAME:${vendorName.toLocaleLowerCase()}`;
};

const getObservedSpendYear = (item: LineItemMapping): number | undefined => {
  const year = item.spend_year ?? new Date(item.invoice_date).getFullYear();
  return Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : undefined;
};

const getYearOverYearChange = (fiscalSpend: VendorAggregate['fiscalSpend']): number | undefined => {
  const pairs = [
    [fiscalSpend.spendFY24, fiscalSpend.spendFY25],
    [fiscalSpend.spendFY25, fiscalSpend.spendFY26]
  ];
  const pair = pairs.find(([previous, current]) => previous > 0 && current > 0);
  if (!pair) return undefined;
  const [previous, current] = pair;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const createItemDetail = (item: LineItemMapping): VendorItemYoYDetail => ({
  material_code: item.material_code?.trim() || item.line_item_id || UI_STRINGS.common.notAvailable,
  material_description: item.raw_desc?.trim() || item.material_desc?.trim() || UI_STRINGS.common.notAvailable,
  po_number: item.po_number?.trim() || UI_STRINGS.common.notAvailable,
  unspsc_code: item.unspsc_code?.trim() || UI_STRINGS.common.notAvailable,
  unspsc_title: item.unspsc_commodity_title?.trim()
    || item.unspsc_category_name?.trim()
    || UI_STRINGS.common.notAvailable
});

const getRiskLevel = (spend: number, isMultiCategory: boolean): VendorSupplyRecord['risk_level'] => {
  if (isMultiCategory || spend >= VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR) return 'HIGH_RISK';
  if (spend >= VENDOR_SUPPLY_THRESHOLDS.MID_SPEND_THRESHOLD_CR) return 'MEDIUM_RISK';
  return 'OPTIMAL';
};

/** Aggregate the selected assessment's D1-backed transaction rows without inventing missing metrics. */
export const buildVendorSupplyRecords = (
  lineItems: LineItemMapping[] = [],
  portfolioSpendCr = 0
): VendorSupplyRecord[] => {
  const aggregates = new Map<string, VendorAggregate>();

  for (const item of lineItems) {
    const vendorName = item.vendor_identified?.trim() || UI_STRINGS.common.notAvailable;
    const key = getVendorKey(item, vendorName);
    let aggregate = aggregates.get(key);
    if (!aggregate) {
      aggregate = {
        vendorName,
        masterId: item.master_supplier_id?.trim() || undefined,
        totalSpend: 0,
        fiscalSpend: { spendFY24: 0, spendFY25: 0, spendFY26: 0 },
        categories: new Map<string, number>(),
        items: [],
        lineItemsCount: 0
      };
      aggregates.set(key, aggregate);
    }

    const spend = getItemSpendCr(item);
    aggregate.totalSpend += spend;
    aggregate.lineItemsCount += 1;
    const year = getObservedSpendYear(item);
    if (year !== undefined) addSpendToFiscalYear(aggregate.fiscalSpend, spend, year);

    const category = item.core_bucket?.trim() || item.unspsc_category_name?.trim();
    if (category) aggregate.categories.set(category, (aggregate.categories.get(category) || 0) + spend);
    aggregate.items.push({ detail: createItemDetail(item), spend });
  }

  const ranked = Array.from(aggregates.values()).sort((left, right) => right.totalSpend - left.totalSpend).slice(0, 50);
  const totalSpend = portfolioSpendCr > 0
    ? portfolioSpendCr
    : Array.from(aggregates.values()).reduce((sum, vendor) => sum + vendor.totalSpend, 0);

  return ranked.map((vendor, index) => {
    const categories = Array.from(vendor.categories.entries()).sort((left, right) => right[1] - left[1]);
    const suppliedCategories = categories.map(([category]) => category);
    const multiCategory = suppliedCategories.length > 1;
    const yoy = getYearOverYearChange(vendor.fiscalSpend);
    const riskLevel = getRiskLevel(vendor.totalSpend, multiCategory);
    const topItems = [...vendor.items]
      .sort((left, right) => right.spend - left.spend)
      .slice(0, 10)
      .map(({ detail }) => detail);

    return {
      rank: index + 1,
      vendor_name: vendor.vendorName,
      master_vendor_id: vendor.masterId || UI_STRINGS.common.notAvailable,
      total_spend_inr_cr: Number(vendor.totalSpend.toFixed(2)),
      spend_fy24_cr: Number(vendor.fiscalSpend.spendFY24.toFixed(2)),
      spend_fy25_cr: Number(vendor.fiscalSpend.spendFY25.toFixed(2)),
      spend_fy26_cr: Number(vendor.fiscalSpend.spendFY26.toFixed(2)),
      yoy_growth_pct: yoy,
      category_type: multiCategory ? 'MULTI_CATEGORY' : 'SINGLE_CATEGORY',
      category_count: suppliedCategories.length,
      primary_category: suppliedCategories[0] || UI_STRINGS.common.notAvailable,
      supplied_categories: suppliedCategories,
      irrelevant_categories: [],
      line_items_count: vendor.lineItemsCount,
      risk_level: riskLevel,
      observation_note: riskLevel === 'HIGH_RISK'
        ? UI_STRINGS.module2.vendorSupply.riskHigh
        : riskLevel === 'MEDIUM_RISK'
          ? UI_STRINGS.module2.vendorSupply.riskMedium
          : UI_STRINGS.module2.vendorSupply.riskOptimal,
      spend_share_pct: totalSpend > 0 ? Number(((vendor.totalSpend / totalSpend) * 100).toFixed(1)) : 0,
      spend_yoy_pct: yoy,
      top_items: topItems
    };
  });
};
