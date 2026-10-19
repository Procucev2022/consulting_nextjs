/**
 * Module 2 — Lever 3: Vendor Base Consolidation Constants
 * Compliant with Rule 8, strict type isolation and barrel exports
 */

export const VENDOR_CONSOLIDATION_CONFIG = {
  LEVER_ID: 3,
  LEVER_CODE: 'LEV-03',
  LEVER_NAME: 'Vendor Base Consolidation',
  UNMAPPED_UNSPSC_CODE: '00000000',
  UNMAPPED_UNSPSC_TITLE: 'Unclassified — UNSPSC mapping unavailable',
  TAIL_SUPPLIER_SHARE_THRESHOLD_PCT: 5.0,
  HIGH_FRAGMENTATION_SUPPLIER_COUNT: 5,
  MEDIUM_FRAGMENTATION_SUPPLIER_COUNT: 3,
  MIN_SUPPLIERS_FOR_MULTI_SOURCING: 2,
  MIN_PLANTS_FOR_CROSS_PLANT: 2
} as const;

export const CONSOLIDATION_STATUS_LABELS = {
  OPPORTUNITY_IDENTIFIED: 'Opportunity Identified',
  POTENTIAL_OPPORTUNITY: 'Potential Opportunity — Further Validation Required',
  INSUFFICIENT_DATA: 'Insufficient Data',
  NO_CLEAR_OPPORTUNITY: 'No Clear Opportunity Identified'
} as const;

export const CATEGORY_CLASSIFICATION_LABELS = {
  VERIFIED_UNSPSC: 'Verified UNSPSC Category',
  PROVISIONAL_UNSPSC: 'Provisional UNSPSC Category',
  SOURCE_SPEND_CATEGORY: 'Source Spend Category (UNSPSC Unmapped)',
  UNMAPPED: 'Unclassified Category'
} as const;

export const VENDOR_CONSOLIDATION_DISCLOSURES = {
  SAVINGS_NOT_QUANTIFIABLE:
    'Estimated Savings: Not Yet Quantifiable. Supplier capacity, willingness to absorb volume, ' +
    'quality certification, and contractual agreements must be verified before defensible savings quantification.',
  CATEGORY_CONSOLIDATION_CANDIDATE_DISCLOSURE:
    'Category-Level Consolidation Candidate Spend: Multi-vendor categories are identified for commercial ' +
    'coordination. Spend remains unquantified to avoid overlap with same-material spend and unsupported assumptions.',
  TRANSACTION_AUDIT_TRAIL_NOTICE:
    'Forensic Audit Sample: Sheet 6 includes an illustrative 100-row sample for reconciliation verification. ' +
    'Complete transactional audit trails are available via raw export.',
  PRICE_VARIATION_SIGNAL:
    'Price variation is an investigation signal, not proof of avoidable cost or achievable savings. ' +
    'Rate disparities require commercial verification.',
  NO_INTERCHANGEABILITY_ASSUMPTION:
    'Never automatically merge material identities or assume technical interchangeability across distinct ' +
    'materials within the same UNSPSC category.',
  CROSS_PLANT_CAVEAT:
    'Do not assume that plant requirements, technical specifications, delivery lead times, or supplier ' +
    'approvals are identical across operating facilities.',
  FEASIBILITY_WARNING:
    'Purchase history alone does not establish supplier capacity, quality approval, contractual suitability, ' +
    'willingness to supply additional volumes, or operational feasibility.'
} as const;

export const METHODOLOGY_DISCLOSURES: string[] = [
  'Zero Arbitrary Savings: No arbitrary percentage reductions are applied to addressable spend.',
  'Distinct Financial Measures: Total Category Spend, Same-Material Multi-Sourcing Spend, and ' +
    'Category-Level Candidate Spend are tracked separately.',
  'Non-Overlapping Accounting: Material-level and category-level candidate pools are tracked distinctly ' +
    'to avoid double-counting.',
  'Classification Integrity: Source spend categories are explicitly distinguished from verified UNSPSC ' +
    'categories when code is 00000000.',
  'Price Dispersion Caveat: Price variation is an operational review signal, not confirmed achievable margin.',
  'Capacity Constraint Rule: Purchase history alone does not prove supplier ability to absorb reallocated volumes.',
  'Technical Interchangeability: Materials within a category are not assumed interchangeable without ' +
    'technical validation.'
];

export const DATA_QUALITY_EXCLUSION_RULES = {
  MISSING_SUPPLIER_ID: 'Missing Supplier ID or Name: Excluded from consolidation attribution',
  MISSING_MATERIAL_ID: 'Missing Material Identifier: Excluded from multi-sourcing analysis',
  MISSING_PLANT_INFO: 'Missing Plant Identifier: Excluded from cross-plant opportunity analysis'
} as const;

export const ACTIONABLE_STATUS_LABELS = {
  CANDIDATE_FOR_REVIEW: 'Candidate for Review',
  TECHNICAL_VALIDATION_REQUIRED: 'Technical Validation Required',
  COMMERCIAL_VALIDATION_REQUIRED: 'Supplier/Commercial Validation Required',
  FURTHER_DATA_REQUIRED: 'Further Data Required',
  NOT_CURRENTLY_SUITABLE: 'Not Currently Suitable',
  VALIDATED_FOR_ACTION: 'Validated for Sourcing Action'
} as const;

export const MAPPING_REVIEW_STATUS_LABELS = {
  TAXONOMY_VERIFIED: 'Taxonomy Verified',
  PROVISIONAL: 'Provisional Classification',
  AWAITING_REVIEW: 'Awaiting Review',
  CLIENT_APPROVED: 'Client-Approved Mapping',
  APPROVED: 'Taxonomy Verified'
} as const;

export const MAPPING_METHOD_LABELS = {
  EXACT_IDENTIFIER: 'Exact Identifier / Pre-Approved Register',
  MATERIAL_DESCRIPTION_MATCH: 'Deterministic UNSPSC Description Match',
  SPECIFICATION_OR_SYNONYM: 'Specification or Industry Synonym Match',
  CONTEXTUAL_HEURISTIC: 'Contextual Material Attribute Alignment',
  MANUAL_REVIEW_REQUIRED: 'Manual Engineering Review Queue'
} as const;

export const VENDOR_CONSOLIDATION_EXCEL_SHEETS = {
  EXECUTIVE_SUMMARY: '1. Executive Summary',
  UNSPSC_CATEGORY: '2. UNSPSC Category Analysis',
  SOURCE_MATERIAL_GROUP: '3. Source Material Groups',
  SUPPLIER_ANALYSIS: '4. Supplier Analysis',
  MATERIAL_OPPORTUNITIES: '5. Material Opportunities',
  CROSS_PLANT: '6. Cross-Plant Analysis',
  MAPPING_EXCEPTIONS: '7. Mapping Exceptions Queue',
  TRANSACTIONS: '8. Purchase Transactions',
  METHODOLOGY: '9. Data Quality & Method'
} as const;

