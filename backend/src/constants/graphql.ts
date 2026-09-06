/**
 * GraphQL Schema Definition and Constants (Backend)
 * 
 * Centralized GraphQL SDL schema definition, field types, queries, and mutations.
 */

export const GRAPHQL_SCHEMA_SDL = `
  type TenantMaster {
    tenant_id: String!
    enterprise_name: String!
    region: String!
    base_currency: String!
    status: String!
    total_spend_evaluated: Float!
    total_spend_evaluated_inr: Float
  }

  type RawDocumentIngestion {
    doc_id: String!
    tenant_id: String!
    file_name: String!
    file_type: String!
    file_size_mb: Float!
    ocr_status: String!
    progress: Float!
    uploaded_at: String!
    records_count: Int!
    detected_currencies: [String!]
    converted_inr_crores: Float
  }

  type ValidationPreCheckRecord {
    record_id: String!
    po_number: String!
    vendor_name: String!
    raw_desc: String!
    order_quantity: Float
    net_price: Float
    subtotal_raw: Float
    amount: Float!
    raw_currency: String
    amount_inr: Float
    inr_crores: Float
    fx_rate_applied: Float
    yahoo_ticker: String
    spend_year: Int
    column_l_code: String
    core_category: String
    issue_flag: String!
    action_status: String!
    resolved: Boolean!
  }

  type SpendCategorySummary {
    id: String!
    name: String!
    spend: Float!
    spend_inr: Float
    spend_inr_crores: Float
    targetReductionPct: Float!
    lineItemsCount: Int!
    color: String!
    column_l_code: String
    spend_2023: Float
    spend_2024: Float
    spend_2025_26: Float
    spend_inr_2023: Float
    spend_inr_2024: Float
    spend_inr_2025_26: Float
  }

  type BalanceCategoryItem {
    name: String!
    column_l_code: String!
    spend_inr_cr: Float!
    share_pct: Float!
  }

  type CategoryTopItem {
    item_id: String!
    item_desc: String!
    column_l_code: String!
    vendor_name: String!
    po_number: String!
    unit_of_measure: String!
    raw_currency: String!
    order_qty_annual: Float!
    price_fy24: Float!
    price_fy25: Float!
    price_fy26: Float!
    fx_rate_applied: Float!
    total_spend_inr_cr: Float!
    price_change_pct: Float!
    trend_direction: String!
    leakage_flag: String
    opportunity_potential_inr_lakhs: Float
  }

  type CategoryYearDetail {
    id: String
    rank: Int
    category: String!
    core_bucket: String
    sample_column_l_code: String!
    sample_column_l_title: String!
    spend_2023: Float
    spend_2024: Float
    spend_2025_26: Float
    total_3yr_spend: Float
    spend_inr_2023_cr: Float!
    spend_inr_2024_cr: Float!
    spend_inr_2025_26_cr: Float!
    spend_fy24_cr: Float
    spend_fy25_cr: Float
    spend_fy26_cr: Float
    total_3yr_spend_inr_cr: Float!
    yoy_growth_pct: Float!
    line_items_count: Int!
    color: String!
    is_balance_category: Boolean
    balance_items: [BalanceCategoryItem!]
    top_items: [CategoryTopItem!]
  }

  type BalanceVendorItem {
    vendor_name: String!
    category: String!
    column_l_code: String!
    spend_inr_cr: Float!
    share_pct: Float!
    line_items_count: Int!
  }

  type VendorYearDetail {
    id: String!
    rank: Int
    vendor_name: String!
    master_vendor_id: String!
    primary_category: String!
    sample_column_l_code: String!
    sample_column_l_title: String!
    spend_fy24_cr: Float!
    spend_fy25_cr: Float!
    spend_fy26_cr: Float!
    total_3yr_spend_inr_cr: Float!
    yoy_growth_pct: Float!
    line_items_count: Int!
    color: String!
    risk_status: String
    price_creep_pct: Float
    is_balance_vendor: Boolean
    balance_vendors: [BalanceVendorItem!]
    top_items: [CategoryTopItem!]
  }

  type LineItemMapping {
    mapping_id: String!
    line_item_id: String!
    raw_desc: String!
    vendor_identified: String!
    master_supplier_id: String
    unspsc_code: String!
    unspsc_category_name: String!
    core_bucket: String!
    ai_confidence: Float!
    status: String!
    unit_price: Float!
    qty: Float!
    total_spend: Float!
    raw_currency: String
    amount_inr: Float
    inr_crores: Float
    fx_rate_applied: Float
    invoice_date: String!
    spend_year: Int
    po_number: String!
  }

  type VendorPriceRank {
    vendor_name: String!
    master_id: String!
    category: String!
    price_creep_pct: Float!
    total_spend: Float!
    total_spend_inr_cr: Float
    risk_status: String!
    variance_leakage_usd: Float!
    variance_leakage_inr_cr: Float
    benchmark_index: String!
    last_36mo_trend: [Float!]!
  }

  type SavingsOpportunity {
    opp_id: String!
    category: String!
    title: String!
    current_spend: Float!
    current_spend_inr_cr: Float
    target_savings_pct: Float!
    est_savings: Float!
    est_savings_inr_cr: Float
    recommended_action: String!
    push_to_module: String!
    status: String!
    risk_level: String!
    contract_leak_type: String!
  }

  type ConversionFunnelPhase {
    phase_num: Int!
    phase_name: String!
    platform_actionable_focus: String!
    value_outcome_delivered: String!
    commercial_lock_in_metric: String!
    completion_pct: Float!
    status: String!
  }

  type QueryAuditItem {
    queryId: String!
    operation: String!
    model: String!
    durationMs: Float!
    cached: Boolean!
    timestamp: String!
    rowCount: Int
  }

  type QueryMetrics {
    totalQueries: Int!
    slowQueries: Int!
    cacheHitRatio: Float!
    averageDurationMs: Float!
    recentAudits: [QueryAuditItem!]!
  }

  type MergeVendorResult {
    success: Boolean!
    affected: Int!
  }

  type DashboardOverview {
    tenant: TenantMaster
    categories: [SpendCategorySummary!]!
    opportunities: [SavingsOpportunity!]!
    funnelStages: [ConversionFunnelPhase!]!
    ingestionQueue: [RawDocumentIngestion!]!
    validationRecords: [ValidationPreCheckRecord!]!
    queryMetrics: QueryMetrics!
  }

  input UpdateTenantInput {
    enterprise_name: String
    region: String
    base_currency: String
    status: String
    total_spend_evaluated_inr: Float
  }

  input IngestionInput {
    file_name: String!
    file_type: String!
    file_size_mb: Float!
    records_count: Int
  }

  input ValidationRecordInput {
    record_id: String!
    issue_flag: String
    action_status: String
    resolved: Boolean
  }

  input MergeVendorInput {
    targetName: String!
    masterId: String!
    canonicalName: String!
  }

  type Query {
    tenant: TenantMaster
    ingestionQueue: [RawDocumentIngestion!]!
    validationRecords: [ValidationPreCheckRecord!]!
    categories: [SpendCategorySummary!]!
    categoryDetails(id: String): [CategoryYearDetail!]!
    vendorDetails: [VendorYearDetail!]!
    vendorRankings: [VendorPriceRank!]!
    lineItems: [LineItemMapping!]!
    opportunities: [SavingsOpportunity!]!
    funnelStages: [ConversionFunnelPhase!]!
    queryMetrics: QueryMetrics!
    dashboardOverview: DashboardOverview!
  }

  type Mutation {
    updateTenant(input: UpdateTenantInput!): TenantMaster!
    addIngestionItem(input: IngestionInput!): RawDocumentIngestion!
    updateValidationRecord(input: ValidationRecordInput!): ValidationPreCheckRecord
    mergeVendor(input: MergeVendorInput!): MergeVendorResult!
    deployOpportunity(id: String!, targetModule: String!): SavingsOpportunity
  }
`;

export const GRAPHQL_ERRORS = {
  INVALID_QUERY: 'Invalid GraphQL query string provided',
  EXECUTION_FAILED: 'GraphQL execution encountered errors',
  MISSING_OPERATION: 'GraphQL request requires query or mutation string'
} as const;
