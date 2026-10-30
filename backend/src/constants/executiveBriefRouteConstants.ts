/**
 * Executive Brief HTTP surface: route table, endpoint URLs, status codes, headers, and user-facing messages.
 */
import type { ExecutiveBriefRouteDefinition } from '../types/executiveBriefRoutes';

export const EXECUTIVE_BRIEF_ROUTE_BASE = '/api/reports/executive-brief';
export const EXECUTIVE_BRIEF_REQUEST_ID_HEADER = 'X-Request-Id';
export const EXECUTIVE_BRIEF_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/u;
export const EXECUTIVE_BRIEF_CACHE_CONTROL = 'no-store';
export const EXECUTIVE_BRIEF_EXPOSED_HEADERS = 'X-Request-Id, Content-Disposition';
export const EXECUTIVE_BRIEF_CLIENT_NAME_MAX_LENGTH = 120;
export const EXECUTIVE_BRIEF_TRAILING_SLASH_PATTERN = /\/+$/u;
export const EXECUTIVE_BRIEF_BEARER_PATTERN = /^Bearer\s+(\S+)$/u;

export const EXECUTIVE_BRIEF_ENDPOINTS = {
  report: `${EXECUTIVE_BRIEF_ROUTE_BASE}/report`,
  audit: `${EXECUTIVE_BRIEF_ROUTE_BASE}/audit`,
  downloadPdf: `${EXECUTIVE_BRIEF_ROUTE_BASE}/download/pdf`,
  downloadPptx: `${EXECUTIVE_BRIEF_ROUTE_BASE}/download/pptx`,
  opportunityBriefPdf: `${EXECUTIVE_BRIEF_ROUTE_BASE}/download/opportunity-brief/pdf`,
  opportunityBriefPptx: `${EXECUTIVE_BRIEF_ROUTE_BASE}/download/opportunity-brief/pptx`,
  regenerate: `${EXECUTIVE_BRIEF_ROUTE_BASE}/regenerate`
} as const;

export const EXECUTIVE_BRIEF_ROUTES: readonly ExecutiveBriefRouteDefinition[] = [
  { key: 'report', method: 'GET', path: '/report' },
  { key: 'audit', method: 'GET', path: '/audit' },
  { key: 'downloadPdf', method: 'GET', path: '/download/pdf' },
  { key: 'downloadPptx', method: 'GET', path: '/download/pptx' },
  { key: 'opportunityBriefPdf', method: 'GET', path: '/download/opportunity-brief/pdf' },
  { key: 'opportunityBriefPptx', method: 'GET', path: '/download/opportunity-brief/pptx' },
  { key: 'regenerate', method: 'POST', path: '/regenerate' }
];

export const EXECUTIVE_BRIEF_HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
} as const;

export const EXECUTIVE_BRIEF_MESSAGES = {
  validationFailed: 'Validation failed',
  invalidJsonBody: 'Request body must be valid JSON such as {"client": "UltraTech Cement Limited"}, or empty.',
  methodNotAllowed: 'This HTTP method is not supported for the executive brief endpoint. Use the method listed in the Allow header.',
  authRequired: 'Administrator sign-in required. Send Authorization: Bearer <admin token> from an ADMIN account, then retry.',
  tokenInvalid: 'The bearer token is invalid or has expired. Sign in again to get a new administrator token, then retry.',
  adminRequired: 'This account does not have the ADMIN role. Ask an administrator to regenerate the executive brief.',
  authSecretMissing: 'AUTH_SECRET is not set on the Worker, so administrator tokens cannot be verified. Set it with wrangler secret put AUTH_SECRET and redeploy.',
  r2Missing: 'The R2 binding OBJECTS is not configured on the Worker. Add the bucket binding in wrangler.jsonc and redeploy before regenerating.',
  blocked: 'Export blocked: the financial reconciliation does not match the certified figures. Review the certified constants before exporting.',
  regenerated: 'Executive Brief regenerated successfully from certified Module 1-4 outputs',
  clientNotCertified: (client: string, certifiedName: string): string =>
    `No certified executive brief exists for "${client}". Only "${certifiedName}" is served. Check the client name and retry.`,
  renderFailed: (label: string, requestId: string): string =>
    `The executive brief ${label} could not be rendered. Retry the request; if it fails again, quote request ID ${requestId} to support.`,
  publishFailed: (requestId: string): string =>
    `The regenerated artifacts could not be stored in R2. Check the OBJECTS binding and retry; quote request ID ${requestId} if it repeats.`
} as const;

export const EXECUTIVE_BRIEF_HEADER_NAMES = {
  AUTHORIZATION: 'Authorization',
  ALLOW: 'Allow',
  CACHE_CONTROL: 'Cache-Control',
  CONTENT_DISPOSITION: 'Content-Disposition',
  CONTENT_LENGTH: 'Content-Length',
  CONTENT_TYPE: 'Content-Type',
  EXPOSE_HEADERS: 'Access-Control-Expose-Headers'
} as const;
export const EXECUTIVE_BRIEF_ATTACHMENT_PREFIX = 'attachment; filename="';
export const EXECUTIVE_BRIEF_ATTACHMENT_SUFFIX = '"';
