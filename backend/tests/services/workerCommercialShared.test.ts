import { afterEach, describe, expect, it, vi } from 'vitest';
import * as workerAuth from '../../src/workerAuth';
import { COMMERCIAL_WORKFLOW } from '../../src/constants/commercialWorkflow';
import {
  authorizeCommercialAdmin, commercialResult, createOneTimeCode, createOtp, d1ChangedRows,
  readCommercialBody, secureEquals, sendCommercialEmail, sha256Hex, toPublicSubscription, verifyCommercialOtp
} from '../../src/services/workerCommercialShared';
import type { CloudflareEnvironment } from '../../src/types/cloudflare';
import {
  createWorkerDatabase, insertRows, WORKER_CORE_SECRET, type WorkerDatabaseFixture
} from '../helpers/workerCoreFixtures';

let fixture: WorkerDatabaseFixture | null = null;
afterEach(() => {
  fixture?.close();
  fixture = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const environment = (overrides: CloudflareEnvironment = {}): CloudflareEnvironment => ({
  ...(fixture ? { DB: fixture.d1 } : {}),
  AUTH_SECRET: WORKER_CORE_SECRET,
  APP_OPERATING_MODE: 'INTERNAL_ASSESSMENT',
  ...overrides
});

const jsonRequest = (body: string): Request => new Request('https://edge.example.test/api/commercial', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body
});

describe('commercial workflow shared helpers', () => {
  it('normalizes JSON body shapes and returns typed responses', async () => {
    expect(await readCommercialBody(jsonRequest('{"ok":true}'))).toEqual({ ok: true });
    expect(await readCommercialBody(jsonRequest('[1,2]'))).toEqual({});
    expect(await readCommercialBody(jsonRequest('{bad')).catch(() => ({}))).toEqual({});
    expect(commercialResult({ success: true }, 201)).toEqual({ body: { success: true }, status: 201 });
  });

  it('issues random codes and compares digests without leaking key material', async () => {
    expect(createOtp()).toMatch(/^\d{6}$/);
    expect(createOneTimeCode()).toMatch(/^UPG-[a-f\d]{64}$/);
    const digest = await sha256Hex('sensitive-code');
    expect(digest).toMatch(/^[a-f\d]{64}$/);
    expect(secureEquals(digest, digest)).toBe(true);
    expect(secureEquals(digest, `${digest}x`)).toBe(false);
    expect(secureEquals(digest, '0'.repeat(digest.length))).toBe(false);
    vi.spyOn(crypto, 'getRandomValues').mockReturnValueOnce(new Uint8Array(0));
    expect(createOtp()).toBe('000000');
  });

  it('authorizes only an active D1 administrator', async () => {
    fixture = createWorkerDatabase();
    insertRows(fixture.db, `INSERT INTO User (id, name, mobile_number, email, company_name, company_address,
      password_hash, role, status, subscription_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      ['admin-1', 'Admin', '+910000000000', 'admin@example.test', 'Example', 'India', 'hash', 'ADMIN', 'ACTIVE', 'GOLD'],
      ['user-1', 'User', '+910000000001', 'user@example.test', 'Example', 'India', 'hash', 'USER', 'ACTIVE', 'BRONZE']
    ]);
    const noBinding = await authorizeCommercialAdmin(new Request('https://edge.example.test'), { AUTH_SECRET: WORKER_CORE_SECRET });
    const noToken = await authorizeCommercialAdmin(new Request('https://edge.example.test'), environment());
    const userToken = `Bearer ${await (await import('../helpers/evidenceSqlite')).issueEvidenceToken({ userId: 'user-1' }, WORKER_CORE_SECRET)}`;
    const nonAdmin = await authorizeCommercialAdmin(new Request('https://edge.example.test', { headers: { Authorization: userToken } }), environment());
    expect(noBinding.result?.status).toBe(503);
    expect(noToken.result?.status).toBe(401);
    expect(nonAdmin.result?.status).toBe(403);
    vi.spyOn(workerAuth, 'authenticateWorkerUser').mockResolvedValueOnce({ status: 401 });
    const missingMessage = await authorizeCommercialAdmin(new Request('https://edge.example.test'), environment());
    expect(missingMessage.result?.body.message).toBe('Administrator authentication is required.');
  });

  it('returns development hints only in an explicitly development-mode environment', async () => {
    const development = await sendCommercialEmail(environment(), 'admin@example.test', 'Code', 'Code 123456', '123456');
    const production = await sendCommercialEmail(
      environment({ APP_OPERATING_MODE: 'PRODUCTION' }), 'admin@example.test', 'Code', 'Code 123456', '123456'
    );
    expect(development).toEqual({ sent: false, developmentHint: '123456' });
    expect(production.sent).toBe(false);
    expect(production.developmentHint).toBeUndefined();
    expect(production.message).toContain('RESEND_API_KEY');
    const noHint = await sendCommercialEmail(environment({ APP_OPERATING_MODE: 'DEV' }), 'admin@example.test', 'Code', 'Code');
    const defaultProduction = await sendCommercialEmail({}, 'admin@example.test', 'Code', 'Code');
    expect(noHint).toEqual({ sent: false });
    expect(defaultProduction.message).toContain('Commercial email delivery is not configured');
  });

  it('sends commercial email through Resend and reports provider failures without credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('{"id":"mail-1"}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{"message":"provider rejected"}', { status: 429 }))
      .mockResolvedValueOnce(new Response('{"error":{"message":"provider error"}}', { status: 503 }))
      .mockResolvedValueOnce(new Response('{}', { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);
    const env = environment({ RESEND_API_KEY: 'opaque-test-key', RESEND_FROM: 'ops@example.test' });
    expect(await sendCommercialEmail(env, 'a@example.test', 'Subject', 'Body')).toEqual({ sent: true });
    const failed = await sendCommercialEmail(env, 'a@example.test', 'Subject', 'Body');
    const nestedFailure = await sendCommercialEmail(env, 'a@example.test', 'Subject', 'Body');
    const emptyFailure = await sendCommercialEmail(env, 'a@example.test', 'Subject', 'Body');
    expect(failed).toEqual({ sent: false, message: 'provider rejected' });
    expect(nestedFailure).toEqual({ sent: false, message: 'provider error' });
    expect(emptyFailure).toEqual({ sent: false, message: 'Email provider returned HTTP 502.' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('verifies an OTP once, increments failed attempts, and rejects expired or exhausted sessions', async () => {
    fixture = createWorkerDatabase();
    const now = Date.now();
    const insertSession = async (id: string, code: string, expires: number): Promise<void> => {
      await fixture!.d1.prepare(`INSERT INTO AdminOtpSession
        (id, purpose, requested_by, otp_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(id, COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, 'admin-1', await sha256Hex(code), expires, new Date().toISOString()).run();
    };
    await insertSession('otp-valid', '123456', now + 300000);
    await insertSession('otp-wrong', '123456', now + 300000);
    await insertSession('otp-expired', '123456', now - 1);
    expect(await verifyCommercialOtp(fixture!.d1, 'otp-wrong', COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, '654321')).toBe(false);
    expect(await verifyCommercialOtp(fixture!.d1, 'otp-valid', COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, '123456')).toBe(true);
    expect(await verifyCommercialOtp(fixture!.d1, 'otp-valid', COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, '123456')).toBe(false);
    expect(await verifyCommercialOtp(fixture!.d1, 'otp-expired', COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, '123456')).toBe(false);
    const exhausted = await fixture!.d1.prepare('UPDATE AdminOtpSession SET attempts = ? WHERE id = ?')
      .bind(COMMERCIAL_WORKFLOW.otpMaxAttempts, 'otp-wrong').run();
    expect(d1ChangedRows(exhausted)).toBe(1);
    expect((await fixture!.d1.prepare('SELECT attempts FROM AdminOtpSession WHERE id = ?')
      .bind('otp-wrong').first<{ attempts: number }>())?.attempts).toBe(COMMERCIAL_WORKFLOW.otpMaxAttempts);
  });

  it('normalizes persisted payment flags and D1 change-count shapes', () => {
    expect(toPublicSubscription({ id: 's-1', payment_confirmed: 1 })).toEqual({ id: 's-1', payment_confirmed: true });
    expect(toPublicSubscription({ id: 's-2', payment_confirmed: 0 }).payment_confirmed).toBe(false);
    expect(toPublicSubscription({ id: 's-3', payment_confirmed: true }).payment_confirmed).toBe(true);
    expect(d1ChangedRows({ meta: { changes: 2 } })).toBe(2);
    expect(d1ChangedRows({ changes: 1 })).toBe(1);
    expect(d1ChangedRows({})).toBeNull();
    expect(d1ChangedRows(null)).toBeNull();
    expect(d1ChangedRows(3)).toBeNull();
  });
});
