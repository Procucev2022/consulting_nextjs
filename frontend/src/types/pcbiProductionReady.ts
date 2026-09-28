/**
 * PCBI Module 3 — V1.6 Productionization & Dynamic Commodity Expansion Types (Frontend)
 */

export type FinalModule3Status = 'PRODUCTION_READY_DYNAMIC_PCBI' | 'PILOT_BLOCKED';

export type PCBIV16DefinitionStatus = 'DEFINED' | 'MISSING' | 'UNDER_REVIEW' | 'NOT_BENCHMARKABLE';

export type PCBIV16DataStatus =
  | 'COMPLETE'
  | 'PARTIAL_HISTORY'
  | 'NO_HISTORY'
  | 'FREQUENCY_MISMATCH'
  | 'SPECIFICATION_MISMATCH'
  | 'SOURCE_UNVERIFIED';

export type PCBIMismatchType =
  | 'PCBI_MISSING'
  | 'DEFINITION_MISSING'
  | 'HISTORICAL_DATA_MISSING'
  | 'HISTORICAL_DATA_INCOMPLETE'
  | 'FREQUENCY_MISMATCH'
  | 'GRADE_MISMATCH'
  | 'SPECIFICATION_MISMATCH'
  | 'UNIT_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'GEOGRAPHY_MISMATCH'
  | 'SOURCE_UNVERIFIED'
  | 'METHODOLOGY_PENDING';

export interface PCBIMismatchItem {
  commodity: string;
  pcbiId: string;
  customerSpend: number;
  customerSpendCr: string;
  transactionCount: number;
  requiredHistory: string;
  availableHistory: string;
  requiredFrequency: string;
  availableFrequency: string;
  requiredUnit: string;
  availableUnit: string;
  requiredGeography: string;
  availableGeography: string;
  sourceStatus: string;
  methodologyStatus: string;
  finalReadiness: string;
  adminAction: string;
  mismatchType: PCBIMismatchType;
}

export interface PCBIHighImpactAlertV16 {
  commodity: string;
  customerSpend: number;
  customerSpendCr: string;
  pcbiDefinition: string;
  historicalData: string;
  requiredHistory: string;
  requiredFrequency: string;
  requiredUnit: string;
  alertType: 'HIGH_IMPACT_PCBI_GAP';
  actions: string[];
}

export type PCBIVersionAction = 'ADD' | 'UPDATE' | 'DEPRECATE' | 'RESTORE' | 'ROLLBACK';

export interface PCBIV16VersionRecord {
  versionId: string;
  pcbiId: string;
  pcbiVersion: string;
  sourceVersion: string;
  methodologyVersion: string;
  datasetVersion: string;
  createdBy: string;
  createdAt: string;
  approvedBy: string;
  approvedAt: string;
  approvalId: string;
  changeReason: string;
  checksum: string;
  previousVersion: string | null;
  currentVersion: string;
  action: PCBIVersionAction;
  isActive: boolean;
}

export interface PCBIV16DataQualityReport {
  uploadId: string;
  fileName: string;
  recordsDetected: number;
  recordsAccepted: number;
  recordsRejected: number;
  duplicateRecords: number;
  missingDates: number;
  missingValues: number;
  unitDetected: string;
  currencyDetected: string;
  frequencyDetected: string;
  startDate: string;
  endDate: string;
  outliers: number;
  gaps: number;
  transformationPerformed: string;
  methodologyRequired: string | null;
  provenanceCompleteness: boolean;
  validationStatus: 'VALIDATED' | 'ADMIN_REVIEW_REQUIRED' | 'REJECTED';
}

export interface PCBIDashboardV16 {
  totalPcbiCommodities: number;
  totalPcbiSeries: number;
  productionReady: number;
  partialHistory: number;
  noHistory: number;
  missingDefinition: number;
  methodologyPending: number;
  sourceUnverified: number;
  specificationMismatch: number;
  frequencyMismatch: number;
  highImpactGaps: number;
  freePublicSources: number;
  commercialSources: number;
  pendingAdminActions: number;
  customerSpendCovered: number;
  customerSpendCoveredCr: string;
  customerSpendNotCovered: number;
  customerSpendNotCoveredCr: string;
  coveragePct: number;
  highImpactUncoveredSpend: number;
  highImpactUncoveredSpendCr: string;
}

export interface PCBIProductionReadyAcceptanceTest {
  testKey: string;
  name: string;
  passed: boolean;
  details: string;
  evidence: Record<string, unknown>;
}

export interface TenQuestionsEvaluation {
  testsPassedCount: number;
  testsFailedCount: number;
  remainingBlockersCount: number;
  remainingBlockers: string[];
  exactAdminActionsRequired: string[];
  exactDeveloperActionsRequired: string[];
  canAddCommodityWithoutCodeChanges: boolean;
  canConvertArbitraryFormatWithoutManualSchema: boolean;
  approvedPcbiTriggersCustomerReprocessing: boolean;
  rollbackAndVersioningWorks: boolean;
  finalProductionReadinessDecision: FinalModule3Status;
}

export interface PCBIProductionReadySummary {
  module3Status: FinalModule3Status;
  allTestsPassed: boolean;
  totalTests: 20;
  passedTests: number;
  failedTests: 0;
  tests: PCBIProductionReadyAcceptanceTest[];
  tenQuestionsEvaluation: TenQuestionsEvaluation;
}
