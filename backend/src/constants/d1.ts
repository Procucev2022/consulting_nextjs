export const D1_SCHEMA_VERSION = '2026-11-05-006';
export const D1_DEMO_TENANT_ID = 'TNT-GLOBAL-8902';
export const TENANT_DATA_CLASSIFICATION = {
  customer: 'CUSTOMER_DATA',
  demo: 'DEMO_ONLY',
  mixed: 'MIXED'
} as const;
export const PCBI_DATA_LAB_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const PCBI_DATA_LAB_UPLOAD_MAX_BASE64_LENGTH = Math.ceil(PCBI_DATA_LAB_UPLOAD_MAX_BYTES / 3) * 4;
export const PCBI_DATA_LAB_UPLOAD_JSON_MAX_BYTES = PCBI_DATA_LAB_UPLOAD_MAX_BASE64_LENGTH + 64 * 1024;
export const PCBI_DATA_LAB_DATE_HEADER_PATTERNS = [/date/i, /week(?:_start)?/i, /period/i, /month/i] as const;
export const PCBI_DATA_LAB_VALUE_HEADER_PATTERNS = [/index[_ ]?value/i, /benchmark[_ ]?value/i, /price/i, /rate/i, /value/i] as const;
export const PCBI_DATA_LAB_UNIT_HEADERS = /^(unit|uom|benchmark[_ ]unit)$/i;
export const PCBI_DATA_LAB_CURRENCY_HEADERS = /^(currency|currency[_ ]code)$/i;
export const PCBI_DATA_LAB_GEOGRAPHY_HEADERS = /^(geography|region|market)$/i;
export const PCBI_DATA_LAB_STRUCTURED_FILE_TYPES = new Set(['CSV', 'TXT', 'XLS', 'XLSX', 'JSON']);

export const D1_TABLES = {
  tenant: 'TenantMaster',
  tenantDataProvenance: 'TenantDataProvenance',
  ingestion: 'RawDocumentIngestion',
  validation: 'ValidationPreCheckRecord',
  categories: 'SpendCategorySummary',
  categoryDetails: 'CategoryYearDetail',
  vendors: 'VendorYearDetail',
  vendorRanks: 'VendorPriceRank',
  mappings: 'LineItemMapping',
  opportunities: 'SavingsOpportunity',
  funnel: 'ConversionFunnelPhase',
  assessments: 'AssessmentRecord',
  assessmentReviewGates: 'AssessmentReviewGate',
  customers: 'CustomerRecord',
  dataVersions: 'AssessmentDataVersion',
  datasetCorrections: 'OrchestrationDatasetCorrection',
  pcbiGapResolutions: 'OrchestrationPCBIGapResolution',
  analysisRuns: 'AssessmentAnalysisRun',
  auditLogs: 'AssessmentAuditLog',
  pcbiBenchmarks: 'PCBIBenchmarkMaster',
  pcbiIndices: 'PCBIWeeklyIndex',
  pcbiWeeklyReference: 'PCBIWeeklyReference',
  pcbiHistoricalObservations: 'PCBIHistoricalObservation',
  pcbiComponents: 'PCBIBenchmarkComponent',
  pcbiMappings: 'PCBIUNSPSCMapping',
  analysisJobs: 'AnalysisJob',
  actionPlans: 'ActionPlanItem',
  actionPlanDetails: 'ActionPlanItemDetails',
  metrics: 'DatasetMetricSummary',
  monthlySpend: 'Module1MonthlySpend',
  currencySpend: 'Module1CurrencyBreakdown',
  taxonomy: 'UNSPSCCommodity',
  fxCurrencies: 'FxCurrencyMaster',
  fxRates: 'FxReferenceRate',
  fxRules: 'FxRateRule',
  fxVersions: 'FxMasterVersion',
  transactions: 'ProcurementTransaction',
  assessmentMaterialMappings: 'AssessmentMaterialMapping',
  alternateVendors: 'AlternateVendorIndex',
  materialMappings: 'MaterialMappingRegister',
  objectMetadata: 'ObjectMetadata',
  alternateVendorCompany: 'AlternateVendorCompany',
  pcbiSnapshot: 'PCBICommoditySnapshot',
  pcbiMasterVersions: 'PCBIMasterVersion',
  pcbiCommoditySources: 'PCBICommoditySource',
  pcbiCommodityObservations: 'PCBICommodityObservation',
  pcbiCommodityPromotions: 'PCBICommodityPromotion',
  pcbiResearchAssignments: 'PCBICommodityResearchAssignment',
  procurementCategoryMappings: 'ProcurementCategoryMapping',
  complianceReviews: 'Module2ComplianceReview',
  eAuctionPlanningAssumptions: 'Module2EAuctionPlanningAssumption',
  upgradeRequests: 'UpgradeRequest',
  adminOtpSessions: 'AdminOtpSession',
  subscriptionRecords: 'SubscriptionRecord',
  subscriptionAuditEvents: 'SubscriptionAuditEvent',
  industryProfiles: 'IndustryMaterialProfile',
  industrySectorPresets: 'IndustrySectorPreset',
  pcbiResearchWorkflows: 'PCBICommodityResearchWorkflow',
  module2LogisticsCandidates: 'Module2LogisticsPackagingCandidate',
  opportunityTenantScope: 'SavingsOpportunityTenantScope'
} as const;

export const D1_TABLE_COUNT = Object.keys(D1_TABLES).length;

export const D1_PCBI_MASTER_FIELDS = [
  'pcbi_id', 'category', 'sub_category', 'benchmark_name', 'benchmark_type', 'quality_rating',
  'benchmarkability_percent', 'residual_percent', 'benchmark_source', 'currency', 'benchmark_unit',
  'geography', 'sector', 'start_date', 'end_date'
] as const;

export const D1_PCBI_WEEKLY_FIELDS = [
  'pcbi_id', 'week_start', 'index_value', 'quality_rating', 'source', 'currency', 'note'
] as const;

export const D1_PCBI_CONSTITUENT_FIELDS = [
  'pcbi_id', 'constituent_name', 'weight_percent', 'benchmarkability_percent', 'residual_percent', 'methodology'
] as const;

export const D1_PCBI_UNSPSC_FIELDS = [
  'unspsc_code', 'pcbi_id', 'category', 'quality_rating'
] as const;

export const D1_REPORTING = {
  inrPerCrore: 10000000,
  decimalPlaces: 2,
  preciseDecimalPlaces: 6,
  weeklyIndexLimit: 52,
  maxIndexLimit: 1000,
  datasetLimit: 100,
  maxDatasetLimit: 500
} as const;

export const D1_UNCLASSIFIED_LINE_ITEM = {
  unspsc_code: '',
  unspsc_category_name: '',
  core_bucket: '',
  ai_confidence: 0,
  status: 'Pending Review'
} as const;

export const D1_LEVERS = {
  eauction: /auction|competitive/i,
  consolidation: /consolidation|supplier/i,
  volume: /volume|bundl|pool/i
} as const;

export const D1_ROUTE_MESSAGES = {
  tenantScopeRequired: 'An authenticated tenant assignment is required to access this dataset.',
  tenantScopeMismatch: 'The requested tenant does not match the authenticated tenant assignment.',
  tenantUnavailable: (tenantId: string): string => `Assigned tenant ${tenantId} is unavailable. Ask an administrator to review the tenant assignment.`,
  validationFailed: 'Validation failed',
  invalidJsonBody: 'Request body must be a JSON object. Correct its syntax and retry.',
  requestBodyTooLarge: (maxBytes: number): string => `Request body exceeds the ${maxBytes}-byte limit. Reduce the payload size and retry.`,
  ingestionUploadFileTooLarge: 'Uploaded procurement files must be no larger than 10 MiB. Choose a smaller file and retry.',
  ingestionUploadBase64Invalid: 'Uploaded file content is not valid Base64. Choose the original file and retry.',
  missingBinding: 'Cloudflare D1 binding DB is not configured',
  module2LogisticsMethod: 'Module 2 logistics and packaging data supports GET requests only.',
  module2LogisticsInvalid: 'Module 2 logistics query is invalid. Select an assessment ID and retry.',
  module2LogisticsAuthFailed: 'Authentication required. Sign in with an active account and retry.',
  module2LogisticsAssessmentNotFound: 'The requested logistics assessment was not found.',
  module2LogisticsAccessDenied: 'You do not have access to logistics data for this assessment.',
  industryProfileMethod: 'Industry profiles support GET requests only.',
  industryProfileInvalid: 'Industry profile query is invalid. Correct the listed fields and retry.',
  industryProfileCorrupt: 'Industry profiles could not be read because a D1 catalog record is invalid. Ask an administrator to repair the catalog.',
  invalidQuery: 'PCBI data could not be loaded because the query parameters are invalid. Correct the listed fields and retry.',
  invalidDatasetScope: 'Validation failed',
  missingCanonical: (assessmentId: string): string =>
    `D1 has no canonical Module 1 dataset for assessment ${assessmentId}. Run Module 1 for this assessment and retry.`,
  unknownPcbi: 'This PCBI endpoint is unavailable. Use benchmarks, components, indices, unspsc-mapping, or dashboard.',
  pcbiMethod: 'This PCBI reference endpoint supports GET only. No benchmark or index data was changed.',
  pcbiVersionNotFound: 'The requested PCBI master version was not found in D1.',
  pcbiVersionConflict: 'That PCBI master version already exists. Choose a new version number and retry.',
  pcbiImportBlocked: 'PCBI master data was not imported because validation contains blocking errors or no benchmark records.',
  pcbiPublishBlocked: 'This PCBI version cannot be published until it has passed validation and contains benchmark records.',
  pcbiImportInvalid: 'PCBI import payload is invalid. Correct the listed fields and retry.',
  pcbiPublishInvalid: 'PCBI publish payload is invalid. Supply a publisher name and retry.',
  pcbiDataLabInvalid: 'Commodity Data Lab request is invalid. Correct the listed fields and retry.',
  pcbiDataLabSourceNotFound: 'The requested PCBI commodity or source was not found in D1.',
  pcbiDataLabFileRequired: 'Select a research evidence file before uploading it to the Data Lab.',
  pcbiDataLabFileInvalid: 'The evidence file could not be read. Check its format and try again.',
  pcbiDataLabR2Unavailable: 'Research evidence cannot be saved because the Cloudflare R2 object store is not configured.',
  pcbiDataLabPersistenceFailed: 'Research evidence could not be committed consistently to D1. Contact support with the request ID before retrying so any partial D1 or R2 records can be checked.',
  pcbiDataLabUploadTooLarge: 'Research evidence exceeds the supported upload size. Choose a file under 10 MB.',
  pcbiDataLabPdfExtractionFailed: 'No reliable dated commodity price rows could be extracted from this PDF. Upload a text-searchable PDF with explicit dates and prices, or use CSV/XLSX.',
  pcbiDataLabPdfExtractionUnavailable: 'PDF observations could not be extracted because the document extraction service is not configured. Contact the administrator to configure it, then upload the PDF again.',
  pcbiDataLabApprovalBlocked: 'PCBI evidence is not ready for catalog approval. Resolve the listed source and observation issues first.',
  pcbiDataLabMethod: 'This Commodity Data Lab endpoint does not support the requested HTTP method.',
  pcbiResearchAssignmentInvalid: 'Research assignment was not saved. Enter a valid PCBI ID and a researcher name or email, then retry.',
  pcbiResearchAssignmentNotFound: 'Research assignment was not saved because this PCBI definition is not in D1. Refresh the queue and select an available commodity.',
  pcbiDataLabDomainRejected: (target: string): string => `This file is not compatible with the ${target} upload area.`,
  pcbiDataLabNoBenchmark: 'A matching PCBI benchmark definition is required before commodity evidence can be staged.',
  pcbiAdminMethod: (allowed: string): string => `PCBI administration route does not support this request. Use the supported ${allowed} operation.`,
  savingsAssessmentRequired: 'Select an assessment to load its savings results. Tenant-wide results are not available for this endpoint.',
  savingsMethod: 'This HTTP method is not supported for the savings endpoint. No savings data was changed.',
  unknownSavings: 'This savings endpoint does not exist. Refresh the savings workspace and select a supported action.',
  currencyNotFound: (currency: string): string => `Currency ${currency} is not present in D1 reference data.`,
  currencyRateUnavailable: (currency: string, date: string): string => `No D1 exchange rate for ${currency} is available on or before ${date}.`
} as const;

export const D1_LOG_MESSAGES = {
  invalidStoredCurrencyMetadata: 'Stored ingestion currency metadata could not be parsed; an empty currency list was used.',
  invalidPcbiAdminStoredJson: 'Stored PCBI administration JSON is invalid; the value was not trusted',
  invalidPcbiAdminPayloadSchema: 'Stored PCBI administration payload does not match its schema; publication was blocked',
  invalidPaymentTermsSourceJson: 'Malformed D1 payment-term source JSON reduced verified coverage'
} as const;

export const D1_LOG_ACTIONS = {
  invalidPcbiAdminStoredJson: 'd1.pcbi_admin.stored_json_invalid',
  invalidPcbiAdminPayloadSchema: 'd1.pcbi_admin.payload_schema_invalid',
  invalidPaymentTermsSourceJson: 'd1.payment_terms.source_json_invalid'
} as const;

export const D1_TAXONOMY_DEFAULT_LIMIT = 50;
export const D1_TAXONOMY_MAX_LIMIT = 1000;
export const D1_INGESTION_PAGE_SIZE = 100;
export const D1_INGESTION_PAGE_QUERY_LIMIT = D1_INGESTION_PAGE_SIZE + 1;
export const D1_INGESTION_CURSOR_ID_MAX_LENGTH = 200;
export const D1_INGESTION_CURSOR_TIMESTAMP_MAX_LENGTH = 80;
export const D1_GRAPHQL_CURSOR_VERSION = 1;
export const D1_GRAPHQL_CURSOR_MAX_LENGTH = 2048;
export const D1_GRAPHQL_PAGE_OVERFETCH_ROWS = 1;
export const D1_GRAPHQL_CURSOR_KINDS = ['ingestionQueue', 'validationRecords'] as const;
export const D1_GRAPHQL_BASE64_BLOCK_LENGTH = 4;
export const D1_GRAPHQL_BASE64_PADDING = '=';
export const D1_SCHEMA_QUERY = `
  SELECT schema.name AS table_name, schema.sql AS table_sql, columns.name AS column_name, columns.cid AS column_cid
  FROM sqlite_master AS schema
  JOIN pragma_table_info(schema.name) AS columns
  WHERE schema.type = 'table'
    AND schema.name NOT LIKE 'sqlite_%'
    AND schema.name NOT LIKE '_cf_%'
    AND schema.name NOT LIKE 'd1_%'
  ORDER BY schema.name, columns.cid
`;
export const D1_DATABASE_STATUS_QUERY = `
  SELECT tables.name, totals.totalRecords
  FROM sqlite_master AS tables
  CROSS JOIN (
    SELECT
      (SELECT COUNT(*) FROM TenantMaster) +
      (SELECT COUNT(*) FROM RawDocumentIngestion) +
      (SELECT COUNT(*) FROM ValidationPreCheckRecord) +
      (SELECT COUNT(*) FROM SpendCategorySummary) +
      (SELECT COUNT(*) FROM VendorYearDetail) +
      (SELECT COUNT(*) FROM AssessmentRecord) +
      (SELECT COUNT(*) FROM ProcurementTransaction) AS totalRecords
  ) AS totals
  WHERE tables.type = 'table' AND tables.name NOT LIKE 'sqlite_%'
`;
export const D1_INGESTION_REMEDIATION_CANDIDATES_QUERY = `
  WITH candidate_records AS (
    SELECT validation.*,
      CASE
        WHEN substr(COALESCE(validation.transaction_date, ''), 1, 10)
          GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
          THEN substr(validation.transaction_date, 1, 10)
        WHEN CAST(validation.spend_year AS REAL) BETWEEN 1900 AND 2200
          AND CAST(validation.spend_year AS INTEGER) = CAST(validation.spend_year AS REAL)
          THEN printf('%04d-12-31', CAST(validation.spend_year AS INTEGER))
        ELSE NULL
      END AS remediation_effective_date
    FROM ValidationPreCheckRecord AS validation
    WHERE validation.tenant_id = ?
      AND COALESCE(validation.amount, 0) > 0
      AND COALESCE(validation.raw_currency, '') <> ''
    ORDER BY validation.created_at DESC
    LIMIT ?
  )
  SELECT candidate_records.*,
    CASE
      WHEN UPPER(TRIM(COALESCE(candidate_records.raw_currency, ''))) = 'INR' THEN 1
      ELSE COALESCE((
        SELECT rate.inr_per_unit FROM FxReferenceRate AS rate
        WHERE rate.currency = UPPER(TRIM(COALESCE(candidate_records.raw_currency, '')))
          AND rate.rate_date <= candidate_records.remediation_effective_date
        ORDER BY rate.rate_date DESC LIMIT 1
      ), 0)
    END AS remediation_fx_rate
  FROM candidate_records
`;
export const D1_INGESTION_REMEDIATED_RECORDS_QUERY = `
  SELECT validation.*
  FROM ValidationPreCheckRecord AS validation
  INNER JOIN json_each(?) AS updated ON updated.value = validation.record_id
  WHERE validation.tenant_id = ?
  ORDER BY CAST(updated.key AS INTEGER)
`;
