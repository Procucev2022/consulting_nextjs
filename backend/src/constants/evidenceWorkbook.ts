/**
 * Evidence workbook catalogue: workbook and savings types, filenames, titles, sheet layouts,
 * sheet headers, and labels. Sheet lists here are the single source for the inventory sheet count.
 */

import type {
  CanonicalSavingsType,
  EvidenceSavingsMetadata,
  EvidenceWorkbookType
} from '../types/evidenceWorkbook';

export const EVIDENCE_WORKBOOK_TYPES = [
  'MODULE_1_EVIDENCE',
  'MODULE_2_EVIDENCE',
  'PCBI_EVIDENCE',
  'SAVINGS_ENGINE_EVIDENCE',
  'FINANCIAL_VALIDATION',
  'DATA_VERSION_DIFF',
  'REPORT_EVIDENCE',
  'MANAGEMENT_QUICK_SUMMARY_EVIDENCE',
  'ANALYSIS_RUN_CONTROL'
] as const satisfies readonly EvidenceWorkbookType[];

export const EVIDENCE_SAVINGS_TYPES = [
  'VENDOR_CONSOLIDATION',
  'BENCHMARK_PRICE_GAP',
  'STRATEGIC_SOURCING',
  'STRATEGIC_MARKET_VALUE',
  'PROCESS_PRODUCTIVITY',
  'COST_AVOIDANCE_RISK',
  'REALIZED_SAVINGS'
] as const satisfies readonly CanonicalSavingsType[];

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

export const EVIDENCE_WORKBOOK_TITLES: Record<EvidenceWorkbookType, string> = {
  MODULE_1_EVIDENCE: 'Module 1 — Spend Ingestion & Baseline Evidence',
  MODULE_2_EVIDENCE: 'Module 2 — AI Categorization & Strategic Sourcing Evidence',
  PCBI_EVIDENCE: 'Module 3 — PCBI & Commodity Benchmarking Evidence',
  SAVINGS_ENGINE_EVIDENCE: 'Module 4 — Savings Engine & Initiative Ledger',
  FINANCIAL_VALIDATION: 'Financial Validation & Integrity Workbook',
  DATA_VERSION_DIFF: 'Data Version Comparison & Reanalysis Diff',
  REPORT_EVIDENCE: 'Report Version Evidence & Governance Audit',
  MANAGEMENT_QUICK_SUMMARY_EVIDENCE: 'Management Quick Summary (10-Slide) Evidence',
  ANALYSIS_RUN_CONTROL: 'Analysis Run Master Control & QA Ledger'
};

export const EVIDENCE_WORKBOOK_DESCRIPTIONS: Record<EvidenceWorkbookType, string> = {
  MODULE_1_EVIDENCE: 'Spend baseline from the ProcurementTransaction ledger for this job: supplier, plant, and material-group spend, plus capped transaction rows.',
  MODULE_2_EVIDENCE: 'Module 2 category and sourcing-lever evidence.',
  PCBI_EVIDENCE: 'PCBI benchmark evidence for this job.',
  SAVINGS_ENGINE_EVIDENCE: 'Run-level savings bridge (gross, overlap, net defensible, potential savings, savings %) from the approved analysis run, reconciled to the assessment record.',
  FINANCIAL_VALIDATION: 'Tie-out checks between the ledger, the approved analysis run, and the assessment record.',
  DATA_VERSION_DIFF: 'Data version history for this job with record-count and checksum deltas between consecutive versions.',
  REPORT_EVIDENCE: 'Report version evidence and governance audit.',
  MANAGEMENT_QUICK_SUMMARY_EVIDENCE: 'Headline KPI reconciliation from the assessment record to the approved run and the ledger.',
  ANALYSIS_RUN_CONTROL: 'Analysis run control log for this job: status, gates, approval, supersession, and totals per run.'
};

export const EVIDENCE_STATIC_UNAVAILABLE_REASONS = {
  MODULE_2_EVIDENCE: 'Module 2 category and sourcing-lever detail is not persisted per analysis run in D1. Some run payloads keep summary counters only.',
  PCBI_EVIDENCE: 'PCBI benchmark matches for this job are not persisted in D1. PCBIBenchmarkMaster holds reference benchmarks, not per-job matches.',
  REPORT_EVIDENCE: 'Report version records are not persisted in D1, so the report-to-dataset trace cannot be produced.'
} as const;

export const EVIDENCE_SHEET_NAMES = {
  README: '01_README',
  SUMMARY: '02_SUMMARY',
  PARITY: 'PARITY',
  SUPPLIER_SPEND: '03_SUPPLIER_SPEND',
  PLANT_SPEND: '04_PLANT_SPEND',
  MATERIAL_GROUPS: '05_MATERIAL_GROUPS',
  TRANSACTIONS: '06_TRANSACTIONS',
  CALCULATION_BRIDGE: '03_CALCULATION_BRIDGE',
  VALIDATION_CHECKS: '03_VALIDATION_CHECKS',
  DATA_VERSIONS: '03_DATA_VERSIONS',
  VERSION_DIFF: '04_VERSION_DIFF',
  KPI_RECONCILIATION: '03_KPI_RECONCILIATION',
  ANALYSIS_RUNS: '03_ANALYSIS_RUNS'
} as const;

export const EVIDENCE_WORKBOOK_SHEETS: Record<EvidenceWorkbookType, readonly string[]> = {
  MODULE_1_EVIDENCE: [
    EVIDENCE_SHEET_NAMES.README, EVIDENCE_SHEET_NAMES.SUMMARY, EVIDENCE_SHEET_NAMES.SUPPLIER_SPEND,
    EVIDENCE_SHEET_NAMES.PLANT_SPEND, EVIDENCE_SHEET_NAMES.MATERIAL_GROUPS, EVIDENCE_SHEET_NAMES.TRANSACTIONS,
    EVIDENCE_SHEET_NAMES.PARITY
  ],
  MODULE_2_EVIDENCE: [],
  PCBI_EVIDENCE: [],
  SAVINGS_ENGINE_EVIDENCE: [
    EVIDENCE_SHEET_NAMES.README, EVIDENCE_SHEET_NAMES.SUMMARY, EVIDENCE_SHEET_NAMES.CALCULATION_BRIDGE,
    EVIDENCE_SHEET_NAMES.PARITY
  ],
  FINANCIAL_VALIDATION: [
    EVIDENCE_SHEET_NAMES.README, EVIDENCE_SHEET_NAMES.SUMMARY, EVIDENCE_SHEET_NAMES.VALIDATION_CHECKS,
    EVIDENCE_SHEET_NAMES.PARITY
  ],
  DATA_VERSION_DIFF: [
    EVIDENCE_SHEET_NAMES.README, EVIDENCE_SHEET_NAMES.SUMMARY, EVIDENCE_SHEET_NAMES.DATA_VERSIONS,
    EVIDENCE_SHEET_NAMES.VERSION_DIFF, EVIDENCE_SHEET_NAMES.PARITY
  ],
  REPORT_EVIDENCE: [],
  MANAGEMENT_QUICK_SUMMARY_EVIDENCE: [
    EVIDENCE_SHEET_NAMES.README, EVIDENCE_SHEET_NAMES.SUMMARY, EVIDENCE_SHEET_NAMES.KPI_RECONCILIATION,
    EVIDENCE_SHEET_NAMES.PARITY
  ],
  ANALYSIS_RUN_CONTROL: [
    EVIDENCE_SHEET_NAMES.README, EVIDENCE_SHEET_NAMES.SUMMARY, EVIDENCE_SHEET_NAMES.ANALYSIS_RUNS,
    EVIDENCE_SHEET_NAMES.PARITY
  ]
};

export const EVIDENCE_SAVINGS_METADATA: Record<CanonicalSavingsType, EvidenceSavingsMetadata> = {
  VENDOR_CONSOLIDATION: {
    initiativeId: 'OPP-001',
    filename: '04A_Vendor_Consolidation_Evidence.xlsx',
    title: 'Vendor Consolidation & Tail Rationalization',
    description: 'Rationalization of fragmented tail suppliers across MRO and consumables.'
  },
  BENCHMARK_PRICE_GAP: {
    initiativeId: 'OPP-003',
    filename: '04B_Benchmark_Price_Gap_Evidence.xlsx',
    title: 'Benchmark Price Gap Analysis',
    description: 'PCBI direct commodity price variance derivation against published indices.'
  },
  STRATEGIC_SOURCING: {
    initiativeId: 'OPP-004',
    filename: '04C_Strategic_Sourcing_Evidence.xlsx',
    title: 'Strategic Sourcing & Commercial Levers',
    description: 'Commercial renegotiation, e-auction events, and multi-plant volume aggregation.'
  },
  STRATEGIC_MARKET_VALUE: {
    initiativeId: 'OPP-006',
    filename: '04D_Strategic_Market_Value_Evidence.xlsx',
    title: 'Strategic Market Value (Non-Direct)',
    description: 'Procurement value from payment terms, SLA enhancements, and price index de-linking.'
  },
  PROCESS_PRODUCTIVITY: {
    initiativeId: 'PROC-001',
    filename: '04E_Process_Productivity_Evidence.xlsx',
    title: 'Process Productivity (PO Effort Reduction)',
    description: '20% PO effort reduction targeting low-value purchase orders.'
  },
  COST_AVOIDANCE_RISK: {
    initiativeId: 'RSK-001',
    filename: '04F_Cost_Avoidance_Risk_Evidence.xlsx',
    title: 'Cost Avoidance & Supplier Risk Mitigation',
    description: 'Supply disruption protection on critical single-source materials. Not monetised as savings.'
  },
  REALIZED_SAVINGS: {
    initiativeId: 'REAL-001',
    filename: '04G_Realized_Savings_Evidence.xlsx',
    title: 'Historical Audited Realized Savings',
    description: 'Historical audited ERP cost reductions from prior financial cycles.'
  }
};

export const EVIDENCE_REQUIRED_ROLE = {
  WORKBOOK: 'CUSTOMER_ANALYST',
  SAVINGS: 'CONSULTANT'
} as const;

export const EVIDENCE_PACKAGE_FILENAME_PREFIX = 'Complete_Analysis_Evidence_Package_';

export const EVIDENCE_PACKAGE_INDEX_FILENAME = '00_PACKAGE_INDEX.txt';

export const EVIDENCE_WORKBOOK_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const EVIDENCE_PACKAGE_MIME_TYPE = 'application/zip';

export const EVIDENCE_CALCULATION_SOURCE =
  'Cloudflare D1: ProcurementTransaction ledger rows, AssessmentAnalysisRun totals, AssessmentRecord headline figures';

export const EVIDENCE_DISCLAIMER = 'Generated by the Worker from D1 rows. This is not a client-side export of the UI.';

export const EVIDENCE_SHEET_HEADERS = {
  README: ['Field', 'Value'],
  SUMMARY_METRIC: ['Metric', 'Value'],
  KPI: ['KPI', 'UI Value', 'Evidence Value', 'Source Value', 'Unit', 'Status'],
  PARITY: ['KPI', 'UI Value', 'Evidence Value', 'Source Value', 'Unit', 'Variance', 'Tolerance', 'Status', 'Supporting Sheet', 'Notes'],
  GROUP: ['Group', 'Ledger Rows', 'Spend (INR Cr)', 'Share of Ledger (%)'],
  TRANSACTION: ['Transaction ID', 'Source Row', 'PO Number', 'PO Line', 'Document Date', 'Supplier', 'Material Code', 'Description', 'Material Group', 'Plant', 'Quantity', 'UOM', 'Net Price', 'Currency', 'Spend (INR)', 'Spend (INR Cr)'],
  BRIDGE: ['Step', 'Component', 'UI Value (INR Cr)', 'Source Value (INR Cr)', 'Status', 'Formula'],
  VALIDATION: ['Check', 'Expected', 'Observed', 'Variance', 'Status', 'Notes'],
  DATA_VERSION: ['Version', 'Data Version ID', 'File Name', 'Record Count', 'File Size (bytes)', 'Checksum', 'Uploaded By', 'Uploaded At', 'Superseded'],
  VERSION_DIFF: ['From Version', 'To Version', 'Record Count From', 'Record Count To', 'Record Delta', 'File Changed', 'Checksum Changed'],
  RUN: ['Analysis Run ID', 'Data Version ID', 'Status', 'Total Spend (INR Cr)', 'Validated Spend (INR Cr)', 'Gross Opportunity (INR Cr)', 'Overlap (INR Cr)', 'Net Defensible (INR Cr)', 'Potential Savings (INR Cr)', 'Savings %', 'All Gates Passed', 'Approved', 'Superseded', 'Created At']
} as const;

export const EVIDENCE_SHEET_LABELS = {
  workbook: 'Workbook',
  title: 'Title',
  filename: 'Filename',
  jobId: 'Job ID',
  customer: 'Customer',
  tenant: 'Tenant',
  dataVersion: 'Active data version',
  analysisRun: 'Active analysis run',
  generatedAt: 'Generated at (UTC)',
  generatedBy: 'Generated by',
  source: 'Calculation source',
  disclaimer: 'Disclaimer',
  ledgerRows: 'Ledger rows in scope',
  ledgerSpend: 'Ledger spend (INR Cr)',
  transactionRows: 'Transaction rows shown',
  transactionCap: 'Transaction sheet cap',
  notRecorded: 'Not recorded',
  parityStatus: 'Parity status',
  checksPassed: 'Checks passed',
  checksFailed: 'Checks failed',
  packageTitle: 'Complete Analysis Evidence Package index',
  packageIncluded: 'Included workbooks',
  packageExcluded: 'Workbooks not included',
  noPriorVersion: 'No prior version to compare',
  yes: 'Yes',
  no: 'No'
} as const;

export const EVIDENCE_CHECK_LABELS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  LEDGER_ROWS_CHECK: 'Ledger rows in scope',
  LEDGER_ROWS_EXPECTED: 'greater than 0',
  LEDGER_ROWS_SOURCE: 'Rows with this assessment_id and tenant_id',
  BRIDGE_GROSS: 'Gross opportunity',
  BRIDGE_GROSS_FORMULA: 'Gross opportunity as displayed',
  BRIDGE_OVERLAP: 'Overlap deductions',
  BRIDGE_OVERLAP_FORMULA: 'Overlap deducted from gross',
  BRIDGE_NET: 'Net defensible opportunity',
  BRIDGE_NET_FORMULA: 'Gross - Overlap = Net defensible',
  BRIDGE_POTENTIAL: 'Potential savings',
  BRIDGE_POTENTIAL_FORMULA: 'Potential savings equals net defensible',
  BRIDGE_PERCENT: 'Savings percentage',
  BRIDGE_PERCENT_FORMULA: 'Net defensible / ledger spend x 100'
} as const;
