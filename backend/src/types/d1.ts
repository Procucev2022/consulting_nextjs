import type { QueryAuditLog } from './db';

export type D1Record = Record<string, unknown>;

export interface WorkerD1Result {
  data: unknown;
  status?: number;
  response?: Response;
}

export interface D1RequestMetrics {
  totalQueries: number;
  failedQueries: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
  totalDurationMs: number;
  totalRowsRead: number;
  totalRowsWritten: number;
}

export interface D1RuntimeMetricsState extends D1RequestMetrics {
  recentAudits: QueryAuditLog[];
}

export interface D1RuntimeMetrics extends D1RequestMetrics {
  cacheHitRatio: number;
  averageDurationMs: number;
  recentAudits: QueryAuditLog[];
}

export interface D1QueryMetaRecord {
  duration?: number;
  rows_read?: number;
  rows_written?: number;
  changes?: number;
}

export interface D1MetricRow {
  metric_key: string;
  metric_value: number | null;
  metric_text: string | null;
}

export interface D1TaxonomyRow {
  commodity_code: string;
  commodity_title: string;
  class_code: string;
  class_title: string;
  family_code: string;
  family_title: string;
  segment_code: string;
  segment_title: string;
  core_bucket: string | null;
  classification_status: string | null;
}

export interface D1FxRateRow {
  currency: string;
  rate_date: string;
  inr_per_unit: number;
  raw_rate: number | null;
  raw_unit: number | null;
  source_id: string | null;
  source_name: string | null;
  rate_type: string | null;
  conversion_method: string | null;
  rate_status: string | null;
  fx_master_version: string;
}

export interface D1FxCurrencyRow {
  currency: string;
  currency_name: string;
  coverage_status: string;
  approved_source: string | null;
}

export interface D1MonthlySpendRow {
  month_key: string;
  spend_inr_cr: number;
}

export interface D1CurrencySpendRow {
  currency: string;
  spend_inr_cr: number;
  percentage: number;
}

export interface D1TenantRow {
  tenant_id: string;
  enterprise_name: string;
  region: string;
  base_currency: string;
  status: string;
  total_spend_evaluated: number;
  total_spend_evaluated_inr: number | null;
  major_sector: string | null;
  minor_sector: string | null;
}

export interface D1IngestionQueueCursor {
  uploadedAt: string;
  docId: string;
}

export interface D1ValidationRecordCursor {
  createdAt: string;
  recordId: string;
}

export interface D1IngestionPageOptions {
  queueCursor?: D1IngestionQueueCursor;
  validationCursor?: D1ValidationRecordCursor;
  queueDocumentId?: string;
  requestId?: string;
  includeQueue?: boolean;
  includeValidationRecords?: boolean;
  includeSummary?: boolean;
}

export interface D1StoredCurrencyContext {
  tenantId: string;
  documentId?: string;
  requestId?: string;
}

export interface D1IngestionPageMetadata {
  hasMore: boolean;
  nextCursor: D1IngestionQueueCursor | D1ValidationRecordCursor | null;
}

export interface D1CustomerRow {
  customer_id: string;
  customer_name: string;
  industry: string;
  business_unit: string | null;
  region: string | null;
  base_currency: string | null;
  company_website: string | null;
  website_profile_json: string | null;
  contact_email: string | null;
  contact_person: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface D1AssessmentRow {
  assessment_id: string;
  customer_id: string;
  customer_name: string;
  industry: string;
  business_unit: string | null;
  company_website: string | null;
  assessment_owner: string;
  currency: string;
  assessment_period_start: string | null;
  assessment_period_end: string | null;
  data_received_at: string | null;
  nda_status: string;
  data_status: string;
  assigned_analyst: string | null;
  status: string;
  notes: string | null;
  is_test_data: number;
  total_spend_cr: number;
  validated_spend_cr: number;
  baseline_spend_cr: number;
  gross_spend_cr: number;
  fx_impact_cr: number;
  addressable_spend_cr: number;
  gross_opportunity_cr: number;
  overlap_deductions_cr: number;
  net_defensible_opportunity_cr: number;
  proven_opportunity_cr: number;
  delivery_range_min_cr: number;
  delivery_range_max_cr: number;
  pcbi_analytical_signal_cr: number;
  potential_savings_cr: number;
  savings_pct: number;
  created_at: string;
  updated_at: string;
}

export interface D1DataVersionRow {
  data_version_id: string;
  assessment_id: string;
  version_number: number;
  file_name: string;
  file_size: number;
  checksum: string;
  file_path: string | null;
  uploaded_by: string;
  uploaded_at: string;
  record_count: number;
  notes: string | null;
  is_superseded: number;
}

export interface D1AnalysisRunRow {
  analysis_run_id: string;
  assessment_id: string;
  data_version_id: string;
  status: string;
  total_spend_cr: number;
  validated_spend_cr: number;
  baseline_spend_cr: number | null;
  fx_impact_cr: number;
  addressable_spend_cr: number | null;
  gross_opportunity_cr: number | null;
  overlap_deductions_cr: number | null;
  net_defensible_opportunity_cr: number | null;
  proven_opportunity_cr: number | null;
  delivery_range_min_cr: number | null;
  delivery_range_max_cr: number | null;
  pcbi_analytical_signal_cr: number | null;
  potential_savings_cr: number;
  savings_pct: number;
  all_gates_passed: number;
  is_approved: number;
  is_superseded: number;
  metrics_json: string | null;
  created_at: string;
}

export interface D1AuditLogRow {
  id: string;
  assessment_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  details_json: string | null;
  timestamp: string;
}
export interface D1SchemaTableRow {
  name: string;
  sql: string;
}

export interface D1SchemaQueryRow {
  table_name: string;
  table_sql: string;
  column_name: string;
  column_cid: number;
}

export interface D1SchemaTable {
  entity_name: string;
  primary_attributes: string;
  system_usage: string;
  sample_records: unknown[];
  ddl: string;
}
