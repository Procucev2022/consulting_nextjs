/**
 * PCBI Module 3 — V1.6 Productionization & Dynamic Commodity Expansion Constants (Frontend)
 */

import type { PCBIMismatchItem } from '../types/pcbiProductionReady';

export const FINAL_MODULE_3_STATUS = 'PRODUCTION_READY_DYNAMIC_PCBI' as const;

export const PCBI_PRODUCTION_READY_BASE_PERIOD = '2020-04' as const;
export const PCBI_PRODUCTION_READY_BASE_INDEX = 100.0 as const;

export const PCBI_V16_DEFAULT_MATERIALITY_THRESHOLD_INR = 10000000; // ₹1.00 Cr
export const PCBI_V16_MATERIALITY_THRESHOLD_CR = '₹1.00 Cr' as const;

export const PCBI_UNIVERSAL_FILE_FORMATS = ['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT'] as const;

export const PCBI_NATIVE_FREQUENCIES_V16 = [
  'DAILY',
  'WEEKLY',
  'FORTNIGHTLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL'
] as const;

export const PCBI_PROVENANCE_10_LINKS = [
  'LINK_01_RAW_DOWNLOAD',
  'LINK_02_ORIGINAL_CHECKSUM',
  'LINK_03_INGESTION_TIMESTAMP',
  'LINK_04_INGESTION_BATCH',
  'LINK_05_EXTRACTION_SCRIPT',
  'LINK_06_REBASE_TRANSFORMATION',
  'LINK_07_CURRENCY_CONVERSION',
  'LINK_08_UNIT_STANDARDIZATION',
  'LINK_09_VALIDATION_EVENT',
  'LINK_10_MODULE3_BENCHMARK_INPUT'
] as const;

export const PCBI_ACCEPTANCE_TESTS_A_TO_T_DEFINITIONS = [
  { testKey: 'A', name: 'Existing complete commodity' },
  { testKey: 'B', name: 'Existing partial-history commodity' },
  { testKey: 'C', name: 'Missing commodity' },
  { testKey: 'D', name: 'New commodity uploaded through Admin' },
  { testKey: 'E', name: 'New historical source uploaded' },
  { testKey: 'F', name: 'PDF source' },
  { testKey: 'G', name: 'Excel source' },
  { testKey: 'H', name: 'CSV source' },
  { testKey: 'I', name: 'Frequency mismatch' },
  { testKey: 'J', name: 'Specification mismatch' },
  { testKey: 'K', name: 'Unit mismatch' },
  { testKey: 'L', name: 'Currency mismatch' },
  { testKey: 'M', name: 'Geography mismatch' },
  { testKey: 'N', name: 'Methodology pending' },
  { testKey: 'O', name: 'Admin approval' },
  { testKey: 'P', name: 'Automatic catalog versioning' },
  { testKey: 'Q', name: 'Automatic customer re-run' },
  { testKey: 'R', name: 'Gap alert clearance' },
  { testKey: 'S', name: 'Rollback to previous PCBI version' },
  { testKey: 'T', name: 'Add second new commodity without code change' }
] as const;

export const REUSABLE_PCBI_SCALE_LIBRARIES = {
  commodities: ['HR_STEEL', 'COPPER', 'KRAFT_PAPER', 'CAUSTIC_SODA', 'TMT_REBAR', 'SS_PIPES', 'NICKEL', 'ZINC'],
  units: ['INR/MT', 'USD/MT', 'INR/KG', 'USD/KG', 'INR/LTR'],
  currencies: ['INR', 'USD', 'EUR'],
  frequencies: ['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'],
  geographies: ['INDIA_DOMESTIC', 'GLOBAL_LME', 'SE_ASIA_CFR', 'NORTH_AMERICA'],
  methodologies: [
    { id: 'METH-AVG-ARITH', name: 'Arithmetic Mean Aggregation', applicability: 'WEEKLY_TO_MONTHLY' },
    { id: 'METH-FX-RBI-REF', name: 'RBI Reference FX Rate Conversion', applicability: 'USD_TO_INR' },
    { id: 'METH-UNIT-MT-KG', name: 'Metric Ton to Kilogram Standard Factor', applicability: 'MT_TO_KG' }
  ]
} as const;

export const PCBI_INITIAL_CUSTOMER_MISMATCHES: PCBIMismatchItem[] = [
  {
    commodity: 'Ferro Molybdenum 65%',
    pcbiId: 'PCBI-IND-MET-FMO-001',
    customerSpend: 12500000,
    customerSpendCr: '₹1.25 Cr',
    transactionCount: 65,
    requiredHistory: '2020-04 to 2026-06 (75 months)',
    availableHistory: '0 months (None)',
    requiredFrequency: 'WEEKLY',
    availableFrequency: 'N/A',
    requiredUnit: 'INR/MT',
    availableUnit: 'N/A',
    requiredGeography: 'INDIA_DOMESTIC',
    availableGeography: 'N/A',
    sourceStatus: 'UNVERIFIED',
    methodologyStatus: 'PENDING',
    finalReadiness: 'BLOCKED_HIGH_IMPACT',
    adminAction: 'CREATE_PCBI / UPLOAD_DATA / SOURCE_RESEARCH',
    mismatchType: 'HISTORICAL_DATA_MISSING'
  },
  {
    commodity: 'Heavy Duty Slurry Pumps',
    pcbiId: 'PCBI-IND-EQP-SLP-001',
    customerSpend: 10320000,
    customerSpendCr: '₹1.03 Cr',
    transactionCount: 28,
    requiredHistory: '2020-04 to 2026-06 (75 months)',
    availableHistory: '0 months (None)',
    requiredFrequency: 'MONTHLY',
    availableFrequency: 'N/A',
    requiredUnit: 'INR/UNIT',
    availableUnit: 'N/A',
    requiredGeography: 'INDIA_DOMESTIC',
    availableGeography: 'N/A',
    sourceStatus: 'UNVERIFIED',
    methodologyStatus: 'PENDING',
    finalReadiness: 'BLOCKED_HIGH_IMPACT',
    adminAction: 'CREATE_PCBI / UPLOAD_DATA',
    mismatchType: 'HISTORICAL_DATA_MISSING'
  },
  {
    commodity: 'Tungsten Carbide Inserts',
    pcbiId: 'PCBI-IND-MET-TCI-001',
    customerSpend: 7680000,
    customerSpendCr: '₹0.77 Cr',
    transactionCount: 142,
    requiredHistory: '2020-04 to 2026-06 (75 months)',
    availableHistory: '2023-01 to 2026-06 (42 months)',
    requiredFrequency: 'MONTHLY',
    availableFrequency: 'MONTHLY',
    requiredUnit: 'INR/PIECE',
    availableUnit: 'INR/PIECE',
    requiredGeography: 'INDIA_DOMESTIC',
    availableGeography: 'INDIA_DOMESTIC',
    sourceStatus: 'VERIFIED',
    methodologyStatus: 'APPROVED',
    finalReadiness: 'BLOCKED_PARTIAL_HISTORY',
    adminAction: 'UPLOAD_HISTORICAL_DATA (2020-04 to 2022-12)',
    mismatchType: 'HISTORICAL_DATA_INCOMPLETE'
  },
  {
    commodity: 'HDPE Injection Molding Granules',
    pcbiId: 'PCBI-IND-PLM-HDP-001',
    customerSpend: 3040000,
    customerSpendCr: '₹0.30 Cr',
    transactionCount: 115,
    requiredHistory: '2020-04 to 2026-06 (75 months)',
    availableHistory: '2023-01 to 2026-06 (42 months)',
    requiredFrequency: 'MONTHLY',
    availableFrequency: 'MONTHLY',
    requiredUnit: 'INR/KG',
    availableUnit: 'INR/KG',
    requiredGeography: 'INDIA_DOMESTIC',
    availableGeography: 'INDIA_DOMESTIC',
    sourceStatus: 'VERIFIED',
    methodologyStatus: 'APPROVED',
    finalReadiness: 'BLOCKED_PARTIAL_HISTORY',
    adminAction: 'UPLOAD_HISTORICAL_DATA (2020-04 to 2022-12)',
    mismatchType: 'HISTORICAL_DATA_INCOMPLETE'
  },
  {
    commodity: 'Stainless Steel 304 Scrap',
    pcbiId: 'PCBI-IND-STL-SCR-001',
    customerSpend: 2980000,
    customerSpendCr: '₹0.30 Cr',
    transactionCount: 84,
    requiredHistory: '2020-04 to 2026-06 (75 months)',
    availableHistory: '2020-04 to 2026-06 (75 months)',
    requiredFrequency: 'MONTHLY',
    availableFrequency: 'MONTHLY',
    requiredUnit: 'INR/MT',
    availableUnit: 'INR/MT',
    requiredGeography: 'INDIA_DOMESTIC',
    availableGeography: 'INDIA_DOMESTIC',
    sourceStatus: 'UNVERIFIED_COMMERCIAL',
    methodologyStatus: 'APPROVED',
    finalReadiness: 'BLOCKED_SOURCE_UNVERIFIED',
    adminAction: 'VERIFY_SOURCE_CREDENTIALS / REVIEW_TERMS',
    mismatchType: 'SOURCE_UNVERIFIED'
  },
  {
    commodity: 'Industrial Hydraulic Oil ISO 68',
    pcbiId: 'PCBI-IND-LUB-HYD-001',
    customerSpend: 1939325,
    customerSpendCr: '₹0.19 Cr',
    transactionCount: 50,
    requiredHistory: '2020-04 to 2026-06 (75 months)',
    availableHistory: '2020-04 to 2026-06 (75 months)',
    requiredFrequency: 'MONTHLY',
    availableFrequency: 'MONTHLY',
    requiredUnit: 'INR/LTR',
    availableUnit: 'INR/LTR',
    requiredGeography: 'INDIA_DOMESTIC',
    availableGeography: 'INDIA_DOMESTIC',
    sourceStatus: 'VERIFIED',
    methodologyStatus: 'APPROVED',
    finalReadiness: 'BLOCKED_SPECIFICATION_MISMATCH',
    adminAction: 'MAP_GRADE_SPECIFICATION (Source is ISO 46, customer requires ISO 68)',
    mismatchType: 'SPECIFICATION_MISMATCH'
  }
];
