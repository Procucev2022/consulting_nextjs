/**
 * Module 2 Ten Strategic Sourcing Levers Constants
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type {
  StrategicSourcingLeverType,
  LeverEvaluationModelConfig
} from '../types/module2AttributionLevers';

export const TEN_STRATEGIC_SOURCING_LEVERS: Record<StrategicSourcingLeverType, string> = {
  DIRECT_PRICE_IMPROVEMENT: 'Direct Price Improvement',
  E_AUCTION: 'E-Auction / Dynamic Bidding',
  VENDOR_CONSOLIDATION: 'Vendor Base Consolidation',
  VOLUME_AGGREGATION: 'Volume Aggregation',
  PAYMENT_TERMS_OPTIMISATION: 'Payment Terms Optimisation',
  CATEGORY_SPECIALISATION: 'Category Specialisation',
  LOGISTICS_PACKAGING: 'Logistics & Packaging Specifications',
  SPECIFICATION_RATIONALISATION: 'Specification Rationalisation',
  CONTRACT_COMPLIANCE_AUDIT: 'Contract Compliance Audit',
  NEW_VENDOR_DEVELOPMENT: 'New-Vendor Development & Alternate Sourcing'
};

export const LEVER_PRIORITY_ORDER: StrategicSourcingLeverType[] = [
  'DIRECT_PRICE_IMPROVEMENT',
  'CONTRACT_COMPLIANCE_AUDIT',
  'VENDOR_CONSOLIDATION',
  'VOLUME_AGGREGATION',
  'PAYMENT_TERMS_OPTIMISATION',
  'E_AUCTION',
  'SPECIFICATION_RATIONALISATION',
  'CATEGORY_SPECIALISATION',
  'LOGISTICS_PACKAGING',
  'NEW_VENDOR_DEVELOPMENT'
];

export const LEVER_PRIORITY_SCORES: Record<StrategicSourcingLeverType, number> = {
  DIRECT_PRICE_IMPROVEMENT: 1000,
  CONTRACT_COMPLIANCE_AUDIT: 900,
  VENDOR_CONSOLIDATION: 800,
  VOLUME_AGGREGATION: 700,
  PAYMENT_TERMS_OPTIMISATION: 600,
  E_AUCTION: 500,
  SPECIFICATION_RATIONALISATION: 400,
  CATEGORY_SPECIALISATION: 300,
  LOGISTICS_PACKAGING: 200,
  NEW_VENDOR_DEVELOPMENT: 100
};

export const LEVER_UNQUANTIFIED_REASONS = {
  MISSING_BID_EVIDENCE: 'MISSING_BID_EVIDENCE',
  MISSING_PAYMENT_TERMS_DATA: 'MISSING_PAYMENT_TERMS_DATA',
  MISSING_TREASURY_FINANCE_RATE: 'MISSING_TREASURY_FINANCE_RATE',
  MISSING_VOLUME_TIER_AGREEMENT: 'MISSING_VOLUME_TIER_AGREEMENT',
  MISSING_FREIGHT_COST_DATA: 'MISSING_FREIGHT_COST_DATA',
  MISSING_PACKAGING_DATA: 'MISSING_PACKAGING_DATA',
  MISSING_SPECIFICATION_EQUIVALENCE: 'MISSING_SPECIFICATION_EQUIVALENCE',
  MISSING_CONTRACT_RATE_CARD: 'MISSING_CONTRACT_RATE_CARD',
  MISSING_ALTERNATE_VENDOR_DATA: 'MISSING_ALTERNATE_VENDOR_DATA',
  MISSING_SPECIALIST_CHARTER: 'MISSING_SPECIALIST_CHARTER',
  SUPPLIER_CAPACITY_UNVERIFIED: 'SUPPLIER_CAPACITY_UNVERIFIED',
  SUPPLY_CONTINUITY_RISK: 'SUPPLY_CONTINUITY_RISK',
  MISSING_SUPPLIER_CAPACITY: 'MISSING_SUPPLIER_CAPACITY',
  UNVERIFIED_PRICE_VARIANCE: 'UNVERIFIED_PRICE_VARIANCE',
  SUSPICIOUS_COMMODITY_UOM: 'SUSPICIOUS_COMMODITY_UOM',
  COMMODITY_SPECIFICATION_UNVERIFIED: 'COMMODITY_SPECIFICATION_UNVERIFIED',
  UNVERIFIED_SPECIFICATION_EQUIVALENCE: 'UNVERIFIED_SPECIFICATION_EQUIVALENCE',
  SUSPECTED_SPECIFICATION_MISMATCH: 'SUSPECTED_SPECIFICATION_MISMATCH'
} as const;

export const LEVER_EVALUATION_CONFIGS: Record<StrategicSourcingLeverType, LeverEvaluationModelConfig> = {
  DIRECT_PRICE_IMPROVEMENT: {
    lever: 'DIRECT_PRICE_IMPROVEMENT',
    leverCode: 'LEV-01',
    leverName: 'Direct Price Improvement',
    requiredTransactionFields: ['material_code', 'uom', 'currency', 'unit_price', 'quantity', 'po_date'],
    requiredSupplierFields: ['vendor_code', 'vendor_name'],
    evidenceRequiredForQuantification: ['Identical clean material code', 'Identical UOM', 'Matching currency', 'Temporal proximity <= 90 days', 'Volume parity <= 3.0x'],
    preconditionsForCommercialValidation: ['Supplier quote verification', 'Contractual price commitment']
  },
  E_AUCTION: {
    lever: 'E_AUCTION',
    leverCode: 'LEV-02',
    leverName: 'E-Auction / Dynamic Bidding',
    requiredTransactionFields: ['material_code', 'spend_category', 'total_spend_inr'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Multiple active suppliers (>= 2)', 'Sufficient category liquidity', 'Executed reverse auction bid sheets'],
    preconditionsForCommercialValidation: ['Supplier auction participation confirmation', 'Actual supplier dynamic bid records']
  },
  VENDOR_CONSOLIDATION: {
    lever: 'VENDOR_CONSOLIDATION',
    leverCode: 'LEV-03',
    leverName: 'Vendor Base Consolidation',
    requiredTransactionFields: ['material_code', 'unit_price', 'quantity', 'po_date'],
    requiredSupplierFields: ['vendor_code', 'vendor_name'],
    evidenceRequiredForQuantification: ['Multiple suppliers in same material/category (>= 2)', 'Verified lower unit price', 'Temporal window <= 90 days', 'Volume parity <= 3.0x'],
    preconditionsForCommercialValidation: ['Target supplier capacity audit', 'Supply continuity approval', 'Quality certification']
  },
  VOLUME_AGGREGATION: {
    lever: 'VOLUME_AGGREGATION',
    leverCode: 'LEV-04',
    leverName: 'Volume Aggregation',
    requiredTransactionFields: ['material_code', 'quantity', 'plant', 'po_date'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Multiple fragmented orders across plants or dates', 'Compatible specifications', 'Agreed volume tier discount matrix'],
    preconditionsForCommercialValidation: ['Demand schedule consolidation', 'Signed master purchase agreement with volume tiers']
  },
  PAYMENT_TERMS_OPTIMISATION: {
    lever: 'PAYMENT_TERMS_OPTIMISATION',
    leverCode: 'LEV-05',
    leverName: 'Payment Terms Optimisation',
    requiredTransactionFields: ['total_spend_inr', 'payment_terms', 'po_date'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Actual contracted baseline payment days', 'Target industry standard payment days', 'Approved treasury cost of capital rate'],
    preconditionsForCommercialValidation: ['Treasury working capital approval', 'Supplier formal acceptance of extended credit terms']
  },
  CATEGORY_SPECIALISATION: {
    lever: 'CATEGORY_SPECIALISATION',
    leverCode: 'LEV-06',
    leverName: 'Category Specialisation',
    requiredTransactionFields: ['spend_category', 'total_spend_inr'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Spend categorized into non-core or fragmented buckets', 'Approved specialist category sourcing framework'],
    preconditionsForCommercialValidation: ['Category specialist management charter', 'Market-tested specialist RFP quotes']
  },
  LOGISTICS_PACKAGING: {
    lever: 'LOGISTICS_PACKAGING',
    leverCode: 'LEV-07',
    leverName: 'Logistics & Packaging Specifications',
    requiredTransactionFields: ['material_code', 'plant', 'quantity', 'freight_terms', 'packaging_type'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Verified freight cost breakdown', 'Standardized packaging specification', 'Incoterms parity'],
    preconditionsForCommercialValidation: ['Packaging engineering validation', 'Logistics route optimization contract']
  },
  SPECIFICATION_RATIONALISATION: {
    lever: 'SPECIFICATION_RATIONALISATION',
    leverCode: 'LEV-08',
    leverName: 'Specification Rationalisation',
    requiredTransactionFields: ['material_code', 'material_desc', 'uom', 'unit_price'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Multiple SKUs with minor dimensional/grade variations', 'Standardized target technical specification'],
    preconditionsForCommercialValidation: ['Plant technical equivalence clearance', 'Engineering change notice (ECN) sign-off']
  },
  CONTRACT_COMPLIANCE_AUDIT: {
    lever: 'CONTRACT_COMPLIANCE_AUDIT',
    leverCode: 'LEV-09',
    leverName: 'Contract Compliance Audit',
    requiredTransactionFields: ['po_number', 'contract_reference', 'unit_price', 'po_date'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Active master contract pricing schedule', 'Invoice/PO rate exceeding contracted schedule rate'],
    preconditionsForCommercialValidation: ['Executed master service agreement / rate card copy', 'Legal/procurement dispute claim confirmation']
  },
  NEW_VENDOR_DEVELOPMENT: {
    lever: 'NEW_VENDOR_DEVELOPMENT',
    leverCode: 'LEV-10',
    leverName: 'New-Vendor Development & Alternate Sourcing',
    requiredTransactionFields: ['material_code', 'spend_category', 'total_spend_inr'],
    requiredSupplierFields: ['vendor_code'],
    evidenceRequiredForQuantification: ['Monopoly or duopoly supply base', 'Audited alternate vendor cost model or make-vs-buy analysis'],
    preconditionsForCommercialValidation: ['Alternate supplier plant audit', 'Pilot batch quality and lab testing approval']
  }
};
