/**
 * Administrator check for Executive Brief regeneration. It reuses verifyToken from workerAuth and accepts only
 * ADMIN tokens. When AUTH_SECRET is missing, every request fails with 503, because an empty HMAC key would accept
 * tokens that anyone can forge.
 */
import { authenticateWorkerUser, verifyToken } from './workerAuth';
import { AUTH_ROLES } from './constants/auth';
import {
  EXECUTIVE_BRIEF_BEARER_PATTERN,
  EXECUTIVE_BRIEF_HEADER_NAMES,
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_BRIEF_MESSAGES
} from './constants/executiveBriefRouteConstants';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { ExecutiveBriefAuthOutcome } from './types/executiveBriefRoutes';
import { EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES } from './constants/executiveOpportunityBriefConstants';


export const extractBearerToken = (request: Request): string | null => {
  const header = (request.headers.get(EXECUTIVE_BRIEF_HEADER_NAMES.AUTHORIZATION) ?? '').trim();
  const match = EXECUTIVE_BRIEF_BEARER_PATTERN.exec(header);
  return match?.[1] ?? null;
};

const verifySafely = async (token: string, secret: string): Promise<Record<string, unknown> | null> => {
  try {
    return await verifyToken(token, secret);
  } catch {
    return null;
  }
};

export const authorizeExecutiveBriefAdmin = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<ExecutiveBriefAuthOutcome> => {
  const secret = environment.AUTH_SECRET;
  if (secret === undefined || secret.length === 0) {
    return {
      ok: false,
      status: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: EXECUTIVE_BRIEF_MESSAGES.authSecretMissing
    };
  }
  if (environment.DB === undefined) {
    return {
      ok: false,
      status: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable
    };
  }
  const token = extractBearerToken(request);
  if (token === null) {
    return { ok: false, status: EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED, message: EXECUTIVE_BRIEF_MESSAGES.authRequired };
  }
  const payload = await verifySafely(token, secret);
  if (payload === null || typeof payload.userId !== 'string') {
    return { ok: false, status: EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED, message: EXECUTIVE_BRIEF_MESSAGES.tokenInvalid };
  }
  if (payload.role !== AUTH_ROLES.ADMIN) {
    return { ok: false, status: EXECUTIVE_BRIEF_HTTP_STATUS.FORBIDDEN, message: EXECUTIVE_BRIEF_MESSAGES.adminRequired };
  }
  try {
    const normalizedHeaders = new Headers(request.headers);
    normalizedHeaders.set(EXECUTIVE_BRIEF_HEADER_NAMES.AUTHORIZATION, ['Bearer', token].join(' '));
    const normalizedRequest = new Request(request.url, {
      method: request.method,
      headers: normalizedHeaders
    });
    const authentication = await authenticateWorkerUser(normalizedRequest, environment, true);
    if (!authentication.user) {
      return {
        ok: false,
        status: authentication.status,
        message: authentication.status === EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED
          ? EXECUTIVE_BRIEF_MESSAGES.tokenInvalid
          : authentication.message ?? EXECUTIVE_BRIEF_MESSAGES.adminRequired
      };
    }
    return { ok: true, userId: authentication.user.id };
  } catch {
    return {
      ok: false,
      status: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable
    };
  }
};
