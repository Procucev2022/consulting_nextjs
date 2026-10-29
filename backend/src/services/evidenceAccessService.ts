/**
 * Authentication and authorization for evidence requests.
 *
 * Identity comes only from the signed Bearer token, and the role comes from the User row in D1.
 * Client-sent x-user-* headers are ignored. Scope rule: an ADMIN may read any job. A USER may read
 * a job only when the sign-in email equals CustomerRecord.contact_email for the job's customer
 * (AssessmentRecord.customer_id). Other USER requests get 403 whether or not the job exists, so
 * customers cannot probe job IDs.
 */

import { AUTH_ROLES, AUTH_STATUS } from '../constants/auth';
import { EVIDENCE_ERROR_CATEGORIES, EVIDENCE_HTTP_STATUS, EVIDENCE_MESSAGES } from '../constants/evidenceMessages';
import { EVIDENCE_BEARER_PATTERN } from '../constants/evidenceRoutes';
import type { CloudflareD1Database, CloudflareEnvironment } from '../types/cloudflare';
import type { EvidenceJobAccessRecord, EvidenceUserRecord } from '../types/evidenceWorkbook';
import { verifyToken } from '../workerAuth';
import { loadUserRecord } from './evidenceD1Repository';
import { EvidenceRequestError } from './evidenceRequestError';

const unauthorized = (message: string): EvidenceRequestError =>
  new EvidenceRequestError(EVIDENCE_HTTP_STATUS.UNAUTHORIZED, EVIDENCE_ERROR_CATEGORIES.AUTH, message);

const forbidden = (message: string): EvidenceRequestError =>
  new EvidenceRequestError(EVIDENCE_HTTP_STATUS.FORBIDDEN, EVIDENCE_ERROR_CATEGORIES.AUTH, message);

const readBearerToken = (request: Request): string => {
  const match = EVIDENCE_BEARER_PATTERN.exec((request.headers.get('Authorization') ?? '').trim());
  if (!match) throw unauthorized(EVIDENCE_MESSAGES.missingBearerToken);
  return match[1];
};

const verifyEvidenceToken = async (token: string, secret: string): Promise<Record<string, unknown> | null> => {
  try {
    return await verifyToken(token, secret);
  } catch {
    return null;
  }
};

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const isLinkedToCustomer = (user: EvidenceUserRecord, job: EvidenceJobAccessRecord): boolean =>
  job.customerContactEmail !== null && normalizeEmail(job.customerContactEmail) === normalizeEmail(user.email);

export const requireEvidenceDatabase = (environment: CloudflareEnvironment): CloudflareD1Database => {
  const database = environment.DB;
  if (!database) {
    throw new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.SERVICE_UNAVAILABLE,
      EVIDENCE_ERROR_CATEGORIES.SERVER,
      EVIDENCE_MESSAGES.databaseNotConfigured
    );
  }
  return database;
};

export const authenticateEvidenceUser = async (
  request: Request,
  environment: CloudflareEnvironment,
  database: CloudflareD1Database,
  requestId: string
): Promise<EvidenceUserRecord> => {
  const secret = environment.AUTH_SECRET;
  if (!secret) {
    throw new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.SERVICE_UNAVAILABLE,
      EVIDENCE_ERROR_CATEGORIES.SERVER,
      EVIDENCE_MESSAGES.authSecretNotConfigured
    );
  }
  const payload = await verifyEvidenceToken(readBearerToken(request), secret);
  const userId = typeof payload?.userId === 'string' ? payload.userId : null;
  if (userId === null) throw unauthorized(EVIDENCE_MESSAGES.invalidToken);
  const user = await loadUserRecord(database, userId, requestId);
  if (!user) throw unauthorized(EVIDENCE_MESSAGES.userNotFound);
  if (user.status !== AUTH_STATUS.ACTIVE) throw forbidden(EVIDENCE_MESSAGES.accountInactive(user.status));
  if (user.role !== AUTH_ROLES.ADMIN && user.role !== AUTH_ROLES.USER) {
    throw forbidden(EVIDENCE_MESSAGES.unsupportedRole(user.role));
  }
  return user;
};

export const authorizeEvidenceJobAccess = (
  user: EvidenceUserRecord,
  job: EvidenceJobAccessRecord | null,
  jobId: string
): EvidenceJobAccessRecord => {
  if (user.role === AUTH_ROLES.ADMIN) {
    if (job === null) {
      throw new EvidenceRequestError(
        EVIDENCE_HTTP_STATUS.NOT_FOUND,
        EVIDENCE_ERROR_CATEGORIES.NOT_FOUND,
        EVIDENCE_MESSAGES.jobNotFound(jobId)
      );
    }
    return job;
  }
  if (job === null || !isLinkedToCustomer(user, job)) throw forbidden(EVIDENCE_MESSAGES.accessDenied(jobId));
  return job;
};
