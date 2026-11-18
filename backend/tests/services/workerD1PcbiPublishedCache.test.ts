import { afterEach, describe, expect, it, vi } from 'vitest';
import { D1_PCBI_PUBLISHED_CACHE_SCOPE } from '../../src/constants/db';
import { bumpCacheGeneration } from '../../src/services/cacheGeneration';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import { clearPublishedPcbiPayloadCache, getPublishedPcbiPayload } from '../../src/workerD1PcbiAdmin';
import { cacheGenerationStatement, createCacheGenerationStore } from '../helpers/cacheGenerationDatabase';
import type { CacheGenerationStore } from '../helpers/cacheGenerationDatabase';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

// Answers the generation statements from a store shared by every isolate. Each published-payload read is recorded, and
// it waits for `gate` when one is given.
const publishedDatabase = (
  store: CacheGenerationStore,
  reads: string[],
  gate?: Promise<void>
): CloudflareD1Database => {
  const readPublished = async (sql: string) => {
    reads.push(sql);
    if (gate) await gate;
    return { results: [{ version: 'V1', upload_id: 'UPLOAD-1', payload_json: '{}' }] };
  };
  return {
    prepare: vi.fn((sql: string) => cacheGenerationStatement(sql, store) ?? { all: () => readPublished(sql) })
  } as unknown as CloudflareD1Database;
};

describe('published PCBI payload generations', () => {
  afterEach(() => {
    clearPublishedPcbiPayloadCache();
    vi.restoreAllMocks();
  });

  it('reads the published payload again after another isolate publishes', async () => {
    const store = createCacheGenerationStore();
    const readsA: string[] = [];
    const isolateA = publishedDatabase(store, readsA);
    const isolateB = publishedDatabase(store, []);

    await getPublishedPcbiPayload(isolateA);
    await getPublishedPcbiPayload(isolateA);
    expect(readsA).toHaveLength(1);

    await bumpCacheGeneration(isolateB, D1_PCBI_PUBLISHED_CACHE_SCOPE);
    await getPublishedPcbiPayload(isolateA);

    expect(readsA).toHaveLength(2);
    expect(store.get(D1_PCBI_PUBLISHED_CACHE_SCOPE)).toBe(1);
  });

  it('does not join a read that started before another isolate published', async () => {
    const store = createCacheGenerationStore();
    const reads: string[] = [];
    let openGate!: () => void;
    const gate = new Promise<void>((resolve) => { openGate = resolve; });
    const isolateA = publishedDatabase(store, reads, gate);
    const isolateB = publishedDatabase(store, []);

    const beforePublish = getPublishedPcbiPayload(isolateA);
    await vi.waitFor(() => expect(reads).toHaveLength(1));
    await bumpCacheGeneration(isolateB, D1_PCBI_PUBLISHED_CACHE_SCOPE);
    const afterPublish = getPublishedPcbiPayload(isolateA);
    await vi.waitFor(() => expect(reads).toHaveLength(2));
    openGate();
    await Promise.all([beforePublish, afterPublish]);

    await getPublishedPcbiPayload(isolateA);
    expect(reads).toHaveLength(2);
  });
});
