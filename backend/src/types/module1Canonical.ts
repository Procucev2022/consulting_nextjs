export interface VgtCurrencyBreakdownItem {
  currency: string;
  transactionCount: number;
  originalSpend?: number;
  profileFxRate?: number;
  profileSpendInr: number;
  profileSpendCr: number;
  historicalSpendInr: number;
  historicalSpendCr: number;
  fxImpactInr: number;
  fxImpactCr: number;
  fxImpactPct: number;
}

export interface VgtSupplierSpendItem {
  rank?: number;
  supplierName?: string;
  supplier_name?: string;
  transactionCount?: number;
  records_count?: number;
  unique_items_count?: number;
  spendInr?: number;
  spendCr?: number;
  spend_inr_cr: number;
  sharePct?: number;
  share_pct?: number;
  cumulativePct?: number;
  cumulative_share_pct?: number;
  paretoClass?: 'A' | 'B';
  in_pareto_80?: boolean;
}

export interface VgtMaterialGroupSpendItem {
  groupCode?: string;
  group_code: string;
  groupName?: string;
  group_name: string;
  recordCount?: number;
  records_count: number;
  unique_items_count?: number;
  unique_vendors_count?: number;
  po_count?: number;
  spendInr?: number;
  spendCr?: number;
  spend_inr_cr: number;
  spend_usd_m?: number;
  sharePct?: number;
  share_pct: number;
  sample_item?: string;
  primary_segment?: string;
  color?: string;
  fy24_spend_inr_cr?: number;
  fy25_spend_inr_cr?: number;
  fy26_spend_inr_cr?: number;
}

export interface VgtPlantSpendItem {
  plantCode?: string;
  plant_code: string;
  plantName?: string;
  plant_name: string;
  recordCount?: number;
  records_count: number;
  unique_items_count?: number;
  unique_vendors_count?: number;
  spendInr?: number;
  spendCr?: number;
  spend_inr_cr: number;
  sharePct?: number;
  share_pct: number;
}

export interface VgtMonthlySpendItem {
  monthKey?: string;
  month_key: string;
  monthLabel?: string;
  month_label: string;
  fiscalYear?: string;
  recordCount?: number;
  records_count: number;
  unique_items_count?: number;
  unique_vendors_count?: number;
  spendInr?: number;
  spendCr?: number;
  spend_inr_cr: number;
  sharePct?: number;
  share_pct?: number;
  mom_change_pct?: number;
}

export interface VgtPeriodMetadata {
  minTransactionDate: string;
  maxTransactionDate: string;
  actualBillingMonths: number;
  actualFiscalYears: string[];
  actualMonthKeys: string[];
  fiscalMonthCoverage: string;
  availableMonthsByFiscalYear: Record<string, number>;
  missingMonthsByFiscalYear: Record<string, string[]>;
  hasMultiYearComparison: boolean;
  has36MonthCoverage: boolean;
}

export interface VgtActualDataCoverage {
  billingMonthsCount: number;
  startDate?: string;
  endDate?: string;
  firstTransactionDate?: string;
  lastTransactionDate?: string;
  dateRangeLabel: string;
  coverageDescription?: string;
}

export interface VgtValidationSummary {
  totalSourceRecords?: number;
  sourceRows?: number;
  validRecordsCount?: number;
  validRows?: number;
  excludedRecordsCount?: number;
  excludedRows?: number;
  anomalyRecordsCount?: number;
  anomalyRows?: number;
  qualityCleanPct?: number;
  cleanSpendYieldPct?: number;
  excludedSpendCr?: number;
  anomalySpendCr?: number;
  recordsActiveText?: string;
  excludedText?: string;
  anomaliesText?: string;
}

export interface VgtModuleStatuses {
  module1: 'READY' | 'IN_PROGRESS' | 'COMPLETED';
  module2: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
  module3: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
  module4: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
  detailedAnalysis?: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
}

export interface VgtParetoSummary {
  totalSpendCr: number;
  top80SpendCr: number;
  top80SpendPct: number;
  topSupplierCount: number;
  totalSupplierCount: number;
}

export interface VgtParetoHierarchyChild {
  name: string;
  spendCr: number;
  percentage: number;
  transactionCount?: number;
}

export interface VgtParetoHierarchyParent {
  id: string;
  name: string;
  totalSpendCr: number;
  sharePct: number;
  cumulativeSpendCr: number;
  cumulativePct: number;
  children: VgtParetoHierarchyChild[];
  transactionCount?: number;
  isCutoffBoundary?: boolean;
}

export interface VgtParetoReconciliation {
  totalValidSpendCr: number;
  vendorParetoSpendCr: number;
  vendorParetoSpendPct: number;
  vendorEntitiesCount: number;
  itemParetoSpendCr: number;
  itemParetoSpendPct: number;
  itemEntitiesCount: number;
  vendorChildVarianceCr: number;
  itemChildVarianceCr: number;
  reconciliationStatus: 'RECONCILED' | 'VARIANCE_DETECTED';
}

export interface VgtParetoHierarchy {
  supplierToShortText: VgtParetoHierarchyParent[];
  shortTextToSupplier: VgtParetoHierarchyParent[];
  reconciliation: VgtParetoReconciliation;
}

export interface Module1CanonicalViewModel {
  assessmentId?: string;
  datasetId: string;
  dataVersionId: string;
  analysisJobId: string;
  sourceFileName: string;
  sourceRowCount: number;
  validRowCount: number;
  excludedRowCount: number;
  anomalyRowCount: number;
  /** Number of excess PO-line rows (Purch.Doc. + Item repeated) found during ingestion. */
  suspectedDuplicateRowCount?: number;

  validFxNormalizedSpendInr: number;
  validFxNormalizedSpendCr: number;

  profileFxBaselineSpendInr: number;
  profileFxBaselineSpendCr: number;

  fxNormalizationImpactInr: number;
  fxNormalizationImpactCr: number;
  fxNormalizationImpactPct: number;
  fxNormalizationImpactStatus?: 'CALCULATED' | 'NOT_CALCULATED';
  /**
   * Describes the provenance of validFxNormalizedSpendCr.
   * 'ERP_CONVERTED'  — value is the sum of the source workbook's pre-converted INR column.
   * 'FX_MASTER_NORMALIZED' — Procucev time-series FX rates were applied.
   */
  spendProvenance?: 'ERP_CONVERTED' | 'FX_MASTER_NORMALIZED';
  isTestData?: boolean;

  detectedCurrencies: string[];
  currencyBreakdown: VgtCurrencyBreakdownItem[];

  uniqueItems: number;
  uniqueVendors: number;
  materialGroups: number;
  operatingPlants: number;
  billingMonths: number;

  configuredEvaluationWindow: string;
  actualDataCoverage: VgtActualDataCoverage;

  supplierSpend: VgtSupplierSpendItem[];
  materialGroupSpend: VgtMaterialGroupSpendItem[];
  plantSpend: VgtPlantSpendItem[];
  monthlySpend: VgtMonthlySpendItem[];

  reconciliationVarianceInr: number;
  reconciliationStatus: 'RECONCILED' | 'PASS' | 'REVIEW_REQUIRED';

  fxMasterVersion: string;
  fxMasterChecksum: string;

  validationSummary: VgtValidationSummary;
  moduleStatuses: VgtModuleStatuses;

  pareto?: VgtParetoSummary;
  paretoHierarchy?: VgtParetoHierarchy;
  periodMetadata?: VgtPeriodMetadata;
}

