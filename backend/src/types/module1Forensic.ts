/**
 * Module 1 Final Forensic Validation & Financial Source-of-Truth Certification Types
 *
 * Enforces strict typing for:
 * - Data contract and data dictionary
 * - Raw Transaction Ledger vs Validated Transaction Ledger
 * - Forensic date and period scoping
 * - FX rate methodology and multi-currency auditing
 * - Precision, rounding, and calculation tolerances
 * - Zero, negative, null, and anomaly classification
 * - Multi-level duplicate forensics
 * - Master data normalization (Supplier, Item, Material Group, Plant)
 * - Multi-dimensional reconciliations and Pareto 80% threshold crossing
 * - Cross-dimension invariants and adversarial test scenarios
 * - Certification gate and audit reports
 */

export type TransactionInclusionStatus = 'VALID' | 'EXCLUDED' | 'ANOMALY' | 'REQUIRES_REVIEW';

export type DetailedValidationStatus =
  | 'PASSED_CLEAN'
  | 'PASSED_WITH_NORMALIZATION'
  | 'PASSED_WITH_WARNING'
  | 'EXCLUDED'
  | 'FAILED'
  | 'REQUIRES_REVIEW';

export type DuplicateClassification = 'EXACT_DUPLICATE' | 'POTENTIAL_DUPLICATE' | 'LEGITIMATE_REPEAT_TRANSACTION';

export type ScopeMismatchFlag = 'PERIOD_SCOPE_MATCH' | 'PERIOD_SCOPE_MISMATCH';

export type FXStatusFlag = 'FX_VALID' | 'FX_DATA_UNAVAILABLE' | 'FX_ZERO_OR_NEGATIVE' | 'FX_UNSUPPORTED_CURRENCY';

export interface DataQualityRuleResult {
  ruleId: string;
  ruleName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recordsEvaluated: number;
  violationsFound: number;
  passRatePct: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  financialImpactInr: number;
  action: string;
}

export interface SourceToKpiLineageEntry {
  kpiName: string;
  reportedValue: string | number;
  backendValue: string | number;
  variance: string | number;
  proofChain: string;
  aggregationOperation: string;
  recordCount: number;
  sampleSourceRows: string;
  status: 'PASS' | 'FAIL';
}

export interface LiveFxIndependenceResult {
  originalHistoricalSpendInr: number;
  simulatedLiveFxSpendInr: number;
  varianceInr: number;
  isIndependent: boolean;
  status: 'PASS' | 'FAIL';
  isolationConfirmed: boolean;
}

export interface ReproducibilityAuditResult {
  run1TotalInr: number;
  run2TotalInr: number;
  varianceInr: number;
  isReproducible: boolean;
  status: 'PASS' | 'FAIL';
}

export interface DataDictionaryField {
  sourceField: string;
  targetField: string;
  datatype: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  transformationRule: string;
  validationRule: string;
  calculationDependency: string[];
  displayRule: string;
}

export interface RawTransactionLedgerRecord {
  recordId: string;
  sourceRow: number;
  sourceFile: string;
  purchasingDocCategory?: string;
  purchasingDocType?: string;
  purchasingGroup?: string | number;
  poNumber: string;
  poLine: number | string;
  documentDateRaw: string | number;
  supplierCode: string;
  supplierName: string;
  materialCode: string;
  shortText: string;
  materialGroup: string;
  plant: string;
  storageLocation?: string;
  orderQuantity: number;
  orderUnit: string;
  quantityInSku?: number;
  sku?: string;
  netPrice: number;
  currency: string;
  totalInrRaw: number;
  totalInCrsRaw: number;
  priceUnit?: number;
  deletionIndicator?: string;
  itemCategory?: string;
  acctAssignmentCat?: string;
}

export interface ValidatedTransactionLedgerRecord {
  recordId: string;
  sourceRow: number;
  sourceFile: string;
  rawRecordId: string;
  poNumber: string;
  poLine: number | string;
  transactionDate: string;
  billingMonth: string;
  fiscalYear: string;
  vendorCode: string;
  vendorName: string;
  normalizedVendor: string;
  vendorConfidence: number;
  itemCode: string;
  itemDescription: string;
  normalizedItem: string;
  materialGroup: string;
  plant: string;
  quantity: number;
  uom: string;
  netPrice: number;
  currency: string;
  approvedFxRate: number;
  fxRateDate: string;
  fxRateSource: string;
  inrUnitPrice: number;
  lineSpendInr: number;
  lineSpendCr: number;
  inclusionStatus: TransactionInclusionStatus;
  exclusionReason?: string;
  anomalyReason?: string;
  duplicateStatus: DuplicateClassification;
}

export interface DateScopeAuditResult {
  sourceFileName: string;
  minTransactionDate: string;
  maxTransactionDate: string;
  distinctMonthsCount: number;
  distinctMonths: string[];
  distinctFiscalYearsCount: number;
  distinctFiscalYears: string[];
  recordsByMonth: Record<string, number>;
  spendByMonthInr: Record<string, number>;
  spendByMonthCr: Record<string, number>;
  configuredEvaluationPeriod: string;
  actualCoveragePeriod: string;
  recordsOutsidePeriod: number;
  spendOutsidePeriodInr: number;
  scopeFlag: ScopeMismatchFlag;
  scopeDiscrepancyExplanation: string;
}

export interface FXAuditRecord {
  currency: string;
  recordCount: number;
  totalSourceSpend: number;
  totalInrSpend: number;
  samplePrice: number;
  sampleFxRate: number;
  fxRateDate: string;
  fxRateSource: string;
  status: FXStatusFlag;
  methodology: string;
}

export interface LineSpendCalculationAudit {
  recordId: string;
  sourceRow: number;
  quantity: number;
  netPrice: number;
  currency: string;
  fxRate: number;
  expectedSpendInr: number;
  systemSpendInr: number;
  varianceInr: number;
  status: 'PASS' | 'FAIL';
  calculationFormula: string;
}

export interface PrecisionForensicResult {
  calculationValueInr: number;
  calculationValueCr: number;
  displayedCrores2Decimals: string;
  reconstructedFromDisplayInr: number;
  varianceInr: number;
  isPrecisionPreserved: boolean;
  proofDisplayNotEqualCalculation: boolean;
}

export interface DuplicateAuditResult {
  totalRecordsChecked: number;
  exactDuplicatesCount: number;
  exactDuplicateSpendInr: number;
  businessDuplicatesCount: number;
  businessDuplicateSpendInr: number;
  potentialDuplicatesCount: number;
  potentialDuplicateSpendInr: number;
  legitimateRepeatsCount: number;
  legitimateRepeatSpendInr: number;
  status: 'PASS' | 'FLAGGED';
}

export interface SupplierNormalizationRecord {
  rawVendor: string;
  vendorCode: string;
  normalizedVendor: string;
  normalizationReason: string;
  confidence: number;
  sourceRecordsCount: number;
  totalSpendInr: number;
}

export interface ItemNormalizationRecord {
  rawItemCode: string;
  rawShortText: string;
  normalizedItem: string;
  materialGroup: string;
  isNumericSku: boolean;
  uniqueItemTreated: boolean;
  sourceRecordsCount: number;
  totalSpendInr: number;
}

export type {
  DimensionSpendSummary,
  CrossDimensionReconciliationResult,
  ParetoAuditResult,
  QualityIndexDecomposition,
  ExceptionRegisterEntry,
  AdversarialScenarioResult,
  MathematicalInvariantResult,
  Module1FinalStatus,
  Module1CertificationReport,
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
  UomAuditSummary,
  Module1HandoffRecord,
  Module1CertifiedHandoff,
  DataQualityLedgerRow,
  TransactionProvenanceEntry,
  HandoffValidationResult,
  NegativeTestScenarioResult,
  GoldenDatasetTestResult
} from './module1ForensicAudit';
