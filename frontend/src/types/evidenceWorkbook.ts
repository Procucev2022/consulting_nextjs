/**
 * Frontend Types & Interfaces for Output Evidence & Validation Workbooks (Prompt 305)
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

export interface EvidenceInventoryItem {
  type: EvidenceWorkbookType;
  filename: string;
  title: string;
  description: string;
  sheetCount: number;
  isAvailable: boolean;
  requiredRole: 'ADMIN' | 'CUSTOMER_ANALYST';
}

export interface EvidenceInventoryResponse {
  success: boolean;
  jobId: string;
  tenantId: string;
  items: EvidenceInventoryItem[];
}

export interface EvidenceParityResponse {
  success: boolean;
  parity: ParityValidationSummary;
}

export type CanonicalSavingsType =
  | 'VENDOR_CONSOLIDATION'
  | 'BENCHMARK_PRICE_GAP'
  | 'STRATEGIC_SOURCING'
  | 'STRATEGIC_MARKET_VALUE'
  | 'PROCESS_PRODUCTIVITY'
  | 'COST_AVOIDANCE_RISK'
  | 'REALIZED_SAVINGS';

export interface SavingsTypeEvidenceInventoryItem {
  savingsType: CanonicalSavingsType;
  initiativeId?: string;
  filename: string;
  title: string;
  description: string;
  grossAmountCr?: number;
  overlapAmountCr?: number;
  netAmountCr: number;
  classificationNote?: string;
  sheetCount: number;
  isAvailable: boolean;
  requiredRole: 'ADMIN' | 'CONSULTANT';
}

export interface SavingsTypeEvidenceInventoryResponse {
  success: boolean;
  jobId: string;
  tenantId: string;
  items: SavingsTypeEvidenceInventoryItem[];
}
