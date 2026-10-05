/**
 * Types & Interfaces for Output Evidence & Validation Workbooks (Prompt 305)
 */

export type EvidenceWorkbookType =
  | 'MODULE_1_EVIDENCE'
  | 'MODULE_2_EVIDENCE'
  | 'PCBI_EVIDENCE'
  | 'SAVINGS_ENGINE_EVIDENCE'
  | 'FINANCIAL_VALIDATION'
  | 'DATA_VERSION_DIFF'
  | 'REPORT_EVIDENCE'
  | 'MANAGEMENT_QUICK_SUMMARY_EVIDENCE'
  | 'ANALYSIS_RUN_CONTROL';

export type CanonicalSavingsType =
  | 'VENDOR_CONSOLIDATION'
  | 'BENCHMARK_PRICE_GAP'
  | 'STRATEGIC_SOURCING'
  | 'STRATEGIC_MARKET_VALUE'
  | 'PROCESS_PRODUCTIVITY'
  | 'COST_AVOIDANCE_RISK'
  | 'REALIZED_SAVINGS';

export type AnyEvidenceType = EvidenceWorkbookType | CanonicalSavingsType;

export type ParityCheckStatus = 'PASS' | 'FAIL';

export interface ParityCheckResult {
  kpi: string;
  uiValue: number | string;
  evidenceValue: number | string;
  sourceValue: number | string;
  unit: string;
  variance: number;
  status: ParityCheckStatus;
  tolerance: number;
  supportingSheet: string;
  notes: string;
}

export interface ParityDiscrepancy {
  kpi: string;
  expectedValue: number | string;
  actualValue: number | string;
  variance: number;
  reason: string;
}

export interface ParityValidationSummary {
  jobId: string;
  dataVersionId: string;
  reportVersionId?: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  overallStatus: ParityCheckStatus;
  evaluatedAt: string;
  discrepancies: ParityDiscrepancy[];
  checks: ParityCheckResult[];
}

export interface WorkbookReadmeMeta {
  customerName: string;
  analysisRunId: string;
  dataVersionId: string;
  reportVersionId?: string;
  moduleName: string;
  workbookType: AnyEvidenceType;
  generatedAt: string;
  generatedBy: string;
  calculationVersion: string;
  sourceRecordCount: number;
  totalSourceSpendCr: number;
  purpose: string;
  validationInstructions: string;
  importantDefinitions: Record<string, string>;
  disclaimer: string;
}

export interface ExecutiveSummaryRow {
  'KPI Metric': string;
  'UI Value': string;
  'Evidence Value': string;
  'Unit': string;
  'Calculation Method': string;
  'Supporting Sheet': string;
  'Reconciliation Status': ParityCheckStatus;
  'Variance': string;
}

export interface CalculationBridgeRow {
  'Step #': number;
  'Initiative / Component': string;
  'Lever': string;
  'Gross Opportunity (₹ Cr)': number;
  'Overlap Deductions (₹ Cr)': number;
  'Exclusions (₹ Cr)': number;
  'Net Pipeline (₹ Cr)': number;
  'Strategic Market Value (₹ Cr)': number;
  'Net Direct Opportunity (₹ Cr)': number;
  'Mathematical Formula': string;
  'Reconciliation Status': ParityCheckStatus;
}

export interface FinancialCheckRow {
  'Check #': string;
  'Validation Rule': string;
  'Target Value': string;
  'Evaluated Value': string;
  'Variance': string;
  'Status': ParityCheckStatus;
  'Audit Notes': string;
}

export interface EvidenceInventoryItem {
  type: EvidenceWorkbookType;
  filename: string;
  title: string;
  description: string;
  sheetCount: number;
  isAvailable: boolean;
  requiredRole: 'ADMIN' | 'CUSTOMER_ANALYST';
}

export interface SavingsTypeEvidenceInventoryItem {
  savingsType: CanonicalSavingsType;
  initiativeId: string;
  filename: string;
  title: string;
  displayedValue: string;
  description: string;
  sheetCount: number;
  isAvailable: boolean;
  requiredRole: 'ADMIN' | 'CUSTOMER_ANALYST';
}

export interface EvidenceDownloadAuditEvent {
  eventId: string;
  jobId: string;
  dataVersionId: string;
  reportVersionId?: string;
  workbookType: AnyEvidenceType | 'PACKAGE_ZIP';
  userId: string;
  userRole: string;
  tenantId: string;
  timestamp: string;
  fileSizeBytes: number;
  checksum: string;
  ipAddress?: string;
}

