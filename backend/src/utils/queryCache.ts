/**
 * In-Memory Query Cache with TTL & Automated Invalidation (Backend)
 *
 * Minimizes database compute hours by serving repeated reads from cache.
 */

import { DEFAULT_CACHE_TTL_MS } from '../constants/db';
import { CacheEntry } from '../types/db';

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();

  public getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public setCached<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  public hasCache(key: string): boolean {
    return this.getCached(key) !== null;
  }

  public invalidateCache(pattern?: string | string[]): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    for (const key of Array.from(this.cache.keys())) {
      for (const p of patterns) {
        if (key.includes(p)) {
          this.cache.delete(key);
          break;
        }
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }
}

export const queryCache = new QueryCache();
export default queryCache;
