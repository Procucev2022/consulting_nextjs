/**
 * Module 2 — Opportunity Intelligence Constants & Governed Parameters (Frontend)
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type {
  CommercialDimensionKey,
  ProcurementMaturityDimensionKey,
  OpportunityEvidenceState
} from '../types/module2OpportunityIntelligence';

export const PROCUREMENT_SAFEGUARD_MESSAGES = {
  NO_MATERIAL_EVIDENCE:
    'Current available evidence does not demonstrate a material quantifiable opportunity. Market discovery is recommended where competitive validation has not recently occurred.',
  MARKET_DISCOVERY_REQUIRED:
    'Market opportunity cannot be established from internal historical transactions alone. Competitive sourcing is required to discover market price.',
  SPECIFICATION_HARMONIZATION_REQUIRED:
    'Supplier consolidation opportunity identified. Benefit not yet quantifiable until specification harmonization.',
  DATA_INSUFFICIENT:
    'Data quality or history window is insufficient for conclusive statistical modeling. Targeted data enrichment is required before commercial commitment.',
  LOW_EVIDENCED:
    'Current available evidence does not demonstrate a material opportunity. Continued monitoring and periodic market testing are recommended.'
} as const;

export const OPPORTUNITY_EVIDENCE_STATE_LABELS: Record<OpportunityEvidenceState, string> = {
  PROVEN_OPPORTUNITY: 'Proven Opportunity',
  QUANTIFIABLE_OPPORTUNITY_RANGE: 'Quantifiable Opportunity Range',
  MARKET_DISCOVERY_OPPORTUNITY: 'Market Discovery Opportunity',
  IDENTIFIED_NOT_QUANTIFIABLE: 'Opportunity Identified — Benefit Not Yet Quantifiable',
  LOW_EVIDENCED_OPPORTUNITY: 'Low Evidenced Opportunity',
  INSUFFICIENT_DATA: 'Insufficient Data'
};

export const MARKET_DISCOVERY_THRESHOLDS = {
  SINGLE_SUPPLIER_COUNT: 1,
  LOW_COMPETITION_MAX_SUPPLIERS: 2,
  HIGH_DEPENDENCY_SHARE_PCT: 70.0,
  MATERIAL_CATEGORY_SPEND_INR: 5000000,
  MIN_TRANSACTIONS_FOR_EVIDENCE: 10,
  MAX_MONTHS_WITHOUT_COMPETITION: 12
} as const;

export const COMMERCIAL_DIMENSION_LABELS: Record<CommercialDimensionKey, string> = {
  PAYMENT_TERMS: 'Payment Terms & Working Capital',
  CONTRACT_COVERAGE: 'Contract Coverage & Long-Term Agreements',
  CONTRACT_EXPIRY: 'Contract Expiry & Renewal Pipeline',
  ESCALATION_CLAUSE: 'Indexation & Price Escalation Governance',
  REBATE_STRUCTURE: 'Volume Tier Rebates & Retrospective Bonuses',
  MOQ_POLICY: 'Minimum Order Quantity & Batch Lot Sizing',
  FREIGHT_TERMS: 'Incoterms & Freight Liability (Ex-Works vs DDP)',
  WARRANTY_TERMS: 'Performance Warranty & Defect Liability',
  LEAD_TIME: 'Order-to-Delivery Lead Time Commitments',
  PRICE_REVIEW: 'Scheduled Price Revision Mechanisms',
  VOLUME_COMMITMENT: 'Committed Volume Bands vs Spot Call-Offs',
  SERVICE_LEVELS: 'SLA Commitments, Fill Rates & OTIF Targets'
};

export const PROCUREMENT_MATURITY_DIMENSION_LABELS: Record<ProcurementMaturityDimensionKey, string> = {
  PRICE_MANAGEMENT: 'Price Management & Dispersion Control',
  VOLUME_MANAGEMENT: 'Volume Aggregation & Batch Optimization',
  SUPPLIER_MANAGEMENT: 'Supplier Performance & Relationship Governance',
  CATEGORY_STRATEGY: 'Category Segmentation & Specialization',
  SPECIFICATION_MANAGEMENT: 'Specification Standardization & Clean-Sheet Alignment',
  COMPETITIVE_SOURCING: 'Competitive Events & Market Discovery Cadence',
  CONTRACT_MANAGEMENT: 'Contract Compliance & Expiry Management',
  COMMERCIAL_TERMS: 'Commercial Terms, Incoterms & Payment Alignment',
  DEMAND_MANAGEMENT: 'Demand Rationalization & Maverick Spend Control',
  DATA_QUALITY: 'Procurement Data Lineage & Specification Traceability'
};
