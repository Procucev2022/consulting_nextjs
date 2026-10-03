-- Cloudflare D1 Complete SQL Schema (SQLite)

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

INSERT OR IGNORE INTO TenantMaster (
  tenant_id,
  enterprise_name,
  region,
  base_currency,
  status
) VALUES (
  'TNT-GLOBAL-8902',
  'Global Enterprise Procurement',
  'GLOBAL',
  'INR',
  'ACTIVE'
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
  resolved INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS SpendCategorySummary (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
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
  spend_inr_2025_26 REAL
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
