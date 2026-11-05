/**
 * Database Optimization & Query Audit Constants (Backend)
 */

export const SLOW_QUERY_THRESHOLD_MS = 100;

// Warn when a dataset read scans more than this many rows, even if it is fast.
export const SLOW_QUERY_ROWS_READ_THRESHOLD = 10000;

export const D1_QUERY_LOG_MESSAGES = {
  completed: 'D1 statement completed',
  slow: 'Slow D1 statement',
  failed: 'D1 statement failed',
  requestSummary: 'D1 request query summary'
} as const;

export const D1_SINGLE_ROW_CHANGE_COUNT = 1;

export const DEFAULT_CACHE_TTL_MS = 60000; // 60 seconds
export const D1_REFERENCE_CACHE_MAX_ENTRIES = 128;
export const D1_TENANT_DATA_CACHE_MAX_ROWS = 1000;
export const D1_MODULE2_ANALYSIS_CACHE_MAX_ENTRIES = 8;
export const D1_MODULE2_ANALYSIS_CACHE_MAX_ROWS = 30000;
export const D1_RUNTIME_RECENT_AUDIT_LIMIT = 100;

export const D1_REFERENCE_CACHE_KEYS = {
  CURRENCY_RATES: 'reference:currency-rates',
  INDUSTRY_CATALOG: 'reference:industry-catalog',
  PCBI_BENCHMARKS: 'reference:pcbi-benchmarks'
} as const;

export const D1_TENANT_DATA_CACHE_KEYS = {
  CATEGORIES_SUMMARY: 'tenant-data:categories-summary',
  CATEGORY_DETAILS: 'tenant-data:category-details',
  VENDOR_DETAILS: 'tenant-data:vendor-details',
  VENDOR_RANKINGS: 'tenant-data:vendor-rankings',
  SAVINGS_OPPORTUNITIES: 'tenant-data:savings-opportunities'
} as const;

export const CACHE_KEYS = {
  TENANT: 'tenant:master',
  INGESTION_QUEUE: 'ingestion:queue',
  VALIDATION_RECORDS: 'validation:records',
  CATEGORIES_SUMMARY: 'categories:summary',
  CATEGORY_DETAILS: 'categories:details',
  VENDOR_DETAILS: 'vendors:details',
  LINE_ITEMS: 'taxonomy:line_items',
  VENDOR_RANKINGS: 'vendors:rankings',
  SAVINGS_OPPORTUNITIES: 'savings:opportunities',
  CONVERSION_FUNNEL: 'conversion:funnel'
} as const;
