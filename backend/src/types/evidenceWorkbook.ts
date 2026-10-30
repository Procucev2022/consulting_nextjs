/**
 * Types for the Output Evidence & Validation Workbooks API served by the Cloudflare Worker.
 *
 * The response interfaces mirror frontend/src/types/evidenceWorkbook.ts field for field.
 * Internal read-model and generation types follow the response contract.
 */

import type { z } from 'zod';
import type { CloudflareD1Database, CloudflareEnvironment } from './cloudflare';
import type {
  evidenceJobParamsSchema,
  evidenceParityQuerySchema,
  evidenceSavingsParamsSchema,
  evidenceWorkbookParamsSchema
} from '../constants/evidenceValidation';

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

export type EvidenceJobParams = z.infer<typeof evidenceJobParamsSchema>;
export type EvidenceWorkbookParams = z.infer<typeof evidenceWorkbookParamsSchema>;
export type EvidenceSavingsParams = z.infer<typeof evidenceSavingsParamsSchema>;
export type EvidenceParityQuery = z.infer<typeof evidenceParityQuerySchema>;

export type EvidenceParityKey = 'TOTAL_SPEND' | 'VALIDATED_SPEND' | 'NET_DEFENSIBLE_OPPORTUNITY' | 'SAVINGS_PERCENT';

export type EvidenceLedgerGroupColumn = 'supplier_name' | 'plant' | 'material_group';

export interface EvidenceUserRecord {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface EvidenceJobAccessRecord {
  assessmentId: string;
  customerName: string;
  status: string;
  totalSpendCr: number | null;
  validatedSpendCr: number | null;
  grossOpportunityCr: number | null;
  overlapDeductionsCr: number | null;
  netDefensibleOpportunityCr: number | null;
  potentialSavingsCr: number | null;
  savingsPct: number | null;
  customerContactEmail: string | null;
}

export interface EvidenceRunRecord {
  analysisRunId: string;
  dataVersionId: string;
  status: string;
  totalSpendCr: number | null;
  validatedSpendCr: number | null;
  grossOpportunityCr: number | null;
  overlapDeductionsCr: number | null;
  netDefensibleOpportunityCr: number | null;
  potentialSavingsCr: number | null;
  savingsPct: number | null;
  allGatesPassed: boolean;
  isApproved: boolean;
  isSuperseded: boolean;
  createdAt: string;
}

export interface EvidenceVersionRecord {
  dataVersionId: string;
  versionNumber: number;
  fileName: string;
  fileSize: number | null;
  checksum: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
  recordCount: number | null;
  isSuperseded: boolean;
}

export interface EvidenceLedgerTotals {
  rowCount: number;
  totalCr: number;
}

export interface EvidenceGroupRecord {
  groupKey: string;
  rowCount: number;
  totalCr: number;
}

export interface EvidenceLedgerRecord {
  transactionId: string;
  sourceRowNumber: number | null;
  poNumber: string | null;
  poLine: string | null;
  documentDateRaw: string | null;
  supplierName: string | null;
  materialCode: string | null;
  shortText: string | null;
  materialGroup: string | null;
  plant: string | null;
  orderQuantity: number | null;
  orderUnit: string | null;
  netPrice: number | null;
  currency: string | null;
  totalInrRaw: number | null;
  totalInCrRaw: number | null;
}

export interface EvidenceLedgerDetail {
  suppliers: EvidenceGroupRecord[];
  plants: EvidenceGroupRecord[];
  materialGroups: EvidenceGroupRecord[];
  sample: EvidenceLedgerRecord[];
  sampleLimit: number;
}

export interface EvidenceSnapshot {
  jobId: string;
  tenantId: string;
  generatedAt: string;
  assessment: EvidenceJobAccessRecord;
  runs: EvidenceRunRecord[];
  versions: EvidenceVersionRecord[];
  activeRun: EvidenceRunRecord | null;
  activeVersion: EvidenceVersionRecord | null;
  ledger: EvidenceLedgerTotals;
  detail: EvidenceLedgerDetail | null;
}

export interface EvidenceSavingsMetadata {
  initiativeId: string;
  filename: string;
  title: string;
  description: string;
}

export interface EvidenceParityCheckDefinition {
  key: EvidenceParityKey;
  kpi: string;
  unit: string;
  tolerance: number;
  supportingSheet: string;
  workbookTypes: readonly EvidenceWorkbookType[];
}

export interface EvidenceParityInputs {
  uiValue: number | null;
  evidenceValue: number | null;
  sourceValue: number | null;
}

export type EvidenceAvailability = { isAvailable: true } | { isAvailable: false; reason: string };

export type EvidenceCell = string | number;

export interface EvidenceSheet {
  name: string;
  rows: EvidenceCell[][];
}

export interface EvidenceSnapshotOptions {
  requestId: string;
  generatedAt?: string;
}

export interface EvidenceRouteInput {
  request: Request;
  environment: CloudflareEnvironment;
  requestId: string;
  action: string;
  rawParams: Record<string, string>;
  searchParams: URLSearchParams;
}

export interface EvidenceFileResponseInput {
  bytes: Uint8Array;
  contentType: string;
  filename: string;
}

export interface EvidenceParityRequest {
  jobId: string;
  workbookType: EvidenceWorkbookType | null;
}

export interface PreparedEvidenceRequest<T extends { jobId: string }> {
  params: T;
  user: EvidenceUserRecord;
  snapshot: EvidenceSnapshot;
  database: CloudflareD1Database;
}

export type EvidenceRouteHandler = (input: EvidenceRouteInput) => Promise<Response>;

export interface EvidenceRouteMatch {
  action: string;
  rawParams: Record<string, string>;
  handler: EvidenceRouteHandler;
}

export interface EvidenceFailureContext {
  requestId: string;
  action: string;
  path: string;
  durationMs: number;
}

export interface EvidenceWorkbookMeta {
  generatedAt: string;
  generatedBy: string;
}

export interface EvidenceGeneratedWorkbook {
  type: EvidenceWorkbookType;
  filename: string;
  bytes: Uint8Array;
  sheetCount: number;
}

export interface EvidenceZipEntry {
  name: string;
  bytes: Uint8Array;
}

export interface EvidenceDosStamp {
  time: number;
  date: number;
}

export interface EvidencePackageExclusion {
  filename: string;
  reason: string;
}

export interface EvidencePackageFile {
  filename: string;
  bytes: Uint8Array;
  includedCount: number;
  excludedCount: number;
}
