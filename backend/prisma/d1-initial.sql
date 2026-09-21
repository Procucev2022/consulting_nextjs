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