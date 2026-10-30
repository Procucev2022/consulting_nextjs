import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { taxonomyRecords } from '../fixtures/taxonomy';
import { TAXONOMY_PAGE_SIZE, TAXONOMY_PREVIEW_LIMIT } from '../../src/constants/taxonomy';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { UNSPSCCommodityRecord } from '../../src/types/taxonomy';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  frontendLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

type TaxonomyModule = typeof import('../../src/data/unspscTaxonomy');

const createRecord = (overrides: Partial<UNSPSCCommodityRecord> = {}): UNSPSCCommodityRecord => ({
  commodityCode: '40151501',
  commodityTitle: 'Industrial pump assembly',
  classCode: '40151500',
  classTitle: 'Industrial pumps',
  familyCode: '40150000',
  familyTitle: 'Fluid distribution equipment',
  segmentCode: '40000000',
  segmentTitle: 'Distribution and conditioning systems',
  coreBucket: 'Direct Materials',
  ...overrides
});

const responseFor = (
  records: UNSPSCCommodityRecord[],
  headers: Record<string, string> = {}
): Response => new Response(JSON.stringify({ success: true, data: records }), { status: 200, headers });

describe('D1-backed UNSPSC taxonomy data utilities', () => {
  let taxonomy: TaxonomyModule;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://backend.test');
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    taxonomy = await import('../../src/data/unspscTaxonomy');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('subscribes to state changes and removes listeners when unsubscribed', async () => {
    const listener = vi.fn();
    const unsubscribe = taxonomy.subscribeTaxonomy(listener);
    fetchMock.mockResolvedValueOnce(responseFor([createRecord()]));

    await taxonomy.loadUNSPSCTaxonomy();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(taxonomy.getTaxonomyLoadState()).toEqual({ isLoading: false, error: null });

    unsubscribe();
    fetchMock.mockResolvedValueOnce(responseFor([createRecord({ commodityCode: '40151502' })]));
    taxonomy.unspscOfficialDictionary.splice(0);
    await taxonomy.loadUNSPSCTaxonomy();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('skips loading when records are already present', async () => {
    taxonomy.unspscOfficialDictionary.push(createRecord());

    await taxonomy.loadUNSPSCTaxonomy();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shares an in-flight load and requests every D1 page', async () => {
    let resolveFirstPage: ((response: Response) => void) | undefined;
    const firstPage = new Promise<Response>((resolve) => { resolveFirstPage = resolve; });
    const fullPage = Array.from({ length: TAXONOMY_PAGE_SIZE }, (_, index) =>
      createRecord({ commodityCode: `4015${String(index).padStart(4, '0')}` })
    );
    fetchMock.mockReturnValueOnce(firstPage).mockResolvedValueOnce(responseFor([createRecord({ commodityCode: 'last' })]));

    const firstLoad = taxonomy.loadUNSPSCTaxonomy();
    const concurrentLoad = taxonomy.loadUNSPSCTaxonomy();
    expect(concurrentLoad).toBe(firstLoad);
    expect(taxonomy.getTaxonomyLoadState()).toEqual({ isLoading: true, error: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(`https://backend.test/api/taxonomy?limit=${TAXONOMY_PAGE_SIZE}&offset=0`);

    resolveFirstPage?.(responseFor(fullPage, { 'x-request-id': 'taxonomy-request-1' }));
    await Promise.all([firstLoad, concurrentLoad]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain(`limit=${TAXONOMY_PAGE_SIZE}&offset=${TAXONOMY_PAGE_SIZE}`);
    expect(taxonomy.unspscOfficialDictionary).toHaveLength(TAXONOMY_PAGE_SIZE + 1);
    expect(taxonomy.getTaxonomyLoadState()).toEqual({ isLoading: false, error: null });
  });

  it('stores a helpful error and rethrows when the taxonomy endpoint fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('unavailable', { status: 503 }));

    await expect(taxonomy.loadUNSPSCTaxonomy()).rejects.toThrow(UI_STRINGS.taxonomyData.httpFailure(503));
    expect(taxonomy.getTaxonomyLoadState()).toEqual({
      isLoading: false,
      error: UI_STRINGS.taxonomyData.loadFailed(UI_STRINGS.taxonomyData.httpFailure(503), 'unavailable')
    });
  });

  it('rejects invalid response shapes and empty seeded results', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: [{ commodityCode: 'bad' }] })));
    await expect(taxonomy.loadUNSPSCTaxonomy()).rejects.toThrow(UI_STRINGS.taxonomyData.invalidResponse);
    expect(taxonomy.getTaxonomyLoadState().error).toContain(UI_STRINGS.taxonomyData.invalidResponse);

    taxonomy = await import('../../src/data/unspscTaxonomy');
    fetchMock.mockResolvedValueOnce(responseFor([]));
    await expect(taxonomy.loadUNSPSCTaxonomy()).rejects.toThrow(UI_STRINGS.taxonomyData.emptyResponse);
    expect(taxonomy.getTaxonomyLoadState().error).toContain(UI_STRINGS.taxonomyData.emptyResponse);
  });

  it('handles non-Error failures and uses the fallback request identifier', async () => {
    fetchMock.mockRejectedValueOnce('raw transport failure');

    await expect(taxonomy.loadUNSPSCTaxonomy()).rejects.toBe('raw transport failure');
    expect(taxonomy.getTaxonomyLoadState().error).toBe(
      UI_STRINGS.taxonomyData.loadFailed(UI_STRINGS.taxonomyData.unknownFailure, UI_STRINGS.taxonomyData.requestUnavailable)
    );
  });

  it('returns a preview for empty searches and filters by category and searchable fields', () => {
    const records = Array.from({ length: TAXONOMY_PREVIEW_LIMIT + 2 }, (_, index) => createRecord({
      commodityCode: `code-${index}`,
      commodityTitle: index === 0 ? 'Special bearing grease' : `Commodity ${index}`,
      classTitle: index === 1 ? 'Rotating equipment' : 'General class',
      segmentTitle: index === 2 ? 'Industrial machinery' : 'Other segment',
      coreBucket: index === 3 ? 'Logistics & Freight' : 'Direct Materials'
    }));
    taxonomy.unspscOfficialDictionary.push(...records);

    expect(taxonomy.searchUNSPSCTaxonomy('')).toHaveLength(TAXONOMY_PREVIEW_LIMIT);
    expect(taxonomy.searchUNSPSCTaxonomy('', 'Direct Materials')).toHaveLength(TAXONOMY_PREVIEW_LIMIT + 1);
    expect(taxonomy.searchUNSPSCTaxonomy('', 'ALL')).toHaveLength(TAXONOMY_PREVIEW_LIMIT + 2);
    expect(taxonomy.searchUNSPSCTaxonomy('code-51')).toHaveLength(1);
    expect(taxonomy.searchUNSPSCTaxonomy('special bearing')).toHaveLength(1);
    expect(taxonomy.searchUNSPSCTaxonomy('rotating equipment')).toHaveLength(1);
    expect(taxonomy.searchUNSPSCTaxonomy('industrial machinery')).toHaveLength(1);
    expect(taxonomy.searchUNSPSCTaxonomy('missing', 'Direct Materials')).toEqual([]);
  });

  it('looks up exact codes, titles, classes, and bounded phrases without substring false positives', () => {
    const pump = createRecord({ commodityTitle: 'Fresh cut african boxwood', classTitle: 'Fresh cut greens' });
    const valve = createRecord({ commodityCode: 'valve-2', commodityTitle: 'Valve insert', classTitle: 'Industrial valves' });
    taxonomy.unspscOfficialDictionary.push(pump, valve);

    expect(taxonomy.lookupUNSPSCByDescription('')).toBeUndefined();
    expect(taxonomy.lookupUNSPSCByDescription(' VALVE-2 ')).toMatchObject({ commodityCode: 'valve-2', classificationStatus: 'CLASSIFIED' });
    expect(taxonomy.lookupUNSPSCByDescription('Valve insert')).toMatchObject({ commodityCode: 'valve-2', classificationStatus: 'CLASSIFIED' });
    expect(taxonomy.lookupUNSPSCByDescription('Industrial valves')).toMatchObject({ commodityCode: 'valve-2' });
    expect(taxonomy.lookupUNSPSCByDescription('fresh cut')).toMatchObject({ commodityCode: pump.commodityCode });
    expect(taxonomy.lookupUNSPSCByDescription('box')).toMatchObject({ classificationStatus: 'UNCLASSIFIED' });
    expect(taxonomy.lookupUNSPSCByDescription('fresh*')).toMatchObject({ classificationStatus: 'UNCLASSIFIED' });
    expect(taxonomy.lookupUNSPSCByDescription('please order industrial valves soon')).toMatchObject({ commodityCode: 'valve-2' });
  });

  it('returns detailed matches and category-aware fallback values', () => {
    taxonomy.unspscOfficialDictionary.push(createRecord({ commodityTitle: 'Industrial pump assembly' }));

    expect(taxonomy.lookupUNSPSCDetails('', 'Custom category')).toEqual({
      commodityCode: '10000000',
      commodityTitle: 'Industrial Material Commodity',
      classTitle: 'Custom category',
      coreBucket: 'Custom category'
    });
    expect(taxonomy.lookupUNSPSCDetails('40151501')).toMatchObject({ commodityTitle: 'Industrial pump assembly' });
    expect(taxonomy.lookupUNSPSCDetails('pump assembly')).toMatchObject({ commodityCode: '40151501' });
    expect(taxonomy.lookupUNSPSCDetails('industrial pump assembly expanded')).toMatchObject({ commodityCode: '40151501' });
    expect(taxonomy.lookupUNSPSCDetails('industrial pumps')).toMatchObject({ commodityCode: '40151501' });
    expect(taxonomy.lookupUNSPSCDetails('unknown product', 'Fallback category')).toEqual({
      commodityCode: '10000000',
      commodityTitle: 'unknown product',
      classTitle: 'Fallback category',
      coreBucket: 'Fallback category'
    });
    expect(taxonomy.lookupUNSPSCDetails('unknown product')).toEqual({
      commodityCode: '10000000',
      commodityTitle: 'unknown product',
      classTitle: 'General Sourcing Class',
      coreBucket: 'Direct Materials'
    });
  });

  it('returns lookup fallbacks when the D1 catalog is empty', () => {
    expect(taxonomy.lookupUNSPSCByDescription('unknown')).toMatchObject({ classificationStatus: 'UNCLASSIFIED' });
    expect(taxonomy.lookupUNSPSCDetails('unknown')).toMatchObject({
      commodityCode: '10000000',
      commodityTitle: 'unknown'
    });
    expect(taxonomy.searchUNSPSCTaxonomy('valve')).toEqual([]);
  });
});
