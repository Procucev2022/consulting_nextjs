import { z } from 'zod';

export const MODULE2_D1_PROJECTION =
  'transaction_id AS id, po_number, po_line, ' +
  "COALESCE(json_extract(raw_json, '$.transactionDate'), document_date_raw) AS po_date, supplier_code AS vendor_code, " +
  'supplier_name AS vendor_name, material_code, short_text AS material_desc, order_quantity AS quantity, ' +
  "order_unit AS uom, COALESCE(json_extract(raw_json, '$.inrUnitPrice'), net_price) AS unit_price, " +
  "COALESCE(json_extract(raw_json, '$.lineSpendInr'), total_inr_raw) AS total_spend_inr, currency, plant, " +
  "material_group AS spend_category, COALESCE(json_extract(raw_json, '$.unspscCode'), " +
  "json_extract(raw_json, '$.unspsc_code')) AS unspsc_code, " +
  "COALESCE(json_extract(raw_json, '$.unspscCategory'), " +
  "json_extract(raw_json, '$.unspsc_category_name')) AS unspsc_category";

export const MODULE2_D1_VALID_TRANSACTION_FILTER =
  "COALESCE(json_extract(raw_json, '$.inclusionStatus'), 'VALID') = 'VALID'";

export const module2D1TransactionSchema = z.object({
  id: z.string(), vendor_name: z.string(), material_desc: z.string(),
  quantity: z.coerce.number(), unit_price: z.coerce.number(), total_spend_inr: z.coerce.number(),
  po_number: z.string().nullish(), po_line: z.union([z.string(), z.number()]).nullish(),
  po_date: z.string().nullish(), vendor_code: z.string().nullish(), material_code: z.string().nullish(),
  uom: z.string().nullish(), currency: z.string().nullish(), plant: z.string().nullish(),
  spend_category: z.string().nullish(), unspsc_code: z.string().nullish(), unspsc_category: z.string().nullish()
});

export const MODULE2_D1_SCOPED_MESSAGES = {
  unavailable: 'This detailed sourcing endpoint has no persisted assessment result in D1. Use the assessment dashboard, category profiles, suppliers, opportunities, or handoff results.',
  unknownRoute: 'This assessment-scoped sourcing endpoint does not exist. Refresh the sourcing workspace and select a supported action.',
  missingCategory: 'The selected category is absent from this assessment. Refresh its category list and select a category from that assessment.',
  scopeRequired: 'Select an assessment before requesting this analysis. No unscoped or cross-assessment data was returned.',
  invalidEAuctionFilter: 'E-auction filters are invalid. Choose a valid financial year, category, material code, and suitability.',
  invalidDirectPriceFilter: 'Price comparison filters are invalid. Choose a valid financial year, category, and material code.',
  invalidVendorConsolidationFilter: 'Vendor consolidation filters are invalid. Choose a category, supported status, material code, or supplier code within the accepted lengths.',
  invalidAlternateSourcingFilter: 'Alternate sourcing filters are invalid. Choose an available state or city and a supported match type.'
} as const;

export const MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS = {
  ACTION: 'assessment.material-mappings.read',
  MESSAGE: 'Invalid assessment material mappings were omitted from the D1 response',
  FALLBACK: 'omit-invalid-mappings',
  MAX_SAMPLE_SOURCE_IDS: 20,
  INVALID_SCHEMA_ERROR: 'Stored material mapping failed schema validation',
  SOURCE_ID_MISMATCH_ERROR: 'Stored material mapping does not match its persisted source id'
} as const;

export const MODULE2_D1_PENDING_ROUTES: ReadonlySet<string> = new Set<string>();

export const MODULE2_D1_ROUTE_MESSAGES = {
  pending: 'This sourcing action or export has not been migrated to the D1 Worker. No changes or export files were created.',
  method: 'This sourcing endpoint supports GET only. No sourcing data was changed.',
  unknown: 'This sourcing endpoint does not exist. Refresh the sourcing workspace and select a supported action.',
  handoffScope: 'Select an assessment before requesting its sourcing handoff. No global handoff result is persisted in D1.',
  invalidSpecificationReview: 'The specification review is incomplete or invalid. Correct the listed fields and retry.',
  specificationCandidateNotFound: 'The candidate is not present in the selected D1 assessment. Refresh the assessment and retry.',
  specificationReviewSaved: 'Technical review saved to the selected assessment.',
  invalidMaterialMapping: 'The material mapping is incomplete or invalid. Enter a valid 8-digit UNSPSC commodity code.',
  materialMappingTargetNotFound: 'The material is not present in the selected D1 assessment. Refresh the mapping queue and retry.',
  materialMappingTaxonomyNotFound: 'That UNSPSC commodity code is not in the D1 taxonomy. Select a code from the taxonomy and retry.',
  materialMappingSaved: 'Material classification saved to the selected assessment.',
  invalidComplianceReview: 'The compliance review is invalid. Add a clear justification and provide a dismissal reason when dismissing an exception.',
  complianceExceptionNotFound: 'The exception is not present in the selected D1 assessment. Refresh the assessment and retry.',
  complianceReviewSaved: 'Procurement compliance review saved to the selected assessment.',
  complianceScopeRequired: 'Select an assessment to review its procurement compliance evidence.',
  invalidEAuctionPlanningAssumption: 'The e-auction planning assumption is invalid. Check its category, rate range, evidence source, and approval details.',
  eAuctionPlanningAssumptionSaved: 'The e-auction planning assumption was saved to D1. It remains planning-only until commercial execution is verified.',
  eAuctionPlanningAssumptionAdminOnly: 'Only an authenticated administrator can change e-auction planning assumptions.',
  eAuctionPlanningAssumptionMethod: 'This planning-assumption endpoint supports GET and PUT only.',
  postRequired: 'This sourcing workflow requires POST. No data was changed.'
} as const;

export const MODULE2_D1_PROFILE_DETAIL_FIELDS = [
  'transactionEvidenceRecords', 'exclusionLedger', 'evidenceBackedStatistics', 'pairwisePriceProofs',
  'evidenceChain', 'completeCalculationTrace', 'specialistAlignments', 'items',
  'commercialExcellence', 'procurementMaturity', 'twoDimensionalAssessments', 'waterfallV2'
] as const;

export const MODULE2_D1_PROFILE_LIST_BUDGET_BYTES = 5000000;

export const MODULE2_D1_VOLUME = {
  INR_PER_CRORE: 10000000,
  AMOUNT_DECIMAL_PLACES: 4,
  RECURRING_MONTH_COUNT: 2,
  SINGLE_TRANSACTION_COUNT: 1,
  EXACT_MATCH_TIER: 'TIER_1_IDENTICAL',
  STATUS_REQUIRES_TECHNICAL_REVIEW: 'Technical Validation Required',
  STATUS_INSUFFICIENT_DATA: 'Further Data Required',
  STATUS_NOT_SUITABLE: 'Not Suitable',
  DISCLOSURE: 'Volume figures represent historical spend only. Physical pooling requires technical, UOM, logistics, and procurement review; no savings are estimated.'
} as const;

export const MODULE2_D1_VOLUME_EXPORT = {
  MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  FILENAME_PREFIX: 'Volume_Aggregation_',
  SHEETS: ['Coverage', 'Tier 1 Opportunities', 'Plants', 'Materials']
} as const;

export const MODULE2_D1_EAUCTION = {
  MINIMUM_SUPPLIERS: 2,
  MINIMUM_PURCHASE_ORDERS: 3,
  MINIMUM_ADDRESSABLE_SPEND_INR: 1000000,
  INR_PER_CRORE: 10000000,
  AMOUNT_DECIMAL_PLACES: 4,
  INDIAN_FINANCIAL_YEAR_START_MONTH: 4,
  UNKNOWN_FINANCIAL_YEAR: 'UNKNOWN',
  ALL_FINANCIAL_YEARS: 'ALL',
  UNMAPPED_UNSPSC_CODE: '00000000',
  UNMAPPED_UNSPSC_TITLE: 'Unclassified — UNSPSC mapping unavailable',
  CERTIFICATION_NOTICE: 'Candidate Identification Engine • Indicative Feasibility Only • NOT Commercially Validated',
  IMPORTANT_LIMITATIONS: [
    'Purchase history alone cannot prove that suppliers will participate in an e-auction.',
    'Historical price dispersion does not constitute guaranteed or commercial savings.',
    'Quantified savings remain at ₹0.00 until an actual auction event is executed and validated.',
    'Final e-auction approval requires procurement review of specifications, supplier eligibility, and commercial terms.'
  ],
  PROCUREMENT_REVIEW_REQUIREMENTS: [
    'Detailed technical specifications and tolerance comparability review',
    'Supplier qualification, manufacturing capacity, and financial solvency',
    'Supplier willingness and readiness for dynamic digital bidding',
    'Commercial terms, payment cycles, and incoterms standardization',
    'Plant-specific delivery schedules, freight terms, and storage constraints',
    'Statutory, taxation, ESG, and compliance clearance'
  ],
  SUITABILITY: {
    CANDIDATE: 'Candidate for Review',
    MORE_DATA: 'Further Data Required',
    NOT_SUITABLE: 'Not Currently Suitable'
  },
  UNSPSC_UNAVAILABLE_REASON: 'No assessment-linked UNSPSC mapping is available in the transaction evidence.',
  MISSING_IDENTITY_REASON: 'Material code or purchase unit is missing; comparable auction lots cannot be confirmed.',
  THRESHOLD_REASON: 'Historical supplier, purchase-order, or spend evidence does not meet the candidate screening threshold.',
  CANDIDATE_REASON: 'Historical transaction evidence meets the configured screen; specifications and supplier readiness need review.',
  MISSING_DATA_LIMITATION: 'Material identity or unit-of-measure data is incomplete; suitability cannot be established.',
  HISTORICAL_ONLY_LIMITATION: 'This is historical addressable spend, not a forecast, commitment, or realized saving.',
  PRICE_RANGE_LABEL: 'Historical observed unit-price range; it is not a market benchmark.',
  CATEGORY_MISSING_DATA: 'One or more material groups need identity or unit-of-measure review.',
  CATEGORY_NO_CANDIDATES: 'No material group in this category meets the candidate screening thresholds.',
  CATEGORY_CANDIDATE: 'At least one material group meets the historical candidate screen and requires procurement review.',
  FILTER_ALL: 'ALL',
  UNKNOWN_VALUE: 'Unavailable',
  MULTIPLE_UOMS: 'Multiple units',
  UNCLASSIFIED_CATEGORY: 'Unclassified',
  PRICE_NOT_AVAILABLE: 'Historical unit price is unavailable for the selected transactions.',
  EXPORT: {
    MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FILENAME_PREFIX: 'EAuction_Candidates_',
    SHEETS: ['Summary', 'Categories', 'Materials', 'Limitations', 'Planning Assumptions']
  }
} as const;

export const MODULE2_D1_DIRECT_PRICE = {
  INR_PER_CRORE: 10000000,
  AMOUNT_DECIMAL_PLACES: 4,
  ALL_FINANCIAL_YEARS: 'ALL',
  UNKNOWN_FINANCIAL_YEAR: 'UNKNOWN',
  UNKNOWN_VALUE: 'Unavailable',
  UNMAPPED_UNSPSC_CODE: '00000000',
  UNMAPPED_UNSPSC_TITLE: 'Unclassified — UNSPSC mapping unavailable',
  CERTIFICATION_NOTICE: 'Historical price comparison • Diagnostic only • No realized savings asserted',
  REVIEW_WARNING: 'Historical price differences are diagnostic only and are not forecast or realized savings.',
  MISSING_COMPARABILITY_WARNING: 'Material identity, description, unit, or quantity evidence is incomplete; price comparability needs review.',
  SINGLE_SUPPLIER_WARNING: 'Only one supplier is observed for this material group; supplier competition is not evidenced.',
  UNIFORM_PRICE_WARNING: 'Observed INR-per-unit prices are uniform; no historical price difference is identified.',
  CATEGORY_COMPARABLE: 'Comparable historical transaction groups are available for review.',
  CATEGORY_REVIEW: 'One or more groups need material or supplier evidence review before comparison.',
  CATEGORY_NO_COMPARISON: 'No qualified historical price comparison is available for this category.',
  DATA_QUALITY_REVIEW: 'REVIEW_REQUIRED',
  DATA_QUALITY_COMPARABLE: 'COMPARABLE_HISTORY',
  EXPORT: {
    MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FILENAME_PREFIX: 'Direct_Price_History_',
    SHEETS: ['Summary', 'Categories', 'Materials', 'Transactions']
  }
} as const;
