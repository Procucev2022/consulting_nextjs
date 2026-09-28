/**
 * PCBI Module 3 — Production Pilot Activation & Dynamic PCBI Library Types (V1.7)
 */

export type PCBIProductionPilotStatus = 'PRODUCTION_PILOT_READY' | 'BLOCKED';

export type PCBIUploadConfidence = 'HIGH_CONFIDENCE' | 'DATA_MAPPING_REVIEW_REQUIRED';

export type PCBIDuplicateAction = 'RETAIN_EXISTING' | 'REPLACE_VERSION' | 'REJECT';

export interface PCBIDuplicateReview {
  seriesId: string;
  observationDate: string;
  existingValue: number;
  incomingValue: number;
  status: 'DUPLICATE_OBSERVATION_REVIEW';
  resolution?: PCBIDuplicateAction;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PCBIMappingReview {
  fileName: string;
  format: string;
  confidenceScore: number;
  status: 'DATA_MAPPING_REVIEW_REQUIRED' | 'MAPPING_CONFIRMED';
  detectedFields: Record<string, string>;
  unmappedColumns: string[];
  userMapping?: Record<string, string>;
}

export interface PCBIHighImpactGapAlert {
  commodity: string;
  materialCode: string;
  unspsc: string;
  customerSpend: number;
  customerSpendCr: string;
  transactionCount: number;
  requiredHistory: string;
  availableHistory: string;
  requiredFrequency: string;
  availableFrequency: string;
  requiredUnit: string;
  availableUnit: string;
  specification: string;
  currentPcbiStatus: string;
  alertLevel: 'PCBI COVERAGE GAP — HIGH IMPACT';
  recommendedActions: string[];
}

export interface PCBICoverageDashboardMetrics {
  totalPcbiCommodities: number;
  pcbiDefined: number;
  pcbiMissing: number;
  completeHistory: number;
  partialHistory: number;
  noHistory: number;
  sourceVerified: number;
  sourceUnverified: number;
  methodologyApproved: number;
  methodologyPending: number;
  specificationMismatch: number;
  frequencyMismatch: number;
  productionReady: number;
  notBenchmarkable: number;
  customerSpendCovered: number;
  customerSpendCoveredCr: string;
  customerSpendGap: number;
  customerSpendGapCr: string;
  pctSpendCovered: number;
  pctSpendGap: number;
}

export interface PCBICountConsistencyCheck {
  customerCommodityCount: number;
  materialCommodityCount: number;
  excludedServiceCount: number;
  pcbiCatalogCount: number;
  productionReadyCount: number;
  researchQueueCount: number;
  partialHistoryCount: number;
  noHistoryCount: number;
  isConsistent: boolean;
  auditDetails: string;
}

export interface PCBIProductionPilotAcceptanceTestResult {
  testNumber: number;
  testId: string;
  name: string;
  passed: boolean;
  details: string;
  evidence: Record<string, unknown>;
}

export interface PCBIProductionPilotReleaseReport {
  module3Status: PCBIProductionPilotStatus;
  allTestsPassed: boolean;
  totalTests: 24;
  passedTests: number;
  failedTests: 0;
  consistencyCheck: PCBICountConsistencyCheck;
  coverageDashboard: PCBICoverageDashboardMetrics;
  highImpactGaps: PCBIHighImpactGapAlert[];
  releaseTimestamp: string;
}
