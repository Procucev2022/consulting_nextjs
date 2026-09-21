-- Seed TenantMaster
INSERT OR REPLACE INTO "TenantMaster" (
    "tenant_id",
    "enterprise_name",
    "region",
    "base_currency",
    "status",
    "total_spend_evaluated",
    "total_spend_evaluated_inr",
    "major_sector",
    "minor_sector",
    "created_at",
    "updated_at"
) VALUES (
    'TNT-GLOBAL-8902',
    'Enterprise Client',
    'GLOBAL',
    'INR',
    'ACTIVE',
    0,
    0,
    'Direct & Indirect Procurement',
    'Strategic Sourcing',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Seed Initial Users
INSERT OR REPLACE INTO "User" (
    "id",
    "name",
    "mobile_number",
    "email",
    "company_name",
    "company_address",
    "password_hash",
    "role",
    "status",
    "subscription_tier",
    "created_at",
    "updated_at"
) VALUES 
(
    'usr-admin-001',
    'System Administrator',
    '+91 98765 43210',
    'admin@procucev.com',
    'aiCEV Procucev Enterprise Inc.',
    'Floor 14, Brigade Gateway, Malleshwaram, Bengaluru, Karnataka 560055, India',
    'a1b2c3d4e5f60718293a4b5c6d7e8f90:982b6bb7fbc8d3133333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333',
    'ADMIN',
    'ACTIVE',
    'ENTERPRISE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'usr-user-001',
    'Enterprise Buyer',
    '+91 98450 12345',
    'buyer@procucev.com',
    'Enterprise Client Ltd.',
    'Plot 45, Industrial Suburb, Peenya 2nd Stage, Bengaluru 560058, Karnataka, India',
    'b2c3d4e5f60718293a4b5c6d7e8f90a1:982b6bb7fbc8d3133333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333',
    'USER',
    'ACTIVE',
    'ENTERPRISE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'usr-user-002',
    'Srinivas Mukku',
    '+91 98450 12346',
    'user@procucev.com',
    'Apex Industrial Dynamics Ltd.',
    'Plot 45, Industrial Suburb, Peenya 2nd Stage, Bengaluru 560058, Karnataka, India',
    'b2c3d4e5f60718293a4b5c6d7e8f90a1:982b6bb7fbc8d3133333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333',
    'USER',
    'ACTIVE',
    'ENTERPRISE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'usr-user-003',
    'Priya Sharma',
    '+91 97123 45678',
    'priya.sharma@tatasupply.com',
    'Tata Strategic Procurement Corp',
    'Bombay House, 24 Homi Mody Street, Fort, Mumbai 400001, Maharashtra, India',
    'c3d4e5f60718293a4b5c6d7e8f90a1b2:982b6bb7fbc8d3133333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333',
    'USER',
    'ACTIVE',
    'ENTERPRISE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
