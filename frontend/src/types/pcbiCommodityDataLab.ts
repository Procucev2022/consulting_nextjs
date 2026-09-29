import type { PCBIDataFrequency } from './pcbiCommodityCoverage';

export type PCBIDomainType =
  | 'CUSTOMER_PURCHASE_HISTORY'
  | 'PCBI_MASTER_SYSTEM_DATA'
  | 'COMMODITY_RESEARCH_EVIDENCE'
  | 'UNKNOWN';

export interface PCBIDomainValidationResult {
  detectedDomain: PCBIDomainType;
  isAllowedInTarget: boolean;
  targetArea: 'PCBI_MASTER' | 'COMMODITY_DATA_LAB' | 'MODULE_1_INGESTION';
  errorMessage?: string;
  guidanceMessage?: string;
  matchedSignatures: string[];
}

export interface CommoditySourceEvidenceObject {
  sourceId: string;
  sourceName: string;
  publisher: string;
  url: string;
  documentName: string;
  publicationDate: string;
  uploadDate: string;
  fileType: 'XLSX' | 'XLS' | 'CSV' | 'PDF' | 'JSON' | 'TXT';
  checksum: string;
  geography: string;
  gradeSpecification: string;
  unit: string;
  currency: string;
  frequency: PCBIDataFrequency;
  deliveryBasis: string;
  historicalCoverage: string;
  extractionStatus: 'PENDING' | 'EXTRACTED' | 'FAILED';
  validationStatus: 'PENDING' | 'VALIDATED' | 'ISSUES_DETECTED';
  methodologyStatus: 'PENDING' | 'METHODOLOGY_APPROVED' | 'METHODOLOGY_REJECTED';
  approvalStatus: 'UNDER_REVIEW' | 'ADMIN_APPROVED' | 'REJECTED';
  extractedObservationsCount: number;
}

export interface CommodityResearchQueueRow {
  commodity: string;
  commodityId: string;
  module2Classification: string;
  unspsc: string;
  customerSpend: number;
  customerSpendCr: string;
  transactionCount: number;
  pcbiId: string;
  seriesId: string;
  currentStatus: string;
  requiredHistory: string;
  availableHistory: string;
  requiredFrequency: PCBIDataFrequency;
  availableFrequency: PCBIDataFrequency | 'NONE';
  sourceStatus: string;
  methodologyStatus: string;
  priority: string;
  researchStatus: string;
  lastUpdated: string;
  action: string;
}

export interface CommodityWorkspaceOverview {
  commodityId: string;
  commodityName: string;
  pcbiId: string;
  seriesId: string;
  module2Classification: string;
  unspsc: string;
  currentStatus: string;
  customerSpendInr: number;
  customerSpendCr: string;
  transactionCount: number;
  requiredStartDate: string;
  requiredEndDate: string;
  requiredFrequency: PCBIDataFrequency;
  requiredUnit: string;
  requiredCurrency: string;
  requiredGeography: string;
  availableHistory: string;
  priority: string;
  researchStatus: string;
  lastUpdated: string;
}

export type CommodityWorkspaceTabKey =
  | 'OVERVIEW'
  | 'RESEARCH_QUEUE'
  | 'UPLOAD_DATA'
  | 'SOURCE_REGISTER'
  | 'EXTRACTED_OBSERVATIONS'
  | 'STANDARDIZATION_PREVIEW'
  | 'SOURCE_COMPARISON'
  | 'METHODOLOGY'
  | 'VALIDATION'
  | 'APPROVAL'
  | 'VERSION_HISTORY'
  | 'PCBI_HISTORY';

export interface CommodityWorkspaceDetail {
  overview: CommodityWorkspaceOverview;
  sources: CommoditySourceEvidenceObject[];
  extractedObservations: Array<{
    observationId: string;
    sourceId: string;
    sourceDate: string;
    rawValue: number;
    rawUnit: string;
    rawCurrency: string;
    normalizedValue: number;
    normalizedUnit: string;
    normalizedCurrency: string;
    frequency: string;
    status: 'VERIFIED' | 'NEEDS_REVIEW';
  }>;
  methodologyDetails: {
    methodologyId: string;
    title: string;
    status: string;
    conversionRule: string;
    governanceNotes: string;
  };
  validationSummary: {
    passed: boolean;
    totalObservations: number;
    validObservations: number;
    missingPeriods: string[];
    criticalErrorsCount: number;
  };
  approvalPackage: {
    isReadyForApproval: boolean;
    canWriteToCatalog: boolean;
    approvalGateStatus: 'LOCKED_PENDING_REVIEW' | 'APPROVED_READY_FOR_CATALOG' | 'CATALOG_PUBLISHED';
    approverName?: string;
    approvedAt?: string;
  };
  activeTab: CommodityWorkspaceTabKey;
}

export interface PCBIResearchDashboardMetrics {
  totalCommodities: number;
  productionReadyCount: number;
  partialHistoryCount: number;
  noHistoryCount: number;
  missingCount: number;
  sourceUnverifiedCount: number;
  methodologyPendingCount: number;
  specificationMismatchCount: number;
  frequencyMismatchCount: number;
  highImpactGapsCount: number;
  queueByPriority: {
    p1Critical: number;
    p2High: number;
    p3Medium: number;
    p4Low: number;
  };
}

export type PCBIAdminTopNavigationTab =
  | 'PCBI_MASTER'
  | 'PCBI_COMMODITY_DATA_LAB'
  | 'PCBI_DATA_LIBRARY'
  | 'PCBI_DASHBOARD';

export type PCBIDataLibrarySubTab =
  | 'COVERAGE_DASHBOARD'
  | 'RESEARCH_QUEUE'
  | 'COMMODITY_PCBI'
  | 'SOURCE_LIBRARY'
  | 'UPLOAD_PCBI_DATA'
  | 'VALIDATION_QUEUE'
  | 'PENDING_APPROVAL'
  | 'ACTIVE_PCBI_SERIES'
  | 'VERSION_HISTORY';

export type PCBIEnterpriseStatus =
  | 'PRODUCTION_READY'
  | 'PARTIAL_HISTORY'
  | 'NO_HISTORY'
  | 'MISSING'
  | 'SOURCE_UNVERIFIED'
  | 'METHODOLOGY_PENDING'
  | 'SPECIFICATION_MISMATCH'
  | 'FREQUENCY_MISMATCH'
  | 'NOT_BENCHMARKABLE'
  | 'VALIDATION_PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface PCBISourceComparisonRecord {
  sourceId: string;
  sourceName: string;
  publisher: string;
  coverageStart: string;
  coverageEnd: string;
  frequency: PCBIDataFrequency;
  unit: string;
  currency: string;
  geography: string;
  specification: string;
  status: string;
  methodology: string;
  variancePct: number | null;
  validationResult: 'PASSED' | 'PENDING' | 'REJECTED';
}
