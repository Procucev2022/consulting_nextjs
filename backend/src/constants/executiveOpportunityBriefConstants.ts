/** SQL and operational constants for the D1-backed Opportunity Brief. */
export const EXECUTIVE_OPPORTUNITY_BRIEF_SQL = {
  tenant: 'SELECT tenant_id, enterprise_name FROM TenantMaster WHERE tenant_id = ? LIMIT 1',
  tenantProvenance: 'SELECT classification FROM TenantDataProvenance WHERE tenant_id = ? LIMIT 1',
  transactionMetrics: `SELECT COUNT(*) AS transaction_count,
    COALESCE(SUM(total_in_cr_raw), 0) AS total_spend_cr,
    COUNT(DISTINCT supplier_name) AS supplier_count,
    COUNT(DISTINCT material_code) AS material_count,
    COUNT(DISTINCT plant) AS plant_count,
    COUNT(DISTINCT po_number) AS purchase_order_count,
    MIN(document_date_raw) AS first_transaction_date,
    MAX(document_date_raw) AS last_transaction_date
    FROM ProcurementTransaction
    WHERE tenant_id = ? AND assessment_id IS NULL
      AND COALESCE(deletion_indicator, '') NOT IN ('X', 'x', '1')`,
  opportunityMetrics: `SELECT COUNT(*) AS opportunity_count,
    COALESCE(SUM(COALESCE(est_savings_inr_cr, est_savings / 10000000.0)), 0) AS estimated_savings_cr,
    COALESCE(AVG(confidence_score), 0) AS average_confidence
    FROM SavingsOpportunity
    WHERE opp_id IN (SELECT opp_id FROM SavingsOpportunityTenantScope WHERE tenant_id = ?)`,
  opportunities: `SELECT opp_id, category, title,
    COALESCE(current_spend_inr_cr, current_spend / 10000000.0, 0) AS current_spend_cr,
    COALESCE(est_savings_inr_cr, est_savings / 10000000.0, 0) AS estimated_savings_cr,
    lever, recommended_action, status, risk_level, confidence_score
    FROM SavingsOpportunity
    WHERE opp_id IN (SELECT opp_id FROM SavingsOpportunityTenantScope WHERE tenant_id = ?)
    ORDER BY estimated_savings_cr DESC, opp_id ASC LIMIT 10`,
  leverBreakdown: `SELECT COALESCE(NULLIF(lever, ''), 'Unspecified') AS label,
    COUNT(*) AS record_count,
    COALESCE(SUM(COALESCE(est_savings_inr_cr, est_savings / 10000000.0)), 0) AS estimated_savings_cr
    FROM SavingsOpportunity
    WHERE opp_id IN (SELECT opp_id FROM SavingsOpportunityTenantScope WHERE tenant_id = ?)
    GROUP BY COALESCE(NULLIF(lever, ''), 'Unspecified')
    ORDER BY estimated_savings_cr DESC LIMIT 8`,
  statusBreakdown: `SELECT COALESCE(NULLIF(status, ''), 'Unspecified') AS label,
    COUNT(*) AS record_count,
    COALESCE(SUM(COALESCE(est_savings_inr_cr, est_savings / 10000000.0)), 0) AS estimated_savings_cr
    FROM SavingsOpportunity
    WHERE opp_id IN (SELECT opp_id FROM SavingsOpportunityTenantScope WHERE tenant_id = ?)
    GROUP BY COALESCE(NULLIF(status, ''), 'Unspecified')
    ORDER BY record_count DESC LIMIT 8`,
  riskBreakdown: `SELECT COALESCE(NULLIF(risk_level, ''), 'Unspecified') AS label,
    COUNT(*) AS record_count,
    COALESCE(SUM(COALESCE(est_savings_inr_cr, est_savings / 10000000.0)), 0) AS estimated_savings_cr
    FROM SavingsOpportunity
    WHERE opp_id IN (SELECT opp_id FROM SavingsOpportunityTenantScope WHERE tenant_id = ?)
    GROUP BY COALESCE(NULLIF(risk_level, ''), 'Unspecified')
    ORDER BY record_count DESC LIMIT 8`
} as const;

export const EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT = {
  PDF_NAME_PREFIX: 'Executive_Opportunity_Brief_',
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/u,
  TENANT_UNSAFE_CHARACTERS: /[^A-Za-z0-9_-]+/gu,
  TENANT_EDGE_SEPARATORS: /^[_-]+|[_-]+$/gu,
  PAGE_WIDTH: 960,
  PAGE_HEIGHT: 540,
  MARGIN: 54,
  ROW_GAP: 34,
  MAX_ROWS: 8,
  PPTX_LAYOUT: 'LAYOUT_16x9',
  PPTX_AUTHOR: 'Procucev Advisory Services',
  PPTX_COMPANY: 'Procucev / aiCEV',
  PPTX_TITLE: 'Executive Opportunity Brief',
  SLIDE_TITLES: [
    'Executive Opportunity Brief',
    'Procurement baseline',
    'Opportunity register',
    'Value by lever',
    'Opportunity status',
    'Risk and confidence',
    'Priority opportunities',
    'Supplier and material footprint',
    'Data scope and coverage',
    'Recommended next actions'
  ],
  UNAVAILABLE_ACTION: 'Review the D1 tenant, transaction baseline, and opportunity register, then retry.',
  EMPTY_VALUE: 'Not recorded',
  CURRENCY_SUFFIX: ' Cr',
  CONFIDENCE_SUFFIX: '%',
  FOOTER: 'Management Confidential | D1-backed procurement data',
  MONEY_DECIMAL_PLACES: 2,
  CONFIDENCE_MULTIPLIER: 100,
  TENANT_FALLBACK: 'Tenant',
  CLASSIFICATION_LABELS: {
    CUSTOMER_DATA: 'CUSTOMER DATA',
    DEMO_ONLY: 'DEMO ONLY - NOT VALIDATED SAVINGS',
    MIXED: 'MIXED DATA - REVIEW SCOPE'
  },
  CLASSIFICATION_COLORS: {
    standard: '#5B6472',
    demo: '#9A3412'
  },
  POWERPOINT_OUTPUT_ERROR: 'PowerPoint generation did not return a byte array.'
} as const;

export const EXECUTIVE_OPPORTUNITY_BRIEF_AUDIT = {
  TITLE: '# Executive Opportunity Brief audit',
  GENERATED_LABEL: 'Generated at',
  TENANT_LABEL: 'Tenant',
  DATA_CLASSIFICATION_LABEL: 'Data classification',
  SCOPE_LABEL: 'Scope',
  SUMMARY_HEADING: '## Procurement baseline and opportunity summary',
  OPPORTUNITY_HEADING: '## Opportunity register',
  CATEGORY_HEADER: 'Category',
  OPPORTUNITY_HEADER: 'Opportunity',
  ESTIMATED_SAVINGS_HEADER: 'Estimated savings (INR Cr)',
  STATUS_HEADER: 'Status',
  RISK_HEADER: 'Risk',
  NO_OPPORTUNITIES: 'No tenant-linked opportunities are recorded in D1.',
  TRANSACTIONS_LABEL: 'Eligible transactions',
  SPEND_LABEL: 'Baseline spend (INR Cr)',
  SUPPLIERS_LABEL: 'Suppliers',
  MATERIALS_LABEL: 'Materials',
  PLANTS_LABEL: 'Plants',
  PURCHASE_ORDERS_LABEL: 'Purchase orders',
  OPPORTUNITIES_LABEL: 'Tenant-linked opportunities',
  SAVINGS_LABEL: 'Estimated savings (INR Cr)',
  NEWLINE_PATTERN: /[\r\n]+/gu,
  PIPE_PATTERN: /\|/gu,
  PIPE_ESCAPE: '\\|',
  DECIMAL_PLACES: 2,
  MARKDOWN_HEADER_SEPARATOR: '| --- | --- | --- | --- | --- |'
} as const;

export const EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES = {
  d1Unavailable: 'The D1 database is not configured for the Opportunity Brief.',
  noTenant: 'No tenant is configured in D1 for this Opportunity Brief.',
  tenantScopeRequired: 'The Opportunity Brief needs a selected tenant. Choose an active tenant in the admin workspace and retry.',
  noTransactions: 'No eligible baseline procurement transactions were found for this tenant.',
  demoScope: 'This report uses D1 demo seed data for illustration. The figures are not validated customer results or realized savings.',
  mixedScope: 'This report contains both demo seed data and customer records. Separate the demo rows before using the figures for decisions.',
  customerScope: 'Baseline transaction rows exclude assessment-specific copies. Opportunities are included only when explicitly linked to this tenant in D1.',
  reportFailed: (requestId: string): string =>
    `The Opportunity Brief could not be loaded from D1. Retry after checking the database connection; quote request ID ${requestId} if the problem continues.`,
  exportFailed: (format: string, requestId: string): string =>
    `The Opportunity Brief ${format.toUpperCase()} could not be generated from D1. Retry after checking the database connection; quote request ID ${requestId} if the problem continues.`,
  tenantMismatch: (requested: string, available: string): string =>
    `The requested tenant "${requested}" does not match the tenant currently available in D1 ("${available}"). Verify the tenant name and retry.`,
  publishFailed: (requestId: string): string =>
    `The D1-backed brief artifacts could not be stored in R2. Check the OBJECTS binding and retry; quote request ID ${requestId} if it repeats.`,
  emailSent: 'The current D1-backed Executive Opportunity Brief was sent successfully.',
  invalidEmailRequest: 'Request body must be valid JSON with a buyerEmail field.',
  emailFailed: (requestId: string): string =>
    `The D1-backed Executive Opportunity Brief could not be emailed. Check the Worker email provider settings and retry; quote request ID ${requestId} if the problem continues.`,
  servedReport: 'Served D1-backed executive opportunity brief report',
  servedDownload: 'Served D1-backed executive opportunity brief download',
  queryFailed: 'Failed to load D1-backed executive opportunity brief data'
} as const;
