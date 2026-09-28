/**
 * PCBI Module 3 — Business Validation & Commodity Population Mode Types
 */

export type PCBIModule3SoftwareStatus = 'PRODUCTION_READY_DYNAMIC_PCBI';

export type PCBICommoditySeriesStatus =
  | 'PRODUCTION_READY'
  | 'PARTIAL_HISTORY'
  | 'NO_HISTORY'
  | 'MISSING'
  | 'SOURCE_UNVERIFIED'
  | 'METHODOLOGY_PENDING'
  | 'SPECIFICATION_MISMATCH'
  | 'FREQUENCY_MISMATCH'
  | 'NOT_BENCHMARKABLE';

export type PCBIDataFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'FORTNIGHTLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL';

export interface PCBIFrequencyMismatchDetails {
  sourceFrequency: PCBIDataFrequency;
  requiredFrequency: PCBIDataFrequency;
  availableHistory: string;
  missingPeriod: string;
  proposedTransformation: string;
  methodologyId: string;
  adminApprovalRequired: true;
}

export interface PCBIDynamicExtractionMapping {
  sourceDate: string;
  rawValue: string;
  rawUnit: string;
  rawCurrency: string;
  sourceFrequency: PCBIDataFrequency;
  sourceGeography: string;
  sourceGrade: string;
  status: 'EXTRACTION_VERIFIED' | 'EXTRACTION_REVIEW_REQUIRED';
}

export type PCBIResearchPriority =
  | 'P1 — Critical Coverage Gap'
  | 'P2 — High Coverage Gap'
  | 'P3 — Medium Coverage Gap'
  | 'P4 — Low Coverage Gap';

export type PCBIResearchStatus =
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'SOURCE_IDENTIFIED'
  | 'DATA_UPLOADED'
  | 'NOT_BENCHMARKABLE'
  | 'RESOLVED';

export interface PCBIResearchGapQueueItem {
  commodityId: string;
  commodityName: string;
  module2Classification: string;
  unspsc: string;
  customerSpend: number;
  customerSpendCr: string;
  transactionCount: number;
  pcbiId: string;
  pcbiDefinitionStatus: string;
  pcbiDataStatus: string;
  requiredStartDate: string;
  requiredEndDate: string;
  requiredFrequency: string;
  requiredUnit: string;
  requiredCurrency: string;
  requiredGeography: string;
  availableHistory: string;
  sourceStatus: string;
  methodologyStatus: string;
  materiality: string;
  priority: PCBIResearchPriority;
  adminAction: string;
  researchStatus: PCBIResearchStatus;
  dateAdded: string;
  lastUpdated: string;
}

export type PCBISourceType =
  | 'GOVERNMENT'
  | 'EXCHANGE'
  | 'INDUSTRY_ASSOCIATION'
  | 'PRODUCER_PUBLICATION'
  | 'MARKET_REPORT'
  | 'HISTORICAL_PDF'
  | 'HISTORICAL_EXCEL'
  | 'CSV'
  | 'PUBLIC_STATISTICAL_DB'
  | 'COMMERCIAL';

export interface PCBIMultiSourceRecord {
  sourceId: string;
  sourceName: string;
  sourceType: PCBISourceType;
  url: string;
  document: string;
  publisher: string;
  publicationDate: string;
  checksum: string;
  frequency: string;
  unit: string;
  currency: string;
  geography: string;
  sourceStatus: 'VALIDATED' | 'UNDER_EVALUATION' | 'UNVERIFIED' | 'REJECTED';
}

export interface PCBISourceComparisonView {
  commodityId: string;
  commodityName: string;
  period: string;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    value: number;
    unit: string;
    currency: string;
    frequency: string;
    geography: string;
    status: string;
  }>;
  variancePct: number;
  recommendedHierarchy: string[];
  adminApprovalRequired: true;
}

export interface PCBIUnitCurrencyDisplayQA {
  customerValue: number;
  customerUnit: string;
  customerCurrency: string;
  pcbiValue: number;
  pcbiUnit: string;
  pcbiCurrency: string;
  isValidDisplay: boolean;
  discrepancyError: string | null;
}

export interface PCBICommodityCoverageDashboard {
  totalCustomerSpend: number;
  totalCustomerSpendCr: string;
  pcbiCoveredSpend: number;
  pcbiCoveredSpendCr: string;
  pcbiUncoveredSpend: number;
  pcbiUncoveredSpendCr: string;
  coveragePct: number;
  commodityCounts: Record<PCBICommoditySeriesStatus, number>;
  topUncoveredCommoditiesBySpend: Array<{
    commodity: string;
    spend: number;
    spendCr: string;
    reason: string;
  }>;
  topMissingPcbiDefinitions: string[];
  topHistoricalDataGaps: string[];
  publicSourceCandidates: string[];
  commercialSourceRequiredCandidates: string[];
}
