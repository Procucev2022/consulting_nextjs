import type {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  SpendCategorySummary,
  CategoryYearDetail,
  VendorYearDetail,
  LineItemMapping,
  VendorPriceRank,
  SavingsOpportunity,
  ConversionFunnelPhase,
  UserRecord
} from '../types';

export const mockTenant: TenantMaster = {
  tenant_id: 'TNT-GLOBAL-8902',
  enterprise_name: 'Enterprise Client',
  region: 'GLOBAL',
  base_currency: 'INR',
  status: 'ACTIVE',
  total_spend_evaluated: 0,
  total_spend_evaluated_inr: 0,
  major_sector: 'Direct & Indirect Procurement',
  minor_sector: 'Strategic Sourcing'
};

export const initialIngestionQueue: RawDocumentIngestion[] = [];

export const initialValidationRecords: ValidationPreCheckRecord[] = [];

export const spendCategoriesData: SpendCategorySummary[] = [];

export const categoryYearWiseDetails: CategoryYearDetail[] = [];

export const initialLineItemMappings: LineItemMapping[] = [];

export const vendorVolatilityRankings: VendorPriceRank[] = [];

export const initialSavingsOpportunities: SavingsOpportunity[] = [];

export const conversionFunnelStages: ConversionFunnelPhase[] = [
  {
    phase_num: 1,
    phase_name: 'Dataset Ingestion & ETL Normalization',
    spend_evaluated_cr: 0,
    count_elements: 0,
    percentage_leakage_identified: 0,
    platform_actionable_focus: 'Multi-Currency Live FX & Pre-ETL Anomaly Detection',
    value_outcome_delivered: 'Unified base currency spend view with OCR validation',
    commercial_lock_in_metric: 'Data Ingestion SLA Verified (<800ms query latency)',
    completion_pct: 100,
    status: 'Completed'
  },
  {
    phase_num: 2,
    phase_name: 'AI UNSPSC Taxonomy & Entity Resolution',
    spend_evaluated_cr: 0,
    count_elements: 0,
    percentage_leakage_identified: 0,
    platform_actionable_focus: 'AI UNSPSC Column L Auto-Classification',
    value_outcome_delivered: 'Standardized commodity codes and unified vendor master',
    commercial_lock_in_metric: 'Taxonomy Match Confidence >= 95%',
    completion_pct: 75,
    status: 'In Progress'
  },
  {
    phase_num: 3,
    phase_name: 'Multi-Year Spend Trend & Volatility Indexing',
    spend_evaluated_cr: 0,
    count_elements: 0,
    percentage_leakage_identified: 0,
    platform_actionable_focus: '36-Month Base Price vs Supplier Price Creep Tracking',
    value_outcome_delivered: 'Benchmark gap identification and commodity index pegging',
    commercial_lock_in_metric: 'LME/ICIS Index Correlation Engine Live',
    completion_pct: 45,
    status: 'Upcoming'
  },
  {
    phase_num: 4,
    phase_name: 'Real-Time Opportunity Identification',
    spend_evaluated_cr: 0,
    count_elements: 0,
    percentage_leakage_identified: 0,
    platform_actionable_focus: 'Direct Opportunity Pipeline Generation',
    value_outcome_delivered: 'Actionable savings pipeline categorized by execution platform',
    commercial_lock_in_metric: 'Executive Approval Matrix Configured',
    completion_pct: 20,
    status: 'Upcoming'
  },
  {
    phase_num: 5,
    phase_name: 'Commercial ROI & SaaS Lock-in',
    spend_evaluated_cr: 0,
    count_elements: 0,
    percentage_leakage_identified: 0,
    platform_actionable_focus: 'Full Platform Onboarding (proCPX & DPS NXT)',
    value_outcome_delivered: 'Sticky SaaS lock-in & continuous savings execution',
    commercial_lock_in_metric: 'Multi-Year Global Agreement Signed',
    completion_pct: 0,
    status: 'Upcoming'
  }
];

export const schemaEntities = [
  {
    entity_name: 'Tenant_Master',
    primary_attributes: 'tenant_id, enterprise_name, region (NA/EU/APAC/GLOBAL), base_currency (INR), status',
    system_usage: 'Root entity supporting multi-tenant enterprise data isolation with INR base reporting.',
    sample_records: [
      { tenant_id: 'TNT-GLOBAL-8902', enterprise_name: 'Enterprise Client', region: 'GLOBAL', base_currency: 'INR (₹ Cr)', status: 'ACTIVE' }
    ]
  },
  {
    entity_name: 'Raw_Document_Ingestion',
    primary_attributes: 'doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, detected_currencies, inr_crores',
    system_usage: 'Stores metadata for uploaded multi-currency procurement files with time-series FX normalization.',
    sample_records: [
      { doc_id: 'DOC-9041', tenant_id: 'TNT-GLOBAL-8902', file_name: 'Purchase_History.xlsx', detected_currencies: 'USD, EUR, INR', inr_crores: '₹0.00 Cr' }
    ]
  },
  {
    entity_name: 'Spend_Line_Items',
    primary_attributes: 'line_item_id, doc_id, tenant_id, po_number, invoice_date, vendor_id, raw_desc, raw_currency, fx_rate, amount_inr, inr_crores, spend_year',
    system_usage: 'Core transaction table containing normalized spend line items converted into INR.',
    sample_records: [
      { line_item_id: 'LITM-7701', doc_id: 'DOC-9041', po_number: 'PO-2025-44910', raw_desc: 'Direct Procurement Consumables', raw_currency: 'INR', fx_rate: '1.00 FX Rate', inr_crores: '₹0.00 Cr' }
    ]
  },
  {
    entity_name: 'AI_Taxonomy_Mapping',
    primary_attributes: 'mapping_id, line_item_id, unspsc_code (Col L), core_category, confidence_score, verified_by_user',
    system_usage: 'Output from Public/Enterprise QUA AI categorization engine utilizing Column L Commodity Codes.',
    sample_records: [
      { mapping_id: 'MAP-1001', line_item_id: 'LITM-7701', unspsc_code: '14121506', core_category: 'Packaging Materials', confidence_score: '98.4%', verified_by_user: true }
    ]
  },
  {
    entity_name: 'Market_Indices',
    primary_attributes: 'index_id, index_code, commodity_name, price_date, benchmark_value',
    system_usage: 'External commodity index tracking (ICIS, LME, Platts, Multi-Currency FX) for spend trend comparison.',
    sample_records: [
      { index_id: 'IDX-USDINR', index_code: 'USDINR=X', commodity_name: 'USD/INR FX Benchmark Rate', price_date: '2026-08-01', benchmark_value: '₹83.80' }
    ]
  }
];

export const vendorYearWiseDetails: VendorYearDetail[] = [];

export const initialSeedUsers: UserRecord[] = [
  {
    id: 'usr-admin-001',
    name: 'System Administrator',
    mobile_number: '+91 98765 43210',
    email: 'admin@procucev.com',
    company_name: 'aiCEV Procucev Enterprise Inc.',
    company_address: 'Floor 14, Brigade Gateway, Malleshwaram, Bengaluru, Karnataka 560055, India',
    password_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90:d94a65eb79041bf8bc35680693400ff3bc1cc9113000930f8d94cc61d6b7d842a152fcdc3d854e9daaf6d9789be1a09bdb6eb11750e63b605bf6f368085f7c3b',
    role: 'ADMIN',
    status: 'ACTIVE',
    subscription_tier: 'GOLD',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    id: 'usr-user-001',
    name: 'Enterprise Buyer',
    mobile_number: '+91 98450 12345',
    email: 'buyer@procucev.com',
    company_name: 'Enterprise Client Ltd.',
    company_address: 'Plot 45, Industrial Suburb, Peenya 2nd Stage, Bengaluru 560058, Karnataka, India',
    password_hash: 'b2c3d4e5f60718293a4b5c6d7e8f90a1:30ad14913a5d6652f98f32c1461a84ff793d18816c44eaa693f2828e2fe5a6de706fc18b8b1f437a570b665b153c49446dadd9c1803c9fc7184bfe0b618645a4',
    role: 'USER',
    status: 'ACTIVE',
    subscription_tier: 'GOLD',
    created_at: new Date('2026-02-15T09:30:00.000Z'),
    updated_at: new Date('2026-02-15T09:30:00.000Z')
  }
];
