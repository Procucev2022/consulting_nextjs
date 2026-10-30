import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAlternateSourcingResultFromD1 } from '../../src/services/workerD1AlternateSourcingD1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const categoryPayload = (categoryName = 'Resin'): string => JSON.stringify({
  categoryName,
  distinctVendorCount: 5,
  stateCounts: { MAHARASHTRA: 3, GUJARAT: 2 },
  topCities: [{ city: 'MUMBAI', count: 2 }],
  contactMetrics: { hasWebsiteCount: 3, hasEmailCount: 4, hasPhoneCount: 5, missingContactCount: 0 },
  companyNormCount: 5
});

const transaction = (categoryName: string): StrategicInputTransaction => ({
  id: 'TX-1', vendor_name: 'Supplier', vendor_code: 'SUP-1', material_code: 'MAT-1',
  material_desc: 'Resin part', spend_category: categoryName, total_spend_inr: 100,
  quantity: 1, unit_price: 100, uom: 'KG'
});

const database = (
  categories: Array<{ category_key: string; payload_json: string }>,
  pool: Array<{ distinct_vendor_count: number | string | null; record_count: number | string | null }>
) => {
  const prepare = vi.fn((sql: string) => {
    const all = vi.fn(async () => ({ results: sql.includes('AlternateVendorIndex') ? categories : [] }));
    const bind = vi.fn(() => ({ all: vi.fn(async () => ({ results: pool })) }));
    return { all, bind };
  });
  return { db: { prepare } as unknown as CloudflareD1Database, prepare };
};

const options = { geographicPreference: 'ALL_LOCATIONS' as const };

describe('D1 alternate sourcing data loader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads category aggregates and counts distinct directory entities across matched categories', async () => {
    const fixture = database([{ category_key: 'resin', payload_json: categoryPayload() }], [
      { distinct_vendor_count: '4', record_count: '5' }
    ]);
    const result = await loadAlternateSourcingResultFromD1(
      fixture.db, 'A1', [transaction('resin')], options, 'req-1'
    );
    expect(result.summary).toMatchObject({
      totalEligibleMaterials: 1, deduplicatedDistinctVendorsAllLocations: 4,
      overallDistinctVendorPoolEstimate: 4
    });
    expect(fixture.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM AlternateVendorIndex'));
    expect(fixture.prepare).toHaveBeenCalledWith(expect.stringContaining('COUNT(DISTINCT vendor_norm)'));
  });

  it('skips the entity-count query when assessment categories do not match the D1 directory', async () => {
    const fixture = database([{ category_key: 'resin', payload_json: categoryPayload() }], []);
    const result = await loadAlternateSourcingResultFromD1(
      fixture.db, 'A1', [transaction('unlisted')], options, 'req-2'
    );
    expect(result.summary.deduplicatedDistinctVendorsAllLocations).toBeNull();
    expect(result.opportunities[0].matchType).toBe('UNMATCHED');
    expect(fixture.prepare).toHaveBeenCalledTimes(1);
  });

  it('reports directory identity counts as unavailable when the aggregate table has no rows', async () => {
    const fixture = database([{ category_key: 'resin', payload_json: categoryPayload() }], [
      { distinct_vendor_count: 0, record_count: 0 }
    ]);
    const result = await loadAlternateSourcingResultFromD1(
      fixture.db, 'A1', [transaction('Resin')], options, 'req-3'
    );
    expect(result.summary.overallDistinctVendorPoolEstimate).toBeNull();
  });

  it('rejects and logs malformed seeded category payloads without returning partial data', async () => {
    const fixture = database([{ category_key: 'resin', payload_json: '{' }], []);
    await expect(loadAlternateSourcingResultFromD1(
      fixture.db, 'A1', [transaction('Resin')], options, 'req-4'
    )).rejects.toThrow();
    const logger = await import('../../src/utils/logger');
    expect(logger.default.error).toHaveBeenCalledWith(
      'D1 alternate vendor category data could not be parsed', { assessmentId: 'A1', requestId: 'req-4' }, expect.any(Error)
    );
  });

  it('handles a missing distinct-count response row without inventing a zero count', async () => {
    const fixture = database([{ category_key: 'resin', payload_json: categoryPayload() }], []);
    const result = await loadAlternateSourcingResultFromD1(
      fixture.db, 'A1', [transaction('Resin')], options, 'req-5'
    );
    expect(result.summary.deduplicatedDistinctVendorsAllLocations).toBeNull();
  });
});
