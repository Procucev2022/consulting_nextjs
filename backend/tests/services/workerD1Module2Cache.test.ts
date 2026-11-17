import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearScopedModule2Cache,
  getOrLoadScopedModule2Analysis,
  getScopedModule2Cache
} from '../../src/services/workerD1Module2Cache';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import type { ScopedModule2Analysis } from '../../src/types/module2D1Scoped';
import type { ProcurementTransactionScope } from '../../src/types/procurementTransactionD1';
import { createCacheGenerationDatabase, createCacheGenerationStore } from '../helpers/cacheGenerationDatabase';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const analysis = { transactions: [], analysis: {} } as unknown as ScopedModule2Analysis;
const scopeFor = (tenantId: string, assessmentId = 'A1'): ProcurementTransactionScope =>
  ({ tenantId, assessmentId }) as ProcurementTransactionScope;
const cacheKey = (tenantId: string, assessmentId = 'A1'): string => JSON.stringify([tenantId, assessmentId]);

describe('Module 2 analysis cache generations', () => {
  beforeEach(() => clearScopedModule2Cache());
  afterEach(() => vi.restoreAllMocks());

  it('reloads an analysis after another isolate advances the tenant generation', async () => {
    const store = createCacheGenerationStore();
    const isolateA = createCacheGenerationDatabase(store);
    const isolateB = createCacheGenerationDatabase(store);
    const load = vi.fn(async () => analysis);

    await getOrLoadScopedModule2Analysis(isolateA, scopeFor('T1'), false, 'req-1', load);
    await getOrLoadScopedModule2Analysis(isolateA, scopeFor('T1'), false, 'req-2', load);
    expect(load).toHaveBeenCalledTimes(1);

    await clearScopedModule2Cache(isolateB, 'T1', 'A1');
    await getOrLoadScopedModule2Analysis(isolateA, scopeFor('T1'), false, 'req-3', load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(store.get('module2-analysis:T1')).toBe(1);
    expect(getScopedModule2Cache(isolateA).get(cacheKey('T1'))?.generation).toBe(1);
  });

  it('keeps the analysis of other tenants when one tenant advances', async () => {
    const store = createCacheGenerationStore();
    const isolateA = createCacheGenerationDatabase(store);
    const isolateB = createCacheGenerationDatabase(store);
    const load = vi.fn(async () => analysis);

    await getOrLoadScopedModule2Analysis(isolateA, scopeFor('T2'), false, 'req-1', load);
    await clearScopedModule2Cache(isolateB, 'T1', 'A1');
    await getOrLoadScopedModule2Analysis(isolateA, scopeFor('T2'), false, 'req-2', load);

    expect(load).toHaveBeenCalledTimes(1);
    expect(store.has('module2-analysis:T2')).toBe(false);
  });

  it('caches the reloaded analysis under the new generation', async () => {
    const database = createCacheGenerationDatabase();
    const load = vi.fn(async () => analysis);

    await getOrLoadScopedModule2Analysis(database, scopeFor('T1'), false, 'req-1', load);
    await clearScopedModule2Cache(database, 'T1', 'A1');
    await getOrLoadScopedModule2Analysis(database, scopeFor('T1'), false, 'req-2', load);
    await getOrLoadScopedModule2Analysis(database, scopeFor('T1'), false, 'req-3', load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('advances no generation when a clear names no tenant', async () => {
    const store = createCacheGenerationStore();
    const database = createCacheGenerationDatabase(store);

    await clearScopedModule2Cache(database);
    await clearScopedModule2Cache(database, undefined, 'A1');

    expect(store.size).toBe(0);
  });

  it('surfaces a failed generation write to the caller', async () => {
    const database = {
      prepare: vi.fn(() => {
        throw new Error('D1 unavailable');
      })
    } as unknown as CloudflareD1Database;

    await expect(clearScopedModule2Cache(database, 'T1', 'A1')).rejects.toThrow('D1 unavailable');
  });
});
