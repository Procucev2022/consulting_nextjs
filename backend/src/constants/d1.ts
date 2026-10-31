export const D1_SCHEMA_VERSION = '2026-10-31-001';
export const PCBI_DATA_LAB_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const PCBI_DATA_LAB_UPLOAD_MAX_BASE64_LENGTH = Math.ceil(PCBI_DATA_LAB_UPLOAD_MAX_BYTES / 3) * 4;
export const PCBI_DATA_LAB_DATE_HEADER_PATTERNS = [/date/i, /week(?:_start)?/i, /period/i, /month/i] as const;
export const PCBI_DATA_LAB_VALUE_HEADER_PATTERNS = [/index[_ ]?value/i, /benchmark[_ ]?value/i, /price/i, /rate/i, /value/i] as const;
export const PCBI_DATA_LAB_UNIT_HEADERS = /^(unit|uom|benchmark[_ ]unit)$/i;
export const PCBI_DATA_LAB_CURRENCY_HEADERS = /^(currency|currency[_ ]code)$/i;
export const PCBI_DATA_LAB_GEOGRAPHY_HEADERS = /^(geography|region|market)$/i;
export const PCBI_DATA_LAB_STRUCTURED_FILE_TYPES = new Set(['CSV', 'TXT', 'XLS', 'XLSX', 'JSON']);

export const D1_TABLES = {
  tenant: 'TenantMaster',
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
  subscriptionAuditEvents: 'SubscriptionAuditEvent'
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
  missingBinding: 'Cloudflare D1 binding DB is not configured',
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

export const D1_TAXONOMY_DEFAULT_LIMIT = 50;
export const D1_TAXONOMY_MAX_LIMIT = 1000;
export const D1_SCHEMA_TABLES_QUERY = "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%' ORDER BY name";
export const D1_SCHEMA_COLUMNS_QUERY = 'SELECT name FROM pragma_table_info(?) ORDER BY cid';

