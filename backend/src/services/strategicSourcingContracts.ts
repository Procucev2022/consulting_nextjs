import { STRATEGIC_SOURCING_CONSTANTS } from '../constants/strategicSourcing';
import type {
  StrategicInputTransaction,
  EAuctionOpportunityDetails,
  RateContractOpportunityDetails
} from '../types/strategicSourcing';
import type { SavingsOpportunityItem } from '../types/savings';

export function runEAuction(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: EAuctionOpportunityDetails[];
} {
  const itemMap = new Map<string, {
    category: string;
    item: string;
    plant: string;
    totalSpend: number;
    vendors: Set<string>;
  }>();

  transactions.forEach((tx) => {
    const cat = (tx.spend_category || '').toUpperCase();
    if (cat !== 'SERVICES') {
      const itemKey = (tx.material_code || tx.material_desc || 'COMMODITY').trim();
      let entry = itemMap.get(itemKey);
      if (!entry) {
        entry = {
          category: tx.spend_category || 'DIRECT MATERIALS',
          item: tx.material_desc || tx.material_code || 'Commodity Material',
          plant: tx.plant || 'Main Plant',
          totalSpend: 0,
          vendors: new Set()
        };
        itemMap.set(itemKey, entry);
      }
      entry.totalSpend += tx.total_spend_inr || 0;
      if (tx.vendor_name) entry.vendors.add(tx.vendor_name);
    }
  });

  const opportunities: SavingsOpportunityItem[] = [];
  const details: EAuctionOpportunityDetails[] = [];
  let counter = 1;

  itemMap.forEach((entry, itemKey) => {
    if (
      entry.totalSpend >= STRATEGIC_SOURCING_CONSTANTS.EAUCTION_MIN_SPEND_INR &&
      entry.vendors.size >= STRATEGIC_SOURCING_CONSTANTS.EAUCTION_MIN_VENDORS
    ) {
      const savingsInr = Math.round(entry.totalSpend * STRATEGIC_SOURCING_CONSTANTS.EAUCTION_SAVINGS_RATE);
      const oppId = `OPP-STRAT-EAUCT-${String(counter++).padStart(3, '0')}`;

      details.push({
        category: entry.category,
        material_desc: entry.item,
        spend_inr: Math.round(entry.totalSpend),
        vendor_count: entry.vendors.size,
        suitability_score: Math.min(95, 70 + entry.vendors.size * 5),
        market_availability: 'HIGH',
        price_transparency: 'HIGH',
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000
      });

      opportunities.push({
        opportunity_id: oppId,
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'E_AUCTION',
        category: entry.category,
        item: itemKey,
        vendor: Array.from(entry.vendors)[0] || 'Market Suppliers',
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
        timeline: '45 Days',
        validation_notes: `Conduct English Reverse Auction across ${entry.vendors.size} qualified vendors`,
        created_at: new Date().toISOString()
      });
    }
  });

  return { opportunities, details };
}

export function runRateContracts(transactions: StrategicInputTransaction[]): {
  opportunities: SavingsOpportunityItem[];
  details: RateContractOpportunityDetails[];
} {
  const itemMap = new Map<string, {
    category: string;
    item: string;
    vendor: string;
    plant: string;
    totalSpend: number;
    poDates: string[];
  }>();

  transactions.forEach((tx) => {
    const key = (tx.material_code || tx.material_desc || 'RECURRING_ITEM').trim();
    let entry = itemMap.get(key);
    if (!entry) {
      entry = {
        category: tx.spend_category || 'MRO',
        item: tx.material_desc || tx.material_code || 'Standard Material',
        vendor: tx.vendor_name || 'Vendor',
        plant: tx.plant || 'Main Plant',
        totalSpend: 0,
        poDates: []
      };
      itemMap.set(key, entry);
    }
    entry.totalSpend += tx.total_spend_inr || 0;
    if (tx.po_date) entry.poDates.push(tx.po_date);
  });

  const opportunities: SavingsOpportunityItem[] = [];
  const details: RateContractOpportunityDetails[] = [];
  let counter = 1;

  itemMap.forEach((entry, itemKey) => {
    if (entry.poDates.length >= STRATEGIC_SOURCING_CONSTANTS.RATE_CONTRACT_MIN_RECURRING_POS) {
      const savingsInr = Math.round(entry.totalSpend * STRATEGIC_SOURCING_CONSTANTS.RATE_CONTRACT_SAVINGS_RATE);
      const oppId = `OPP-STRAT-RATE-${String(counter++).padStart(3, '0')}`;

      details.push({
        material_desc: entry.item,
        recurring_po_count: entry.poDates.length,
        annual_spend_inr: Math.round(entry.totalSpend),
        purchase_frequency: entry.poDates.length > 12 ? 'WEEKLY' : 'MONTHLY',
        recommended_contract_type: 'Annual Rate Contract',
        potential_savings_inr: savingsInr,
        potential_savings_inr_cr: Math.round((savingsInr / 10000000) * 1000) / 1000
      });

      opportunities.push({
        opportunity_id: oppId,
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'RATE_CONTRACT',
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
        status: 'IDENTIFIED',
        owner: 'SCM',
        timeline: '90 Days',
        validation_notes: 'Establish 12-month Annual Rate Contract with price lock',
        created_at: new Date().toISOString()
      });
    }
  });

  return { opportunities, details };
}
