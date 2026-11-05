import { expectApiFetchCall } from '../utils/apiFetchAssertions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { TAXONOMY_PAGE_SIZE } from '../../src/constants/taxonomy';
import { taxonomyRecords } from '../fixtures/taxonomy';

vi.mock('../../src/utils/logger', () => ({ default: { info: vi.fn(), error: vi.fn() } }));

const response = (data: unknown, status = 200): Response => new Response(JSON.stringify({ success: true, data }), { status, headers: { 'x-request-id': 'request-taxonomy' } });

describe('database commodity catalog hydration', () => {
  // tests/setup.ts seeds the shared catalog module before each file. Every test needs a fresh module
  // instance so it starts from the empty catalog that the database-only contract requires.
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it('starts empty, shares concurrent loads, publishes completion and caches persisted pages', async () => {
    const taxonomy = await import('../../src/data/unspscTaxonomy');
    expect(taxonomy.unspscOfficialDictionary).toEqual([]);
    let finish: (value: Response) => void = () => undefined;
    const firstResponse = new Promise<Response>((resolve) => { finish = resolve; });
    const page = Array.from({ length: TAXONOMY_PAGE_SIZE }, (_, index) => ({ ...taxonomyRecords[0], commodityCode: String(index) }));
    const fetcher = vi.fn().mockReturnValueOnce(firstResponse).mockResolvedValueOnce(response(taxonomyRecords));
    vi.stubGlobal('fetch', fetcher);
    const listener = vi.fn();
    const unsubscribe = taxonomy.subscribeTaxonomy(listener);
    const first = taxonomy.loadUNSPSCTaxonomy();
    expect(taxonomy.loadUNSPSCTaxonomy()).toBe(first);
    expect(taxonomy.getTaxonomyLoadState().isLoading).toBe(true);
    finish(response(page));
    await first;
    expectApiFetchCall(fetcher, '/api/taxonomy?limit=1000&offset=0', undefined, 1);
    expectApiFetchCall(fetcher, '/api/taxonomy?limit=1000&offset=1000', undefined, 2);
    expect(taxonomy.unspscOfficialDictionary).toHaveLength(page.length + taxonomyRecords.length);
    expect(taxonomy.getTaxonomyLoadState()).toEqual({ isLoading: false, error: null });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await taxonomy.loadUNSPSCTaxonomy();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it.each([
    { result: response([], 503), reason: UI_STRINGS.taxonomyData.httpFailure(503) },
    { result: response([{ commodityCode: 'missing-fields' }]), reason: UI_STRINGS.taxonomyData.invalidResponse },
    { result: response([]), reason: UI_STRINGS.taxonomyData.emptyResponse }
  ])('rejects invalid and unavailable catalog responses without inventing records', async ({ result, reason }) => {
    const taxonomy = await import('../../src/data/unspscTaxonomy');
    const fetcher = vi.fn().mockResolvedValueOnce(result).mockResolvedValueOnce(response(taxonomyRecords));
    vi.stubGlobal('fetch', fetcher);
    await expect(taxonomy.loadUNSPSCTaxonomy()).rejects.toThrow(reason);
    expect(taxonomy.getTaxonomyLoadState()).toEqual({ isLoading: false, error: UI_STRINGS.taxonomyData.loadFailed(reason, 'request-taxonomy') });
    expect(taxonomy.unspscOfficialDictionary).toEqual([]);
    await taxonomy.loadUNSPSCTaxonomy();
    expect(taxonomy.unspscOfficialDictionary).toEqual(taxonomyRecords);
  });

  it('discards incomplete pages on a network failure and records a useful retry message', async () => {
    const taxonomy = await import('../../src/data/unspscTaxonomy');
    const page = Array.from({ length: TAXONOMY_PAGE_SIZE }, () => taxonomyRecords[0]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(page)).mockRejectedValueOnce('offline'));
    await expect(taxonomy.loadUNSPSCTaxonomy()).rejects.toBe('offline');
    expect(taxonomy.unspscOfficialDictionary).toEqual([]);
    expect(taxonomy.getTaxonomyLoadState().error).toBe(UI_STRINGS.taxonomyData.loadFailed(UI_STRINGS.taxonomyData.unknownFailure, 'request-taxonomy'));
  });

  it('handles a transport failure before headers arrive', async () => {
    const taxonomy = await import('../../src/data/unspscTaxonomy');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(taxonomy.loadUNSPSCTaxonomy()).rejects.toThrow('offline');
    expect(taxonomy.getTaxonomyLoadState().error).toBe(UI_STRINGS.taxonomyData.loadFailed('offline', UI_STRINGS.taxonomyData.requestUnavailable));
  });
});
