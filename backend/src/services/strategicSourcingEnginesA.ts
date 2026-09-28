import { STRATEGIC_SOURCING_CONSTANTS } from '../constants/strategicSourcing';
import type {
  StrategicInputTransaction,
  VendorConsolidationOpportunityDetails,
  PoConsolidationOpportunityDetails
} from '../types/strategicSourcing';
import type { SavingsOpportunityItem } from '../types/savings';

export function runVendorConsolidation(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: VendorConsolidationOpportunityDetails[];
} {
  const groupMap = new Map<string, {
    category: string;
    item: string;
    plant: string;
    totalSpend: number;
    vendorSpends: Map<string, number>;
  }>();

  transactions.forEach((tx) => {
    const key = (tx.material_code || tx.material_desc || 'UNKNOWN_ITEM').trim();
    let grp = groupMap.get(key);
    if (!grp) {
      grp = {
        category: tx.spend_category || 'DIRECT MATERIALS',
        item: tx.material_desc || tx.material_code || 'Industrial Supply',
        plant: tx.plant || 'Main Plant',
        totalSpend: 0,
        vendorSpends: new Map()
      };
      groupMap.set(key, grp);
    }
    grp.totalSpend += tx.total_spend_inr || 0;
    const vName = tx.vendor_name || 'Unknown Vendor';
    grp.vendorSpends.set(vName, (grp.vendorSpends.get(vName) || 0) + (tx.total_spend_inr || 0));
  });

  const opportunities: SavingsOpportunityItem[] = [];
  const details: VendorConsolidationOpportunityDetails[] = [];
  let counter = 1;

  groupMap.forEach((grp, itemKey) => {
    if (grp.vendorSpends.size >= STRATEGIC_SOURCING_CONSTANTS.VENDOR_CONSOLIDATION_MIN_VENDORS) {
      const sortedVendors = Array.from(grp.vendorSpends.entries()).sort((a, b) => b[1] - a[1]);
      const primaryVendor = sortedVendors[0][0];
      const fragmentedVendors = sortedVendors.slice(1).map(([v]) => v);
      const tailSpend = sortedVendors.slice(1).reduce((acc, [, s]) => acc + s, 0);

      if (tailSpend > 0) {
        const savingsInr = Math.round(tailSpend * STRATEGIC_SOURCING_CONSTANTS.VENDOR_CONSOLIDATION_SAVINGS_RATE);
        const oppId = `OPP-STRAT-VEND-${String(counter++).padStart(3, '0')}`;

        details.push({
          material_group: grp.item,
          current_vendor_count: grp.vendorSpends.size,
          target_vendor_count: 1,
          affected_spend_inr: Math.round(tailSpend),
          affected_spend_inr_cr: Math.round((tailSpend / 10000000) * 1000) / 1000,
          primary_vendor: primaryVendor,
          fragmented_vendors: fragmentedVendors,
          potential_savings_inr: savingsInr,
          potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
          consolidation_ratio: Math.round((1 - (1 / grp.vendorSpends.size)) * 100)
        });

        opportunities.push({
          opportunity_id: oppId,
          source_module: 'MODULE_2_STRATEGIC',
          source_engine: 'VENDOR_CONSOLIDATION',
          category: grp.category,
          item: itemKey,
          vendor: primaryVendor,
          plant: grp.plant,
          spend_inr: Math.round(grp.totalSpend),
          spend_inr_cr: Math.round((grp.totalSpend / 10000000) * 1000) / 1000,
          potential_savings_inr: savingsInr,
          potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
          is_overlapping: false,
          net_savings_inr: savingsInr,
          net_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
          status: 'IDENTIFIED',
          owner: 'Procurement',
          timeline: '60 Days',
          validation_notes: `Consolidate ${grp.vendorSpends.size} vendors to primary supplier ${primaryVendor}`,
          created_at: new Date().toISOString()
        });
      }
    }
  });

  return { opportunities, details };
}

export function runPoConsolidation(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: PoConsolidationOpportunityDetails[];
} {
  const pairMap = new Map<string, {
    vendor: string;
    item: string;
    category: string;
    plant: string;
    poCount: number;
    totalSpend: number;
  }>();

  transactions.forEach((tx) => {
    const v = tx.vendor_name || 'Vendor';
    const m = tx.material_desc || tx.material_code || 'Material';
    const key = `${v}|${m}`;
    let entry = pairMap.get(key);
    if (!entry) {
      entry = {
        vendor: v,
        item: m,
        category: tx.spend_category || 'MRO',
        plant: tx.plant || 'Main Plant',
        poCount: 0,
        totalSpend: 0
      };
      pairMap.set(key, entry);
    }
    entry.poCount += 1;
    entry.totalSpend += tx.total_spend_inr || 0;
  });

  const opportunities: SavingsOpportunityItem[] = [];
  const details: PoConsolidationOpportunityDetails[] = [];
  let counter = 1;

  pairMap.forEach((entry) => {
    if (entry.poCount >= STRATEGIC_SOURCING_CONSTANTS.PO_CONSOLIDATION_MIN_POS) {
      const avgPoValue = entry.totalSpend / entry.poCount;
      const excessPos = entry.poCount - 1;
      const adminSavings = excessPos * STRATEGIC_SOURCING_CONSTANTS.PO_CONSOLIDATION_ADMIN_COST_PER_PO;
      const volumeRebate = entry.totalSpend * STRATEGIC_SOURCING_CONSTANTS.PO_CONSOLIDATION_VOLUME_REBATE_RATE;
      const totalSavings = Math.round(adminSavings + volumeRebate);
      const oppId = `OPP-STRAT-PO-${String(counter++).padStart(3, '0')}`;

      details.push({
        vendor_name: entry.vendor,
        material_desc: entry.item,
        po_count: entry.poCount,
        total_spend_inr: Math.round(entry.totalSpend),
        average_po_value_inr: Math.round(avgPoValue),
        small_orders_count: excessPos,
        potential_savings_inr: totalSavings,
        potential_savings_inr_cr: Math.round((totalSavings / 10000000) * 1000) / 1000
      });

      opportunities.push({
        opportunity_id: oppId,
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'PO_CONSOLIDATION',
        category: entry.category,
        item: entry.item,
        vendor: entry.vendor,
        plant: entry.plant,
        spend_inr: Math.round(entry.totalSpend),
        spend_inr_cr: Math.round((entry.totalSpend / 10000000) * 1000) / 1000,
        potential_savings_inr: totalSavings,
        potential_savings_inr_cr: Math.round((totalSavings / 10000000) * 1000) / 1000,
        is_overlapping: false,
        net_savings_inr: totalSavings,
        net_savings_inr_cr: Math.round((totalSavings / 10000000) * 1000) / 1000,
        status: 'IDENTIFIED',
        owner: 'Procurement',
        timeline: '30 Days',
        validation_notes: `Consolidate ${entry.poCount} small POs into scheduled blanket orders`,
        created_at: new Date().toISOString()
      });
    }
  });

  return { opportunities, details };
}
