/**
 * PO Consolidation Simulator Engine Calculator
 */

import type {
  LineItemMapping,
  MultiplePoItem,
  PoConsolidationCadence,
  CadenceSavingsBenefit,
  PoConsolidationSummary
} from '../types';

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

export function calculatePoConsolidation(lineItems: LineItemMapping[] = []): MultiplePoItem[] {
  if (!lineItems || lineItems.length === 0) return [];

  const pairMap = new Map<string, PoPairAggregate>();
  lineItems.forEach((item, idx) => aggregatePoRecord(item, idx, pairMap));

  const poItems: MultiplePoItem[] = [];
  let pairCounter = 0;
  pairMap.forEach((pair) => poItems.push(buildPoConsolidationItem(pair, pairCounter++)));

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
  if (item.po_number) entry.poNumbers.add(item.po_number);
}

function buildPoConsolidationItem(pair: PoPairAggregate, idx: number): MultiplePoItem {
  const annualSpend = pair.totalSpend;
  const poCount = Math.max(pair.poNumbers.size, pair.poCount, 4);
  const avgMonthly = Math.max(1, Math.round(poCount / 12));
  const avgPoValueLakhs = Number(((annualSpend * 100) / (poCount || 1)).toFixed(1));
  const mSpend = Math.round((annualSpend * 100) / 12);

  const monthlyDist = [
    { month: 'Apr', po_count: Math.round(avgMonthly * 0.9), spend_inr_lakhs: mSpend },
    { month: 'May', po_count: avgMonthly, spend_inr_lakhs: mSpend },
    { month: 'Jun', po_count: Math.round(avgMonthly * 1.1), spend_inr_lakhs: mSpend },
    { month: 'Jul', po_count: avgMonthly, spend_inr_lakhs: mSpend },
    { month: 'Aug', po_count: Math.round(avgMonthly * 1.2), spend_inr_lakhs: mSpend },
    { month: 'Sep', po_count: avgMonthly, spend_inr_lakhs: mSpend }
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

export const calculatePoConsolidationSummary = (
  items: MultiplePoItem[] = [],
  activeCadence: PoConsolidationCadence = 'QUARTERLY'
): PoConsolidationSummary => {
  let totalSpend = 0;
  let totalCurrentPos = 0;
  let totalTargetPos = 0;
  let totalAdminSavings = 0;
  let totalScaleSavings = 0;

  items.forEach((item) => {
    totalSpend += item.total_annual_spend_cr;
    totalCurrentPos += item.annual_po_count;
    const option = item.cadence_options[activeCadence];
    if (option) {
      totalTargetPos += option.target_pos_per_year;
      totalAdminSavings += option.admin_savings_lakhs;
      totalScaleSavings += option.scale_savings_cr;
    }
  });

  const avgReduction = totalCurrentPos > 0
    ? Number((((totalCurrentPos - totalTargetPos) / totalCurrentPos) * 100).toFixed(1))
    : 0;

  return {
    totalFragmentedSpendCr: Number(totalSpend.toFixed(2)),
    totalCurrentPos,
    totalTargetPos,
    totalAdminCostSavingsLakhs: Number(totalAdminSavings.toFixed(1)),
    totalScaleSavingsCr: Number(totalScaleSavings.toFixed(2)),
    avgPoReductionPct: avgReduction,
    qualifiedSuppliersCount: items.length
  };
};
