import { describe, expect, it } from 'vitest';
import { handleIndustryProfilesRoute } from '../src/workerD1IndustryProfiles';
import { D1_TABLES } from '../src/constants/d1';
import type { CloudflareD1Database } from '../src/types/cloudflare';

const makeDatabase = (profiles: Array<Record<string, unknown>>, presets: Array<Record<string, unknown>> = []) => {
  const queries: string[] = [];
  const db: CloudflareD1Database = {
    prepare(query: string) {
      queries.push(query);
      let values: unknown[] = [];
      const statement = {
        bind(...boundValues: unknown[]) { values = boundValues; return statement; },
        async all<T>() {
          const rows = query.includes(D1_TABLES.industryProfiles) ? profiles : presets;
          return { results: rows as T[] };
        },
        async first<T>() { return null as T | null; },
        async run() { return {}; }
      };
      void values;
      return statement;
    }
  };
  return { db, queries };
};

describe('handleIndustryProfilesRoute', () => {
  it('returns profiles decoded from D1 and preset rows', async () => {
    const { db, queries } = makeDatabase([
      { profile_id: 'CHEM-SPEC', major_sector: 'Chemical & Petrochemicals', minor_sector: 'Specialty Chemicals',
        profile_json: JSON.stringify({ sectorCode: 'CHEM-SPEC', majorSector: 'Chemical & Petrochemicals' }) }
    ], [{ clientName: 'Apex', majorSector: 'Chemical & Petrochemicals', minorSector: 'Specialty Chemicals' }]);
    const result = await handleIndustryProfilesRoute(db, new Request('https://example.test/api/industry-profiles'),
      new URL('https://example.test/api/industry-profiles'));
    expect(result.data).toMatchObject({
      success: true,
      profiles: [{ sectorCode: 'CHEM-SPEC' }],
      presets: [{ clientName: 'Apex' }]
    });
    expect(queries).toHaveLength(2);
  });

  it('filters major sector safely and rejects invalid query, unsupported methods and missing D1', async () => {
    const { db, queries } = makeDatabase([]);
    const filtered = await handleIndustryProfilesRoute(db,
      new Request('https://example.test/api/industry-profiles'),
      new URL('https://example.test/api/industry-profiles?majorSector=Chemical%20%26%20Petrochemicals'));
    expect(filtered.status).toBeUndefined();
    expect(queries[0]).toContain('WHERE major_sector = ?');
    const invalid = await handleIndustryProfilesRoute(db,
      new Request('https://example.test/api/industry-profiles'),
      new URL(`https://example.test/api/industry-profiles?majorSector=${'x'.repeat(121)}`));
    expect(invalid.status).toBe(400);
    const method = await handleIndustryProfilesRoute(db,
      new Request('https://example.test/api/industry-profiles', { method: 'POST' }),
      new URL('https://example.test/api/industry-profiles'));
    expect(method.status).toBe(405);
    await expect(handleIndustryProfilesRoute(undefined,
      new Request('https://example.test/api/industry-profiles'),
      new URL('https://example.test/api/industry-profiles'))).rejects.toThrow();
  });

  it('fails closed on malformed catalog JSON', async () => {
    const { db } = makeDatabase([{ profile_id: 'BROKEN', profile_json: 'not-json' }]);
    const result = await handleIndustryProfilesRoute(db,
      new Request('https://example.test/api/industry-profiles', { headers: { 'x-request-id': 'req-1' } }),
      new URL('https://example.test/api/industry-profiles'));
    expect(result.status).toBe(500);
    expect(result.data).toMatchObject({ success: false });
  });
});
