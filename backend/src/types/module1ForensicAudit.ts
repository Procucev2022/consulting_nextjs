import type {
  TransactionInclusionStatus,
  LineSpendCalculationAudit
} from './module1Forensic';

export interface DimensionSpendSummary {
  dimensionKey: string;
  dimensionName: string;
  recordCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
  sharePct: number;
}

export interface CrossDimensionReconciliationResult {
  totalTransactionSpendInr: number;
  totalSupplierSpendInr: number;
  totalItemSpendInr: number;
  totalCategorySpendInr: number;
  totalMaterialGroupSpendInr: number;
  totalPlantSpendInr: number;
  totalMonthlySpendInr: number;
  maxAbsoluteVarianceInr: number;
  reconciliationStatus: 'PASS' | 'FAIL';
}

export interface ParetoAuditResult {
  totalSpendInr: number;
  totalSpendCr: number;
  theoretical80ThresholdInr: number;
  theoretical80ThresholdCr: number;
  cutoffEntityIndex: number;
  cutoffEntityCount: number;
  cutoffEntityName: string;
  cutoffCumulativeSpendInr: number;
  cutoffCumulativeSpendCr: number;
  cutoffCumulativeSharePct: number;
  isThresholdCrossingDeterministic: boolean;
  topEntities: Array<{
    rank: number;
    entityName: string;
    spendInr: number;
    spendCr: number;
    sharePct: number;
    cumulativeSpendInr: number;
    cumulativeSpendCr: number;
    cumulativeSharePct: number;
  }>;
}

export interface QualityIndexDecomposition {
  overallQualityIndexPct: number;
  dataQualityPct: number;
  dataCompletenessPct: number;
  dataReconciliationPct: number;
  procurementPerformanceDisclaimer: string;
  components: {
    formatValidityScore: number;
    schemaConformityScore: number;
    priceQuantityCompletenessScore: number;
    supplierStandardizationScore: number;
    reconciliationIntegrityScore: number;
  };
}

export interface ExceptionRegisterEntry {
  recordId: string;
  sourceRow: number;
  field: string;
  observedValue: string | number;
  expectedRule: string;
  status: TransactionInclusionStatus;
  reason: string;
  impactOnSpendInr: number;
  resolution: string;
  timestamp: string;
}

export interface AdversarialScenarioResult {
  scenarioCode: string;
  scenarioName: string;
  testInputDescription: string;
  expectedBehavior: string;
  actualOutcome: string;
  status: 'PASS' | 'FAIL';
  documentedReason: string;
}

export interface MathematicalInvariantResult {
  invariantNumber: number;
  invariantName: string;
  formalDefinition: string;
  evaluatedResult: boolean;
  varianceObserved: number;
  status: 'PASS' | 'FAIL';
}

export type Module1FinalStatus =
  | 'MODULE_1_E2E_VALIDATED'
  | 'MODULE_1_E2E_VALIDATION_BLOCKED'
  | 'MODULE_1_E2E_CERTIFIED'
  | 'MODULE_1_NOT_CERTIFIED'
  | 'MODULE_1_FORENSICALLY_VALIDATED'
  | 'MODULE_1_VALIDATION_FAILED'
  | 'PRODUCTION_READY_CERTIFIED'
  | 'BLOCKED_DEFECT_REMEDIATION_REQUIRED';

export interface DataQualityLedgerRow {
  rowId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  errorCode: string;
  errorDescription: string;
  originalValue: string;
  expectedValue: string;
  status: string;
  actionRequired: string;
  resolutionDate: string;
}

export interface TransactionProvenanceEntry {
  kpiName: string;
  aggregationLevel: string;
  category: string;
  item: string;
  supplier: string;
  transactionId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  calculatedSpendInr: number;
  displayValue: string;
  status: 'PASS' | 'FAIL';
}

export interface HandoffValidationResult {
  datasetVersion: string;
  sourceSha256: string;
  generatedAt: string;
  totalSpendInr: number;
  totalSpendCr: number;
  totalRecords: number;
  reconciliationStatus: 'PASS' | 'FAIL';
  unexplainedSpendVariance: string;
  unexplainedCountVariance: number;
  pcbiLeakage: number;
  syntheticSavings: number;
  strategicSourcingLogic: number;
  status: 'PASS' | 'FAIL';
}

export interface NegativeTestScenarioResult {
  scenarioCode: string;
  scenarioName: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  quarantineStatus: 'BLOCKED' | 'QUARANTINED' | 'FLAGGED_EXCLUDED';
  status: 'PASS' | 'FAIL';
}

export interface GoldenDatasetTestResult {
  scenarioName: string;
  recordCount: number;
  expectedSpendInr: number;
  actualSpendInr: number;
  varianceInr: number;
  status: 'PASS' | 'FAIL';
}

export interface Module1HandoffRecord {
  sourceRowId: string;
  po: string;
  lineItem: number;
  date: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemDescription: string;
  materialGroup: string;
  plant: string;
  quantity: number;
  uom: string;
  sourceCurrency: string;
  fxRate: number;
  inrUnitPrice: number;
  lineSpendInr: number;
  inScope: boolean;
  validationStatus: string;
}

export interface Module1CertifiedHandoff {
  datasetVersion: string;
  sourceSha256: string;
  generatedAt: string;
  totalRecords: number;
  totalSpendInr: number;
  totalSpendCr: number;
  status: 'MODULE_1_FORENSICALLY_VALIDATED';
  handoffRecords: Module1HandoffRecord[];
}

export interface Module1CertificationReport {
  generatedAt: string;
  finalStatus: Module1FinalStatus;
  datasetScope: {
    sourceFileName: string;
    totalRecords: number;
    evaluatedPeriod: string;
    actualDateCoverage: string;
    scopeMismatchDetected: boolean;
  };
  financialTotals: {
    rawSpendInr: number;
    rawSpendCr: number;
    validatedSpendInr: number;
    validatedSpendCr: number;
    excludedSpendInr: number;
    excludedSpendCr: number;
    anomalySpendInr: number;
    anomalySpendCr: number;
    spendReconciliationBalanceInr: number;
  };
  currencyDistribution: Record<string, number>;
  fxForensics: {
    methodology: string;
    ratesApplied: Record<string, number>;
    status: string;
  };
  reconciliations: {
    supplier: 'PASS' | 'FAIL';
    item: 'PASS' | 'FAIL';
    materialGroup: 'PASS' | 'FAIL';
    plant: 'PASS' | 'FAIL';
    monthly: 'PASS' | 'FAIL';
    crossDimension: 'PASS' | 'FAIL';
    pareto: 'PASS' | 'FAIL';
  };
  sampleTransactions: LineSpendCalculationAudit[];
  adversarialSuite: {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
  };
  invariantsSuite: {
    totalInvariants: number;
    satisfiedInvariants: number;
    violatedInvariants: number;
  };
  exceptionsCount: number;
  qualityIndex: QualityIndexDecomposition;
  remainingRisks: string[];
}

export type {
  GoldenDatasetHash,
  AggregationReconciliationMatrixEntry,
  MetamorphicTestResult,
  GoldenTransactionProofEntry,
  ReconciliationWaterfallStep,
  UiBackendReconciliationResult,
  PartitionInvarianceResult,
  RowOrderInvarianceResult,
  DatasetManifest,
  CalculationProofEntry,
  UomAuditSummary
} from './module1ForensicDeliverables';
