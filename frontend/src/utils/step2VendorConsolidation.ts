/**
 * Vendor Consolidation Simulator Engine Calculator
 */

import type {
  LineItemMapping,
  RecurringConsolidationItem,
  ConsolidationCategory,
  VendorConsolidationSummary
} from '../types';
import { lookupUNSPSCDetails, lookupUNSPSCByDescription } from '../data/unspscTaxonomy';

interface ConsolidationGroupAggregate {
  category: string;
  itemGroupTitle: string;
  itemGroupCode: string;
  unspscCode: string;
  unspscFamily: string;
  totalSpend: number;
  suppliers: Map<string, { spend: number; poCount: number; vendorId: string }>;
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
  idx?: number
): void {
  const existingS = entry.suppliers.get(vName);
  if (existingS) {
    existingS.spend += spendCr;
    existingS.poCount += 1;
  } else {
    entry.suppliers.set(vName, {
      spend: spendCr,
      poCount: 1,
      vendorId: masterId || `VND-${100 + (idx || 0)}`
    });
  }
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

  const spendCr = item.inr_crores || (item.total_spend ? item.total_spend / 10000000 : 0.5);
  entry.totalSpend += spendCr;
  entry.totalPos += 1;
  entry.totalUnits += item.qty || 100;
  upsertGroupSupplier(entry, item.vendor_identified || 'Supplier', spendCr, item.master_supplier_id, idx);
}

function buildConsolidationItem(grp: ConsolidationGroupAggregate, counter: number): RecurringConsolidationItem {
  const vendorCount = grp.suppliers.size;
  const priceVariance = Math.min(35, Number((8.5 + (counter % 4) * 4.2).toFixed(1)));
  const savingsPct = Math.min(18, Number((7.0 + (counter % 3) * 3.5).toFixed(1)));
  const savingsCr = Number(((grp.totalSpend * savingsPct) / 100).toFixed(2));

  const sortedSuppliers = Array.from(grp.suppliers.entries())
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([vName, sData], sIdx) => ({
      vendor_id: sData.vendorId,
      vendor_name: vName,
      annual_spend_inr_cr: Number(sData.spend.toFixed(2)),
      spend_share_pct: Number(((sData.spend / (grp.totalSpend || 1)) * 100).toFixed(1)),
      unit_rate_index: Number((1.0 + sIdx * 0.05).toFixed(2)),
      monthly_po_count: Math.max(1, Math.round(sData.poCount / 12)),
      status: (sIdx === 0 ? 'Primary' : sIdx === 1 ? 'Incumbent' : 'Spot / Peripheral') as
        | 'Primary'
        | 'Incumbent'
        | 'Spot / Peripheral'
    }));

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
      `Consolidate volume across ${vendorCount} vendors to top 2 competitive suppliers`,
      'Standardize specifications and run multi-round RFP on proCPX',
      `Lock in volume discounts delivering ₹${savingsCr.toFixed(2)} Cr savings`
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
