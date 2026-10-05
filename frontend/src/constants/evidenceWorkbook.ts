/**
 * Frontend Constants for Output Evidence & Validation Workbooks (Prompt 305 & 306)
 */

import type {
  EvidenceWorkbookType,
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

export const SAVINGS_TYPE_FILENAMES: Record<string, string> = {
  VENDOR_CONSOLIDATION: '04A_Vendor_Consolidation_Evidence.xlsx',
  BENCHMARK_PRICE_GAP: '04B_Benchmark_Price_Gap_Evidence.xlsx',
  STRATEGIC_SOURCING: '04C_Strategic_Sourcing_Evidence.xlsx',
  STRATEGIC_MARKET_VALUE: '04D_Strategic_Market_Value_Evidence.xlsx',
  PROCESS_PRODUCTIVITY: '04E_Process_Productivity_Evidence.xlsx',
  COST_AVOIDANCE_RISK: '04F_Cost_Avoidance_Risk_Evidence.xlsx',
  REALIZED_SAVINGS: '04G_Realized_Savings_Evidence.xlsx'
};

export const SAVINGS_TYPES_INVENTORY: SavingsTypeEvidenceInventoryItem[] = [
  {
    savingsType: 'VENDOR_CONSOLIDATION',
    initiativeId: 'OPP-001',
    filename: '04A_Vendor_Consolidation_Evidence.xlsx',
    title: 'Vendor Consolidation & Tail Rationalization',
    description: 'Rationalization of fragmented tail suppliers (< ₹25 Lakhs spend) across MRO and consumables.',
    grossAmountCr: 6.17,
    overlapAmountCr: 0.00,
    netAmountCr: 6.17,
    classificationNote: '5% vendor consolidation is an indicative modelling assumption, not a guaranteed saving.',
    sheetCount: 5,
    isAvailable: true,
    requiredRole: 'ADMIN' as const
  },
  {
    savingsType: 'BENCHMARK_PRICE_GAP',
    initiativeId: 'OPP-003',
    filename: '04B_Benchmark_Price_Gap_Evidence.xlsx',
    title: 'Benchmark Price Gap Analysis',
    description: 'PCBI direct commodity price variance derivation against published indices (CRISIL, S&P Platts).',
    grossAmountCr: 80.67,
    overlapAmountCr: 40.20,
    netAmountCr: 29.73,
    classificationNote: 'Exclusion-adjusted net opportunity after ₹40.20 Cr overlap and ₹10.74 Cr exclusions.',
    sheetCount: 5,
    isAvailable: true,
    requiredRole: 'ADMIN' as const
  },
  {
    savingsType: 'STRATEGIC_SOURCING',
    initiativeId: 'OPP-004',
    filename: '04C_Strategic_Sourcing_Evidence.xlsx',
    title: 'Strategic Sourcing & Commercial Levers',
    description: 'Commercial renegotiation, e-auction dynamic events, and multi-plant volume aggregation.',
    grossAmountCr: 71.40,
    overlapAmountCr: 22.60,
    netAmountCr: 42.82,
    classificationNote: 'Exclusion-adjusted net opportunity after ₹22.60 Cr overlap and ₹5.98 Cr exclusions.',
    sheetCount: 5,
    isAvailable: true,
    requiredRole: 'ADMIN' as const
  },
  {
    savingsType: 'STRATEGIC_MARKET_VALUE',
    initiativeId: 'OPP-006',
    filename: '04D_Strategic_Market_Value_Evidence.xlsx',
    title: 'Strategic Market Value (Non-Direct)',
    description: 'Procurement value from payment terms extension, SLA enhancements, and price index de-linking.',
    grossAmountCr: 14.88,
    overlapAmountCr: 0.00,
    netAmountCr: 14.88,
    classificationNote: 'Net Defensible Value Pipeline: ₹93.60 Cr = ₹78.72 Cr Net Direct + ₹14.88 Cr Strategic Market Value.',
    sheetCount: 4,
    isAvailable: true,
    requiredRole: 'ADMIN' as const
  },
  {
    savingsType: 'PROCESS_PRODUCTIVITY',
    initiativeId: 'PROC-001',
    filename: '04E_Process_Productivity_Evidence.xlsx',
    title: 'Process Productivity (PO Effort Reduction)',
    description: '20% PO effort reduction targeting 824 low-value purchase orders for automated punchout catalogues.',
    grossAmountCr: 0.00,
    overlapAmountCr: 0.00,
    netAmountCr: 0.00,
    classificationNote: 'Process productivity is currently expressed as a 20% PO effort reduction. Direct saving is ₹0.',
    sheetCount: 4,
    isAvailable: true,
    requiredRole: 'ADMIN' as const
  },
  {
    savingsType: 'COST_AVOIDANCE_RISK',
    initiativeId: 'RSK-001',
    filename: '04F_Cost_Avoidance_Risk_Evidence.xlsx',
    title: 'Cost Avoidance & Supplier Risk Mitigation',
    description: 'Supply disruption protection covering ₹420.00 Cr in critical single-source materials.',
    grossAmountCr: 0.00,
    overlapAmountCr: 0.00,
    netAmountCr: 0.00,
    classificationNote: 'Spend De-Risked — Not Monetized as Savings. Strictly isolated from Wave-1 opportunity.',
    sheetCount: 4,
    isAvailable: true,
    requiredRole: 'ADMIN' as const
  },
  {
    savingsType: 'REALIZED_SAVINGS',
    initiativeId: 'REAL-001',
    filename: '04G_Realized_Savings_Evidence.xlsx',
    title: 'Historical Audited Realized Savings',
    description: 'Historical audited ERP cost reductions completed in prior financial cycles.',
    grossAmountCr: 68.00,
    overlapAmountCr: 0.00,
    netAmountCr: 68.00,
    classificationNote: 'Separate historical classification. Never added to Wave-1 opportunity.',
    sheetCount: 4,
    isAvailable: true,
    requiredRole: 'ADMIN' as const
  }
];
