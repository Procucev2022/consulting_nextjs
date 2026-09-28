import { STRATEGIC_SOURCING_CONSTANTS } from '../constants/strategicSourcing';
import type {
  StrategicInputTransaction,
  SpecificationRationalizationDetails,
  DemandConsolidationDetails,
  NewVendorDevelopmentDetails,
  AlternateMaterialDetails
} from '../types/strategicSourcing';
import type { SavingsOpportunityItem } from '../types/savings';

export function runSpecRationalization(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: SpecificationRationalizationDetails[];
} {
  const clusterMap = new Map<string, {
    category: string;
    variants: Set<string>;
    totalSpend: number;
    plant: string;
  }>();

  transactions.forEach((tx) => {
    const desc = (tx.material_desc || tx.material_code || '').trim();
    const firstWord = desc.split(' ')[0]?.toUpperCase() || 'GENERAL';
    if (firstWord.length >= 3) {
      let entry = clusterMap.get(firstWord);
      if (!entry) {
        entry = {
          category: tx.spend_category || 'DIRECT MATERIALS',
          variants: new Set(),
          totalSpend: 0,
          plant: tx.plant || 'Main Plant'
        };
        clusterMap.set(firstWord, entry);
      }
      entry.variants.add(desc);
      entry.totalSpend += tx.total_spend_inr || 0;
    }
  });

  const opportunities: SavingsOpportunityItem[] = [];
  const details: SpecificationRationalizationDetails[] = [];
  let counter = 1;

  clusterMap.forEach((entry, clusterPrefix) => {
    if (entry.variants.size >= 3 && entry.totalSpend > 1000000) {
      const rate = STRATEGIC_SOURCING_CONSTANTS.SPEC_RATIONALIZATION_SAVINGS_RATE;
      const savingsInr = Math.round(entry.totalSpend * rate);
      const oppId = `OPP-STRAT-SPEC-${String(counter++).padStart(3, '0')}`;

      details.push({
        spec_cluster: clusterPrefix,
        variant_count: entry.variants.size,
        variant_materials: Array.from(entry.variants).slice(0, 5),
        total_spend_inr: Math.round(entry.totalSpend),
        standardized_sku_recommendation: `Standardize ${clusterPrefix} series to core grade`,
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000
      });

      opportunities.push({
        opportunity_id: oppId,
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'SPECIFICATION_RATIONALIZATION',
        category: entry.category,
        item: `${clusterPrefix} Variants`,
        vendor: 'Multiple Vendors',
        plant: entry.plant,
        spend_inr: Math.round(entry.totalSpend),
        spend_inr_cr: Math.round((entry.totalSpend / 10000000) * 1000) / 1000,
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
        is_overlapping: false,
        net_savings_inr: savingsInr,
        net_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
        status: 'IDENTIFIED',
        owner: 'Technical',
        timeline: '90 Days',
        validation_notes: `Standardize ${entry.variants.size} distinct specifications into unified catalog SKU`,
        created_at: new Date().toISOString()
      });
    }
  });

  return { opportunities, details };
}

export function runDemandConsolidation(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: DemandConsolidationDetails[];
} {
  const itemMap = new Map<string, {
    category: string;
    item: string;
    plants: Set<string>;
    bus: Set<string>;
    totalSpend: number;
    totalQty: number;
  }>();

  transactions.forEach((tx) => {
    const key = (tx.material_code || tx.material_desc || 'ITEM').trim();
    let entry = itemMap.get(key);
    if (!entry) {
      entry = {
        category: tx.spend_category || 'DIRECT MATERIALS',
        item: tx.material_desc || tx.material_code || 'Supply Item',
        plants: new Set(),
        bus: new Set(),
        totalSpend: 0,
        totalQty: 0
      };
      itemMap.set(key, entry);
    }
    if (tx.plant) entry.plants.add(tx.plant);
    if (tx.business_unit) entry.bus.add(tx.business_unit);
    entry.totalSpend += tx.total_spend_inr || 0;
    entry.totalQty += tx.quantity || 0;
  });

  const opportunities: SavingsOpportunityItem[] = [];
  const details: DemandConsolidationDetails[] = [];
  let counter = 1;

  itemMap.forEach((entry, itemKey) => {
    if (entry.plants.size >= STRATEGIC_SOURCING_CONSTANTS.DEMAND_CONSOLIDATION_MIN_PLANTS) {
      const rate = STRATEGIC_SOURCING_CONSTANTS.DEMAND_CONSOLIDATION_SAVINGS_RATE;
      const savingsInr = Math.round(entry.totalSpend * rate);
      const oppId = `OPP-STRAT-DEMAND-${String(counter++).padStart(3, '0')}`;

      details.push({
        material_desc: entry.item,
        plants_involved: Array.from(entry.plants),
        business_units_involved: Array.from(entry.bus),
        total_spend_inr: Math.round(entry.totalSpend),
        combined_quantity: entry.totalQty,
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000
      });

      opportunities.push({
        opportunity_id: oppId,
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'DEMAND_CONSOLIDATION',
        category: entry.category,
        item: itemKey,
        vendor: 'Consolidated Supplier Pool',
        plant: Array.from(entry.plants).join(', '),
        spend_inr: Math.round(entry.totalSpend),
        spend_inr_cr: Math.round((entry.totalSpend / 10000000) * 1000) / 1000,
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
        is_overlapping: false,
        net_savings_inr: savingsInr,
        net_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
        status: 'IDENTIFIED',
        owner: 'SCM',
        timeline: '60 Days',
        validation_notes: `Pool demand across plants (${Array.from(entry.plants).join(', ')}) for volume tier pricing`,
        created_at: new Date().toISOString()
      });
    }
  });

  return { opportunities, details };
}

export function runNewVendorDevelopment(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: NewVendorDevelopmentDetails[];
} {
  const itemMap = new Map<string, {
    category: string;
    item: string;
    plant: string;
    totalSpend: number;
    vendorSpends: Map<string, number>;
  }>();

  transactions.forEach((tx) => {
    const key = (tx.material_code || tx.material_desc || 'ITEM').trim();
    let entry = itemMap.get(key);
    if (!entry) {
      entry = {
        category: tx.spend_category || 'DIRECT MATERIALS',
        item: tx.material_desc || tx.material_code || 'Supply Item',
        plant: tx.plant || 'Main Plant',
        totalSpend: 0,
        vendorSpends: new Map()
      };
      itemMap.set(key, entry);
    }
    entry.totalSpend += tx.total_spend_inr || 0;
    const v = tx.vendor_name || 'Vendor';
    entry.vendorSpends.set(v, (entry.vendorSpends.get(v) || 0) + (tx.total_spend_inr || 0));
  });

  const opportunities: SavingsOpportunityItem[] = [];
  const details: NewVendorDevelopmentDetails[] = [];
  let counter = 1;

  itemMap.forEach((entry, itemKey) => {
    if (entry.totalSpend >= 2000000) {
      const sorted = Array.from(entry.vendorSpends.entries()).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const [dominantVendor, dominantSpend] = sorted[0];
        const dominantShare = (dominantSpend / entry.totalSpend) * 100;

        if (dominantShare >= STRATEGIC_SOURCING_CONSTANTS.NEW_VENDOR_DOMINANT_SHARE_THRESHOLD_PCT) {
          const savingsInr = Math.round(entry.totalSpend * STRATEGIC_SOURCING_CONSTANTS.NEW_VENDOR_SAVINGS_RATE);
          const oppId = `OPP-STRAT-NEWVEND-${String(counter++).padStart(3, '0')}`;
          const isSole = sorted.length === 1;

          details.push({
            material_desc: entry.item,
            dominant_vendor: dominantVendor,
            dominant_share_pct: Math.round(dominantShare),
            spend_inr: Math.round(entry.totalSpend),
            risk_level: isSole ? 'CRITICAL_SINGLE_SOURCE' : 'HIGH_CONCENTRATION',
            potential_savings_inr: savingsInr,
            potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000
          });

          opportunities.push({
            opportunity_id: oppId,
            source_module: 'MODULE_2_STRATEGIC',
            source_engine: 'NEW_VENDOR_DEVELOPMENT',
            category: entry.category,
            item: itemKey,
            vendor: dominantVendor,
            plant: entry.plant,
            spend_inr: Math.round(entry.totalSpend),
            spend_inr_cr: Math.round((entry.totalSpend / 10000000) * 1000) / 1000,
            potential_savings_inr: savingsInr,
            potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
            is_overlapping: false,
            net_savings_inr: savingsInr,
            net_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
            status: 'IDENTIFIED',
            owner: 'Procurement',
            timeline: '120 Days',
            validation_notes: `Qualify secondary vendor to reduce ${Math.round(dominantShare)}% dependency`,
            created_at: new Date().toISOString()
          });
        }
      }
    }
  });

  return { opportunities, details };
}

export function runAlternateMaterials(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: AlternateMaterialDetails[];
} {
  const opportunities: SavingsOpportunityItem[] = [];
  const details: AlternateMaterialDetails[] = [];
  let counter = 1;

  const highSpendItems = new Map<string, {
    category: string;
    item: string;
    vendor: string;
    plant: string;
    totalSpend: number;
  }>();

  transactions.forEach((tx) => {
    const desc = (tx.material_desc || tx.material_code || '').trim();
    const cat = (tx.spend_category || '').toUpperCase();
    if (cat === 'PACKING MATERIALS' || cat === 'DIRECT MATERIALS') {
      let entry = highSpendItems.get(desc);
      if (!entry) {
        entry = {
          category: tx.spend_category || 'DIRECT MATERIALS',
          item: desc,
          vendor: tx.vendor_name || 'Vendor',
          plant: tx.plant || 'Main Plant',
          totalSpend: 0
        };
        highSpendItems.set(desc, entry);
      }
      entry.totalSpend += tx.total_spend_inr || 0;
    }
  });

  highSpendItems.forEach((entry, itemKey) => {
    if (entry.totalSpend >= 2500000) {
      const savingsInr = Math.round(entry.totalSpend * STRATEGIC_SOURCING_CONSTANTS.ALTERNATE_MATERIAL_SAVINGS_RATE);
      const oppId = `OPP-STRAT-ALT-${String(counter++).padStart(3, '0')}`;

      details.push({
        material_desc: entry.item,
        current_spec: `Current Spec: ${entry.item}`,
        spend_inr: Math.round(entry.totalSpend),
        alternate_proposal: 'Evaluate standard commercial alternate grade / make-buy formulation',
        validation_status: STRATEGIC_SOURCING_CONSTANTS.ALTERNATE_MATERIAL_VALIDATION_LABEL,
        technical_feasibility: 'PENDING_TECHNICAL_REVIEW',
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000
      });

      opportunities.push({
        opportunity_id: oppId,
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'ALTERNATE_MATERIAL',
        category: entry.category,
        item: itemKey,
        vendor: entry.vendor,
        plant: entry.plant,
        spend_inr: Math.round(entry.totalSpend),
        spend_inr_cr: Math.round((entry.totalSpend / 10000000) * 1000) / 1000,
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
        is_overlapping: false,
        net_savings_inr: savingsInr,
        net_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000,
        status: 'UNDER_VALIDATION',
        owner: 'Technical',
        timeline: '180 Days',
        validation_notes: `${STRATEGIC_SOURCING_CONSTANTS.ALTERNATE_MATERIAL_VALIDATION_LABEL}: Technical sampling`,
        created_at: new Date().toISOString()
      });
    }
  });

  return { opportunities, details };
}
