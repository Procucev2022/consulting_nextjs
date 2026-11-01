import type {
  CommoditySourceEvidenceObject,
  ExtractedObservationDetail,
  PCBICommodityResearchWorkflowStatus
} from './pcbiCommodityDataLab';

export interface PCBICommoditySourceRow {
  source_id: string;
  commodity_id: string;
  pcbi_id: string;
  series_id: string | null;
  source_name: string;
  publisher: string;
  url: string | null;
  document_name: string;
  publication_date: string | null;
  uploaded_at: string;
  uploaded_by: string;
  file_type: CommoditySourceEvidenceObject['fileType'];
  checksum: string;
  object_key: string;
  geography: string;
  unit: string;
  currency: string;
  frequency: string;
  grade_specification: string;
  delivery_basis: string;
  historical_coverage: string;
  extraction_status: CommoditySourceEvidenceObject['extractionStatus'];
  validation_status: CommoditySourceEvidenceObject['validationStatus'];
  methodology_status: CommoditySourceEvidenceObject['methodologyStatus'];
  approval_status: CommoditySourceEvidenceObject['approvalStatus'];
  extracted_observations_count: number;
}

export interface PCBICommodityObservationRow extends ExtractedObservationDetail {
  pcbi_id: string;
  observation_date: string;
  raw_value: number;
  raw_unit: string;
  raw_currency: string;
  normalized_value: number;
  normalized_unit: string;
  normalized_currency: string;
  frequency: string;
  payload_json: string;
}

export interface PCBICommodityBenchmarkRow {
  pcbi_id: string;
  benchmark_name: string;
  benchmark_unit: string;
  currency: string;
  geography: string;
  category: string;
  sub_category: string;
  sector: string;
  quality_rating: string;
  benchmarkability_percent: number | null;
  effective_from: string | null;
  start_date: string | null;
  end_date: string | null;
  applicable_sectors: string | string[] | null;
}

export interface PCBICommodityPromotionRow {
  promotion_id: string;
  catalog_version_id: string;
  source_id: string;
  commodity_id: string;
  pcbi_id: string;
  approver_name: string;
  comments: string | null;
  promoted_at: string;
  observation_count: number;
}

export interface PCBICommodityResearchAssignmentRow {
  pcbi_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  updated_at: string;
}

export interface PCBICommodityResearchWorkflowRow {
  pcbi_id: string;
  status: PCBICommodityResearchWorkflowStatus;
  due_date: string | null;
  notes: string;
  updated_by: string;
  updated_at: string;
}

export interface PCBIParsedObservation {
  observationDate: string;
  value: number;
  originalRow: Record<string, unknown>;
}

export interface PCBICommoditySpendByUnspscRow {
  unspsc_code: string;
  spend_inr: number;
  transaction_count: number;
}

export interface PCBICommoditySpendSummary {
  spendInr: number;
  transactionCount: number;
  unspscCodes: string[];
}

export interface PCBIDataLabDomainResult {
  detectedDomain: 'CUSTOMER_PURCHASE_HISTORY' | 'PCBI_MASTER_SYSTEM_DATA' | 'COMMODITY_RESEARCH_EVIDENCE' | 'UNKNOWN';
  isAllowedInTarget: boolean;
  targetArea: 'PCBI_MASTER' | 'COMMODITY_DATA_LAB' | 'MODULE_1_INGESTION';
  errorMessage?: string;
  guidanceMessage?: string;
  matchedSignatures: string[];
}

