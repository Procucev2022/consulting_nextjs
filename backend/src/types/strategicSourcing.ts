/**
 * Strategic Sourcing Engine Data Types (Module 2B - Master Product Spec Prompt 100)
 */

import type { SavingsOpportunityItem } from './savings';

export interface StrategicInputTransaction {
  id?: string;
  po_number?: string;
  po_date?: string;
  vendor_code?: string;
  vendor_name: string;
  material_code?: string;
  material_desc: string;
  quantity: number;
  uom?: string;
  unit_price: number;
  total_spend_inr: number;
  currency?: string;
  plant?: string;
  business_unit?: string;
  department?: string;
  spend_category?: string;
  unspsc_code?: string;
  unspsc_commodity?: string;
  unspsc_class?: string;
}

export interface VendorConsolidationOpportunityDetails {
  material_group: string;
  current_vendor_count: number;
  target_vendor_count: number;
  affected_spend_inr: number;
  affected_spend_inr_cr: number;
  primary_vendor: string;
  fragmented_vendors: string[];
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
  consolidation_ratio: number;
}

export interface PoConsolidationOpportunityDetails {
  vendor_name: string;
  material_desc: string;
  po_count: number;
  total_spend_inr: number;
  average_po_value_inr: number;
  small_orders_count: number;
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
}

export interface EAuctionOpportunityDetails {
  category: string;
  material_desc: string;
  spend_inr: number;
  vendor_count: number;
  suitability_score: number;
  market_availability: 'HIGH' | 'MEDIUM';
  price_transparency: 'HIGH' | 'MEDIUM';
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
}

export interface RateContractOpportunityDetails {
  material_desc: string;
  recurring_po_count: number;
  annual_spend_inr: number;
  purchase_frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  recommended_contract_type: 'Annual Rate Contract' | 'Framework Agreement' | 'Blanket PO';
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
}

export interface SpecificationRationalizationDetails {
  spec_cluster: string;
  variant_count: number;
  variant_materials: string[];
  total_spend_inr: number;
  standardized_sku_recommendation: string;
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
}

export interface DemandConsolidationDetails {
  material_desc: string;
  plants_involved: string[];
  business_units_involved: string[];
  total_spend_inr: number;
  combined_quantity: number;
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
}

export interface NewVendorDevelopmentDetails {
  material_desc: string;
  dominant_vendor: string;
  dominant_share_pct: number;
  spend_inr: number;
  risk_level: 'CRITICAL_SINGLE_SOURCE' | 'HIGH_CONCENTRATION';
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
}

export interface AlternateMaterialDetails {
  material_desc: string;
  current_spec: string;
  spend_inr: number;
  alternate_proposal: string;
  validation_status: 'OPPORTUNITY REQUIRING VALIDATION';
  technical_feasibility: 'PENDING_TECHNICAL_REVIEW';
  potential_savings_inr: number;
  potential_savings_inr_cr: number;
}

export interface StrategicSourcingResult {
  opportunities: SavingsOpportunityItem[];
  vendorConsolidationDetails: VendorConsolidationOpportunityDetails[];
  poConsolidationDetails: PoConsolidationOpportunityDetails[];
  eauctionDetails: EAuctionOpportunityDetails[];
  rateContractDetails: RateContractOpportunityDetails[];
  specificationRationalizationDetails: SpecificationRationalizationDetails[];
  demandConsolidationDetails: DemandConsolidationDetails[];
  newVendorDevelopmentDetails: NewVendorDevelopmentDetails[];
  alternateMaterialDetails: AlternateMaterialDetails[];
  summary: {
    total_strategic_opportunities_count: number;
    total_potential_savings_inr: number;
    total_potential_savings_inr_cr: number;
    spend_analyzed_inr: number;
    spend_analyzed_inr_cr: number;
  };
}
