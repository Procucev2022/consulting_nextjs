import { vi } from 'vitest';
import { assembleExecutiveBriefReport } from '../src/services/executiveBriefReportService';
import { DEFAULT_CLIENT_PROFILE } from '../src/constants/executiveBriefConstants';
import type { CloudflareEnvironment, CloudflareR2Bucket } from '../src/types/cloudflare';
import type { ExecutiveBriefReportData } from '../src/types/executiveBriefExportTypes';

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

export const testEnvironment = (overrides: Partial<CloudflareEnvironment> = {}): CloudflareEnvironment => ({
  AUTH_SECRET: TEST_AUTH_SECRET,
  OBJECTS: bucketDouble(),
  ...overrides
});

export const certifiedReport = (): ExecutiveBriefReportData =>
  assembleExecutiveBriefReport(DEFAULT_CLIENT_PROFILE.clientName, TEST_REPORT_DATE);

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
