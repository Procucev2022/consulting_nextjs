/**
 * PCBI Module 3 Forensic Data-Lineage & Benchmark Certification Types
 */

export interface PcbiMasterRecord {
  pcbiId: string;
  commodity: string;
  category: string;
  benchmarkName: string;
  source: string;
  sourceAccessTier: string;
  sourceFrequency: string;
  benchmarkUnit: string;
  currency: string;
  qualityGrade: string;
  coverageStatus: string;
  effectiveFrom: string;
  effectiveTo: string;
  transformationMethod: string;
  evidenceReference: string;
  lastValidatedDate: string;
}

export interface PcbiSourceProvenanceRecord {
  sourceId: string;
  pcbiId: string;
  commodity: string;
  sourceName: string;
  sourceType: string;
  publisher: string;
  frequency: string;
  unit: string;
  currency: string;
  url: string;
  documentRef: string;
  accessTier: string;
  licenseRequired: boolean;
  manualAuthRequired: boolean;
  frequencyCompatible: boolean;
  unitCompatible: boolean;
  currencyCompatible: boolean;
  status: string;
}

export interface PcbiObservationRecord {
  pcbiId: string;
  observationDate: string;
  valueInr: number;
  originalValue: number;
  originalCurrency: string;
  fxRate: number;
  unit: string;
  source: string;
  status: string;
}

export interface PcbiCustomerTransactionBenchmarkRecord {
  recordId: string;
  sourceRow: number;
  poNumber: string;
  transactionDate: string;
  supplierCode: string;
  supplierName: string;
  itemCode: string;
  itemDescription: string;
  materialGroup: string;
  quantity: number;
  orderUnit: string;
  transactionUnitPrice: number;
  currency: string;
  transactionSpendInr: number;
  mappingStatus: 'MAPPED' | 'PARTIAL' | 'UNMAPPED' | 'NOT_BENCHMARKABLE' | 'SERVICE' | 'UNMAPPED_BENCHMARK_SIGNAL';
  unmappedSignal?: 'UNMAPPED_BENCHMARK_SIGNAL';
  unmappedReason?: string;
  marketVarianceValue?: number;
  pcbiId?: string;
  benchmarkDateUsed?: string;
  rawBenchmarkPrice?: number;
  benchmarkCurrency?: string;
  normalizedBenchmarkPriceInr?: number;
  conversionFactor: number;
  unitPriceDifferenceInr?: number;
  priceDifferencePct?: number;
  potentialPriceGapInr?: number;
  direction?: 'ABOVE_BENCHMARK' | 'AT_BENCHMARK' | 'BELOW_BENCHMARK' | 'UNBENCHMARKED';
  qualityGrade?: string;
  sourceTier?: string;
  isOutlier: boolean;
  outlierReason?: string;
}

export interface PcbiSpendReconciliation {
  totalValidatedSpendInr: number;
  totalValidatedSpendCr: number;
  benchmarkableSpendInr: number;
  benchmarkableSpendCr: number;
  partiallyBenchmarkableSpendInr: number;
  partiallyBenchmarkableSpendCr: number;
  notBenchmarkableSpendInr: number;
  notBenchmarkableSpendCr: number;
  unmappedSpendInr: number;
  unmappedSpendCr: number;
  serviceSpendInr: number;
  serviceSpendCr: number;
  sumCalculatedInr: number;
  sumCalculatedCr: number;
  reconciliationVarianceInr: number;
  reconciliationVarianceCr: number;
  transactionCoveragePct: number;
  spendCoveragePct: number;
  categoryCoveragePct: number;
  isReconciled: boolean;
}

export interface PcbiBenchmarkPriceGapResult {
  totalBenchmarkedTransactions: number;
  aboveBenchmarkCount: number;
  atBenchmarkCount: number;
  belowBenchmarkCount: number;
  totalBenchmarkPriceGapInr: number;
  totalBenchmarkPriceGapCr: number;
  maxPriceGapPct: number;
  outlierCount: number;
  belowBenchmarkSpendInr: number;
  belowBenchmarkSpendCr: number;
  analyticalCaveat: string;
}

export interface PcbiIndependentAuditComparison {
  dimension: string;
  productionValue: number | string;
  independentValue: number | string;
  variance: number | string;
  status: 'MATCH' | 'VARIANCE';
}

export interface PcbiTestMatrixItem {
  testId: string;
  description: string;
  status: 'PASSED' | 'FAILED';
  evidence: string;
}

export interface PcbiForensicCertificationReport {
  pcbiMasterVersion: string;
  pcbiChecksum: string;
  totalPcbiSeries: number;
  totalBenchmarkObservations: number;
  sourceDistribution: Record<string, number>;
  qualityDistribution: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
  };
  coverageBySpend: {
    benchmarkableSpendCr: number;
    totalSpendCr: number;
    spendCoveragePct: number;
  };
  coverageByTransaction: {
    benchmarkableTxCount: number;
    totalTxCount: number;
    txCoveragePct: number;
  };
  coveredCategories: string[];
  unmappedCategories: string[];
  nonBenchmarkableCategories: string[];
  frequencyMismatchCount: number;
  missingObservationCount: number;
  customerTransactionToPcbiMappingCount: number;
  benchmarkableSpend: number;
  benchmarkPriceGapAmount: number;
  benchmarkPriceGapTransactionCount: number;
  independentCalculation: Record<string, number | string>;
  productionVsIndependentVariance: number;
  uiApiEvidenceVariance: number;
  module1Regression: string;
  module2Regression: string;
  vgtChecksum: string;
  fxChecksum: string;
  evidenceWorkbookSha256: string;
  testCount: {
    total: number;
    passed: number;
    failed: number;
  };
  browserValidation: string;
  p0DefectsCount: number;
  p1DefectsCount: number;
  p2DefectsCount: number;
  finalVerdict: 'PCBI CERTIFIED' | 'PCBI NOT CERTIFIED';
}
