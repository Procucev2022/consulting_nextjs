export const MODULE2_D1_SPECIFICATION_RATIONALISATION = {
  INR_PER_CRORE: 10000000,
  CANDIDATE_ID_PREFIX: 'SPEC',
  CUSTOMER_UNAVAILABLE: 'Assessment customer unavailable',
  IDENTIFICATION_RATIONALE: 'Description, category, and unit match after case and whitespace normalisation. ' +
    'This is a search signal only and does not establish technical equivalence.',
  MISSING_TECHNICAL_DATA: 'Technical composition, grade, dimensions, tolerances, and approved specifications ' +
    'are not available in the D1 transaction ledger.',
  FINANCIAL_BENEFIT_STATUS: 'Not quantified. No technical equivalence or approved savings assumption is recorded.',
  NEXT_ACTION: 'A qualified technical owner must compare approved specifications before any standardisation decision.',
  METHODOLOGY_DISCLOSURES: [
    'Candidates require different material codes with matching normalised descriptions, categories, and units.',
    'Description similarity is only a retrieval aid; it is not evidence that products are interchangeable.',
    'Rows missing material code, description, category, or unit are excluded from candidate matching.',
    'Candidate spend is historical D1 spend under review and is not a savings estimate.',
    'Technical review decisions are unavailable until D1 review persistence and authenticated reviewer identity are configured.'
  ],
  FINANCIAL_DISCLAIMER: 'No savings, technical equivalence, compliance, or realised benefit is asserted. ' +
    'Historical spend is shown only to scope manual review.',
  EXPORT: {
    MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FILENAME_PREFIX: 'Specification_Rationalisation_',
    SHEETS: ['Summary', 'Candidates', 'Methodology']
  }
} as const;
