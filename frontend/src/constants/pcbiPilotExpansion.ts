/**
 * PCBI Module 3 — Controlled Pilot Finalization & Dynamic Commodity Expansion Constants (V1.6)
 */

export const MODULE3_STATUS = 'PRODUCTION_READY_FOR_CONTROLLED_PILOT' as const;

export const PCBI_PILOT_BASE_PERIOD = '2020-04' as const;
export const PCBI_PILOT_BASE_INDEX = 100.0;

export const PCBI_PILOT_SUPPORTED_FORMATS = ['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT'] as const;

export const PCBI_HISTORY_THRESHOLDS = {
  COMPLETE_MIN_MONTHS: 75,
  PARTIAL_MIN_MONTHS: 24,
  NO_HISTORY_MAX_MONTHS: 0
} as const;

export const PCBI_FREQUENCY_GOVERNANCE_RULES = {
  'WEEKLY_TO_WEEKLY': {
    sourceFrequency: 'WEEKLY',
    targetFrequency: 'WEEKLY',
    action: 'DIRECT',
    allowed: true,
    requiresMethodologyApproval: false
  },
  'MONTHLY_TO_MONTHLY': {
    sourceFrequency: 'MONTHLY',
    targetFrequency: 'MONTHLY',
    action: 'DIRECT',
    allowed: true,
    requiresMethodologyApproval: false
  },
  'FORTNIGHTLY_TO_WEEKLY': {
    sourceFrequency: 'FORTNIGHTLY',
    targetFrequency: 'WEEKLY',
    action: 'BLOCK',
    allowed: false,
    requiresMethodologyApproval: true,
    blockReason: 'METHODOLOGY_APPROVAL_REQUIRED: Fortnightly to Weekly interpolation lacks approved formula.'
  },
  'MONTHLY_TO_WEEKLY': {
    sourceFrequency: 'MONTHLY',
    targetFrequency: 'WEEKLY',
    action: 'BLOCK',
    allowed: false,
    requiresMethodologyApproval: true,
    blockReason: 'METHODOLOGY_APPROVAL_REQUIRED: Monthly to Weekly interpolation lacks approved formula.'
  },
  'QUARTERLY_TO_MONTHLY': {
    sourceFrequency: 'QUARTERLY',
    targetFrequency: 'MONTHLY',
    action: 'BLOCK',
    allowed: false,
    requiresMethodologyApproval: true,
    blockReason: 'METHODOLOGY_APPROVAL_REQUIRED: Quarterly to Monthly interpolation lacks approved formula.'
  }
} as const;

export const ANALYTICAL_PREVIEW_DISCLAIMER = 'ANALYTICAL PREVIEW — NOT SAVINGS' as const;

export const PILOT_GOVERNANCE_LOCKS = {
  MODULE1_FROZEN: true,
  MODULE2_FROZEN: true,
  PCBI_MASTER_IMMUTABLE: true,
  MODULE4_DISCONNECTED: true,
  SAVINGS_CALCULATED: 0,
  COMMERCIAL_PURCHASES: 0,
  ALLOW_SILENT_INTERPOLATION: false,
  ALLOW_SYNTHETIC_OBSERVATIONS: false,
  ALLOW_ARBITRARY_AVERAGING: false
} as const;

export const PRODUCT_ACCEPTANCE_TEST_DEFINITIONS = [
  { testNumber: 1, testId: 'TEST_01', name: 'Existing eligible PCBI calculates successfully' },
  { testNumber: 2, testId: 'TEST_02', name: 'Missing PCBI generates actionable gap' },
  { testNumber: 3, testId: 'TEST_03', name: 'Admin uploads XLSX' },
  { testNumber: 4, testId: 'TEST_04', name: 'Admin uploads PDF' },
  { testNumber: 5, testId: 'TEST_05', name: 'Admin uploads CSV' },
  { testNumber: 6, testId: 'TEST_06', name: 'System detects columns and frequency' },
  { testNumber: 7, testId: 'TEST_07', name: 'System blocks unapproved frequency conversion' },
  { testNumber: 8, testId: 'TEST_08', name: 'Admin approves methodology' },
  { testNumber: 9, testId: 'TEST_09', name: 'Admin approves PCBI' },
  {
    testNumber: 10,
    testId: 'TEST_10',
    name: 'Customer commodity changes: MISSING -> DEFINED -> HISTORY AVAILABLE -> PRODUCTION_READY'
  },
  { testNumber: 11, testId: 'TEST_11', name: 'New historical data can be appended' },
  { testNumber: 12, testId: 'TEST_12', name: 'Version history remains immutable' },
  { testNumber: 13, testId: 'TEST_13', name: 'Second source can be added' },
  { testNumber: 14, testId: 'TEST_14', name: 'Source provenance remains separate' },
  {
    testNumber: 15,
    testId: 'TEST_15',
    name: 'One blocked commodity does not prevent another eligible commodity from calculating'
  },
  { testNumber: 16, testId: 'TEST_16', name: 'Module 1 remains unchanged' },
  { testNumber: 17, testId: 'TEST_17', name: 'Module 2 remains unchanged' },
  { testNumber: 18, testId: 'TEST_18', name: 'Module 4 remains disconnected' },
  { testNumber: 19, testId: 'TEST_19', name: 'Savings remains ZERO' },
  { testNumber: 20, testId: 'TEST_20', name: 'Commercial purchasing remains ZERO' }
] as const;
