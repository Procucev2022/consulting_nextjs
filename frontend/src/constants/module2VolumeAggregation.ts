/**
 * Module 2 — Lever 4: Volume Aggregation Frontend Constants
 * Compliant with Rule 7, 8, 9, max 300 lines, line length <= 120 chars
 */

export const VOLUME_AGGREGATION_OPPORTUNITY_TIERS = {
  TIER_1_IDENTICAL: 'TIER_1_IDENTICAL',
  TIER_2_COMPARABLE: 'TIER_2_COMPARABLE',
  TIER_3_CATEGORY: 'TIER_3_CATEGORY'
} as const;

export const VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS = {
  RECURRING: 'RECURRING',
  PERIODIC_SEASONAL: 'PERIODIC_SEASONAL',
  ONE_TIME_PROJECT: 'ONE_TIME_PROJECT',
  INSUFFICIENT_HISTORY: 'INSUFFICIENT_HISTORY'
} as const;

export const VOLUME_AGGREGATION_STATUSES = {
  CANDIDATE_IDENTIFIED: 'Candidate Identified',
  FURTHER_DATA_REQUIRED: 'Further Data Required',
  TECHNICAL_VALIDATION_REQUIRED: 'Technical Validation Required',
  COMMERCIAL_EVALUATION_REQUIRED: 'Commercial Evaluation Required',
  READY_FOR_SOURCING_REVIEW: 'Ready for Sourcing Review',
  APPROVED_FOR_EXECUTION: 'Approved for Execution',
  COMPLETED_BENEFIT_PENDING: 'Completed — Benefit Pending Validation',
  SAVINGS_VALIDATED: 'Savings Validated',
  NOT_SUITABLE: 'Not Suitable'
} as const;

export const VOLUME_AGGREGATION_ELIGIBILITY_TYPES = {
  MULTI_FACILITY_POOLING: 'MULTI_FACILITY_POOLING',
  MULTI_VENDOR_ALLOCATION: 'MULTI_VENDOR_ALLOCATION',
  TEMPORAL_LOT_CONSOLIDATION: 'TEMPORAL_LOT_CONSOLIDATION',
  LIMITED_HISTORY_NO_HISTORICAL_PATTERN: 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN',
  SINGLE_PURCHASE_NON_AGGREGATABLE: 'SINGLE_PURCHASE_NON_AGGREGATABLE',
  INCOMPATIBLE_UOM: 'INCOMPATIBLE_UOM'
} as const;

export const VOLUME_AGGREGATION_UI_STRINGS = {
  TITLE: 'Lever 4: Volume Aggregation',
  SUBTITLE:
    'Consolidates multi-facility demand into institutional procurement lots while segregating physical lots from commercial category negotiations.',
  TAB_OVERVIEW: 'Opportunity Overview',
  TAB_PLANTS: 'Plant Analysis',
  TAB_MATERIALS: 'Material Analysis',
  TAB_TRANSACTIONS: 'Purchase Transactions',
  TAB_PO_CONSOLIDATION: 'PO Consolidation Cadence',
  PO_CONSOLIDATION_SIGNAL_NOTE:
    'PO consolidation is an operational cadence signal for batch lot sizing and administrative efficiency. It is not an automatic monetary saving until vendor volume scale contracts are executed.',
  KPI_TOTAL_INCURRED_SPEND: 'Total Historical Incurred Spend',
  KPI_POTENTIALLY_AGGREGATABLE: 'Potentially Aggregatable Spend',
  KPI_UOM_COMPATIBLE: 'UOM-Compatible Expenditure',
  KPI_GENUINE_OPPORTUNITIES: 'Genuine Aggregation Opportunities',
  KPI_EXCLUDED_PHYSICAL: 'Excluded Physical Quantities (Ambiguous UOM)',
  KPI_TIER1_IDENTICAL: 'Tier 1 Identical Materials',
  KPI_TIER2_COMPARABLE: 'Tier 2 Comparable Materials',
  KPI_TIER3_CATEGORY: 'Tier 3 Category Umbrella Sourcing',
  KPI_LIMITED_HISTORY: 'Limited History Records (Review Required)',
  KPI_SAVINGS_STATUS: 'Commercial Savings Status',
  SAVINGS_STATUS_VALUE: 'NOT YET QUANTIFIABLE',
  SAVINGS_STATUS_SUB: 'Pending negotiated volume rebate contracts',
  EXPORT_BUTTON: 'Download 8-Sheet Auditable Excel Report',
  FILTER_ALL: 'All Tiers',
  SEARCH_PLACEHOLDER: 'Search by material code, description, category, or plant...',
  EMPTY_RESULTS: 'No aggregation records matching the specified criteria.',
  LOADING_TEXT: 'Analyzing multi-plant purchase history and demand recurrence...'
} as const;

