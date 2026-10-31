import { describe, expect, it } from 'vitest';
import { handleModule2LogisticsPackagingRoute } from '../src/workerD1Module2Logistics';
import type { CloudflareD1Database } from '../src/types/cloudflare';

const makeDatabase = (rows: Array<Record<string, unknown>>) => {
  let statementSql = '';
  let boundValues: unknown[] = [];
  const db: CloudflareD1Database = {
    prepare(query: string) {
      statementSql = query;
      const statement = {
        bind(...values: unknown[]) { boundValues = values; return statement; },
        async all<T>() { return { results: rows as T[] }; },
        async first<T>() { return null as T | null; },
        async run() { return {}; }
      };
      return statement;
    }
  };
  return { db, getQuery: () => statementSql, getBindings: () => boundValues };
};

describe('handleModule2LogisticsPackagingRoute', () => {
  it('returns assessment-scoped D1 candidates and identifies demo rows', async () => {
    const { db, getQuery, getBindings } = makeDatabase([
      { candidateId: 'DEMO-LOG-001', assessmentId: 'AIC-2026-0001', isDemo: 1 },
      { candidateId: 'LOG-REAL-001', assessmentId: 'AIC-2026-0001', isDemo: 0 }
    ]);
    const result = await handleModule2LogisticsPackagingRoute(db,
      new Request('https://example.test/api/module2/logistics-packaging?assessmentId=AIC-2026-0001'),
      new URL('https://example.test/api/module2/logistics-packaging?assessmentId=AIC-2026-0001'));
    expect(result.data).toMatchObject({
      success: true, count: 2, candidates: [{ candidateId: 'DEMO-LOG-001', isDemo: true }, { candidateId: 'LOG-REAL-001', isDemo: false }]
    });
    expect(getQuery()).toContain('WHERE assessment_id = ?');
    expect(getBindings()).toEqual(['AIC-2026-0001']);
  });

  it('rejects invalid assessment scope, unsupported methods and missing D1', async () => {
    const { db } = makeDatabase([]);
    const invalid = await handleModule2LogisticsPackagingRoute(db,
      new Request('https://example.test/api/module2/logistics-packaging'),
      new URL('https://example.test/api/module2/logistics-packaging'));
    expect(invalid.status).toBe(400);
    const oversized = await handleModule2LogisticsPackagingRoute(db,
      new Request('https://example.test/api/module2/logistics-packaging'),
      new URL(`https://example.test/api/module2/logistics-packaging?assessmentId=${'a'.repeat(121)}`));
    expect(oversized.status).toBe(400);
    const method = await handleModule2LogisticsPackagingRoute(db,
      new Request('https://example.test/api/module2/logistics-packaging', { method: 'POST' }),
      new URL('https://example.test/api/module2/logistics-packaging'));
    expect(method.status).toBe(405);
    await expect(handleModule2LogisticsPackagingRoute(undefined,
      new Request('https://example.test/api/module2/logistics-packaging'),
      new URL('https://example.test/api/module2/logistics-packaging'))).rejects.toThrow();
  });
});
