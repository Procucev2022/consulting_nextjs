import { vi } from 'vitest';
import type { CloudflareEnvironment, CloudflareR2Bucket } from '../src/types/cloudflare';
import type { ExecutiveOpportunityBriefReport } from '../src/types/executiveOpportunityBrief';
import { EXECUTIVE_OPPORTUNITY_BRIEF_SQL } from '../src/constants/executiveOpportunityBriefConstants';

export const TEST_AUTH_SECRET = 'executive-brief-test-secret-2026';
export const TEST_REPORT_DATE = '2026-10-24';
export const TEST_ORIGIN = 'https://worker.example.test';
export const EXECUTIVE_BRIEF_PATH = '/api/reports/executive-brief';

const toBase64Url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Signs a token in the same HS256 format that workerAuth.verifyToken accepts.
 */
export const signTestToken = async (payload: Record<string, unknown>, secret: string): Promise<string> => {
  const encode = (value: unknown): string => toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode(payload);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${toBase64Url(new Uint8Array(signature))}`;
};

export const adminToken = async (): Promise<string> =>
  signTestToken(
    { userId: 'usr-admin-test', email: 'admin@procucev.test', role: 'ADMIN', exp: Date.now() + 60000 },
    TEST_AUTH_SECRET
  );

export const userToken = async (): Promise<string> =>
  signTestToken(
    { userId: 'usr-standard-test', email: 'user@procucev.test', role: 'USER', exp: Date.now() + 60000 },
    TEST_AUTH_SECRET
  );

export const expiredAdminToken = async (): Promise<string> =>
  signTestToken(
    { userId: 'usr-admin-test', email: 'admin@procucev.test', role: 'ADMIN', exp: Date.now() - 60000 },
    TEST_AUTH_SECRET
  );

export const bucketDouble = (): CloudflareR2Bucket & {
  put: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
} => ({
  put: vi.fn(async () => undefined),
  get: vi.fn(async () => null),
  delete: vi.fn(async () => undefined)
});

const d1TestDatabase: NonNullable<CloudflareEnvironment['DB']> = {
  prepare: (query: string) => {
    let values: unknown[] = [];
    const statement = {
      bind: (...boundValues: unknown[]) => { values = boundValues; return statement; },
      first: async <T>() => {
        if (query.includes('FROM User WHERE id = ?')) {
          const userId = String(values[0]);
          return {
            id: userId,
            name: 'D1 Test User',
            email: userId === 'usr-standard-test' ? 'user@procucev.test' : 'admin@procucev.test',
            role: userId === 'usr-standard-test' ? 'USER' : 'ADMIN',
            status: 'ACTIVE'
          } as T;
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.transactionMetrics) {
          return {
            transaction_count: 12,
            total_spend_cr: 125.5,
            supplier_count: 4,
            material_count: 6,
            plant_count: 2,
            purchase_order_count: 9,
            first_transaction_date: '2024-01-01',
            last_transaction_date: '2025-12-31'
          } as T;
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunityMetrics) {
          return { opportunity_count: 1, estimated_savings_cr: 10.25, average_confidence: 0.87 } as T;
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenantProvenance) {
          return { classification: 'DEMO_ONLY' } as T;
        }
        return null;
      },
      all: async <T>() => {
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenants) {
          return { results: [{ tenant_id: 'TEN-1', enterprise_name: 'D1 Enterprise' }] as T[] };
        }
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities) {
          return { results: [{
            opp_id: 'OPP-1', category: 'Packaging', title: 'Packaging sourcing', current_spend_cr: 50,
            estimated_savings_cr: 10.25, lever: 'Strategic sourcing', recommended_action: 'Launch a tender',
            status: 'Identified', risk_level: 'Medium', confidence_score: 0.9
          }] as T[] };
        }
        return { results: [{ label: 'Strategic sourcing', record_count: 1, estimated_savings_cr: 10.25 }] as T[] };
      },
      run: async () => ({ success: true })
    };
    return statement;
  }
};

export const testEnvironment = (overrides: Partial<CloudflareEnvironment> = {}): CloudflareEnvironment => ({
  AUTH_SECRET: TEST_AUTH_SECRET,
  OBJECTS: bucketDouble(),
  DB: d1TestDatabase,
  ...overrides
});

export const d1OpportunityBriefReport = (): ExecutiveOpportunityBriefReport => ({
  tenant: { tenantId: 'TEN-1', enterpriseName: 'D1 Enterprise' },
  dataClassification: 'DEMO_ONLY',
  generatedAt: '2026-10-24T09:00:00.000Z',
  scopeDescription: 'D1 demonstration data. Savings are not validated.',
  metrics: {
    transactionCount: 12,
    totalSpendCr: 125.5,
    supplierCount: 4,
    materialCount: 6,
    plantCount: 2,
    purchaseOrderCount: 9,
    firstTransactionDate: '2024-01-01',
    lastTransactionDate: '2025-12-31',
    opportunityCount: 1,
    estimatedSavingsCr: 10.25,
    averageConfidence: 0.87
  },
  opportunities: [{
    id: 'OPP-1',
    category: 'Packaging',
    title: 'Packaging sourcing',
    currentSpendCr: 50,
    estimatedSavingsCr: 10.25,
    lever: 'Strategic sourcing',
    recommendedAction: 'Launch a tender',
    status: 'Identified',
    riskLevel: 'Medium',
    confidence: 0.9
  }],
  levers: [{ label: 'Strategic sourcing', count: 1, estimatedSavingsCr: 10.25 }],
  statuses: [{ label: 'Identified', count: 1, estimatedSavingsCr: 10.25 }],
  risks: [{ label: 'Medium', count: 1, estimatedSavingsCr: 10.25 }]
});

export const briefUrl = (path: string, query = ''): URL => new URL(`${TEST_ORIGIN}${EXECUTIVE_BRIEF_PATH}${path}${query}`);

export const briefRequest = (
  method: string,
  path: string,
  init: { headers?: Record<string, string>; body?: string; query?: string } = {}
): Request => {
  const headers = new Headers(init.headers ?? {});
  return new Request(`${TEST_ORIGIN}${EXECUTIVE_BRIEF_PATH}${path}${init.query ?? ''}`, {
    method,
    headers,
    body: init.body
  });
};
