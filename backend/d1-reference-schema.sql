-- Versioned D1 reference and normalized source-data schema.
-- Core application tables remain in d1-schema.sql.

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

CREATE TABLE IF NOT EXISTS PCBICommoditySource (
  source_id TEXT PRIMARY KEY NOT NULL,
  commodity_id TEXT NOT NULL,
  pcbi_id TEXT NOT NULL,
  series_id TEXT,
  source_name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT,
  document_name TEXT NOT NULL,
  publication_date TEXT,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  file_type TEXT NOT NULL,
  checksum TEXT NOT NULL,
  object_key TEXT NOT NULL,
  geography TEXT NOT NULL,
  grade_specification TEXT NOT NULL,
  unit TEXT NOT NULL,
  currency TEXT NOT NULL,
  frequency TEXT NOT NULL,
  delivery_basis TEXT NOT NULL,
  historical_coverage TEXT NOT NULL,
  extraction_status TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  methodology_status TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  extracted_observations_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pcbi_source_series ON PCBICommoditySource(pcbi_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS PCBICommodityObservation (
  observation_id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT NOT NULL,
  pcbi_id TEXT NOT NULL,
  observation_date TEXT NOT NULL,
  raw_value REAL NOT NULL,
  raw_unit TEXT NOT NULL,
  raw_currency TEXT NOT NULL,
  normalized_value REAL NOT NULL,
  normalized_unit TEXT NOT NULL,
  normalized_currency TEXT NOT NULL,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  UNIQUE(source_id, observation_date),
  FOREIGN KEY(source_id) REFERENCES PCBICommoditySource(source_id)
);
CREATE INDEX IF NOT EXISTS idx_pcbi_observation_series ON PCBICommodityObservation(pcbi_id, observation_date);

CREATE TABLE IF NOT EXISTS PCBICommodityPromotion (
  promotion_id TEXT PRIMARY KEY NOT NULL,
  catalog_version_id TEXT NOT NULL UNIQUE,
  source_id TEXT NOT NULL,
  commodity_id TEXT NOT NULL,
  pcbi_id TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  comments TEXT,
  promoted_at TEXT NOT NULL,
  observation_count INTEGER NOT NULL,
  FOREIGN KEY(source_id) REFERENCES PCBICommoditySource(source_id)
);
CREATE INDEX IF NOT EXISTS idx_pcbi_promotion_series ON PCBICommodityPromotion(pcbi_id, promoted_at DESC);

CREATE TABLE IF NOT EXISTS PCBICommodityResearchAssignment (
  pcbi_id TEXT PRIMARY KEY NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pcbi_research_assignment_owner ON PCBICommodityResearchAssignment(assigned_to, updated_at DESC);

CREATE TABLE IF NOT EXISTS PCBIMasterVersion (
  id TEXT PRIMARY KEY NOT NULL,
  version TEXT NOT NULL UNIQUE,
  upload_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size_mb REAL NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'VALIDATED', 'PUBLISHED', 'ARCHIVED')),
  metrics_json TEXT NOT NULL,
  validation_report_json TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  published_at TEXT,
  published_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_pcbi_master_version_status ON PCBIMasterVersion(status, uploaded_at DESC);

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
