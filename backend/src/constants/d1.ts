export const D1_SCHEMA_VERSION = '2026-10-30-010';

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
  alternateVendors: 'AlternateVendorIndex',
  materialMappings: 'MaterialMappingRegister',
  objectMetadata: 'ObjectMetadata',
  alternateVendorCompany: 'AlternateVendorCompany',
  pcbiSnapshot: 'PCBICommoditySnapshot',
  procurementCategoryMappings: 'ProcurementCategoryMapping',
  complianceReviews: 'Module2ComplianceReview',
  eAuctionPlanningAssumptions: 'Module2EAuctionPlanningAssumption',
  upgradeRequests: 'UpgradeRequest',
  adminOtpSessions: 'AdminOtpSession',
  subscriptionRecords: 'SubscriptionRecord',
  subscriptionAuditEvents: 'SubscriptionAuditEvent'
} as const;

export const D1_TABLE_COUNT = Object.keys(D1_TABLES).length;

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

