/**
 * Constants for Output Evidence & Validation Workbooks (Prompt 305)
 */

import type {
  EvidenceWorkbookType,
  CanonicalSavingsType,
  EvidenceInventoryItem,
  SavingsTypeEvidenceInventoryItem
} from '../types/evidenceWorkbook';

export const EVIDENCE_WORKBOOK_FILENAMES: Record<EvidenceWorkbookType, string> = {
  MODULE_1_EVIDENCE: '01_Module_1_Evidence.xlsx',
  MODULE_2_EVIDENCE: '02_Module_2_Evidence.xlsx',
  PCBI_EVIDENCE: '03_PCBI_Evidence.xlsx',
  SAVINGS_ENGINE_EVIDENCE: '04_Savings_Engine_Evidence.xlsx',
  FINANCIAL_VALIDATION: '05_Financial_Validation.xlsx',
  DATA_VERSION_DIFF: '06_Data_Version_Diff.xlsx',
  REPORT_EVIDENCE: '07_Report_Evidence.xlsx',
  MANAGEMENT_QUICK_SUMMARY_EVIDENCE: '08_Management_Quick_Summary_Evidence.xlsx',
  ANALYSIS_RUN_CONTROL: '09_Analysis_Run_Control.xlsx'
};

export const SAVINGS_TYPE_FILENAMES: Record<CanonicalSavingsType, string> = {
  VENDOR_CONSOLIDATION: '04A_Vendor_Consolidation_Evidence.xlsx',
  BENCHMARK_PRICE_GAP: '04B_Benchmark_Price_Gap_Evidence.xlsx',
  STRATEGIC_SOURCING: '04C_Strategic_Sourcing_Evidence.xlsx',
  STRATEGIC_MARKET_VALUE: '04D_Strategic_Market_Value_Evidence.xlsx',
  PROCESS_PRODUCTIVITY: '04E_Process_Productivity_Evidence.xlsx',
  COST_AVOIDANCE_RISK: '04F_Cost_Avoidance_Risk_Evidence.xlsx',
  REALIZED_SAVINGS: '04G_Realized_Savings_Evidence.xlsx'
};

export const EVIDENCE_PACKAGE_ZIP_FILENAME = 'Complete_Analysis_Evidence_Package.zip';

export const EVIDENCE_STANDARD_SHEETS = {
  README: '01_README',
  EXECUTIVE_SUMMARY: '02_EXECUTIVE_SUMMARY',
  CALCULATION_BRIDGE: '03_CALCULATION_BRIDGE',
  SUPPORTING_ANALYSIS: '04_SUPPORTING_ANALYSIS',
  SOURCE_RECORDS: '05_SOURCE_RECORDS',
  RECONCILIATION: '06_RECONCILIATION',
  ASSUMPTIONS: '07_ASSUMPTIONS',
  EXCLUSIONS: '08_EXCLUSIONS',
  AUDIT_TRAIL: '09_AUDIT_TRAIL'
} as const;

export const EVIDENCE_CERTIFIED_BENCHMARKS = {
  TOTAL_SPEND_CR: 5920.35,
  TOTAL_SPEND_INR: 59203500000,
  ANALYSIS_PERIOD: 'April 2024 – March 2026',
  TOTAL_TRANSACTIONS: 31671,
  TOTAL_SUPPLIERS: 974,
  TOTAL_CATEGORIES: 256,
  TOTAL_PLANTS: 26,
  TOTAL_POS: 15884,

  // PCBI Metrics
  PCBI_TECHNICAL_IDS_COUNT: 290,
  PCBI_ADDRESSABLE_SPEND_CR: 5524.92,
  QUARANTINED_SERVICES_SPEND_CR: 113.39,
  QUARANTINED_NON_BENCHMARKABLE_SPEND_CR: 282.05,

  // Opportunity Bridge
  GROSS_OPPORTUNITY_CR: 173.12,
  OVERLAP_DEDUCTIONS_CR: 62.80,
  EXCLUSIONS_CR: 16.72,
  NET_DEFENSIBLE_PIPELINE_CR: 93.60,
  STRATEGIC_MARKET_VALUE_CR: 14.88,
  NET_DIRECT_SAVINGS_CR: 78.72,
  MATHEMATICAL_VARIANCE_CR: 0.00,
  REALIZED_SAVINGS_CR: 68.00,
  COST_AVOIDANCE_SPEND_DERISKED_CR: 420.00,

  // Initiatives
  OPP_001_VENDOR_CONSOLIDATION_GROSS_CR: 6.17,
  OPP_001_VENDOR_CONSOLIDATION_OVERLAP_CR: 0.00,
  OPP_001_VENDOR_CONSOLIDATION_NET_CR: 6.17,

  OPP_003_PRICE_GAP_GROSS_CR: 80.67,
  OPP_003_PRICE_GAP_OVERLAP_CR: 40.20,
  OPP_003_PRICE_GAP_NET_CR: 40.47,
  OPP_003_PRICE_GAP_EXCLUSION_ADJ_CR: 29.73,

  OPP_004_STRATEGIC_SOURCING_GROSS_CR: 71.40,
  OPP_004_STRATEGIC_SOURCING_OVERLAP_CR: 22.60,
  OPP_004_STRATEGIC_SOURCING_NET_CR: 48.80,
  OPP_004_STRATEGIC_SOURCING_EXCLUSION_ADJ_CR: 42.82,

  OPP_006_STRATEGIC_MARKET_VALUE_CR: 14.88,

  // Mathematical Tolerances
  FINANCIAL_TOLERANCE_CR: 0.0001
};

export const EVIDENCE_README_MANDATORY_NOTICE =
  'This workbook provides the calculation and evidence trail supporting the corresponding aiCEV output. ' +
  'It is generated from the same backend source of truth used by the application.';

export const EVIDENCE_README_WARNING =
  'WARNING: This workbook contains proprietary evidence, validation traces, and forensic calculations. ' +
  'It is intended for independent audit and verification, not merely as a raw transactional data dump.';

export const EVIDENCE_INVENTORY: EvidenceInventoryItem[] = [
  {
    type: 'MODULE_1_EVIDENCE',
    filename: '01_Module_1_Evidence.xlsx',
    title: 'Module 1 — Spend Ingestion & Baseline Evidence',
    description: 'Detailed proof of spend concentration, supplier rankings, plant breakdowns, and source records.',
    sheetCount: 8,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'MODULE_2_EVIDENCE',
    filename: '02_Module_2_Evidence.xlsx',
    title: 'Module 2 — AI Categorization & Strategic Sourcing Evidence',
    description: 'UNSPSC confidence, spend by category, sourcing lever assignments, and opportunity indicators.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'PCBI_EVIDENCE',
    filename: '03_PCBI_Evidence.xlsx',
    title: 'Module 3 — PCBI & Commodity Benchmarking Evidence',
    description: '290 Technical IDs, benchmark sources, price gap derivations, and quarantine registries.',
    sheetCount: 11,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'SAVINGS_ENGINE_EVIDENCE',
    filename: '04_Savings_Engine_Evidence.xlsx',
    title: 'Module 4 — Savings Engine & Initiative Ledger',
    description: 'Mathematical derivation of Wave-1 initiatives, overlap deductions, and exclusion adjustments.',
    sheetCount: 10,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'FINANCIAL_VALIDATION',
    filename: '05_Financial_Validation.xlsx',
    title: 'Financial Validation & Integrity Workbook',
    description: 'Automated 9-point CFO/CEO mathematical audit proving ₹0.00 variance and strict isolation.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'DATA_VERSION_DIFF',
    filename: '06_Data_Version_Diff.xlsx',
    title: 'Data Version Comparison & Reanalysis Diff',
    description: 'Granular delta between previous and current datasets across records, suppliers, and spend.',
    sheetCount: 5,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'REPORT_EVIDENCE',
    filename: '07_Report_Evidence.xlsx',
    title: 'Report Version Evidence & Governance Audit',
    description: 'Complete trace connecting certified report versions to dataset states and admin approvals.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'MANAGEMENT_QUICK_SUMMARY_EVIDENCE',
    filename: '08_Management_Quick_Summary_Evidence.xlsx',
    title: 'Management Quick Summary (10-Slide) Evidence',
    description: 'Slide-by-slide KPI reconciliation mapping headline board figures to underlying ledgers.',
    sheetCount: 5,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    type: 'ANALYSIS_RUN_CONTROL',
    filename: '09_Analysis_Run_Control.xlsx',
    title: 'Analysis Run Master Control & QA Ledger',
    description: 'System master control log recording module execution timestamps, gates, and hashes.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  }
];

export const SAVINGS_TYPES_INVENTORY: SavingsTypeEvidenceInventoryItem[] = [
  {
    savingsType: 'VENDOR_CONSOLIDATION',
    initiativeId: 'OPP-001',
    filename: '04A_Vendor_Consolidation_Evidence.xlsx',
    title: 'Vendor Consolidation & Tail Rationalization Evidence',
    displayedValue: '₹6.17 Cr',
    description: 'Detailed derivation of ₹6.17 Cr consolidation opportunity based on 5% indicative tail model.',
    sheetCount: 7,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    savingsType: 'BENCHMARK_PRICE_GAP',
    initiativeId: 'OPP-003',
    filename: '04B_Benchmark_Price_Gap_Evidence.xlsx',
    title: 'PCBI Benchmark Price Gap Evidence',
    displayedValue: '₹29.73 Cr',
    description: 'Traces ₹80.67 Cr Gross to ₹40.20 Cr Overlap and ₹10.74 Cr Exclusions = ₹29.73 Cr net direct.',
    sheetCount: 8,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    savingsType: 'STRATEGIC_SOURCING',
    initiativeId: 'OPP-004',
    filename: '04C_Strategic_Sourcing_Evidence.xlsx',
    title: 'Strategic Sourcing & Commercial Negotiation Evidence',
    displayedValue: '₹42.82 Cr',
    description: 'Traces ₹71.40 Cr Gross to ₹22.60 Cr Overlap and ₹5.98 Cr Exclusions = ₹42.82 Cr net direct.',
    sheetCount: 8,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    savingsType: 'STRATEGIC_MARKET_VALUE',
    initiativeId: 'OPP-006',
    filename: '04D_Strategic_Market_Value_Evidence.xlsx',
    title: 'Strategic Market Value (Contract Restructuring) Evidence',
    displayedValue: '₹14.88 Cr',
    description: 'Proves ₹14.88 Cr non-direct strategic value and isolation from ₹78.72 Cr net direct savings.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    savingsType: 'PROCESS_PRODUCTIVITY',
    initiativeId: 'OPP-007',
    filename: '04E_Process_Productivity_Evidence.xlsx',
    title: 'Process Productivity & PO Effort Reduction Evidence',
    displayedValue: '20% Effort Reduction',
    description: '20% PO effort reduction across 824 POs; direct monetary savings strictly ₹0.00 until baseline validation.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    savingsType: 'COST_AVOIDANCE_RISK',
    initiativeId: 'OPP-008',
    filename: '04F_Cost_Avoidance_Risk_Evidence.xlsx',
    title: 'Spend De-Risked & Supplier Risk Contingency Evidence',
    displayedValue: '₹420.00 Cr De-risked',
    description: 'Evidence supporting ₹420.00 Cr spend de-risking; strictly NOT monetized as savings.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  },
  {
    savingsType: 'REALIZED_SAVINGS',
    initiativeId: 'OPP-009',
    filename: '04G_Realized_Savings_Evidence.xlsx',
    title: 'Realized Savings Audit & Historical Verification Evidence',
    displayedValue: '₹68.00 Cr Realized',
    description: 'Audited historical ERP savings of ₹68.00 Cr; strictly non-additive to Wave-1 opportunity pipeline.',
    sheetCount: 6,
    isAvailable: true,
    requiredRole: 'ADMIN'
  }
];

