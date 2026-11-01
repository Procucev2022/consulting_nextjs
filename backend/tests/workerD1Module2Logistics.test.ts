import { describe, expect, it } from 'vitest';
import { handleModule2LogisticsPackagingRoute } from '../src/workerD1Module2Logistics';
import type { CloudflareD1Database } from '../src/types/cloudflare';
import { adminToken, TEST_AUTH_SECRET, userToken } from './executiveBriefTestHelpers';

const makeDatabase = (
  rows: Array<Record<string, unknown>>,
  contactEmail: string | null = 'user@procucev.test',
  assessmentFound = true
) => {
  let statementSql = '';
  let boundValues: unknown[] = [];
  const db: CloudflareD1Database = {
    prepare(query: string) {
      statementSql = query;
      const statement = {
        bind(...values: unknown[]) { boundValues = values; return statement; },
        async all<T>() { return { results: rows as T[] }; },
        async first<T>() {
          if (query.includes('FROM User WHERE id = ?')) {
            const userId = String(boundValues[0]);
            return {
              id: userId,
              name: 'Logistics User',
              email: userId === 'usr-standard-test' ? 'user@procucev.test' : 'admin@procucev.test',
              role: userId === 'usr-standard-test' ? 'USER' : 'ADMIN',
              status: 'ACTIVE'
            } as T;
          }
          if (query.includes('FROM AssessmentRecord')) {
            return assessmentFound ? { customer_id: 'CUSTOMER-1', contact_email: contactEmail } as T : null;
          }
          return null as T | null;
        },
        async run() { return {}; }
      };
      return statement;
    }
  };
  return { db, getQuery: () => statementSql, getBindings: () => boundValues };
};

const testEnvironment = (db: CloudflareD1Database | undefined) => ({ DB: db, AUTH_SECRET: TEST_AUTH_SECRET });

const authenticatedRequest = async (token: string, url: URL): Promise<Request> =>
  new Request(url, { headers: { Authorization: 'Bearer ' + token } });

describe('handleModule2LogisticsPackagingRoute', () => {
  it('returns assessment-scoped D1 candidates and identifies demo rows', async () => {
    const { db, getQuery, getBindings } = makeDatabase([
      { candidateId: 'DEMO-LOG-001', assessmentId: 'AIC-2026-0001', isDemo: 1 },
      { candidateId: 'LOG-REAL-001', assessmentId: 'AIC-2026-0001', isDemo: 0 }
    ]);
    const url = new URL('https://example.test/api/module2/logistics-packaging?assessmentId=AIC-2026-0001');
    const result = await handleModule2LogisticsPackagingRoute(testEnvironment(db), await authenticatedRequest(await userToken(), url), url);
    expect(result.data).toMatchObject({
      success: true, count: 2, candidates: [{ candidateId: 'DEMO-LOG-001', isDemo: true }, { candidateId: 'LOG-REAL-001', isDemo: false }]
    });
    expect(getQuery()).toContain('WHERE assessment_id = ?');
    expect(getBindings()).toEqual(['AIC-2026-0001']);
  });

  it('rejects invalid assessment scope, unsupported methods and missing D1', async () => {
    const { db } = makeDatabase([]);
    const env = testEnvironment(db);
    const invalidUrl = new URL('https://example.test/api/module2/logistics-packaging');
    const invalid = await handleModule2LogisticsPackagingRoute(env,
      new Request('https://example.test/api/module2/logistics-packaging'),
      invalidUrl);
    expect(invalid.status).toBe(400);
    const oversizedUrl = new URL(`https://example.test/api/module2/logistics-packaging?assessmentId=${'a'.repeat(121)}`);
    const oversized = await handleModule2LogisticsPackagingRoute(env,
      await authenticatedRequest(await userToken(), oversizedUrl), oversizedUrl);
    expect(oversized.status).toBe(400);
    const method = await handleModule2LogisticsPackagingRoute(env,
      new Request(invalidUrl, { method: 'POST' }),
      invalidUrl);
    expect(method.status).toBe(405);
    await expect(handleModule2LogisticsPackagingRoute(undefined,
      new Request(invalidUrl),
      invalidUrl)).rejects.toThrow();
  });

  it('rejects unauthenticated and out-of-scope callers before querying candidate rows', async () => {
    const { db } = makeDatabase([]);
    const url = new URL('https://example.test/api/module2/logistics-packaging?assessmentId=AIC-2026-0001');
    const anonymous = await handleModule2LogisticsPackagingRoute(testEnvironment(db), new Request(url), url);
    expect(anonymous.status).toBe(401);

    const { db: foreignDb } = makeDatabase([], 'other@procucev.test');
    const forbidden = await handleModule2LogisticsPackagingRoute(
      testEnvironment(foreignDb),
      await authenticatedRequest(await userToken(), url),
      url
    );
    expect(forbidden.status).toBe(403);

    const { db: missingAssessmentDb } = makeDatabase([], 'user@procucev.test', false);
    const missingAssessment = await handleModule2LogisticsPackagingRoute(
      testEnvironment(missingAssessmentDb),
      await authenticatedRequest(await adminToken(), url),
      url
    );
    expect(missingAssessment.status).toBe(404);
  });

  it('allows administrators and rejects customer users without a linked contact email', async () => {
    const url = new URL('https://example.test/api/module2/logistics-packaging?assessmentId=AIC-2026-0001');
    const { db: adminDb } = makeDatabase([{ candidateId: 'LOG-1', isDemo: 1 }], null);
    const adminResult = await handleModule2LogisticsPackagingRoute(
      testEnvironment(adminDb),
      await authenticatedRequest(await adminToken(), url),
      url
    );
    expect(adminResult.data).toMatchObject({ success: true, count: 1 });

    const { db: noContactDb } = makeDatabase([], null);
    const noContact = await handleModule2LogisticsPackagingRoute(
      testEnvironment(noContactDb),
      await authenticatedRequest(await userToken(), url),
      url
    );
    expect(noContact.status).toBe(403);
  });
});
