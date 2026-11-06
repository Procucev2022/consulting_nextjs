import type { AuthRouteResult, CloudflareEnvironment } from '../types/cloudflare';
import type { CommercialAdminAuthorization, ResendEmailResponse } from '../types/commercialWorkflow';
import type { CloudflareD1Database } from '../types/cloudflare';
import { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import { D1_SINGLE_ROW_CHANGE_COUNT } from '../constants/db';
import { D1_TABLES } from '../constants/d1';
import { authenticateWorkerUser } from '../workerAuth';
import { d1ChangedRows } from '../utils/d1Result';
import { readJson } from '../workerHttp';

export { d1ChangedRows } from '../utils/d1Result';

export const commercialResult = (body: Record<string, unknown>, status: number): AuthRouteResult => ({ body, status });

export const readCommercialBody = async (request: Request): Promise<Record<string, unknown>> => readJson(request);

export const authorizeCommercialAdmin = async (
  request: Request, environment: CloudflareEnvironment
): Promise<CommercialAdminAuthorization> => {
  const db = environment.DB;
  if (!db) {
    return {
      actor: null,
      db: null,
      result: commercialResult({ success: false, message: 'Cloudflare D1 is not configured.' }, 503)
    };
  }
  const auth = await authenticateWorkerUser(request, environment, true);
  if (!auth.user) {
    return {
      actor: null,
      db: null,
      result: commercialResult({ success: false, message: auth.message || 'Administrator authentication is required.' }, auth.status)
    };
  }
  return { actor: { ...auth.user, role: 'ADMIN' }, db, result: null };
};

export const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const secureEquals = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

export const createOtp = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const value = ((bytes[0] ?? 0) * 0x1000000) + ((bytes[1] ?? 0) * 0x10000) +
    ((bytes[2] ?? 0) * 0x100) + (bytes[3] ?? 0);
  return String(value % 1_000_000).padStart(6, '0');
};

export const createOneTimeCode = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `UPG-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
};

export const sendCommercialEmail = async (
  environment: CloudflareEnvironment,
  to: string,
  subject: string,
  text: string,
  developmentHint?: string
): Promise<{ sent: boolean; developmentHint?: string; message?: string }> => {
  if (!environment.RESEND_API_KEY || !environment.RESEND_FROM) {
    const mode = (
      environment.ENVIRONMENT || environment.APP_OPERATING_MODE || COMMERCIAL_WORKFLOW.productionMode
    ).toUpperCase();
    return !COMMERCIAL_WORKFLOW.developmentModes.includes(mode as typeof COMMERCIAL_WORKFLOW.developmentModes[number])
      ? { sent: false, message: 'Commercial email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM in the Worker environment.' }
      : { sent: false, ...(developmentHint ? { developmentHint } : {}) };
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${environment.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: environment.RESEND_FROM, to: [to], subject, text })
  });
  const payload = await response.json().catch(() => ({})) as ResendEmailResponse;
  if (!response.ok) {
    return { sent: false, message: payload.message || payload.error?.message || `Email provider returned HTTP ${response.status}.` };
  }
  return { sent: true };
};

export const toPublicSubscription = <T extends object>(row: T): T & { payment_confirmed: boolean } => ({
  ...row,
  payment_confirmed: (row as { payment_confirmed?: unknown }).payment_confirmed === 1 ||
    (row as { payment_confirmed?: unknown }).payment_confirmed === true
});

export const verifyCommercialOtp = async (
  db: CloudflareD1Database,
  sessionId: string,
  purpose: string,
  otp: string
): Promise<boolean> => {
  const otpHash = await sha256Hex(otp);
  const verifiedAt = new Date().toISOString();
  const updated = await db.prepare(`
    UPDATE ${D1_TABLES.adminOtpSessions}
    SET attempts = attempts + 1,
      verified_at = CASE WHEN otp_hash = ? THEN ? ELSE verified_at END
    WHERE id = ? AND purpose = ? AND expires_at > ? AND verified_at IS NULL AND attempts < ?
  `).bind(
    otpHash, verifiedAt, sessionId, purpose, Date.now(), COMMERCIAL_WORKFLOW.otpMaxAttempts
  ).run();
  if (d1ChangedRows(updated) !== D1_SINGLE_ROW_CHANGE_COUNT) return false;
  const row = await db.prepare(`SELECT verified_at FROM ${D1_TABLES.adminOtpSessions} WHERE id = ?`)
    .bind(sessionId).first<{ verified_at: string | null }>();
  return Boolean(row?.verified_at);
};
