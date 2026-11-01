import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleExecutiveBriefRoute } from '../src/workerD1ExecutiveBrief';
import { extractBearerToken, authorizeExecutiveBriefAdmin } from '../src/workerD1ExecutiveBriefAuth';
import { EXECUTIVE_BRIEF_HTTP_STATUS, EXECUTIVE_BRIEF_MESSAGES } from '../src/constants/executiveBriefRouteConstants';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../src/constants/executiveOpportunityBriefConstants';
import type { CloudflareEnvironment } from '../src/types/cloudflare';
import {
  TEST_AUTH_SECRET,
  adminToken,
  briefRequest,
  briefUrl,
  bucketDouble,
  expiredAdminToken,
  signTestToken,
  testEnvironment,
  userToken
} from './executiveBriefTestHelpers';

vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

const REGENERATE_PATH = '/regenerate';
const REGENERATE_URL = briefUrl(REGENERATE_PATH);

const regenerate = async (
  init: { token?: string | null; body?: string; env?: CloudflareEnvironment; authorization?: string } = {}
): Promise<Response> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init.authorization !== undefined) {
    headers.Authorization = init.authorization;
  } else if (init.token) {
    headers.Authorization = `Bearer ${init.token}`;
  }
  const request = briefRequest('POST', REGENERATE_PATH, { headers, body: init.body ?? '{}' });
  const response = await handleExecutiveBriefRoute(request, init.env ?? testEnvironment(), REGENERATE_URL);
  if (response === null) {
    throw new Error('Expected the regenerate route to answer');
  }
  return response;
};

const regenerationDatabase = (
  tenants: Array<{ tenant_id: string; enterprise_name: string }>,
  failBriefQuery = false
): NonNullable<CloudflareEnvironment['DB']> => ({
  prepare: (query: string) => {
    let values: unknown[] = [];
    const statement = {
      bind: (...boundValues: unknown[]) => { values = boundValues; return statement; },
      first: async <T>() => {
        if (query.includes('FROM User')) {
          const userId = String(values[0]);
          return {
            id: userId,
            name: 'D1 Admin',
            email: 'admin@example.test',
            role: userId === 'usr-standard-test' ? 'USER' : 'ADMIN',
            status: 'ACTIVE'
          } as T;
        }
        if (failBriefQuery) throw new Error('D1 report query failed');
        return null;
      },
      all: async <T>() => {
        if (failBriefQuery) throw new Error('D1 report query failed');
        return { results: (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenants ? tenants : []) as T[] };
      },
      run: async () => ({ success: true })
    };
    return statement;
  }
});

describe('executive brief regeneration authorization', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-24T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('extracts only Bearer tokens from the Authorization header', () => {
    const withToken = briefRequest('POST', REGENERATE_PATH, { headers: { Authorization: 'Bearer abc.def.ghi' } });
    expect(extractBearerToken(withToken)).toBe('abc.def.ghi');
    const basic = briefRequest('POST', REGENERATE_PATH, { headers: { Authorization: 'Basic abc' } });
    expect(extractBearerToken(basic)).toBeNull();
    expect(extractBearerToken(briefRequest('POST', REGENERATE_PATH))).toBeNull();
  });

  it('returns 401 with the sign-in guidance when no bearer token is sent', async () => {
    const response = await regenerate();
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
    expect(((await response.json()) as { message: string }).message).toBe(EXECUTIVE_BRIEF_MESSAGES.authRequired);
  });

  it('returns 401 for a malformed Authorization header', async () => {
    const response = await regenerate({ authorization: 'Basic dXNlcjpwYXNz' });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
  });

  it('returns 401 for an expired token, a token signed with another secret, and an undecodable signature', async () => {
    expect((await regenerate({ token: await expiredAdminToken() })).status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
    const foreign = await signTestToken(
      { userId: 'usr-admin-test', role: 'ADMIN', exp: Date.now() + 60000 },
      'some-other-secret'
    );
    expect((await regenerate({ token: foreign })).status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
    const garbled = await regenerate({ authorization: 'Bearer aaa.bbb.!!!' });
    expect(garbled.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
    expect(((await garbled.json()) as { message: string }).message).toBe(EXECUTIVE_BRIEF_MESSAGES.tokenInvalid);
  });

  it('returns 401 when a valid admin token has no user identifier', async () => {
    const anonymous = await signTestToken({ role: 'ADMIN', exp: Date.now() + 60000 }, TEST_AUTH_SECRET);
    expect((await regenerate({ token: anonymous })).status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
  });

  it('returns 403 with the administrator message for a signed-in non-admin account', async () => {
    const response = await regenerate({ token: await userToken() });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.FORBIDDEN);
    expect(((await response.json()) as { message: string }).message).toBe(EXECUTIVE_BRIEF_MESSAGES.adminRequired);
  });

  it('returns 503 when AUTH_SECRET is missing, so no token can be trusted', async () => {
    const env = testEnvironment({ AUTH_SECRET: '' });
    const response = await regenerate({ token: await adminToken(), env });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(((await response.json()) as { message: string }).message).toBe(EXECUTIVE_BRIEF_MESSAGES.authSecretMissing);
    const outcome = await authorizeExecutiveBriefAdmin(briefRequest('POST', REGENERATE_PATH), { AUTH_SECRET: '' });
    expect(outcome.ok).toBe(false);
  });

  it('accepts an admin token and reports the user identifier only through the outcome', async () => {
    const outcome = await authorizeExecutiveBriefAdmin(
      briefRequest('POST', REGENERATE_PATH, { headers: { Authorization: `Bearer ${await adminToken()}` } }),
      testEnvironment()
    );
    expect(outcome).toEqual({ ok: true, userId: 'usr-admin-test' });
  });
});

describe('executive brief regeneration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-24T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('publishes the four D1 artifacts to R2 under executive-brief/<tenant>/ and returns their keys', async () => {
    const bucket = bucketDouble();
    const response = await regenerate({ token: await adminToken(), env: testEnvironment({ OBJECTS: bucket }) });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    const body = (await response.json()) as {
      success: boolean;
      message: string;
      data: { tenantId: string; enterpriseName: string; reportDate: string; artifacts: Array<{ key: string }> };
    };
    expect(body.success).toBe(true);
    expect(body.message).toBe(EXECUTIVE_BRIEF_MESSAGES.regenerated);
    expect(body.data.tenantId).toBe('TEN-1');
    expect(body.data.enterpriseName).toBe('D1 Enterprise');
    expect(body.data.reportDate).toBe('2026-10-24');
    expect(body.data.artifacts.map((artifact) => artifact.key)).toEqual(
      bucket.put.mock.calls.map((call) => call[0])
    );
    expect(bucket.put).toHaveBeenCalledTimes(4);
    expect(String(bucket.put.mock.calls[0][0]).startsWith('executive-brief/D1_Enterprise/')).toBe(true);
  });

  it('uses the current D1 tenant when the body is empty', async () => {
    const response = await regenerate({ token: await adminToken(), body: '   ' });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
  });

  it('rejects malformed JSON and a non-string client with a 400 validation response', async () => {
    const malformed = await regenerate({ token: await adminToken(), body: '{"client":' });
    expect(malformed.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);
    const malformedBody = (await malformed.json()) as { errors: Array<{ message: string }> };
    expect(malformedBody.errors[0].message).toBe(EXECUTIVE_BRIEF_MESSAGES.invalidJsonBody);

    const numeric = await regenerate({ token: await adminToken(), body: '{"client":42}' });
    expect(numeric.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);
    const numericBody = (await numeric.json()) as { message: string; errors: Array<{ path: string }> };
    expect(numericBody.message).toBe(EXECUTIVE_BRIEF_MESSAGES.validationFailed);
    expect(numericBody.errors[0].path).toBe('client');
  });

  it('returns 404 for a client that does not match the active D1 tenant', async () => {
    const response = await regenerate({ token: await adminToken(), body: '{"client":"ABC Textile Ltd"}' });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);
    expect(((await response.json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.tenantMismatch('ABC Textile Ltd', 'D1 Enterprise'));
  });

  it('returns 503 when the OBJECTS binding is not configured', async () => {
    const response = await regenerate({ token: await adminToken(), env: testEnvironment({ OBJECTS: undefined }) });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(((await response.json()) as { message: string }).message).toBe(EXECUTIVE_BRIEF_MESSAGES.r2Missing);
  });

  it('returns 500 with the request ID when R2 rejects a write', async () => {
    const bucket = bucketDouble();
    bucket.put.mockRejectedValueOnce(new Error('R2 unavailable'));
    const response = await regenerate({
      token: await adminToken(),
      env: testEnvironment({ OBJECTS: bucket })
    });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = response.headers.get('X-Request-Id') ?? '';
    expect(requestId.length).toBeGreaterThan(0);
    expect(((await response.json()) as { message: string }).message).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.publishFailed(requestId));
  });

  it('requires D1 before it can regenerate the R2 report', async () => {
    const response = await regenerate({
      token: await adminToken(),
      env: testEnvironment({ DB: undefined })
    });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(((await response.json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable);
  });

  it('reports missing and ambiguous tenant scopes from D1 without publishing artifacts', async () => {
    const missing = await regenerate({
      token: await adminToken(),
      env: testEnvironment({ DB: regenerationDatabase([]) })
    });
    expect(missing.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);
    expect(((await missing.json()) as { reason: string }).reason).toBe('no-tenant');

    const ambiguous = await regenerate({
      token: await adminToken(),
      env: testEnvironment({ DB: regenerationDatabase([
        { tenant_id: 'TEN-1', enterprise_name: 'One' },
        { tenant_id: 'TEN-2', enterprise_name: 'Two' }
      ]) })
    });
    expect(ambiguous.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT);
    expect(((await ambiguous.json()) as { reason: string }).reason).toBe('ambiguous-tenant');
  });

  it('returns a request-correlated failure when D1 throws while loading the report', async () => {
    const response = await regenerate({
      token: await adminToken(),
      env: testEnvironment({ DB: regenerationDatabase([], true) })
    });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = response.headers.get('X-Request-Id') ?? '';
    expect(((await response.json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.reportFailed(requestId));
  });
});
