import { afterEach, describe, expect, it, vi } from 'vitest';
import { D1_REFERENCE_CACHE_MAX_ENTRIES } from '../../src/constants/db';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import { createD1RequestMetrics, instrumentD1Database } from '../../src/services/d1QueryTelemetry';
import {
  clearD1ReferenceDataCache,
  getD1ReferenceDataCacheSize,
  getOrLoadD1ReferenceData
} from '../../src/services/d1ReferenceDataCache';
import { getD1RuntimeMetrics } from '../../src/services/d1QueryTelemetry';

const createDatabase = (): CloudflareD1Database => ({ prepare: vi.fn() } as unknown as CloudflareD1Database);

describe('D1 reference data cache', () => {
  afterEach(() => {
    clearD1ReferenceDataCache();
    vi.restoreAllMocks();
  });

  it('loads once per database and key, then returns the cached value', async () => {
    const database = createDatabase();
    const load = vi.fn().mockResolvedValue({ currencies: ['USD'] });

    const miss = await getOrLoadD1ReferenceData(database, 'rates', load);
    const hit = await getOrLoadD1ReferenceData(database, 'rates', load);

    expect(miss).toEqual({ value: { currencies: ['USD'] }, cacheStatus: 'miss' });
    expect(hit).toEqual({ value: { currencies: ['USD'] }, cacheStatus: 'hit' });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('shares cache entries across request-scoped telemetry wrappers for the same D1 binding', async () => {
    const database = createDatabase();
    const firstRequestDatabase = instrumentD1Database(database, 'request-one', createD1RequestMetrics());
    const secondRequestDatabase = instrumentD1Database(database, 'request-two', createD1RequestMetrics());
    const load = vi.fn().mockResolvedValue({ profiles: ['Chemical'] });

    const first = await getOrLoadD1ReferenceData(firstRequestDatabase, 'industry-catalog', load);
    const second = await getOrLoadD1ReferenceData(secondRequestDatabase, 'industry-catalog', load);

    expect(first.cacheStatus).toBe('miss');
    expect(second).toEqual({ value: { profiles: ['Chemical'] }, cacheStatus: 'hit' });
    expect(load).toHaveBeenCalledOnce();
    expect(getD1ReferenceDataCacheSize(firstRequestDatabase)).toBe(1);
    expect(getD1RuntimeMetrics(firstRequestDatabase)).toMatchObject({ cacheHits: 1, cacheMisses: 1, cacheHitRatio: 0.5 });

    clearD1ReferenceDataCache(secondRequestDatabase, 'industry-catalog');
    expect((await getOrLoadD1ReferenceData(firstRequestDatabase, 'industry-catalog', load)).cacheStatus).toBe('miss');
    expect(load).toHaveBeenCalledTimes(2);
    expect(getD1RuntimeMetrics(firstRequestDatabase)).toMatchObject({ cacheHits: 1, cacheMisses: 2 });
  });

  it('coalesces concurrent reads and reports the joining request', async () => {
    const database = createDatabase();
    let resolveLoad!: (value: string[]) => void;
    const load = vi.fn(() => new Promise<string[]>((resolve) => { resolveLoad = resolve; }));
    const first = getOrLoadD1ReferenceData(database, 'industry', load);
    await Promise.resolve();
    const second = getOrLoadD1ReferenceData(database, 'industry', load);

    resolveLoad(['Chemical']);
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult.cacheStatus).toBe('miss');
    expect(secondResult.cacheStatus).toBe('coalesced');
    expect(secondResult.value).toEqual(['Chemical']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('expires entries and does not cache failed loads', async () => {
    const database = createDatabase();
    let now = 100;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const load = vi.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('fresh');

    expect((await getOrLoadD1ReferenceData(database, 'benchmarks', load, 10)).value).toBe('old');
    now = 111;
    expect((await getOrLoadD1ReferenceData(database, 'benchmarks', load, 10)).value).toBe('fresh');

    const failingLoad = vi.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce('recovered');
    await expect(getOrLoadD1ReferenceData(database, 'failure', failingLoad)).rejects.toThrow('unavailable');
    expect((await getOrLoadD1ReferenceData(database, 'failure', failingLoad)).value).toBe('recovered');
    expect(failingLoad).toHaveBeenCalledTimes(2);
  });

  it('supports key, database, and global invalidation', async () => {
    const firstDatabase = createDatabase();
    const secondDatabase = createDatabase();
    const load = vi.fn().mockResolvedValue('value');

    await getOrLoadD1ReferenceData(firstDatabase, 'one', load);
    await getOrLoadD1ReferenceData(firstDatabase, 'two', load);
    await getOrLoadD1ReferenceData(secondDatabase, 'one', load);
    clearD1ReferenceDataCache(firstDatabase, 'one');
    await getOrLoadD1ReferenceData(firstDatabase, 'one', load);
    await getOrLoadD1ReferenceData(firstDatabase, 'two', load);
    clearD1ReferenceDataCache(secondDatabase);
    await getOrLoadD1ReferenceData(secondDatabase, 'one', load);
    clearD1ReferenceDataCache();
    await getOrLoadD1ReferenceData(firstDatabase, 'two', load);

    expect(load).toHaveBeenCalledTimes(6);
  });

  it('evicts expired and oldest entries to keep the cache bounded', async () => {
    const database = createDatabase();
    let now = 1;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const load = vi.fn((key: string) => Promise.resolve(key));

    await getOrLoadD1ReferenceData(database, 'expired', () => load('expired'), 1);
    now = 3;
    await getOrLoadD1ReferenceData(database, 'fresh', () => load('fresh'));
    expect(load).toHaveBeenCalledTimes(2);

    clearD1ReferenceDataCache(database);
    for (let index = 0; index < D1_REFERENCE_CACHE_MAX_ENTRIES + 1; index += 1) {
      const key = `key-${index}`;
      await getOrLoadD1ReferenceData(database, key, () => load(key));
    }
    await getOrLoadD1ReferenceData(database, 'key-0', () => load('key-0'));

    expect(load).toHaveBeenCalledTimes(D1_REFERENCE_CACHE_MAX_ENTRIES + 4);
  });

  it('does not retain an in-flight value cleared during a write', async () => {
    const database = createDatabase();
    let resolveOld!: (value: string) => void;
    const oldLoad = getOrLoadD1ReferenceData(database, 'published', () =>
      new Promise<string>((resolve) => { resolveOld = resolve; })
    );
    await Promise.resolve();
    clearD1ReferenceDataCache(database, 'published');
    const freshLoad = await getOrLoadD1ReferenceData(database, 'published', async () => 'new');
    resolveOld('old');
    await oldLoad;

    expect(freshLoad.value).toBe('new');
    expect((await getOrLoadD1ReferenceData(database, 'published', async () => 'unexpected')).value).toBe('new');
  });
});
