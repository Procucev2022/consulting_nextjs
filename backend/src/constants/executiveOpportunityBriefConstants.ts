/** SQL and operational constants for the D1-backed Opportunity Brief. */
export const EXECUTIVE_OPPORTUNITY_BRIEF_SQL = {
  tenants: 'SELECT tenant_id, enterprise_name FROM TenantMaster ORDER BY tenant_id LIMIT 2',
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
    FROM SavingsOpportunity`,
  opportunities: `SELECT opp_id, category, title,
    COALESCE(current_spend_inr_cr, current_spend / 10000000.0, 0) AS current_spend_cr,
    COALESCE(est_savings_inr_cr, est_savings / 10000000.0, 0) AS estimated_savings_cr,
    lever, recommended_action, status, risk_level, confidence_score
    FROM SavingsOpportunity
    ORDER BY estimated_savings_cr DESC, opp_id ASC LIMIT 10`,
  leverBreakdown: `SELECT COALESCE(NULLIF(lever, ''), 'Unspecified') AS label,
    COUNT(*) AS record_count,
    COALESCE(SUM(COALESCE(est_savings_inr_cr, est_savings / 10000000.0)), 0) AS estimated_savings_cr
    FROM SavingsOpportunity GROUP BY COALESCE(NULLIF(lever, ''), 'Unspecified')
    ORDER BY estimated_savings_cr DESC LIMIT 8`,
  statusBreakdown: `SELECT COALESCE(NULLIF(status, ''), 'Unspecified') AS label,
    COUNT(*) AS record_count,
    COALESCE(SUM(COALESCE(est_savings_inr_cr, est_savings / 10000000.0)), 0) AS estimated_savings_cr
    FROM SavingsOpportunity GROUP BY COALESCE(NULLIF(status, ''), 'Unspecified')
    ORDER BY record_count DESC LIMIT 8`,
  riskBreakdown: `SELECT COALESCE(NULLIF(risk_level, ''), 'Unspecified') AS label,
    COUNT(*) AS record_count,
    COALESCE(SUM(COALESCE(est_savings_inr_cr, est_savings / 10000000.0)), 0) AS estimated_savings_cr
    FROM SavingsOpportunity GROUP BY COALESCE(NULLIF(risk_level, ''), 'Unspecified')
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
  POWERPOINT_OUTPUT_ERROR: 'PowerPoint generation did not return a byte array.'
} as const;

export const EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES = {
  d1Unavailable: 'The D1 database is not configured for the Opportunity Brief.',
  noTenant: 'No tenant is configured in D1 for this Opportunity Brief.',
  ambiguousTenant: 'The Opportunity Brief requires one tenant because savings opportunities are not tenant-scoped yet.',
  noTransactions: 'No eligible baseline procurement transactions were found for this tenant.',
  reportFailed: (requestId: string): string =>
    `The Opportunity Brief could not be loaded from D1. Retry after checking the database connection; quote request ID ${requestId} if the problem continues.`,
  exportFailed: (format: string, requestId: string): string =>
    `The Opportunity Brief ${format.toUpperCase()} could not be generated from D1. Retry after checking the database connection; quote request ID ${requestId} if the problem continues.`,
  servedReport: 'Served D1-backed executive opportunity brief report',
  servedDownload: 'Served D1-backed executive opportunity brief download',
  queryFailed: 'Failed to load D1-backed executive opportunity brief data'
} as const;
