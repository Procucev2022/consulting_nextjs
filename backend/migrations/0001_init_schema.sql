-- CreateTable
CREATE TABLE "TenantMaster" (
    "tenant_id" TEXT NOT NULL PRIMARY KEY,
    "enterprise_name" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "base_currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "total_spend_evaluated" REAL NOT NULL DEFAULT 0,
    "total_spend_evaluated_inr" REAL,
    "major_sector" TEXT DEFAULT 'Chemical & Petrochemicals',
    "minor_sector" TEXT DEFAULT 'Specialty Chemicals',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RawDocumentIngestion" (
    "doc_id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size_mb" REAL NOT NULL,
    "ocr_status" TEXT NOT NULL DEFAULT 'Pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "records_count" INTEGER NOT NULL DEFAULT 0,
    "detected_currencies" TEXT NOT NULL DEFAULT '[]',
    "converted_inr_crores" REAL
);

-- CreateTable
CREATE TABLE "ValidationPreCheckRecord" (
    "record_id" TEXT NOT NULL PRIMARY KEY,
    "po_number" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "raw_desc" TEXT NOT NULL,
    "order_quantity" REAL,
    "net_price" REAL,
    "subtotal_raw" REAL,
    "amount" REAL NOT NULL,
    "raw_currency" TEXT,
    "amount_inr" REAL,
    "inr_crores" REAL,
    "fx_rate_applied" REAL,
    "yahoo_ticker" TEXT,
    "spend_year" INTEGER,
    "transaction_date" TEXT,
    "column_l_code" TEXT,
    "core_category" TEXT,
    "issue_flag" TEXT NOT NULL,
    "action_status" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SpendCategorySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "spend" REAL NOT NULL,
    "spend_inr" REAL,
    "spend_inr_crores" REAL,
    "targetReductionPct" REAL NOT NULL,
    "lineItemsCount" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "column_l_code" TEXT,
    "spend_2023" REAL,
    "spend_2024" REAL,
    "spend_2025_26" REAL,
    "spend_inr_2023" REAL,
    "spend_inr_2024" REAL,
    "spend_inr_2025_26" REAL
);

-- CreateTable
CREATE TABLE "CategoryYearDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rank" INTEGER,
    "category" TEXT NOT NULL,
    "core_bucket" TEXT,
    "sample_column_l_code" TEXT NOT NULL,
    "sample_column_l_title" TEXT NOT NULL,
    "spend_2023" REAL,
    "spend_2024" REAL,
    "spend_2025_26" REAL,
    "total_3yr_spend" REAL,
    "spend_inr_2023_cr" REAL NOT NULL,
    "spend_inr_2024_cr" REAL NOT NULL,
    "spend_inr_2025_26_cr" REAL NOT NULL,
    "spend_fy24_cr" REAL,
    "spend_fy25_cr" REAL,
    "spend_fy26_cr" REAL,
    "total_3yr_spend_inr_cr" REAL NOT NULL,
    "yoy_growth_pct" REAL NOT NULL,
    "line_items_count" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "is_balance_category" BOOLEAN NOT NULL DEFAULT false,
    "balance_items" TEXT,
    "top_items" TEXT
);

-- CreateTable
CREATE TABLE "VendorYearDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rank" INTEGER,
    "vendor_name" TEXT NOT NULL,
    "master_vendor_id" TEXT NOT NULL,
    "primary_category" TEXT NOT NULL,
    "sample_column_l_code" TEXT NOT NULL,
    "sample_column_l_title" TEXT NOT NULL,
    "spend_fy24_cr" REAL NOT NULL,
    "spend_fy25_cr" REAL NOT NULL,
    "spend_fy26_cr" REAL NOT NULL,
    "total_3yr_spend_inr_cr" REAL NOT NULL,
    "yoy_growth_pct" REAL NOT NULL,
    "line_items_count" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "is_balance_vendor" BOOLEAN NOT NULL DEFAULT false,
    "risk_status" TEXT,
    "price_creep_pct" REAL,
    "variance_leakage_inr_cr" REAL,
    "balance_vendors" TEXT,
    "top_items" TEXT
);

-- CreateTable
CREATE TABLE "VendorPriceRank" (
    "rank" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendor_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "total_spend_inr_cr" REAL NOT NULL,
    "price_creep_pct" REAL NOT NULL,
    "variance_leakage_inr_cr" REAL NOT NULL,
    "risk_status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LineItemMapping" (
    "mapping_id" TEXT NOT NULL PRIMARY KEY,
    "raw_line_text" TEXT NOT NULL,
    "mapped_unspsc_code" TEXT NOT NULL,
    "unspsc_title" TEXT NOT NULL,
    "confidence_score" REAL NOT NULL,
    "suggested_bucket" TEXT NOT NULL,
    "human_verified" BOOLEAN NOT NULL DEFAULT false,
    "vendor_identified" TEXT NOT NULL,
    "master_supplier_id" TEXT
);

-- CreateTable
CREATE TABLE "SavingsOpportunity" (
    "opp_id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "current_spend_inr_cr" REAL NOT NULL,
    "target_savings_pct" REAL NOT NULL,
    "est_savings_inr_cr" REAL NOT NULL,
    "benchmark_source" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ConversionFunnelPhase" (
    "stage" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "spend_reach_inr_cr" REAL NOT NULL,
    "conversion_rate" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "action_item" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_address" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscription_tier" TEXT DEFAULT 'FREE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RawDocumentIngestion_tenant_id_idx" ON "RawDocumentIngestion"("tenant_id");

-- CreateIndex
CREATE INDEX "ValidationPreCheckRecord_vendor_name_idx" ON "ValidationPreCheckRecord"("vendor_name");

-- CreateIndex
CREATE INDEX "ValidationPreCheckRecord_resolved_idx" ON "ValidationPreCheckRecord"("resolved");

-- CreateIndex
CREATE INDEX "ValidationPreCheckRecord_spend_year_idx" ON "ValidationPreCheckRecord"("spend_year");

-- CreateIndex
CREATE INDEX "VendorYearDetail_vendor_name_idx" ON "VendorYearDetail"("vendor_name");

-- CreateIndex
CREATE INDEX "VendorYearDetail_master_vendor_id_idx" ON "VendorYearDetail"("master_vendor_id");

-- CreateIndex
CREATE INDEX "VendorPriceRank_vendor_name_idx" ON "VendorPriceRank"("vendor_name");

-- CreateIndex
CREATE INDEX "VendorPriceRank_category_idx" ON "VendorPriceRank"("category");

-- CreateIndex
CREATE INDEX "LineItemMapping_mapped_unspsc_code_idx" ON "LineItemMapping"("mapped_unspsc_code");

-- CreateIndex
CREATE INDEX "LineItemMapping_vendor_identified_idx" ON "LineItemMapping"("vendor_identified");

-- CreateIndex
CREATE INDEX "SavingsOpportunity_category_idx" ON "SavingsOpportunity"("category");

-- CreateIndex
CREATE INDEX "SavingsOpportunity_status_idx" ON "SavingsOpportunity"("status");

-- CreateIndex
CREATE INDEX "ConversionFunnelPhase_status_idx" ON "ConversionFunnelPhase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_subscription_tier_idx" ON "User"("subscription_tier");
