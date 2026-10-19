/**
 * Vendor Consolidation Simulator Engine Calculator
 */

import type {
  LineItemMapping,
  RecurringConsolidationItem,
  ConsolidationCategory,
  ConsolidationSupplier,
  VendorConsolidationSummary
} from '../types';
import { lookupUNSPSCDetails, lookupUNSPSCByDescription } from '../data/unspscTaxonomy';

interface SupplierAggregateData {
  spend: number;
  poCount: number;
  vendorId: string;
  totalUnits: number;
  unitPrice?: number;
}

interface ConsolidationGroupAggregate {
  category: string;
  itemGroupTitle: string;
  itemGroupCode: string;
  unspscCode: string;
  unspscFamily: string;
  totalSpend: number;
  suppliers: Map<string, SupplierAggregateData>;
  totalPos: number;
  totalUnits: number;
}

export function calculateVendorConsolidation(
  lineItems: LineItemMapping[] = []
): RecurringConsolidationItem[] {
  if (!lineItems || lineItems.length === 0) return [];

  const groupMap = new Map<string, ConsolidationGroupAggregate>();
  lineItems.forEach((item, idx) => aggregateConsolidationRecord(item, idx, groupMap));

  const consolidationItems: RecurringConsolidationItem[] = [];
  let counter = 0;

  groupMap.forEach((grp) => {
    if (grp.suppliers.size >= 2 && grp.totalSpend > 0) {
      consolidationItems.push(buildConsolidationItem(grp, counter++));
    }
  });

  return consolidationItems.sort((a, b) => b.total_spend_inr_cr - a.total_spend_inr_cr);
}

function resolveConsolidationTaxonomy(desc: string, bucket: string): { code: string; family: string } {
  const descMatch = lookupUNSPSCByDescription(desc);
  const fallback = lookupUNSPSCDetails(desc, bucket);
  if (descMatch?.classificationStatus === 'UNCLASSIFIED') {
    return {
      code: '00000000',
      family: 'Unclassified (Review Required)'
    };
  }
  return {
    code: descMatch?.commodityCode || '10000000',
    family: descMatch?.classTitle || fallback.classTitle || 'Industrial Supplies'
  };
}

function createGroupAggregate(item: LineItemMapping, cat: string, idx: number): ConsolidationGroupAggregate {
  const tax = resolveConsolidationTaxonomy(item.raw_desc, item.core_bucket);
  return {
    category: cat,
    itemGroupTitle: `${cat} - ${item.raw_desc?.slice(0, 28) || 'Supply Group'}`,
    itemGroupCode: `GRP-${100 + idx}`,
    unspscCode: item.unspsc_code || tax.code,
    unspscFamily: item.unspsc_class_title || tax.family,
    totalSpend: 0,
    suppliers: new Map(),
    totalPos: 0,
    totalUnits: 0
  };
}

function upsertGroupSupplier(
  entry: ConsolidationGroupAggregate,
  vName: string,
  spendCr: number,
  masterId?: string,
  idx?: number,
  qty?: number,
  unitPrice?: number
): void {
  const existingS = entry.suppliers.get(vName);
  const units = qty && qty > 0 ? qty : 0;
  if (existingS) {
    existingS.spend += spendCr;
    existingS.poCount += 1;
    existingS.totalUnits += units;
    if (unitPrice && unitPrice > 0) {
      existingS.unitPrice = unitPrice;
    }
  } else {
    entry.suppliers.set(vName, {
      spend: spendCr,
      poCount: 1,
      vendorId: masterId || `VND-${100 + (idx || 0)}`,
      totalUnits: units,
      unitPrice: unitPrice && unitPrice > 0 ? unitPrice : undefined
    });
  }
}

function resolveItemSpendAndPrice(item: LineItemMapping): { spendCr: number; qty: number; unitPrice?: number } {
  const spendCr = item.inr_crores ?? (item.total_spend ? item.total_spend / 10000000 : 0);
  const qty = item.qty && item.qty > 0 ? item.qty : 0;
  let unitPrice = item.unit_price && item.unit_price > 0 ? item.unit_price : undefined;
  if (!unitPrice && qty > 0 && item.total_spend) {
    unitPrice = item.total_spend / qty;
  }
  return { spendCr, qty, unitPrice };
}

function aggregateConsolidationRecord(
  item: LineItemMapping,
  idx: number,
  groupMap: Map<string, ConsolidationGroupAggregate>
): void {
  const cat = item.core_bucket || item.unspsc_category_name || 'Direct Materials';
  const groupKey = `${cat}_${item.raw_desc?.split(' ')[0] || 'Group'}`;
  let entry = groupMap.get(groupKey);
  if (!entry) {
    entry = createGroupAggregate(item, cat, idx);
    groupMap.set(groupKey, entry);
  }

  const { spendCr, qty, unitPrice } = resolveItemSpendAndPrice(item);
  entry.totalSpend += spendCr;
  entry.totalPos += 1;
  entry.totalUnits += qty;
  upsertGroupSupplier(
    entry,
    item.vendor_identified || 'Supplier',
    spendCr,
    item.master_supplier_id,
    idx,
    qty,
    unitPrice
  );
}

function extractSupplierPrices(
  sortedSuppliersList: [string, SupplierAggregateData][]
): { vendorName: string; price: number; data: SupplierAggregateData }[] {
  const supplierPrices: { vendorName: string; price: number; data: SupplierAggregateData }[] = [];
  for (const [vName, sData] of sortedSuppliersList) {
    let effectivePrice = sData.unitPrice;
    if (!effectivePrice && sData.totalUnits > 0 && sData.spend > 0) {
      effectivePrice = (sData.spend * 10000000) / sData.totalUnits;
    }
    if (effectivePrice && effectivePrice > 0) {
      supplierPrices.push({ vendorName: vName, price: effectivePrice, data: sData });
    }
  }
  return supplierPrices;
}

function computeTailExcessSpend(
  supplierPrices: { vendorName: string; price: number; data: SupplierAggregateData }[],
  baselinePrice?: number
): number {
  if (!baselinePrice || baselinePrice <= 0) return 0;
  let totalTailExcessSpendCr = 0;
  for (const { price, data } of supplierPrices) {
    if (price > baselinePrice) {
      if (data.totalUnits > 0) {
        totalTailExcessSpendCr += ((price - baselinePrice) * data.totalUnits) / 10000000;
      } else {
        const ratePremium = (price - baselinePrice) / baselinePrice;
        totalTailExcessSpendCr += data.spend * (ratePremium / (1 + ratePremium));
      }
    }
  }
  return totalTailExcessSpendCr;
}

function formatConsolidationSuppliers(
  sortedSuppliersList: [string, SupplierAggregateData][],
  totalSpend: number,
  baselinePrice?: number
): ConsolidationSupplier[] {
  return sortedSuppliersList.map(([vName, sData], sIdx) => {
    let effectivePrice = sData.unitPrice;
    if (!effectivePrice && sData.totalUnits > 0 && sData.spend > 0) {
      effectivePrice = (sData.spend * 10000000) / sData.totalUnits;
    }
    const unitRateIndex = baselinePrice && effectivePrice && baselinePrice > 0
      ? Number((effectivePrice / baselinePrice).toFixed(2))
      : 1.0;

    return {
      vendor_id: sData.vendorId,
      vendor_name: vName,
      annual_spend_inr_cr: Number(sData.spend.toFixed(2)),
      spend_share_pct: Number(((sData.spend / (totalSpend || 1)) * 100).toFixed(1)),
      unit_rate_index: unitRateIndex,
      monthly_po_count: Math.max(1, Math.round(sData.poCount / 12)),
      status: (sIdx === 0 ? 'Primary' : sIdx === 1 ? 'Incumbent' : 'Spot / Peripheral') as
        | 'Primary'
        | 'Incumbent'
        | 'Spot / Peripheral'
    };
  });
}

function buildConsolidationItem(grp: ConsolidationGroupAggregate, counter: number): RecurringConsolidationItem {
  const vendorCount = grp.suppliers.size;
  const sortedSuppliersList = Array.from(grp.suppliers.entries()).sort((a, b) => b[1].spend - a[1].spend);

  const supplierPrices = extractSupplierPrices(sortedSuppliersList);
  const prices = supplierPrices.map((sp) => sp.price);
  const baselinePrice = supplierPrices.length >= 2 ? Math.min(...prices) : undefined;
  const maxPrice = supplierPrices.length >= 2 ? Math.max(...prices) : undefined;
  const priceVariance = baselinePrice && maxPrice && baselinePrice > 0
    ? Number((((maxPrice - baselinePrice) / baselinePrice) * 100).toFixed(1))
    : 0;

  const totalTailExcessSpendCr = computeTailExcessSpend(supplierPrices, baselinePrice);
  const savingsCr = Number(totalTailExcessSpendCr.toFixed(2));
  const savingsPct = grp.totalSpend > 0
    ? Number(((savingsCr / grp.totalSpend) * 100).toFixed(1))
    : 0;

  const sortedSuppliers = formatConsolidationSuppliers(sortedSuppliersList, grp.totalSpend, baselinePrice);

  return {
    id: `CONS-${100 + counter}`,
    category: grp.category as ConsolidationCategory,
    item_group_title: grp.itemGroupTitle,
    item_group_code: grp.itemGroupCode,
    unspsc_family: grp.unspscFamily,
    unspsc_code: grp.unspscCode,
    total_spend_inr_cr: Number(grp.totalSpend.toFixed(2)),
    vendor_count: vendorCount,
    recurring_monthly: true,
    procurement_cadence: 'Monthly Recurring',
    monthly_po_avg: Math.max(1, Math.round(grp.totalPos / 12)),
    annual_units: grp.totalUnits,
    unit_of_measure: 'Units',
    price_variance_pct: priceVariance,
    target_consolidated_vendors: Math.max(1, Math.min(2, Math.floor(vendorCount / 2))),
    est_volume_savings_pct: savingsPct,
    est_volume_savings_cr: savingsCr,
    recommended_auction_type: 'Dynamic Reverse Auction',
    auction_platform: 'proCPX Sourcing Engine',
    suppliers: sortedSuppliers,
    consolidation_roadmap: [
      `Consolidate volume across ${vendorCount} vendors to primary competitive suppliers`,
      'Harmonize specifications and eliminate tail spot purchase variance',
      savingsCr > 0
        ? `Demonstrable price gap opportunity based on internal historical baseline: ₹${savingsCr.toFixed(2)} Cr`
        : 'Opportunity unquantified from available data: Unit rates are uniform or comparable rate baseline is unavailable'
    ]
  };
}

export const calculateVendorConsolidationSummary = (
  items: RecurringConsolidationItem[] = []
): VendorConsolidationSummary => {
  const totalFragmentedSpendCr = Number(
    items.reduce((acc, curr) => acc + curr.total_spend_inr_cr, 0).toFixed(2)
  );
  const categoriesCount = items.length;
  const totalActiveVendors = items.reduce((acc, curr) => acc + curr.vendor_count, 0);
  const avgVendorsPerCategory = categoriesCount > 0
    ? Number((totalActiveVendors / categoriesCount).toFixed(1))
    : 0;
  const potentialVolumeSavingsCr = Number(
    items.reduce((acc, curr) => acc + curr.est_volume_savings_cr, 0).toFixed(2)
  );
  const avgSavingsPct = totalFragmentedSpendCr > 0
    ? Number(((potentialVolumeSavingsCr / totalFragmentedSpendCr) * 100).toFixed(1))
    : 0;

  return {
    totalFragmentedSpendCr,
    categoriesCount,
    totalActiveVendors,
    avgVendorsPerCategory,
    potentialVolumeSavingsCr,
    avgSavingsPct
  };
};
