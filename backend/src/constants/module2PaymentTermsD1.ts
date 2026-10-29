export const MODULE2_D1_PAYMENT_TERMS = {
  INR_PER_CRORE: 10000000,
  MODELLING_RATE_PER_30_DAYS: 0.015,
  MAX_CREDIT_DAYS: 3650,
  UNKNOWN_VALUE: 'Unavailable',
  TERM_FIELD_ALIASES: [
    'paymentterms', 'termsofpayment', 'paymentterm', 'paymenttermsdescription', 'creditdays', 'paymentdays'
  ],
  DISCOUNT_PERCENT_ALIASES: ['earlypaymentdiscountpercent', 'discountpercent', 'cashdiscountpercent'],
  DISCOUNT_DAYS_ALIASES: ['earlypaymentdiscountdays', 'discountdays', 'cashdiscountdays'],
  NON_CREDIT_TERM_PATTERN: /\b(?:ADVANCE|COD|CASH ON DELIVERY|IMMEDIATE|DUE ON RECEIPT)\b/i,
  END_OF_MONTH_PATTERN: /\b(?:EOM|END OF MONTH|MONTH END)\b/i,
  AMBIGUOUS_TERMS_PATTERN: /\b(?:OR|EITHER|WHICHEVER)\b/i,
  NET_DAYS_PATTERN: /\b(?:NET\s*|N\s*)(\d{1,4})\b/gi,
  DAY_COUNT_PATTERN: /\b(\d{1,4})\s*(?:DAYS?|D)\b/gi,
  DATA_UNAVAILABLE_STATUS: 'DATA_UNAVAILABLE',
  PARTIAL_STATUS: 'DATA_PARTIALLY_AVAILABLE',
  NOT_QUANTIFIABLE_STATUS: 'NOT_YET_QUANTIFIABLE',
  STATUS_DISPLAY_LABELS: {
    DATA_UNAVAILABLE: 'Data Unavailable — Payment Terms Not Found in Source Data',
    DATA_PARTIALLY_AVAILABLE: 'Data Partially Available',
    NOT_YET_QUANTIFIABLE: 'Not Yet Quantifiable',
    OPPORTUNITY_IDENTIFIED: 'Opportunity Identified',
    AWAITING_VALIDATION: 'Awaiting Validation'
  },
  COMPLETE_RECORD_STATUS: 'COMPLETE',
  PARTIAL_RECORD_STATUS: 'PARTIAL',
  MISSING_RECORD_STATUS: 'MISSING',
  PAYMENT_TERMS_SOURCE: 'ProcurementTransaction.raw_json payment-term fields',
  EXPORT: {
    MIME_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FILENAME_PREFIX: 'Payment_Terms_',
    SHEETS: [
      'Coverage Summary', 'Opportunities', 'Supplier Profiles', 'Transaction Coverage',
      'Payment Term Gaps', 'Verified Terms', 'Methodology', 'Reconciliation'
    ]
  }
} as const;

export const MODULE2_D1_PAYMENT_TERMS_MESSAGES = {
  MISSING_FIELD: 'No payment-terms field was found in this transaction source row.',
  INVALID_SOURCE: 'The transaction raw_json value is not valid JSON and payment terms cannot be inspected.',
  UNPARSEABLE: 'Payment-term evidence is present but does not identify one unambiguous credit-day value.',
  NO_FINANCING_BENEFIT:
    'No financing benefit is quantified because validated target terms, actual payment dates, and approval are absent.',
  SOURCE_DISCLOSURE:
    'Terms are read from assessment-linked ProcurementTransaction raw_json only; missing source values remain missing.',
  SCOPE_REQUIRED: 'An assessment scope is required to read payment-term transaction evidence.',
  BENEFIT_DISCLOSURE:
    'Working-capital release, financing benefit, and early-payment savings remain zero until source evidence and approval support calculation.'
} as const;
