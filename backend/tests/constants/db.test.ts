import { describe, it, expect } from 'vitest';
import { SLOW_QUERY_THRESHOLD_MS, DEFAULT_CACHE_TTL_MS, CACHE_KEYS } from '../../src/constants/db';
import * as ConstantsIndex from '../../src/constants/index';

describe('Database Constants', () => {
  it('should define performance thresholds and cache configurations', () => {
    expect(SLOW_QUERY_THRESHOLD_MS).toBe(100);
    expect(DEFAULT_CACHE_TTL_MS).toBe(60000);
  });

  it('should define unique cache keys for all domain models', () => {
    expect(CACHE_KEYS.TENANT).toBe('tenant:master');
    expect(CACHE_KEYS.INGESTION_QUEUE).toBe('ingestion:queue');
    expect(CACHE_KEYS.VALIDATION_RECORDS).toBe('validation:records');
    expect(CACHE_KEYS.CATEGORIES_SUMMARY).toBe('categories:summary');
    expect(CACHE_KEYS.CATEGORY_DETAILS).toBe('categories:details');
    expect(CACHE_KEYS.VENDOR_DETAILS).toBe('vendors:details');
    expect(CACHE_KEYS.VENDOR_RANKINGS).toBe('vendors:rankings');
    expect(CACHE_KEYS.LINE_ITEMS).toBe('taxonomy:line_items');
    expect(CACHE_KEYS.SAVINGS_OPPORTUNITIES).toBe('savings:opportunities');
    expect(CACHE_KEYS.CONVERSION_FUNNEL).toBe('conversion:funnel');
  });

  it('should re-export db constants via the unified constants barrel', () => {
    expect(ConstantsIndex.SLOW_QUERY_THRESHOLD_MS).toBe(SLOW_QUERY_THRESHOLD_MS);
    expect(ConstantsIndex.DEFAULT_CACHE_TTL_MS).toBe(DEFAULT_CACHE_TTL_MS);
    expect(ConstantsIndex.CACHE_KEYS).toEqual(CACHE_KEYS);
  });
});
