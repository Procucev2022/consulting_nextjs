import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleExecutiveBriefRoute } from '../src/workerD1ExecutiveBrief';
import { EXECUTIVE_BRIEF_HTTP_STATUS } from '../src/constants/executiveBriefRouteConstants';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../src/constants/executiveOpportunityBriefConstants';
import type { CloudflareEnvironment } from '../src/types/cloudflare';
import { briefRequest, briefUrl, testEnvironment, userToken } from './executiveBriefTestHelpers';
import * as workerAuth from '../src/workerAuth';

const mocked = vi.hoisted(() => ({ failAudit: false, failPdf: false }));

vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

vi.mock('../src/services/executiveOpportunityBriefExport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/executiveOpportunityBriefExport')>();
  return {
    ...actual,
    formatExecutiveOpportunityBriefAuditMarkdown: vi.fn((...args: Parameters<typeof actual.formatExecutiveOpportunityBriefAuditMarkdown>) => {
      if (mocked.failAudit) throw new Error('markdown rendering failed');
      return actual.formatExecutiveOpportunityBriefAuditMarkdown(...args);
    }),
    generateExecutiveOpportunityBriefPdf: vi.fn((...args: Parameters<typeof actual.generateExecutiveOpportunityBriefPdf>) => {
      if (mocked.failPdf) throw new Error('PDF rendering failed');
      return actual.generateExecutiveOpportunityBriefPdf(...args);
    })
  };
});

const route = async (path: string, env: CloudflareEnvironment = testEnvironment()): Promise<Response> => {
  const response = await handleExecutiveBriefRoute(briefRequest('GET', path), env, briefUrl(path));
  if (response === null) throw new Error('Expected the executive brief route to answer');
  return response;
};

describe('D1 executive brief error handling', () => {
  beforeEach(() => {
    mocked.failAudit = false;
    mocked.failPdf = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns a request-correlated error when D1 queries fail', async () => {
    const environment = testEnvironment({
      DB: { prepare: () => { throw new Error('D1 query failed'); } } as unknown as CloudflareEnvironment['DB']
    });
    const response = await route('/report', environment);
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = response.headers.get('X-Request-Id') ?? '';
    expect(((await response.json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.reportFailed(requestId));
  });

  it('returns an actionable failure when D1-backed audit formatting fails', async () => {
    mocked.failAudit = true;
    const response = await route('/audit');
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = response.headers.get('X-Request-Id') ?? '';
    expect(((await response.json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.exportFailed('audit', requestId));
  });

  it('returns an actionable failure when a D1-backed PDF cannot render', async () => {
    mocked.failPdf = true;
    const response = await route('/download/pdf');
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = response.headers.get('X-Request-Id') ?? '';
    expect(((await response.json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.exportFailed('pdf', requestId));
  });

  it('emails a report assembled from D1 to an authenticated recipient', async () => {
    let emailText = '';
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      emailText = (JSON.parse(String(init?.body)) as { text: string }).text;
      return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const token = await userToken();
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', {
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerEmail: 'buyer@example.test' })
      }),
      testEnvironment({ RESEND_API_KEY: 'test-key', RESEND_FROM: 'reports@example.test' }),
      briefUrl('/email')
    );
    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(((await (response as Response).json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailSent);
    expect(emailText).toContain('D1 Enterprise');
    expect(emailText).toContain('DEMO_ONLY');
    expect(emailText).not.toContain('commercialMetrics');
  });

  it('validates recipients and rejects unauthenticated email requests', async () => {
    const invalid = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', { body: JSON.stringify({ buyerEmail: 'bad', inventedMetrics: 100 }) }),
      testEnvironment(),
      briefUrl('/email')
    );
    expect(invalid?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);

    const unauthenticated = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', { body: JSON.stringify({ buyerEmail: 'buyer@example.test' }) }),
      testEnvironment(),
      briefUrl('/email')
    );
    expect(unauthenticated?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED);
  });

  it('rejects malformed JSON before authenticating an email request', async () => {
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', { body: '{"buyerEmail":' }),
      testEnvironment(),
      briefUrl('/email')
    );

    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);
    const body = (await (response as Response).json()) as { errors: Array<{ message: string }> };
    expect(body.errors[0].message).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.invalidEmailRequest);
  });

  it('uses the fallback email error when authentication omits its message', async () => {
    vi.spyOn(workerAuth, 'authenticateWorkerUser').mockResolvedValueOnce({ status: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE });
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', { body: JSON.stringify({ buyerEmail: 'buyer@example.test' }) }),
      testEnvironment(),
      briefUrl('/email')
    );

    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
    const requestId = (response as Response).headers.get('X-Request-Id') ?? '';
    expect(((await (response as Response).json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailFailed(requestId));
  });

  it('returns a D1 report-loading failure after authenticating the email recipient', async () => {
    const token = await userToken();
    const database = {
      prepare: (query: string) => {
        const statement = {
          bind: () => statement,
          first: async <T>() => query.includes('FROM User')
            ? { id: 'usr-user-test', name: 'D1 Test User', email: 'buyer@example.test', role: 'USER', status: 'ACTIVE' } as T
            : null,
          all: async <T>() => ({
            results: query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenants ? [] as T[] : [] as T[]
          }),
          run: async () => ({ success: true })
        };
        return statement;
      }
    } as unknown as CloudflareEnvironment['DB'];
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', {
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerEmail: 'buyer@example.test' })
      }),
      testEnvironment({ DB: database }),
      briefUrl('/email')
    );

    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND);
    expect(((await (response as Response).json()) as { reason: string }).reason).toBe('no-tenant');
  });

  it('uses the request-correlated fallback when a development email provider has no configuration', async () => {
    const token = await userToken();
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', {
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerEmail: 'buyer@example.test' })
      }),
      testEnvironment({ ENVIRONMENT: 'DEVELOPMENT' }),
      briefUrl('/email')
    );

    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
    const requestId = (response as Response).headers.get('X-Request-Id') ?? '';
    expect(((await (response as Response).json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailFailed(requestId));
  });

  it('returns a correlated error when the email provider throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('provider connection failed'); }));
    const token = await userToken();
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', {
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerEmail: 'buyer@example.test' })
      }),
      testEnvironment({ RESEND_API_KEY: 'test-key', RESEND_FROM: 'reports@example.test' }),
      briefUrl('/email')
    );

    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = (response as Response).headers.get('X-Request-Id') ?? '';
    expect(((await (response as Response).json()) as { message: string }).message)
      .toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailFailed(requestId));
  });

  it('returns a provider error when D1 report email delivery is unavailable', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: 'provider unavailable' }), { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const token = await userToken();
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/email', {
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerEmail: 'buyer@example.test' })
      }),
      testEnvironment({ RESEND_API_KEY: 'test-key', RESEND_FROM: 'reports@example.test' }),
      briefUrl('/email')
    );
    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(((await (response as Response).json()) as { message: string }).message).toBe('provider unavailable');
  });
});
