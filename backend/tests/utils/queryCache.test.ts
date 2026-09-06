import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queryCache } from '../../src/utils/queryCache';

describe('QueryCache Utility', () => {
  beforeEach(() => {
    queryCache.clearCache();
  });

  it('should store and retrieve cached items', () => {
    queryCache.setCached('test-key', { foo: 'bar' });
    expect(queryCache.getCached('test-key')).toEqual({ foo: 'bar' });
    expect(queryCache.hasCache('test-key')).toBe(true);
    expect(queryCache.getCacheSize()).toBe(1);
  });

  it('should return null for non-existent keys', () => {
    expect(queryCache.getCached('non-existent')).toBeNull();
    expect(queryCache.hasCache('non-existent')).toBe(false);
  });

  it('should invalidate expired entries based on TTL', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    queryCache.setCached('ttl-key', 'sample-val', 1000);
    expect(queryCache.getCached('ttl-key')).toBe('sample-val');

    // Advance time beyond TTL
    vi.spyOn(Date, 'now').mockReturnValue(now + 1500);
    expect(queryCache.getCached('ttl-key')).toBeNull();
    expect(queryCache.hasCache('ttl-key')).toBe(false);

    vi.restoreAllMocks();
  });

  it('should invalidate cache by specific key pattern', () => {
    queryCache.setCached('db:tenant', { id: 1 });
    queryCache.setCached('db:vendors', { id: 2 });
    queryCache.setCached('api:other', { id: 3 });

    queryCache.invalidateCache('tenant');
    expect(queryCache.getCached('db:tenant')).toBeNull();
    expect(queryCache.getCached('db:vendors')).toBeDefined();
    expect(queryCache.getCached('api:other')).toBeDefined();
  });

  it('should invalidate cache by array of patterns', () => {
    queryCache.setCached('db:tenant', { id: 1 });
    queryCache.setCached('db:vendors', { id: 2 });
    queryCache.setCached('api:other', { id: 3 });

    queryCache.invalidateCache(['tenant', 'vendors']);
    expect(queryCache.getCached('db:tenant')).toBeNull();
    expect(queryCache.getCached('db:vendors')).toBeNull();
    expect(queryCache.getCached('api:other')).toBeDefined();
  });

  it('should clear all cache when no pattern is provided to invalidateCache', () => {
    queryCache.setCached('db:tenant', { id: 1 });
    queryCache.setCached('db:vendors', { id: 2 });
    queryCache.invalidateCache();
    expect(queryCache.getCacheSize()).toBe(0);
  });

  it('should clear all cache using clearCache()', () => {
    queryCache.setCached('k1', 1);
    queryCache.setCached('k2', 2);
    expect(queryCache.getCacheSize()).toBe(2);
    queryCache.clearCache();
    expect(queryCache.getCacheSize()).toBe(0);
  });
});
