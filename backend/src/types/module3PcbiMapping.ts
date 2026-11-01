/**
 * Module 3 PCBI Phase 2 — Benchmark Catalog, Source Availability & Material Mapping Types
 * Conforms to strict rule 9 (no inline types) and rule 8.
 */

export type BenchmarkSourceAvailability =
  | 'VERIFIED_DATA_AVAILABLE'
  | 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED'
  | 'LICENSE_REQUIRED'
  | 'MANUAL_VALIDATION_REQUIRED'
  | 'NO_SUITABLE_SOURCE_IDENTIFIED';

export type BenchmarkMappingStatus =
  | 'MAPPED_APPROVED'
  | 'MAPPED_PENDING_APPROVAL'
  | 'REJECTED'
  | 'INCOMPATIBLE_SPECIFICATION'
  | 'INCOMPATIBLE_UOM'
  | 'INCOMPATIBLE_CURRENCY'
  | 'NO_SUITABLE_BENCHMARK_IDENTIFIED'
  | 'NEW_BENCHMARK_SERIES_REQUIRED'
  | 'UNMAPPED';

export type MappingConfidenceRating = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNMAPPED';

export type SpecificationComparability =
  | 'IDENTICAL_GRADE'
  | 'PROXY_GRADE'
  | 'NOT_COMPARABLE'
  | 'UNVERIFIED';

export type GeographyCompatibility =
  | 'DOMESTIC_EX_WORKS'
  | 'IMPORT_PARITY'
  | 'REGIONAL_DELIVERED'
  | 'INCOMPATIBLE';

export type DeliveryTermCompatibility =
  | 'EX_WORKS_MATCHED'
  | 'FOR_DESTINATION_MATCHED'
  | 'FREIGHT_ADJUSTMENT_REQUIRED'
  | 'INCOMPATIBLE';

export interface UnitConversionRule {
  sourceUom: string;
  targetBenchmarkUom: string;
  conversionFactor: number;
  isTraceable: boolean;
  notes?: string;
}

export interface CurrencyConversionRule {
  sourceCurrency: string;
  targetBenchmarkCurrency: string;
  fxSource: string;
  isTraceable: boolean;
}

export interface MaterialMappingAuditEntry {
  action: string;
  actor: string;
  timestamp: string;
  comment: string;
}

export interface MaterialBenchmarkMappingRecord {
  id: string;
  assessmentId: string;
  customerName: string;
  materialCode: string;
  materialDescription: string;
  spendCategory: string;
  unspscCode?: string;
  unspscCommodity?: string;
  historicalSpendInr: number;
  historicalSpendCr: number;
  transactionCount: number;
  sourceUom: string;
  sourceCurrency: string;

  // Benchmark Target
  benchmarkSeriesId?: string;
  benchmarkSeriesName?: string;
  benchmarkPublisher?: string;
  benchmarkGeography?: string;
  benchmarkDeliveryTerm?: string;
  benchmarkUom?: string;
  benchmarkCurrency?: string;
  sourceAvailability: BenchmarkSourceAvailability;

  // Comparability & Conversions
  specificationComparability: SpecificationComparability;
  geographyCompatibility: GeographyCompatibility;
  deliveryTermCompatibility: DeliveryTermCompatibility;
  unitConversion: UnitConversionRule;
  currencyConversion: CurrencyConversionRule;

  // Governance & Review
  mappingStatus: BenchmarkMappingStatus;
  confidenceRating: MappingConfidenceRating;
  evidenceRationale: string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedBy?: string;
  approvalTimestamp?: string;
  auditHistory: MaterialMappingAuditEntry[];
}

export interface BorosilBenchmarkRequirementsItem {
  materialGroupId: string;
  materialGroupName: string;
  priorityRank: number;
  materialsCount: number;
  transactionCount: number;
  totalHistoricalSpendCr: number;
  sapMaterialCodes: string[];
  module2Categories: string[];
  purchaseUoms: string[];
  normalizedUom: string;
  requiredBenchmarkSpecification: string;
  candidatePublisher: string;
  sourceFrequency: 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'NONE';
  geographicCoverage: string;
  requiredCurrency: 'INR' | 'USD';
  deliveryTerms: string;
  actualSourceAvailability: BenchmarkSourceAvailability;
  mappingConfidence: MappingConfidenceRating;
  unresolvedQuestions: string[];
}

export interface BorosilBenchmarkCoverageSummary {
  assessmentId: string;
  customerName: string;
  baselineSpendCr: number;
  baselineTransactions: number;
  evaluatedMaterialsCount: number;
  mappedApprovedSpendCr: number;
  mappedApprovedSpendPct: number;
  mappedPendingApprovalSpendCr: number;
  sourceIdentifiedSpendCr: number;
  licenseRequiredSpendCr: number;
  manualValidationRequiredSpendCr: number;
  noSuitableSourceSpendCr: number;
  unmappedSpendCr: number;
  unmappedSpendPct: number;
  marketVarianceValueCr: number;
  certifiedSavingsCr: number;
  realizedSavingsCr: number;
  module4Executed: boolean;
  finalStatus?: string;
  nrSpendCr?: number;
  researchStatus?: string;
}
