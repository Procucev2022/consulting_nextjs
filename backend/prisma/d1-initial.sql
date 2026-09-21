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