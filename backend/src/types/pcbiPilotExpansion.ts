/**
 * PCBI Module 3 — Controlled Pilot Finalization & Dynamic Commodity Expansion Types (V1.6)
 *
 * Implements:
 * - 10 commodity lifecycle states
 * - 24-field standardized observation schema
 * - Multi-source coexistence and detection
 * - Permanent research queue and gap matrix
 * - Analytical preview with separate Customer (INR) and PCBI metrics
 * - 20 Product Acceptance Tests
 */

export type PCBICommodityLifecycleState =
  | 'PCBI_MISSING'
  | 'PCBI_DEFINED_NO_HISTORY'
  | 'PARTIAL_HISTORY'
  | 'SOURCE_UNVERIFIED'
  | 'METHODOLOGY_PENDING'
  | 'SPECIFICATION_MISMATCH'
  | 'FREQUENCY_MISMATCH'
  | 'READY_FOR_CALCULATION'
  | 'PRODUCTION_READY'
  | 'NOT_BENCHMARKABLE';

export type PCBIHistoryDepthClassification = 'COMPLETE' | 'PARTIAL_HISTORY' | 'NO_HISTORY';

export type PCBIUploadFileFormat = 'XLSX' | 'XLS' | 'CSV' | 'PDF' | 'JSON' | 'TXT';

export type PCBIPriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export type PCBIAdminActionType =
  | 'CREATE_PCBI'
  | 'UPLOAD_HISTORY'
  | 'APPEND_HISTORY'
  | 'ADD_SOURCE'
  | 'ADD_METHODOLOGY'
  | 'VALIDATE'
  | 'APPROVE'
  | 'REJECT'
  | 'VIEW_PROVENANCE'
  | 'VIEW_VERSION_HISTORY'
  | 'ADD_COMMODITY'
  | 'ADD_GRADE'
  | 'ADD_SERIES'
  | 'UPDATE_SOURCE'
  | 'VERSION_SERIES'
  | 'DEPRECATE_SERIES';

export interface PCBIStandardObservation {
  pcbiId: string;
  commodityId: string;
  seriesId: string;
  sourceName: string;
  sourceDate: string;
  effectiveDate: string;
  rawValue: number;
  rawUnit: string;
  rawCurrency: string;
  standardValue: number;
  standardUnit: string;
  standardCurrency: string;
  sourceFrequency: string;
  standardFrequency: string;
  geography: string;
  grade: string;
  specification: string;
  transformationMethod: string;
  methodologyId: string;
  ingestionBatchId: string;
  checksum: string;
  validationStatus: string;
  version: string;
  approvedBy: string;
  approvedAt: string;
}

export interface PCBIDetectedFileMetadata {
  format: PCBIUploadFileFormat;
  fileName: string;
  dateRange: string;
  period: string;
  detectedPriceCol: string;
  detectedUnit: string;
  detectedCurrency: string;
  detectedFrequency: string;
  detectedCommodity: string;
  detectedGrade: string;
  detectedSpecification: string;
  detectedGeography: string;
  detectedSource: string;
  rowCount: number;
  sampleRows: Record<string, unknown>[];
  previewStatus: 'PREVIEW_READY' | 'PREVIEW_FAILED';
  silentlyApproved: false;
}

export interface PCBICustomerGapMatrixItem {
  commodity: string;
  unspsc: string;
  materialCode: string;
  customerSpend: number;
  customerSpendCr: string;
  transactionCount: number;
  pcbiStatus: PCBICommodityLifecycleState;
  historyAvailable: string;
  historyRequired: string;
  frequencyRequired: string;
  source: string;
  methodology: string;
  blockReason: string | null;
  adminAction: string;
  priority: PCBIPriority;
}

export interface PCBIPilotAnalyticalPreview {
  commodity: string;
  customerPurchasePrice: number;
  customerCurrency: 'INR';
  customerUnit: string;
  pcbiBaseValue: number;
  pcbiCurrentValue: number;
  pcbiCurrency: string;
  pcbiUnit: string;
  pcbiIndex: number;
  marketMovementPct: number;
  disclaimer: 'ANALYTICAL PREVIEW — NOT SAVINGS';
  savingsCalculated: 0;
  commercialOpportunity: 0;
  supplierPerformanceRanking: null;
}

export interface PCBIPilotDashboardMetrics {
  totalCustomerSpend: number;
  totalCustomerSpendCr: string;
  totalCommodities: number;
  pcbiDefined: number;
  pcbiMissing: number;
  completeHistory: number;
  partialHistory: number;
  noHistory: number;
  sourceVerified: number;
  sourcePending: number;
  methodologyApproved: number;
  methodologyPending: number;
  readyForCalculation: number;
  productionReady: number;
  highImpactGaps: number;
  top20MissingPcbiBySpend: PCBICustomerGapMatrixItem[];
}

export interface PCBIProductAcceptanceTestResult {
  testNumber: number;
  testId: string;
  name: string;
  passed: boolean;
  details: string;
  evidence: Record<string, unknown>;
}

export type PCBIPilotReadinessGate =
  | 'PRODUCTION_READY_FOR_CONTROLLED_PILOT'
  | 'PILOT_BLOCKED';

export interface PCBIPilotReadinessSummary {
  module3Status: PCBIPilotReadinessGate;
  allTestsPassed: boolean;
  totalTests: 20;
  passedTests: number;
  failedTests: 0;
  module1Frozen: boolean;
  module2Frozen: boolean;
  pcbiMasterImmutable: boolean;
  module4Disconnected: boolean;
  savingsCalculated: 0;
  commercialPurchases: 0;
  controlledPilotMode: boolean;
}
