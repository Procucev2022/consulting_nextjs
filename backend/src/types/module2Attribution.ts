/**
 * Module 2 Transaction-Level Opportunity Attribution Ledger Types
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

export type AttributionEligibilityStatus =
  | 'ELIGIBLE'
  | 'INELIGIBLE'
  | 'EXCLUDED'
  | 'SUSPECTED_DUPLICATE_REVIEW';

export type {
  StrategicSourcingLeverType,
  LeverEvidenceStatus,
  LeverEvaluationModelConfig,
  LeverReconciliationSummary
} from './module2AttributionLevers';

export type AttributionLeverType =
  | 'DIRECT_PRICE_IMPROVEMENT'
  | 'E_AUCTION'
  | 'VENDOR_CONSOLIDATION'
  | 'VOLUME_AGGREGATION'
  | 'PAYMENT_TERMS_OPTIMISATION'
  | 'CATEGORY_SPECIALISATION'
  | 'LOGISTICS_PACKAGING'
  | 'SPECIFICATION_RATIONALISATION'
  | 'CONTRACT_COMPLIANCE_AUDIT'
  | 'NEW_VENDOR_DEVELOPMENT'
  | 'VOLUME_BUNDLING'
  | 'SPECIFICATION_STANDARDIZATION'
  | 'CATEGORY_SPECIALIST_REALIGNMENT'
  | 'PO_CONSOLIDATION'
  | 'NONE'
  | 'UNQUANTIFIED';

export type AttributionOverlapTreatment =
  | 'MUTUALLY_EXCLUSIVE_PRIMARY'
  | 'NO_OVERLAP'
  | 'SECONDARY_SCENARIO'
  | 'EXCLUDED_NON_PRIMARY'
  | 'UNQUANTIFIED';

export type BaselineQualificationStatus =
  | 'OBSERVED_PRICE_VARIANCE'
  | 'VALIDATED_ATTAINABLE_OPPORTUNITY'
  | 'UNVERIFIED_PRICE_VARIANCE'
  | 'UNQUANTIFIED'
  | 'INELIGIBLE';

export type TemporalComparisonStatus =
  | 'INSIDE_WINDOW'
  | 'OUTSIDE_TEMPORAL_WINDOW'
  | 'INSUFFICIENT_PEERS'
  | 'NOT_APPLICABLE';

export type VolumeAttainabilityStatus =
  | 'VOLUME_PARITY_VERIFIED'
  | 'VOLUME_DISPARITY_UNVERIFIED'
  | 'MISSING_VOLUME_EVIDENCE'
  | 'NOT_APPLICABLE';

export interface AttributionEngineConfig {
  temporalWindowDays?: number;
  maxVolumeRatioThreshold?: number;
  outlierRatioThreshold?: number;
  supplierCapacityVerified?: boolean;
  coalSpecificationVerified?: boolean;
}

export interface CandidateLeverEvaluation {
  lever: AttributionLeverType;
  isEligible: boolean;
  eligibilityReason: string;
  isQuantified: boolean;
  unquantifiedReason?: string;
  baselineUnitRate: number | null;
  proposedUnitRate: number | null;
  grossOpportunityInr: number;
  priorityScore: number;
  qualificationStatus?: BaselineQualificationStatus;
  observedPriceVarianceInr?: number;
  validatedAttainableOpportunityInr?: number;
  temporalComparisonStatus?: TemporalComparisonStatus;
  volumeAttainabilityStatus?: VolumeAttainabilityStatus;
  evidenceStatus?: import('./module2AttributionLevers').LeverEvidenceStatus;
  unresolvedConditions?: string[];
}

export interface TransactionAttributionRecord {
  assessmentId: string;
  sourceTransactionId: string;
  sourceRowReference: string | number;
  poNumber: string;
  lineItemId: string;
  supplierId: string;
  supplierName: string;
  materialCode: string;
  itemDescription: string;
  procurementCategory: string;
  unspscCode: string;
  transactionDate: string;
  quantity: number;
  uom: string;
  originalCurrency: string;
  originalAmount: number;
  validatedSpendInr: number;
  candidateLevers: CandidateLeverEvaluation[];
  eligibilityStatus: AttributionEligibilityStatus;
  eligibilityReason: string;
  qualificationStatus: BaselineQualificationStatus;
  observedPriceVarianceInr: number;
  validatedAttainableOpportunityInr: number;
  primaryAttributedLever: AttributionLeverType;
  baselineUnitRate: number | null;
  baselineEvidence: string | null;
  proposedUnitRate: number | null;
  proposedEvidence: string | null;
  grossOpportunityAmountInr: number;
  overlapTreatment: AttributionOverlapTreatment;
  netAttributedOpportunityInr: number;
  confidenceStatus: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNQUANTIFIED';
  calculationMethod: string;
  calculationVersion: string;
  isSuspectedDuplicate: boolean;
  isZeroOrNegativeSpend: boolean;
  isMissingRequiredEvidence: boolean;
  isExcludedFromBaseline: boolean;
  baselineExclusionReason: string | null;
  temporalComparisonStatus: TemporalComparisonStatus;
  volumeAttainabilityStatus: VolumeAttainabilityStatus;
  requiresCategoryTemporalReview: boolean;
}

export interface AttributionSpendCategoryMetrics {
  spendInr: number;
  spendCr: number;
  transactionCount: number;
}

export interface AttributionPopulationMetrics {
  totalTransactionCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
  suspectedDuplicateTransactionCount: number;
  suspectedDuplicateSpendInr: number;
  zeroOrNegativeTransactionCount: number;
  zeroOrNegativeSpendInr: number;
}

export interface AttributionEligibilityMetrics {
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  eligibleTransactionCount: number;
  ineligibleSpendInr: number;
  ineligibleSpendCr: number;
  ineligibleTransactionCount: number;
}

export interface AttributionQuantifiabilityMetrics {
  quantifiedSpendInr: number;
  quantifiedSpendCr: number;
  quantifiedTransactionCount: number;
  unquantifiedSpendInr: number;
  unquantifiedSpendCr: number;
  unquantifiedTransactionCount: number;
  unquantifiedReasonsBreakdown: Record<string, number>;
}

export interface LeverAllocationSummary {
  transactionCount: number;
  allocatedSpendInr: number;
  allocatedSpendCr: number;
  netOpportunityInr: number;
  netOpportunityCr: number;
}

export interface AlternativeScenarioSummary {
  transactionCount: number;
  unrealizedOpportunityInr: number;
  unrealizedOpportunityCr: number;
}

export interface OpportunityWaterfallSummary {
  grossOpportunityInr: number;
  grossOpportunityCr: number;
  overlapDeductionsInr: number;
  overlapDeductionsCr: number;
  netOpportunityInr: number;
  netOpportunityCr: number;
  grossCandidateOpportunityInr: number;
  grossCandidateOpportunityCr: number;
  multiLeverOverlapDeductionsInr: number;
  multiLeverOverlapDeductionsCr: number;
  volumeDisparityExclusionsInr: number;
  volumeDisparityExclusionsCr: number;
  otherQualificationExclusionsInr: number;
  otherQualificationExclusionsCr: number;
  netQualifiedCandidateOpportunityInr: number;
  netQualifiedCandidateOpportunityCr: number;
  commerciallyValidatedSavingsInr: number;
  commerciallyValidatedSavingsCr: number;
  totalObservedVarianceInr: number;
  totalObservedVarianceCr: number;
  totalValidatedOpportunityInr: number;
  totalValidatedOpportunityCr: number;
  reconciliationBalanceInr: number;
  isArithmeticallyBalanced: boolean;
  isCertified: boolean;
  certificationNotice: string;
}

export interface AttributionReconciliationReport {
  assessmentId: string;
  timestamp: string;
  version: string;
  sourcePopulation: AttributionPopulationMetrics;
  spendEligibility: AttributionEligibilityMetrics;
  spendExcludedFromBaseline: AttributionSpendCategoryMetrics;
  spendWithObservedVariance: AttributionSpendCategoryMetrics;
  spendWithValidatedOpportunity: AttributionSpendCategoryMetrics;
  quantifiability: AttributionQuantifiabilityMetrics;
  primaryAllocationsByLever: Record<string, LeverAllocationSummary>;
  alternativeScenariosByLever: Record<string, AlternativeScenarioSummary>;
  opportunityWaterfall: OpportunityWaterfallSummary;
  leverReconciliation?: Record<string, import('./module2AttributionLevers').LeverReconciliationSummary>;
}

export interface TransactionAttributionLedgerResult {
  assessmentId: string;
  recordCount: number;
  records: TransactionAttributionRecord[];
  reconciliation: AttributionReconciliationReport;
  timestamp: string;
  version: string;
}

export interface AttributionPrimarySelection {
  primaryLever: AttributionLeverType;
  netInr: number;
  overlapTreatment: AttributionOverlapTreatment;
  baselinePrice: number | null;
  proposedPrice: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNQUANTIFIED';
  qualificationStatus: BaselineQualificationStatus;
  observedVarianceInr: number;
  validatedOpportunityInr: number;
  temporalStatus: TemporalComparisonStatus;
  volumeStatus: VolumeAttainabilityStatus;
}

export interface AttributionHeaderMeta {
  assessmentId: string;
  sourceTransactionId: string;
  sourceRowReference: number;
  poNumber: string;
  lineItemId: string;
  supplierId: string;
  supplierName: string;
}

export interface AttributionItemMeta {
  materialCode: string;
  itemDescription: string;
  procurementCategory: string;
  unspscCode: string;
  transactionDate: string;
  quantity: number;
  uom: string;
  originalCurrency: string;
  originalAmount: number;
  validatedSpendInr: number;
}

export interface AttributionPriceEvidence {
  baselineEv: string | null;
  proposedEv: string | null;
}
