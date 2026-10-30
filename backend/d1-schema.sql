-- Cloudflare D1 Complete SQL Schema (SQLite)
-- Production & Development Unified Schema for Consulting Intelligence Platform

CREATE TABLE IF NOT EXISTS TenantMaster (
  tenant_id TEXT PRIMARY KEY NOT NULL,
  enterprise_name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'GLOBAL',
  base_currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  total_spend_evaluated REAL NOT NULL DEFAULT 0,
  total_spend_evaluated_inr REAL,
  major_sector TEXT DEFAULT 'Chemical & Petrochemicals',
  minor_sector TEXT DEFAULT 'Specialty Chemicals',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  subscription_tier TEXT NOT NULL DEFAULT 'BRONZE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_user_tier ON User(subscription_tier);

CREATE TABLE IF NOT EXISTS RawDocumentIngestion (
  doc_id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'TNT-GLOBAL-8902',
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'XLSX',
  file_size_mb REAL NOT NULL DEFAULT 1.0,
  ocr_status TEXT NOT NULL DEFAULT 'Completed',
  progress REAL NOT NULL DEFAULT 100,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  records_count INTEGER NOT NULL DEFAULT 0,
  detected_currencies TEXT DEFAULT '["INR"]',
  converted_inr_crores REAL DEFAULT 0,
  unique_items_count INTEGER DEFAULT 0,
  unique_vendors_count INTEGER DEFAULT 0,
  material_groups_count INTEGER DEFAULT 0,
  plants_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_raw_doc_tenant ON RawDocumentIngestion(tenant_id);
CREATE INDEX IF NOT EXISTS idx_raw_doc_uploaded ON RawDocumentIngestion(uploaded_at);

CREATE TABLE IF NOT EXISTS ValidationPreCheckRecord (
  record_id TEXT PRIMARY KEY NOT NULL,
  po_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  raw_desc TEXT NOT NULL,
  order_quantity REAL,
  net_price REAL,
  subtotal_raw REAL,
  amount REAL NOT NULL DEFAULT 0,
  raw_currency TEXT DEFAULT 'INR',
  amount_inr REAL,
  inr_crores REAL,
  fx_rate_applied REAL,
  yahoo_ticker TEXT,
  spend_year INTEGER,
  transaction_date TEXT,
  column_l_code TEXT,
  core_category TEXT,
  issue_flag TEXT NOT NULL DEFAULT 'Passed Clean',
  action_status TEXT NOT NULL DEFAULT 'Ready',
  resolved INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_val_record_vendor ON ValidationPreCheckRecord(vendor_name);
CREATE INDEX IF NOT EXISTS idx_val_record_status ON ValidationPreCheckRecord(action_status);

CREATE TABLE IF NOT EXISTS SpendCategorySummary (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  spend REAL NOT NULL DEFAULT 0,
  spend_inr REAL,
  spend_inr_crores REAL,
  targetReductionPct REAL DEFAULT 0,
  lineItemsCount INTEGER DEFAULT 0,
  color TEXT DEFAULT '#38bdf8',
  column_l_code TEXT,
  spend_2023 REAL,
  spend_2024 REAL,
  spend_2025_26 REAL,
  spend_inr_2023 REAL,
  spend_inr_2024 REAL,
  spend_inr_2025_26 REAL,
  spend_fy24_cr REAL,
  spend_fy25_cr REAL,
  spend_fy26_cr REAL,
  vendor_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  share_pct REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS CategoryYearDetail (
  id TEXT PRIMARY KEY NOT NULL,
  rank INTEGER,
  category TEXT NOT NULL,
  core_bucket TEXT,
  sample_column_l_code TEXT,
  sample_column_l_title TEXT,
  spend_2023 REAL,
  spend_2024 REAL,
  spend_2025_26 REAL,
  total_3yr_spend REAL,
  spend_inr_2023_cr REAL NOT NULL DEFAULT 0,
  spend_inr_2024_cr REAL NOT NULL DEFAULT 0,
  spend_inr_2025_26_cr REAL NOT NULL DEFAULT 0,
  spend_fy24_cr REAL,
  spend_fy25_cr REAL,
  spend_fy26_cr REAL,
  total_3yr_spend_inr_cr REAL NOT NULL DEFAULT 0,
  yoy_growth_pct REAL DEFAULT 0,
  line_items_count INTEGER DEFAULT 0,
  color TEXT DEFAULT '#38bdf8',
  is_balance_category INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS VendorYearDetail (
  id TEXT PRIMARY KEY NOT NULL,
  rank INTEGER,
  vendor_name TEXT NOT NULL,
  master_vendor_id TEXT NOT NULL,
  primary_category TEXT NOT NULL,
  sample_column_l_code TEXT,
  sample_column_l_title TEXT,
  spend_fy24_cr REAL NOT NULL DEFAULT 0,
  spend_fy25_cr REAL NOT NULL DEFAULT 0,
  spend_fy26_cr REAL NOT NULL DEFAULT 0,
  total_3yr_spend_inr_cr REAL NOT NULL DEFAULT 0,
  yoy_growth_pct REAL DEFAULT 0,
  line_items_count INTEGER DEFAULT 0,
  color TEXT DEFAULT '#38bdf8',
  risk_status TEXT DEFAULT 'ALIGNED',
  price_creep_pct REAL DEFAULT 0,
  is_balance_vendor INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vendor_detail_name ON VendorYearDetail(vendor_name);

CREATE TABLE IF NOT EXISTS LineItemMapping (
  mapping_id TEXT PRIMARY KEY NOT NULL,
  line_item_id TEXT NOT NULL,
  material_code TEXT,
  material_desc TEXT,
  raw_desc TEXT NOT NULL,
  vendor_identified TEXT NOT NULL,
  master_supplier_id TEXT,
  unspsc_code TEXT NOT NULL,
  unspsc_category_name TEXT NOT NULL,
  unspsc_commodity_title TEXT,
  unspsc_class_title TEXT,
  core_bucket TEXT NOT NULL,
  ai_confidence REAL DEFAULT 0.95,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  unit_price REAL NOT NULL DEFAULT 0,
  qty REAL NOT NULL DEFAULT 1,
  total_spend REAL NOT NULL DEFAULT 0,
  raw_currency TEXT DEFAULT 'INR',
  amount_inr REAL,
  inr_crores REAL,
  fx_rate_applied REAL,
  invoice_date TEXT,
  spend_year INTEGER,
  po_number TEXT,
  industry_sector TEXT,
  sector_relevance TEXT,
  sector_alignment_score REAL
);

CREATE INDEX IF NOT EXISTS idx_line_mapping_code ON LineItemMapping(unspsc_code);
CREATE INDEX IF NOT EXISTS idx_line_mapping_vendor ON LineItemMapping(vendor_identified);

CREATE TABLE IF NOT EXISTS VendorPriceRank (
  vendor_name TEXT NOT NULL,
  master_id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  price_creep_pct REAL DEFAULT 0,
  total_spend REAL NOT NULL DEFAULT 0,
  total_spend_inr_cr REAL,
  risk_status TEXT DEFAULT 'ALIGNED',
  variance_leakage_usd REAL DEFAULT 0,
  variance_leakage_inr_cr REAL,
  benchmark_index TEXT DEFAULT 'LME',
  last_36mo_trend TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS SavingsOpportunity (
  opp_id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  title TEXT,
  current_spend REAL,
  current_spend_inr_cr REAL,
  target_savings_pct REAL,
  est_savings REAL,
  est_savings_inr_cr REAL,
  savings_percentage REAL,
  lever TEXT,
  recommended_action TEXT,
  push_to_module TEXT DEFAULT 'proCPX',
  recommended_module TEXT DEFAULT 'proCPX',
  status TEXT DEFAULT 'Identified',
  risk_level TEXT DEFAULT 'Low',
  contract_leak_type TEXT,
  complexity TEXT DEFAULT 'Low',
  confidence_score REAL DEFAULT 0.9
);

CREATE INDEX IF NOT EXISTS idx_savings_cat ON SavingsOpportunity(category);
CREATE INDEX IF NOT EXISTS idx_savings_status ON SavingsOpportunity(status);

CREATE TABLE IF NOT EXISTS ConversionFunnelPhase (
  phase_num INTEGER PRIMARY KEY NOT NULL,
  phase_name TEXT NOT NULL,
  platform_actionable_focus TEXT NOT NULL,
  value_outcome_delivered TEXT NOT NULL,
  commercial_lock_in_metric TEXT NOT NULL,
  completion_pct REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Upcoming',
  spend_evaluated_cr REAL,
  count_elements INTEGER,
  percentage_leakage_identified REAL
);

CREATE TABLE IF NOT EXISTS AssessmentRecord (
  assessment_id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  business_unit TEXT DEFAULT 'Default BU',
  company_website TEXT,
  assessment_owner TEXT NOT NULL,
  currency TEXT DEFAULT 'INR',
  assessment_period_start TEXT,
  assessment_period_end TEXT,
  data_received_at TEXT,
  nda_status TEXT DEFAULT 'SIGNED',
  data_status TEXT DEFAULT 'VALIDATED',
  assigned_analyst TEXT,
  status TEXT DEFAULT 'COMPLETED',
  notes TEXT,
  is_test_data INTEGER DEFAULT 0,
  total_spend_cr REAL DEFAULT 556.5347,
  validated_spend_cr REAL DEFAULT 556.5347,
  baseline_spend_cr REAL DEFAULT 556.5347,
  gross_spend_cr REAL DEFAULT 585.3049,
  fx_impact_cr REAL DEFAULT 0,
  addressable_spend_cr REAL DEFAULT 489.20,
  gross_opportunity_cr REAL DEFAULT 48.65,
  overlap_deductions_cr REAL DEFAULT 6.20,
  net_defensible_opportunity_cr REAL DEFAULT 42.45,
  proven_opportunity_cr REAL DEFAULT 38.10,
  delivery_range_min_cr REAL DEFAULT 35.00,
  delivery_range_max_cr REAL DEFAULT 45.00,
  pcbi_analytical_signal_cr REAL DEFAULT 14.80,
  potential_savings_cr REAL DEFAULT 42.45,
  savings_pct REAL DEFAULT 7.63,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_customer ON AssessmentRecord(customer_id);
CREATE INDEX IF NOT EXISTS idx_assessment_status ON AssessmentRecord(status);

CREATE TABLE IF NOT EXISTS CustomerRecord (
  customer_id TEXT PRIMARY KEY NOT NULL,
  customer_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  business_unit TEXT DEFAULT 'Default BU',
  region TEXT DEFAULT 'APAC',
  base_currency TEXT DEFAULT 'INR',
  company_website TEXT,
  website_profile_json TEXT,
  contact_email TEXT,
  contact_person TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_status ON CustomerRecord(status);

CREATE TABLE IF NOT EXISTS AssessmentDataVersion (
  data_version_id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  checksum TEXT NOT NULL,
  file_path TEXT,
  uploaded_by TEXT NOT NULL DEFAULT 'admin@procucev.com',
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  record_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_superseded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_data_version_assessment ON AssessmentDataVersion(assessment_id);

CREATE TABLE IF NOT EXISTS AssessmentAnalysisRun (
  analysis_run_id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  data_version_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  total_spend_cr REAL NOT NULL DEFAULT 0,
  validated_spend_cr REAL NOT NULL DEFAULT 0,
  baseline_spend_cr REAL,
  fx_impact_cr REAL DEFAULT 0,
  addressable_spend_cr REAL,
  gross_opportunity_cr REAL,
  overlap_deductions_cr REAL,
  net_defensible_opportunity_cr REAL,
  proven_opportunity_cr REAL,
  delivery_range_min_cr REAL,
  delivery_range_max_cr REAL,
  pcbi_analytical_signal_cr REAL,
  potential_savings_cr REAL NOT NULL DEFAULT 0,
  savings_pct REAL NOT NULL DEFAULT 0,
  all_gates_passed INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 1,
  is_superseded INTEGER NOT NULL DEFAULT 0,
  metrics_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_run_assessment ON AssessmentAnalysisRun(assessment_id);

CREATE TABLE IF NOT EXISTS AssessmentAuditLog (
  id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details_json TEXT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_assessment ON AssessmentAuditLog(assessment_id);

CREATE TABLE IF NOT EXISTS PCBIBenchmarkMaster (
  id TEXT PRIMARY KEY NOT NULL,
  pcbi_id TEXT NOT NULL UNIQUE,
  sector TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  unspsc_segment TEXT,
  unspsc_family TEXT,
  unspsc_class TEXT,
  unspsc_commodity TEXT,
  benchmark_name TEXT NOT NULL,
  benchmark_source TEXT NOT NULL,
  source_series TEXT NOT NULL,
  benchmark_unit TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  geography TEXT NOT NULL,
  benchmark_type TEXT NOT NULL DEFAULT 'SINGLE',
  benchmarkability_percent REAL DEFAULT 75,
  residual_percent REAL DEFAULT 25,
  quality_rating TEXT DEFAULT 'A',
  calculation_method TEXT,
  benchmark_scope TEXT DEFAULT 'MULTI_SECTOR',
  applicable_sectors TEXT,
  gap_handling_method TEXT DEFAULT 'FORWARD_FILL',
  effective_from TEXT,
  version INTEGER DEFAULT 1,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pcbi_commodity ON PCBIBenchmarkMaster(pcbi_id);
CREATE INDEX IF NOT EXISTS idx_pcbi_category ON PCBIBenchmarkMaster(category);

CREATE TABLE IF NOT EXISTS PCBIWeeklyIndex (
  id TEXT PRIMARY KEY NOT NULL,
  pcbi_id TEXT NOT NULL,
  week_date TEXT NOT NULL,
  index_value REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_projected INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pcbi_index_series ON PCBIWeeklyIndex(pcbi_id, week_date);

CREATE TABLE IF NOT EXISTS AnalysisJob (
  id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  progress REAL NOT NULL DEFAULT 100,
  result_summary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_job_assessment ON AnalysisJob(assessment_id);

CREATE TABLE IF NOT EXISTS ActionPlanItem (
  id TEXT PRIMARY KEY NOT NULL,
  opp_id TEXT NOT NULL,
  title TEXT NOT NULL,
  lever TEXT NOT NULL,
  category TEXT NOT NULL,
  est_savings_inr_cr REAL NOT NULL,
  owner TEXT NOT NULL DEFAULT 'STRATEGIC_SOURCING',
  quarter TEXT NOT NULL DEFAULT 'Q1',
  status TEXT NOT NULL DEFAULT 'PLANNED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_action_plan_opp ON ActionPlanItem(opp_id);

CREATE TABLE IF NOT EXISTS ActionPlanItemDetails (
  action_id TEXT PRIMARY KEY NOT NULL,
  target_date TEXT,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  comments TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Versioned D1 reference and normalized source-data schema.
-- Keep this block synchronized with backend/d1-reference-schema.sql.

CREATE TABLE IF NOT EXISTS DatasetMetricSummary (
  metric_key TEXT PRIMARY KEY NOT NULL,
  metric_value REAL,
  metric_text TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Module1MonthlySpend (
  month_key TEXT PRIMARY KEY NOT NULL,
  spend_inr_cr REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS Module1CurrencyBreakdown (
  currency TEXT PRIMARY KEY NOT NULL,
  spend_inr_cr REAL NOT NULL,
  percentage REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS UNSPSCCommodity (
  commodity_code TEXT PRIMARY KEY NOT NULL,
  commodity_title TEXT NOT NULL,
  class_code TEXT NOT NULL,
  class_title TEXT NOT NULL,
  family_code TEXT NOT NULL,
  family_title TEXT NOT NULL,
  segment_code TEXT NOT NULL,
  segment_title TEXT NOT NULL,
  core_bucket TEXT,
  classification_status TEXT,
  taxonomy_version TEXT NOT NULL,
  source_checksum TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unspsc_title ON UNSPSCCommodity(commodity_title);
CREATE INDEX IF NOT EXISTS idx_unspsc_bucket ON UNSPSCCommodity(core_bucket);

CREATE TABLE IF NOT EXISTS FxCurrencyMaster (
  currency TEXT PRIMARY KEY NOT NULL,
  currency_name TEXT NOT NULL,
  coverage_status TEXT NOT NULL,
  approved_source TEXT,
  fx_master_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS FxReferenceRate (
  currency TEXT NOT NULL,
  rate_date TEXT NOT NULL,
  inr_per_unit REAL NOT NULL,
  raw_rate REAL,
  raw_unit REAL,
  raw_quote_convention TEXT,
  source_id TEXT,
  source_name TEXT,
  rate_type TEXT,
  conversion_method TEXT,
  rate_status TEXT,
  fx_master_version TEXT NOT NULL,
  PRIMARY KEY (currency, rate_date)
);

CREATE INDEX IF NOT EXISTS idx_fx_rate_date ON FxReferenceRate(currency, rate_date DESC);

CREATE TABLE IF NOT EXISTS FxRateRule (
  rule_id TEXT PRIMARY KEY NOT NULL,
  rule TEXT NOT NULL,
  implementation_requirement TEXT NOT NULL,
  control_type TEXT NOT NULL,
  fx_master_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS FxMasterVersion (
  version_id TEXT PRIMARY KEY NOT NULL,
  workbook_name TEXT NOT NULL,
  created_date TEXT,
  coverage_start TEXT,
  coverage_end TEXT,
  currencies INTEGER,
  total_records INTEGER,
  source_mix TEXT,
  created_by TEXT,
  sha256_checksum TEXT NOT NULL,
  validation_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ProcurementTransaction (
  transaction_id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  assessment_id TEXT,
  source_document_id TEXT,
  source_row_number INTEGER,
  source_file TEXT,
  po_number TEXT,
  po_line TEXT,
  document_date_raw TEXT,
  supplier_code TEXT,
  supplier_name TEXT NOT NULL,
  material_code TEXT,
  short_text TEXT,
  material_group TEXT,
  plant TEXT,
  storage_location TEXT,
  order_quantity REAL,
  order_unit TEXT,
  quantity_in_sku REAL,
  sku TEXT,
  net_price REAL,
  currency TEXT NOT NULL,
  total_inr_raw REAL,
  total_in_cr_raw REAL,
  price_unit REAL,
  deletion_indicator TEXT,
  item_category TEXT,
  account_assignment_category TEXT,
  raw_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_procurement_tx_tenant ON ProcurementTransaction(tenant_id);
CREATE INDEX IF NOT EXISTS idx_procurement_tx_vendor ON ProcurementTransaction(tenant_id, supplier_name);
CREATE INDEX IF NOT EXISTS idx_procurement_tx_material ON ProcurementTransaction(tenant_id, material_code);
CREATE INDEX IF NOT EXISTS idx_procurement_tx_po ON ProcurementTransaction(tenant_id, po_number);

CREATE TABLE IF NOT EXISTS AlternateVendorIndex (
  category_key TEXT PRIMARY KEY NOT NULL,
  category_name TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source_checksum TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS MaterialMappingRegister (
  source_material_id TEXT PRIMARY KEY NOT NULL,
  payload_json TEXT NOT NULL,
  taxonomy_version TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AssessmentMaterialMapping (
  assessment_id TEXT NOT NULL,
  source_material_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  reviewed_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assessment_id, source_material_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_material_mapping_assessment
  ON AssessmentMaterialMapping(assessment_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS Module2SpecificationReview (
  review_id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT,
  review_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('TECHNICALLY_VERIFIED', 'REJECTED', 'AWAITING_TECHNICAL_REVIEW')),
  technical_justification TEXT NOT NULL,
  proposed_standard TEXT,
  application_scope TEXT,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_module2_specification_review_candidate
  ON Module2SpecificationReview(assessment_id, candidate_id, review_date, review_id);

CREATE TABLE IF NOT EXISTS Module2ComplianceReview (
  review_id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  exception_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT,
  review_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('VERIFIED_EXCEPTION', 'NOT_AN_EXCEPTION', 'AWAITING_REVIEW')),
  technical_justification TEXT NOT NULL,
  corrective_action_plan TEXT,
  dismissal_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_module2_compliance_review_exception
  ON Module2ComplianceReview(assessment_id, exception_id, review_date, review_id);

CREATE TABLE IF NOT EXISTS Module2EAuctionPlanningAssumption (
  assumption_id TEXT PRIMARY KEY NOT NULL,
  category_or_material TEXT NOT NULL,
  min_savings_rate REAL NOT NULL CHECK (min_savings_rate >= 0 AND min_savings_rate <= 1),
  expected_savings_rate REAL NOT NULL CHECK (expected_savings_rate >= min_savings_rate AND expected_savings_rate <= max_savings_rate),
  max_savings_rate REAL NOT NULL CHECK (max_savings_rate >= expected_savings_rate AND max_savings_rate <= 1),
  rate_source TEXT NOT NULL,
  reference_period TEXT NOT NULL,
  applicability TEXT NOT NULL,
  approval_status TEXT NOT NULL CHECK (approval_status IN (
    'Proposed Planning Assumption — Approval Required', 'APPROVED', 'PENDING_APPROVAL', 'UNQUANTIFIABLE'
  )),
  approved_by TEXT,
  approved_date TEXT,
  confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW', 'NOT_ESTABLISHED')),
  is_planning_assumption_only INTEGER NOT NULL DEFAULT 1 CHECK (is_planning_assumption_only = 1),
  notes TEXT,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (approval_status <> 'APPROVED' OR (approved_by IS NOT NULL AND approved_date IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_module2_eauction_assumption_category
  ON Module2EAuctionPlanningAssumption(category_or_material, assumption_id);

CREATE TABLE IF NOT EXISTS ProcurementCategoryMapping (
  material_group_code TEXT PRIMARY KEY NOT NULL,
  category_name TEXT NOT NULL,
  source_checksum TEXT
);

CREATE TABLE IF NOT EXISTS ObjectMetadata (
  object_key TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  assessment_id TEXT,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  bucket TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_object_metadata_tenant ON ObjectMetadata(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS PCBICommoditySnapshot (
  pcbi_id TEXT PRIMARY KEY NOT NULL,
  commodity_name TEXT NOT NULL,
  current_rate_inr REAL NOT NULL,
  trend_pct REAL NOT NULL,
  active_alert INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AlternateVendorCompany (
  alternate_vendor_id TEXT PRIMARY KEY NOT NULL,
  category_key TEXT NOT NULL,
  vendor_norm TEXT NOT NULL,
  source_checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_alternate_vendor_category ON AlternateVendorCompany(category_key);

CREATE TABLE IF NOT EXISTS PCBIBenchmarkComponent (
  id TEXT PRIMARY KEY NOT NULL,
  pcbi_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  benchmark_source TEXT NOT NULL,
  source_series TEXT NOT NULL,
  weight_percent REAL NOT NULL,
  benchmark_unit TEXT NOT NULL,
  currency TEXT NOT NULL,
  geography TEXT NOT NULL,
  quality_rating TEXT NOT NULL,
  active INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pcbi_component_parent ON PCBIBenchmarkComponent(pcbi_id, active);

CREATE TABLE IF NOT EXISTS PCBIUNSPSCMapping (
  id TEXT PRIMARY KEY NOT NULL,
  unspsc_code TEXT NOT NULL,
  unspsc_title TEXT,
  unspsc_level TEXT,
  pcbi_id TEXT NOT NULL,
  category TEXT,
  sub_category TEXT,
  default_benchmarkability REAL,
  quality_rating TEXT NOT NULL,
  active INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pcbi_mapping_code ON PCBIUNSPSCMapping(unspsc_code, active);

-- Retain every weekly source field without altering the existing deployed legacy table.
CREATE TABLE IF NOT EXISTS PCBIWeeklyReference (
  id TEXT PRIMARY KEY NOT NULL,
  pcbi_id TEXT NOT NULL,
  component_id TEXT,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  index_value REAL NOT NULL,
  base_period_index REAL,
  source TEXT NOT NULL,
  source_series TEXT,
  quality_rating TEXT NOT NULL,
  currency TEXT NOT NULL,
  unit TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pcbi_reference_series ON PCBIWeeklyReference(pcbi_id, week_start);
CREATE INDEX IF NOT EXISTS idx_pcbi_reference_component ON PCBIWeeklyReference(component_id, week_start);

-- Original dated price observations retain their monthly frequency; they are
-- not synthesized into weekly indices or activated as current benchmarks.
CREATE TABLE IF NOT EXISTS PCBIHistoricalObservation (
  pcbi_id TEXT NOT NULL,
  observation_date TEXT NOT NULL,
  value_inr REAL NOT NULL,
  original_value REAL NOT NULL,
  original_currency TEXT NOT NULL,
  fx_rate REAL NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  observation_frequency TEXT NOT NULL CHECK (observation_frequency = 'MONTHLY'),
  source_checksum TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (pcbi_id, observation_date)
);

-- Lossless migration of persisted assessment metadata, canonical calculations,
-- review gates, and audit history. Run/version IDs are scoped to an assessment.
CREATE TABLE IF NOT EXISTS AssessmentStoreEntry (
  entry_type TEXT NOT NULL,
  assessment_id TEXT NOT NULL DEFAULT '',
  entry_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source_checksum TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_type, assessment_id, entry_id)
);
CREATE TABLE IF NOT EXISTS D1SeedPayloadChunk (
  entry_type TEXT NOT NULL,
  assessment_id TEXT NOT NULL DEFAULT '',
  entry_id TEXT NOT NULL,
  source_checksum TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  payload_part TEXT NOT NULL,
  PRIMARY KEY (entry_type, assessment_id, entry_id, source_checksum, chunk_index)
);

-- Analysis orchestration (Worker API): report workflow, quality gate, customer
-- acknowledgements, correction requests, notifications and audit events.
-- At most one non-superseded report exists per assessment (partial unique index).

CREATE TABLE IF NOT EXISTS OrchestrationReportVersion (
  report_version_id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
  analysis_run_id TEXT NOT NULL,
  data_version_id TEXT NOT NULL,
  workflow_state TEXT NOT NULL CHECK (workflow_state IN (
    'ADMIN_REVIEW', 'SUBMITTED_TO_CUSTOMER', 'CUSTOMER_VIEWED', 'CUSTOMER_ACKNOWLEDGED', 'SUPERSEDED'
  )),
  generated_by TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  submitted_by TEXT,
  submitted_at TEXT,
  customer_viewed_at TEXT,
  acknowledged_at TEXT,
  superseded_by TEXT,
  superseded_at TEXT,
  supersede_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (assessment_id, sequence_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orch_report_one_active ON OrchestrationReportVersion(assessment_id) WHERE workflow_state <> 'SUPERSEDED';

CREATE TABLE IF NOT EXISTS OrchestrationQualityChecklist (
  checklist_id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  report_version_id TEXT,
  checklist_json TEXT NOT NULL,
  is_complete INTEGER NOT NULL DEFAULT 0 CHECK (is_complete IN (0, 1)),
  unconfirmed_count INTEGER NOT NULL DEFAULT 0 CHECK (unconfirmed_count >= 0),
  confirmed_by TEXT NOT NULL,
  confirmed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orch_checklist_report ON OrchestrationQualityChecklist(report_version_id, created_at);

CREATE TABLE IF NOT EXISTS OrchestrationAcknowledgement (
  acknowledgement_id TEXT PRIMARY KEY NOT NULL,
  report_version_id TEXT NOT NULL UNIQUE,
  assessment_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  notes TEXT,
  acknowledged_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS OrchestrationCorrectionRequest (
  request_id TEXT PRIMARY KEY NOT NULL,
  assessment_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  supporting_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVIEWED', 'ACCEPTED_REANALYSIS', 'REJECTED')),
  reviewed_by TEXT,
  admin_response TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orch_correction_assessment ON OrchestrationCorrectionRequest(assessment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orch_correction_status ON OrchestrationCorrectionRequest(status);

CREATE TABLE IF NOT EXISTS OrchestrationNotification (
  notification_id TEXT PRIMARY KEY NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('ADMIN', 'CUSTOMER')),
  tenant_id TEXT NOT NULL,
  assessment_id TEXT,
  report_version_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'ACTION_REQUIRED', 'WARNING', 'SUCCESS')),
  read_flag INTEGER NOT NULL DEFAULT 0 CHECK (read_flag IN (0, 1)),
  email_status TEXT CHECK (email_status IS NULL OR email_status IN ('NOT_SENT', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED')),
  email_last_error TEXT,
  email_retry_count INTEGER NOT NULL DEFAULT 0 CHECK (email_retry_count >= 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orch_notification_created ON OrchestrationNotification(created_at);

CREATE TABLE IF NOT EXISTS OrchestrationAuditEvent (
  event_id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  assessment_id TEXT,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('CUSTOMER', 'ADMIN', 'SYSTEM')),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orch_audit_created ON OrchestrationAuditEvent(created_at);

CREATE TABLE IF NOT EXISTS UpgradeRequest (
  id TEXT PRIMARY KEY NOT NULL,
  customer_user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_details TEXT,
  current_tier TEXT NOT NULL CHECK (current_tier IN ('BRONZE', 'SILVER', 'GOLD')),
  requested_tier TEXT NOT NULL CHECK (requested_tier IN ('SILVER', 'GOLD', 'ENTERPRISE')),
  requirements_note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_ADMIN_ACTION' CHECK (
    status IN ('PENDING_ADMIN_ACTION', 'OTP_VERIFIED_CODE_SENT', 'UPGRADE_COMPLETED', 'REJECTED')
  ),
  generated_unique_code_hash TEXT,
  code_generated_at TEXT,
  code_expires_at INTEGER,
  code_redeemed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_upgrade_request_status_created ON UpgradeRequest(status, created_at);
CREATE INDEX IF NOT EXISTS idx_upgrade_request_email_status ON UpgradeRequest(lower(customer_email), status);

CREATE TABLE IF NOT EXISTS AdminOtpSession (
  id TEXT PRIMARY KEY NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('UPGRADE_APPROVAL', 'SUBSCRIPTION_PROVISION')),
  request_id TEXT,
  customer_id TEXT,
  requested_by TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  verified_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_otp_session_request ON AdminOtpSession(request_id, purpose, created_at);

CREATE TABLE IF NOT EXISTS SubscriptionRecord (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD')),
  status TEXT NOT NULL CHECK (status IN ('FREE', 'PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED')),
  commercial_status TEXT NOT NULL CHECK (commercial_status IN ('FREE_TIER', 'QUOTED', 'INVOICED', 'PAYMENT_RECEIVED', 'COMPLETED')),
  payment_reference TEXT,
  payment_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (payment_confirmed IN (0, 1)),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  provisioned_by TEXT,
  provisioned_at TEXT,
  activated_by TEXT,
  activated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_status_updated ON SubscriptionRecord(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_subscription_customer_email ON SubscriptionRecord(lower(customer_email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_one_paid_active_customer
  ON SubscriptionRecord(lower(customer_email)) WHERE status IN ('PENDING_ACTIVATION', 'ACTIVE');

CREATE TABLE IF NOT EXISTS SubscriptionAuditEvent (
  id TEXT PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('ADMIN', 'SYSTEM')),
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('SUCCESS', 'FAILURE')),
  details_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_subscription_time ON SubscriptionAuditEvent(subscription_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_time ON SubscriptionAuditEvent(timestamp);
