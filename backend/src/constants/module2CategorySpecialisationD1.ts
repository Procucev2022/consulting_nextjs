export const MODULE2_D1_CATEGORY_SPECIALISATION = {
  INR_PER_CRORE: 10000000,
  PRIORITY_A_SPEND_SHARE_PCT: 5,
  PRIORITY_B_SPEND_SHARE_PCT: 1,
  UNKNOWN_CUSTOMER: 'Assessment customer unavailable',
  CATEGORY_DATA_LIMITATIONS: [
    'Spend, suppliers, materials, plants, and concentration are calculated from this assessment’s D1 transaction rows.',
    'Contract coverage and operating-cost baselines are not present in the transaction ledger.',
    'No planning assumptions are configured in D1; monetary opportunity estimates are not produced.'
  ],
  PRICE_VARIATION_UNAVAILABLE: 'Comparable historical price variation is unavailable for this category.',
  CONTRACT_COVERAGE_UNAVAILABLE: 'Contract coverage is unavailable in the assessment transaction ledger.',
  PRIORITY_RATIONALE: {
    A: 'Category spend share meets the configured strategic priority threshold.',
    B: 'Category spend share meets the configured optimisation priority threshold.',
    C: 'Category spend share is below the configured optimisation priority threshold.'
  },
  APPROACH_RATIONALE: {
    DEDICATED: 'High assessment spend share suggests dedicated category ownership for review.',
    SHARED: 'Moderate assessment spend share suggests shared category management for review.',
    STANDARD: 'Current spend share supports standard procurement handling; reassess if scope changes.'
  },
  VALIDATION_STATUS: 'DATA PARTIALLY AVAILABLE',
  DISCLAIMER: 'Historical D1 transaction evidence supports category prioritisation only. No planning assumptions, forecast savings, or realized benefits are asserted.',
  EXPORT: {
    MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FILENAME_PREFIX: 'Category_Specialisation_',
    SHEETS: ['Summary', 'Categories', 'Methodology']
  }
} as const;
