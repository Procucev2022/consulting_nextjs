/**
 * Vendor Consolidation and PO Consolidation Simulator Engine Calculators
 */

import type {
  LineItemMapping,
  RecurringConsolidationItem,
  MultiplePoItem,
  PoConsolidationCadence,
  CadenceSavingsBenefit,
  ConsolidationCategory
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
  if (!lineItems || lineItems.length === 0) {
    return [];
  }

  const groupMap = new Map<string, ConsolidationGroupAggregate>();

  lineItems.forEach((item, idx) => {
    aggregateConsolidationRecord(item, idx, groupMap);
  });

  const consolidationItems: RecurringConsolidationItem[] = [];
  let counter = 0;

  groupMap.forEach((grp) => {
    if (grp.suppliers.size >= 2 && grp.totalSpend > 0) {
      consolidationItems.push(buildConsolidationItem(grp, counter));
      counter++;
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

  const vName = item.vendor_identified || 'Supplier';
  upsertGroupSupplier(entry, vName, spendCr, item.master_supplier_id, idx);
}

function buildConsolidationItem(
  grp: ConsolidationGroupAggregate,
  counter: number
): RecurringConsolidationItem {
  const vendorCount = grp.suppliers.size;
  const priceVariance = Math.min(35, Number((8.5 + (counter % 4) * 4.2).toFixed(1)));
  const savingsPct = Math.min(18, Number((7.0 + (counter % 3) * 3.5).toFixed(1)));
  const savingsCr = Number(((grp.totalSpend * savingsPct) / 100).toFixed(2));

  const sortedSuppliers = Array.from(grp.suppliers.entries())
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([vName, sData], sIdx) => {
      const statusVal: 'Primary' | 'Incumbent' | 'Spot / Peripheral' =
        sIdx === 0 ? 'Primary' : sIdx === 1 ? 'Incumbent' : 'Spot / Peripheral';
      return {
        vendor_id: sData.vendorId,
        vendor_name: vName,
        annual_spend_inr_cr: Number(sData.spend.toFixed(2)),
        spend_share_pct: Number(((sData.spend / (grp.totalSpend || 1)) * 100).toFixed(1)),
        unit_rate_index: Number((1.0 + sIdx * 0.05).toFixed(2)),
        monthly_po_count: Math.max(1, Math.round(sData.poCount / 12)),
        status: statusVal
      };
    });

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

interface PoPairAggregate {
  vendorName: string;
  vendorId: string;
  category: string;
  materialCode: string;
  materialDesc: string;
  totalSpend: number;
  poCount: number;
  poNumbers: Set<string>;
}

export function calculatePoConsolidation(
  lineItems: LineItemMapping[] = []
): MultiplePoItem[] {
  if (!lineItems || lineItems.length === 0) {
    return [];
  }

  const pairMap = new Map<string, PoPairAggregate>();

  lineItems.forEach((item, idx) => {
    aggregatePoRecord(item, idx, pairMap);
  });

  const poItems: MultiplePoItem[] = [];
  let pairCounter = 0;

  pairMap.forEach((pair) => {
    poItems.push(buildPoConsolidationItem(pair, pairCounter++));
  });

  return poItems.sort((a, b) => b.total_annual_spend_cr - a.total_annual_spend_cr);
}

function createPoPairEntry(item: LineItemMapping, idx: number, matDesc: string): PoPairAggregate {
  return {
    vendorName: item.vendor_identified || 'Supplier',
    vendorId: item.master_supplier_id || `VND-M-${1000 + idx}`,
    category: item.core_bucket || 'Direct Materials',
    materialCode: item.material_code || `MAT-${2000 + idx}`,
    materialDesc: matDesc,
    totalSpend: 0,
    poCount: 0,
    poNumbers: new Set()
  };
}

function aggregatePoRecord(
  item: LineItemMapping,
  idx: number,
  pairMap: Map<string, PoPairAggregate>
): void {
  const vName = item.vendor_identified || 'Supplier';
  const matDesc = item.raw_desc || item.material_desc || 'Item';
  const pairKey = `${vName}_${matDesc}`;

  let entry = pairMap.get(pairKey);
  if (!entry) {
    entry = createPoPairEntry(item, idx, matDesc);
    pairMap.set(pairKey, entry);
  }

  const spendCr = item.inr_crores || (item.total_spend ? item.total_spend / 10000000 : 0.5);
  entry.totalSpend += spendCr;
  entry.poCount += 1;
  if (item.po_number) {
    entry.poNumbers.add(item.po_number);
  }
}

function buildPoConsolidationItem(pair: PoPairAggregate, idx: number): MultiplePoItem {
  const annualSpend = pair.totalSpend;
  const poCount = Math.max(pair.poNumbers.size, pair.poCount, 4);
  const avgMonthly = Math.max(1, Math.round(poCount / 12));
  const avgPoValueLakhs = Number(((annualSpend * 100) / (poCount || 1)).toFixed(1));

  const monthlyDist = [
    { month: 'Apr', po_count: Math.round(avgMonthly * 0.9), spend_inr_lakhs: Math.round((annualSpend * 100) / 12) },
    { month: 'May', po_count: avgMonthly, spend_inr_lakhs: Math.round((annualSpend * 100) / 12) },
    { month: 'Jun', po_count: Math.round(avgMonthly * 1.1), spend_inr_lakhs: Math.round((annualSpend * 100) / 12) },
    { month: 'Jul', po_count: avgMonthly, spend_inr_lakhs: Math.round((annualSpend * 100) / 12) },
    { month: 'Aug', po_count: Math.round(avgMonthly * 1.2), spend_inr_lakhs: Math.round((annualSpend * 100) / 12) },
    { month: 'Sep', po_count: avgMonthly, spend_inr_lakhs: Math.round((annualSpend * 100) / 12) }
  ];

  return {
    id: `PO-CONS-${100 + idx}`,
    vendor_id: pair.vendorId,
    vendor_name: pair.vendorName,
    category: pair.category,
    item_description: pair.materialDesc,
    material_code: pair.materialCode,
    total_annual_spend_cr: Number(annualSpend.toFixed(2)),
    annual_po_count: poCount,
    avg_pos_per_month: avgMonthly,
    avg_po_value_lakhs: avgPoValueLakhs,
    monthly_distribution: monthlyDist,
    primary_plant: 'Plant 1000 - Main Hub',
    cadence_options: {
      MONTHLY: buildCadenceOption('MONTHLY', 'Monthly Aggregation', 12, 3.5, poCount, annualSpend),
      QUARTERLY: buildCadenceOption('QUARTERLY', 'Quarterly Batching', 4, 7.5, poCount, annualSpend),
      HALF_YEARLY: buildCadenceOption('HALF_YEARLY', 'Semi-Annual Blanket PO', 2, 11.0, poCount, annualSpend),
      ANNUAL: buildCadenceOption('ANNUAL', 'Annual Master Blanket PO', 1, 14.5, poCount, annualSpend)
    },
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation: `Transition from ${poCount} spot POs to 4 structured quarterly releases.`,
    blanket_po_strategy: `Execute annual frame agreement with ${pair.vendorName} on DPS NXT.`
  };
}

function buildCadenceOption(
  cad: PoConsolidationCadence,
  label: string,
  targetPos: number,
  discPct: number,
  poCount: number,
  annualSpend: number
): CadenceSavingsBenefit {
  const redPct = Number((((poCount - targetPos) / poCount) * 100).toFixed(1));
  const scaleSavCr = Number(((annualSpend * discPct) / 100).toFixed(2));
  const adminSavLakhs = Number(((poCount - targetPos) * 0.15).toFixed(1));
  const totalBenefit = Number((scaleSavCr + adminSavLakhs / 100).toFixed(2));

  return {
    cadence: cad,
    label,
    target_pos_per_year: targetPos,
    po_reduction_pct: Math.max(0, redPct),
    scale_discount_pct: discPct,
    scale_savings_cr: scaleSavCr,
    admin_savings_lakhs: adminSavLakhs,
    total_benefit_cr: totalBenefit
  };
}
