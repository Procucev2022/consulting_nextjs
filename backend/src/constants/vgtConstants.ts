/**
 * Authoritative VGT Forensic Audit & Historical FX Reconciliation Constants
 * Dataset: VGT Testing Data.xlsx (SHA-256: 59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def)
 * Frozen FX Master: aiCEV_FX_Master_2020_2026_v2.xlsx
 * Master SHA-256: 7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f
 */

export const VGT_DATASET_FILENAME = 'VGT Testing Data.xlsx';
export const VGT_DATASET_SHA256 = '59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def';

export const VGT_FX_MASTER_FILENAME = 'aiCEV_FX_Master_2020_2026_v2.xlsx';
export const VGT_FX_MASTER_SHA256 = '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f';

// Exact Population Reconciliation
export const VGT_POPULATION_SOURCE_ROWS = 20505;
export const VGT_POPULATION_VALID_ROWS = 20241;
export const VGT_POPULATION_EXCLUDED_ROWS = 252;
export const VGT_POPULATION_ANOMALY_ROWS = 12;

// Preserved Customer-Profile Fixed FX Rates Baseline
export const VGT_CUSTOMER_PROFILE_FX_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 75.0,
  EUR: 85.0,
  CNY: 6.5
};

// Authoritative Financial Benchmark Spend Figures (INR)
export const VGT_VALID_HISTORICAL_FX_SPEND_INR = 40738306838.02;
export const VGT_VALID_HISTORICAL_FX_SPEND_CR = 4073.8307;

export const VGT_VALID_CUSTOMER_PROFILE_SPEND_INR = 39203277493.29; // ≈ 39,203,277,300 INR (₹3,920.3277 Cr)
export const VGT_VALID_CUSTOMER_PROFILE_SPEND_CR = 3920.3277;

export const VGT_FX_METHODOLOGY_IMPACT_INR = 1535029344.73; // ≈ 1,535,029,538.02 INR (₹153.5029 Cr)
export const VGT_FX_METHODOLOGY_IMPACT_CR = 153.5029;
export const VGT_FX_IMPACT_PERCENTAGE = 3.91;

// Raw All-Row Population Historical Figures (Before Exclusion & Anomaly Quarantine)
export const VGT_RAW_ALL_ROW_HISTORICAL_SPEND_INR = 41825301574.94;
export const VGT_RAW_ALL_ROW_HISTORICAL_SPEND_CR = 4182.5302;

export const VGT_EXCLUDED_SPEND_INR = 1090760132.81;
export const VGT_EXCLUDED_SPEND_CR = 109.076;

export const VGT_ANOMALY_SPEND_INR = -3765395.89;
export const VGT_ANOMALY_SPEND_CR = -0.3765;

// Valid Currency-Level Breakdown
export const VGT_VALID_CURRENCY_COUNTS: Record<string, number> = {
  INR: 19639,
  USD: 431,
  EUR: 4,
  CNY: 167
};

export const VGT_CURRENCY_PROFILE_SPEND_CR: Record<string, number> = {
  INR: 2275.51,
  USD: 1444.504,
  EUR: 2.414,
  CNY: 197.9
};

export const VGT_CURRENCY_HISTORICAL_SPEND_CR: Record<string, number> = {
  INR: 2275.51,
  USD: 1446.241,
  EUR: 2.444,
  CNY: 349.635
};

export const VGT_CURRENCY_FX_IMPACT_CR: Record<string, number> = {
  INR: 0.0,
  USD: 1.737,
  EUR: 0.031,
  CNY: 151.735
};

// Explanatory Information Labels
export const VGT_FX_NORMALIZATION_NOTE =
  'Spend normalized using transaction-date historical FX rates. Customer-profile fixed FX rates are retained as the baseline for comparison.';
export const VGT_FX_METHODOLOGY_IMPACT_NOTE = 'FX normalization impact vs profile rates: ₹153.50 Cr';
export const VGT_VALID_FX_NORMALIZED_SPEND_LABEL = 'VALID FX-NORMALIZED SPEND';

// Evidence Workbook Identifiers
export const VGT_EVIDENCE_WORKBOOK_FILENAME = 'MODULE_1_VGT_EVIDENCE.xlsx';
export const VGT_SHEET_11_NAME = '11_FX_ERP_FORENSIC_BRIDGE';
export const VGT_SHEET_11_CONCEPT = '11_FX_PROFILE_HISTORICAL_BRIDGE';
