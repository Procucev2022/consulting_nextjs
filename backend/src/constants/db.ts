/**
 * Database Optimization & Query Audit Constants (Backend)
 */

export const SLOW_QUERY_THRESHOLD_MS = 100;

export const DEFAULT_CACHE_TTL_MS = 60000; // 60 seconds

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
