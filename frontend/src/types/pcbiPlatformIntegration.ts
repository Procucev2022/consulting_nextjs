/**
 * PCBI Full Platform Productionization Types (Frontend)
 */

export type PlatformProductionStatus =
  | 'PRODUCTION_READY'
  | 'PRODUCTION_READY_WITH_CONTROLLED_GAPS'
  | 'PRODUCTION_READY_WITH_CONTROLLED_DATA_GAPS'
  | 'PRODUCTION_OPERATIONAL'
  | 'BLOCKED';

export type Module4AuditComponentStatus =
  | 'READY'
  | 'DEFECT'
  | 'INCOMPLETE'
  | 'INTEGRATION_REQUIRED'
  | 'GOVERNANCE_REQUIRED';

export type Module3ToModule4AvailabilityStatus =
  | 'PCBI_AVAILABLE'
  | 'PCBI_PARTIAL'
  | 'PCBI_MISSING'
  | 'PCBI_BLOCKED'
  | 'PCBI_NOT_BENCHMARKABLE';

export type Module4OpportunityOutputCategory =
  | 'OPPORTUNITY_ELIGIBLE'
  | 'OPPORTUNITY_BLOCKED_PCBI_GAP'
  | 'OPPORTUNITY_BLOCKED_SPECIFICATION'
  | 'OPPORTUNITY_BLOCKED_UNIT'
  | 'OPPORTUNITY_BLOCKED_CURRENCY'
  | 'OPPORTUNITY_BLOCKED_GEOGRAPHY'
  | 'OPPORTUNITY_BLOCKED_METHODOLOGY'
  | 'OPPORTUNITY_BLOCKED_FREQUENCY'
  | 'NOT_BENCHMARKABLE';

export interface Module4InputContractRecord {
  transactionId: string;
  customerActualPrice: number;
  customerUnit: string;
  customerCurrency: string;
  customerDate: string;
  module2Classification: string;
  unspsc: string;
  pcbiId: string;
  pcbiIndex: number | null;
  pcbiBenchmarkValue: number | null;
  pcbiSource: string;
  pcbiMethodology: string;
  pcbiEffectiveDate: string;
  pcbiStatus: Module3ToModule4AvailabilityStatus;
  pcbiUnit: string;
  pcbiCurrency: string;
  pcbiGeography: string;
  provenanceReference: string;
}

export interface Module4OpportunityEvaluationResult {
  transactionId: string;
  commodityName: string;
  outputCategory: Module4OpportunityOutputCategory;
  isOpportunityEligible: boolean;
  benchmarkVariancePct: number | null;
  potentialOpportunityInr: number;
  blockReason: string | null;
  governanceValidated: boolean;
  provenanceHash: string;
}

export interface PlatformContinuityReconciliation {
  inputTransactionsCount: number;
  module1OutputCount: number;
  module2ClassifiedCount: number;
  module3ProcessedCount: number;
  module4EvaluatedCount: number;
  isReconciliationPassed: boolean;
  varianceCount: number;
  discrepancyDetails: string[];
}

export interface PlatformManagementDashboardMetrics {
  totalCustomerSpendInr: number;
  totalCustomerSpendCr: string;
  pcbiCoveredSpendInr: number;
  pcbiCoveredSpendCr: string;
  pcbiUncoveredSpendInr: number;
  pcbiUncoveredSpendCr: string;
  benchmarkEligibleSpendInr: number;
  benchmarkEligibleSpendCr: string;
  opportunityEligibleSpendInr: number;
  opportunityEligibleSpendCr: string;
  opportunityBlockedSpendInr: number;
  opportunityBlockedSpendCr: string;
  pcbiResearchGapInr: number;
  pcbiResearchGapCr: string;
  notBenchmarkableSpendInr: number;
  notBenchmarkableSpendCr: string;
  coveragePct: number;
  opportunityConversionPct: number;
}

export interface PlatformAcceptanceTestResult {
  testNumber: number;
  testName: string;
  scenario: string;
  expectedStatus: Module4OpportunityOutputCategory | 'REJECTED' | 'RECONCILIATION_FAILURE';
  actualStatus: string;
  passed: boolean;
  details: string;
}

export interface PlatformDeploymentChecklistItem {
  area: string;
  component: string;
  status: 'READY' | 'BLOCKED' | 'DEFECT' | 'REQUIRES_ADMIN_ACTION';
  notes: string;
}

export interface VersionChangeSimulationResult {
  commodityId: string;
  previousVersion: string;
  newVersion: string;
  previousIndex: number;
  newIndex: number;
  previousOpportunityInr: number;
  newOpportunityInr: number;
  recalculatedTransactionsCount: number;
  unaffectedTransactionsCount: number;
  previousCalculationAuditable: boolean;
  oldVersionImmutable: boolean;
  varianceInr: number;
}

export interface DynamicGapToOpportunitySimulationResult {
  commodityId: string;
  commodityName: string;
  stepsCompleted: string[];
  initialState: string;
  finalState: string;
  initialOpportunityInr: number;
  finalOpportunityInr: number;
  codeDeploymentRequired: boolean;
  auditTrailReference: string;
}

