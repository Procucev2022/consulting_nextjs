/**
 * Module 2 — Lever 3: Vendor Base Consolidation Constants (Frontend)
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
  MEDIUM_FRAGMENTATION_SUPPLIER_COUNT: 3
} as const;

export const CONSOLIDATION_STATUS_LABELS = {
  OPPORTUNITY_IDENTIFIED: 'Opportunity Identified',
  POTENTIAL_OPPORTUNITY: 'Potential Opportunity — Further Validation Required',
  INSUFFICIENT_DATA: 'Insufficient Data',
  NO_CLEAR_OPPORTUNITY: 'No Clear Opportunity Identified'
} as const;

export const ACTIONABLE_STATUS_LABELS = {
  CANDIDATE_FOR_REVIEW: 'Candidate for Review',
  TECHNICAL_VALIDATION_REQUIRED: 'Technical Validation Required',
  SUPPLIER_COMMERCIAL_VALIDATION_REQUIRED: 'Supplier/Commercial Validation Required',
  FURTHER_DATA_REQUIRED: 'Further Data Required',
  NOT_CURRENTLY_SUITABLE: 'Not Currently Suitable',
  VALIDATED_FOR_SOURCING_ACTION: 'Validated for Sourcing Action'
} as const;

export const MAPPING_REVIEW_STATUS_LABELS = {
  TAXONOMY_VERIFIED: 'Taxonomy Verified',
  PROVISIONAL: 'Provisional Classification',
  AWAITING_REVIEW: 'Awaiting Review',
  CLIENT_APPROVED: 'Client-Approved Mapping',
  APPROVED: 'Taxonomy Verified'
} as const;

export const DIMENSION_LABELS = {
  UNSPSC: 'UNSPSC Hierarchy (Primary)',
  SOURCE_GROUP: 'Client SAP Material Groups',
  SUPPLIER: 'Supplier Analysis',
  MATERIAL: 'Material Opportunities',
  PLANT: 'Cross-Plant Analysis',
  MAPPING_QUEUE: 'Mapping Exceptions Queue'
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
    'willingness to supply additional volumes, or operational feasibility.',
  CATEGORY_CONSOLIDATION_CANDIDATE_DISCLOSURE:
    'Category-level consolidation candidates represent multi-supplier structures for strategic review, ' +
    'not verified or addressable cost savings.'
} as const;

export const VENDOR_CONSOLIDATION_UI_CONFIG = {
  ALL_FILTER_VALUE: 'ALL',
  DEFAULT_UOM: 'EA',
  DEFAULT_PO_LINE: '1',
  MAPPING_QUEUE_ROW_LIMIT: 50,
  MAPPING_UPDATE_ENDPOINT: '/api/module2/sourcing/vendor-consolidation/mappings/update',
  MAPPING_BULK_UPDATE_ENDPOINT: '/api/module2/sourcing/vendor-consolidation/mappings/bulk-update',
  MAPPING_BATCH_LIMIT: 100,
  MAPPING_APPROVAL_STATUS: 'CLIENT_APPROVED',
  MAPPING_APPROVAL_AUDIT_NOTE: 'Client approved during manual engineering review session',
  MAPPING_SUGGESTION_AUDIT_NOTE: 'Suggested by taxonomy categorization; analyst review is required.'
} as const;
