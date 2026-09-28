/**
 * PCBI Module 3 — Production Pilot Activation & Dynamic PCBI Library Constants (V1.7)
 */

export const PRODUCTION_PILOT_STATUS = 'PRODUCTION_PILOT_READY' as const;

export const HIGH_IMPACT_SPEND_THRESHOLD = 10000000; // ₹1.0000 Cr

export const PCBI_PRODUCTION_PILOT_BASE_PERIOD = '2020-04' as const;
export const PCBI_PRODUCTION_PILOT_BASE_INDEX = 100.0;

export const PRODUCTION_PILOT_GOVERNANCE_LOCKS = {
  MODULE1_FROZEN: true,
  MODULE2_FROZEN: true,
  PCBI_MASTER_IMMUTABLE: true,
  MODULE4_DISCONNECTED: true,
  SAVINGS_CALCULATED: 0,
  COMMERCIAL_PURCHASES: 0
} as const;

export const DATA_CONSISTENCY_BASELINE = {
  CUSTOMER_COMMODITY_COUNT: 13,
  MATERIAL_COMMODITY_COUNT: 12,
  EXCLUDED_SERVICE_COUNT: 1,
  PCBI_CATALOG_BASELINE_COUNT: 290,
  PRODUCTION_READY_COUNT: 6,
  RESEARCH_QUEUE_COUNT: 6,
  PARTIAL_HISTORY_COUNT: 2,
  NO_HISTORY_COUNT: 2,
  TOTAL_CUSTOMER_SPEND: 86317055,
  SPEND_COVERED: 32120405,
  SPEND_GAP: 38459325,
  SPEND_EXCLUDED: 15737325
} as const;

export const ACCEPTANCE_TEST_24_DEFINITIONS = [
  { testNumber: 1, testId: 'TEST_01', name: 'Existing valid PCBI calculates' },
  { testNumber: 2, testId: 'TEST_02', name: 'Missing PCBI creates gap' },
  { testNumber: 3, testId: 'TEST_03', name: 'Admin creates new PCBI' },
  { testNumber: 4, testId: 'TEST_04', name: 'Admin uploads XLSX' },
  { testNumber: 5, testId: 'TEST_05', name: 'Admin uploads PDF' },
  { testNumber: 6, testId: 'TEST_06', name: 'Admin uploads CSV' },
  { testNumber: 7, testId: 'TEST_07', name: 'Admin manually maps ambiguous columns' },
  { testNumber: 8, testId: 'TEST_08', name: 'Admin adds historical observations' },
  { testNumber: 9, testId: 'TEST_09', name: 'Duplicate observation detected' },
  { testNumber: 10, testId: 'TEST_10', name: 'Partial history remains blocked' },
  { testNumber: 11, testId: 'TEST_11', name: 'Frequency mismatch remains blocked' },
  { testNumber: 12, testId: 'TEST_12', name: 'Specification mismatch remains blocked' },
  { testNumber: 13, testId: 'TEST_13', name: 'Admin approves methodology' },
  { testNumber: 14, testId: 'TEST_14', name: 'Admin approves PCBI' },
  { testNumber: 15, testId: 'TEST_15', name: 'Affected commodity recalculates only' },
  { testNumber: 16, testId: 'TEST_16', name: 'Other commodities remain unaffected' },
  { testNumber: 17, testId: 'TEST_17', name: 'New source can be added' },
  { testNumber: 18, testId: 'TEST_18', name: 'Existing history remains immutable' },
  { testNumber: 19, testId: 'TEST_19', name: 'Module 1 unchanged' },
  { testNumber: 20, testId: 'TEST_20', name: 'Module 2 unchanged' },
  { testNumber: 21, testId: 'TEST_21', name: 'Module 4 remains disconnected' },
  { testNumber: 22, testId: 'TEST_22', name: 'Savings remains ZERO' },
  { testNumber: 23, testId: 'TEST_23', name: 'New commodity can be added without code deployment' },
  { testNumber: 24, testId: 'TEST_24', name: 'Research queue automatically reprioritizes' }
] as const;
