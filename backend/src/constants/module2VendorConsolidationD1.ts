export const MODULE2_D1_VENDOR_CONSOLIDATION = {
  LEVER_ID: 3,
  LEVER_CODE: 'LEV-03',
  LEVER_NAME: 'Vendor Base Consolidation',
  INR_PER_CRORE: 10000000,
  TAIL_SUPPLIER_SHARE_THRESHOLD_PCT: 5,
  HIGH_FRAGMENTATION_SUPPLIER_COUNT: 5,
  MEDIUM_FRAGMENTATION_SUPPLIER_COUNT: 3,
  TRANSACTION_SAMPLE_LIMIT: 500,
  UNKNOWN_VALUE: 'Unavailable',
  UNMAPPED_UNSPSC_CODE: '00000000',
  UNMAPPED_UNSPSC_TITLE: 'Unclassified — UNSPSC mapping unavailable',
  CATEGORY_CLASSIFICATION_LABELS: {
    VERIFIED_UNSPSC: 'Verified UNSPSC Category',
    PROVISIONAL_UNSPSC: 'Provisional UNSPSC Category',
    SOURCE_SPEND_CATEGORY: 'Source Spend Category (UNSPSC Unmapped)',
    UNMAPPED: 'Unclassified Category'
  },
  STATUS: {
    IDENTIFIED: 'Opportunity Identified',
    POTENTIAL: 'Potential Opportunity — Further Validation Required',
    INSUFFICIENT: 'Insufficient Data',
    NO_OPPORTUNITY: 'No Clear Opportunity Identified'
  },
  ACTIONABLE_STATUS: 'Supplier/Commercial Validation Required',
  CATEGORY_DISCLOSURE:
    'Supplier overlap identifies historical purchasing structure for review; supplier capacity, quality, specifications, and commercial terms require validation.',
  SAVINGS_DISCLOSURE:
    'Savings are not quantified. Historical spend and price variation do not establish achievable, validated, or realized savings.',
  AUDIT_NOTICE:
    'Transaction evidence is assessment-scoped D1 data. Both the report and workbook transaction tab show a capped sample; summaries use all scoped rows.',
  PRICE_SIGNAL:
    'Historical INR-per-unit variation is an investigation signal and does not prove comparable specifications or avoidable cost.',
  COMPARABLE_SIGNAL:
    'Shared UNSPSC taxonomy is a discovery signal only. No technical interchangeability or material substitution is assumed.',
  CROSS_PLANT_SIGNAL:
    'Purchases span plants; technical needs, logistics, supplier approvals, and delivery schedules require validation.',
  MAPPING_GAP:
    'No assessment-linked UNSPSC mapping is present in the D1 transaction evidence.',
  DATA_QUALITY_RULE: 'NON_NEGATIVE_FINITE_INR_SPEND',
  DATA_QUALITY_ACTION:
    'Rows with negative or non-finite normalized INR spend were excluded from totals and opportunity signals.',
  EXPORT: {
    MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FILENAME_PREFIX: 'Vendor_Consolidation_',
    SHEETS: [
      'Summary', 'Categories', 'Supplier Profiles', 'Same Material',
      'Comparable Materials', 'Cross Plant', 'Mapping Queue', 'Transaction Sample'
    ]
  }
} as const;

export const MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES = {
  IDENTIFIED_REASON:
    'The same source material code and purchase unit appear across suppliers; procurement must validate specification and supply feasibility.',
  CATEGORY_REASON:
    'Multiple suppliers are present in the category. This is a review signal, not an instruction to remove suppliers.',
  NO_CANDIDATE_REASON:
    'Assessment transaction evidence does not establish a multi-supplier consolidation candidate.',
  MAPPING_REVIEW_REASON: 'Review the source material mapping against the assessment evidence and UNSPSC taxonomy.'
} as const;
