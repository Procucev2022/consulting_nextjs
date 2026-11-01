/**
 * Module 3 PCBI — Frontend Missing-Index Gap List Types
 * Conforms to Rule 9 (Types isolation, no inline types) and file length <= 300 lines.
 */

export type PCBIMissingIndexExplicitStatus =
  | 'VERIFIED OBSERVATIONS AVAILABLE'
  | 'BENCHMARK DEFINED — OBSERVATIONS MISSING'
  | 'SOURCE IDENTIFIED — DATA NOT ACQUIRED'
  | 'LICENSE REQUIRED'
  | 'MAPPING / SPECIFICATION REVIEW REQUIRED'
  | 'STALE DATA'
  | 'UNMAPPED — RESEARCH REQUIRED'
  | 'NO SUITABLE BENCHMARK IDENTIFIED';

export type PCBIGapStatus = PCBIMissingIndexExplicitStatus;

export interface PCBIMissingIndexGapItem {
  id: string;
  materialCode: string;
  materialDescription: string;
  commodityClassification: string;
  unspscCode: string;
  existingGradeSpecification: string;
  customerSpendCr: number;
  customerSpendInr: number;
  transactionCount: number;
  spendSharePct: number;
  pcbiSeriesId: string | null;
  benchmarkSeriesName: string | null;
  benchmarkPublisherSource: string;
  sourceStatus: string;
  observationCoverage: string;
  latestObservationDate: string | null;
  gapStatus: PCBIGapStatus;
  gapReason: string;
  nextActionRequired: string;
}

export interface PCBIGapStatusSummaryItem {
  status: PCBIGapStatus;
  statusLabel: string;
  itemCount: number;
  transactionCount: number;
  totalSpendCr: number;
  totalSpendInr: number;
  spendPercentage: number;
  actionGuidance: string;
}

export interface PCBIMissingIndexGapReport {
  assessmentId: string;
  customerId: string;
  customerName: string;
  reportDate: string;
  baselineSpendCr: number;
  baselineSpendInr: number;
  baselineTransactions: number;
  totalRequirementsCount: number;
  verifiedObservationsCount: number;
  verifiedSpendCr: number;
  missingIndexGapSpendCr: number;
  missingIndexGapSpendPct: number;
  quarantinedObservationsCount: number;
  certifiedSavingsCr: number;
  realizedSavingsCr: number;
  pcbiIndexCalculated: boolean;
  statusSummaries: PCBIGapStatusSummaryItem[];
  items: PCBIMissingIndexGapItem[];
}

export interface PCBIMissingIndexGapViewProps {
  assessmentId?: string;
  onSelectRequirement?: (item: PCBIMissingIndexGapItem) => void;
}

export interface PCBIMissingIndexTableProps {
  items: PCBIMissingIndexGapItem[];
  onSelectRequirement?: (item: PCBIMissingIndexGapItem) => void;
  onUploadBenchmark?: (item: PCBIMissingIndexGapItem) => void;
  onNavigateToMappingReview?: (materialCode: string) => void;
}

export interface PCBIMaterialAuditModalProps {
  isOpen: boolean;
  item: PCBIMissingIndexGapItem | null;
  onClose: () => void;
  onUploadBenchmark?: (item: PCBIMissingIndexGapItem) => void;
  onNavigateToMappingReview?: (materialCode: string) => void;
}

export interface PCBIMissingIndexStatusCardsProps {
  report: PCBIMissingIndexGapReport;
  selectedStatus: PCBIGapStatus | 'ALL';
  onSelectStatus: (status: PCBIGapStatus | 'ALL') => void;
}

