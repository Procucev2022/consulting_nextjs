import { AUTH_MESSAGES } from '../constants/auth';
import { tenantScopeSelectionSchema } from '../constants/validation';
import type { CloudflareEnvironment } from '../types/cloudflare';
import type { WorkerAuthIdentity } from '../types/auth';
import type { TenantAccessDecision } from '../types/tenantAccess';
import { authenticateWorkerUser } from '../workerAuth';
import logger from '../utils/logger';
import { readJson } from '../workerHttp';

const INTERNAL_TENANT_HEADER = 'x-resolved-tenant-id';
const TENANT_KEYS = ['tenantId', 'tenant_id', 'buyerId', 'buyer_id'] as const;

const isSelfAuthorizedRoute = (path: string): boolean =>
  path.startsWith('/api/auth/') || path.startsWith('/api/admin/') ||
  path.startsWith('/api/upgrade/') || path.startsWith('/api/subscription/');

const isPublicRoute = (path: string): boolean =>
  path === '/api/health' || path === '/api/telemetry/client-error';

const isAdminOnlyRoute = (request: Request, path: string): boolean =>
  path.startsWith('/api/db/') || (path === '/api/tenant' && request.method === 'PUT');

const isTenantIndependentRoute = (path: string): boolean => path.startsWith('/api/db/');

const collectUrlAndHeaderSelections = (request: Request, url: URL): unknown[] => {
  const supplied: unknown[] = [];
  for (const key of TENANT_KEYS) {
    const value = url.searchParams.get(key);
    if (value !== null) supplied.push({ [key]: value });
    const headerValue = key === 'tenantId' || key === 'tenant_id'
      ? request.headers.get('x-tenant-id')
      : request.headers.get('x-buyer-id');
    if (headerValue) supplied.push({ [key]: headerValue });
  }
  return supplied;
};

const readBodyTenantSelection = async (request: Request): Promise<unknown | undefined> => {
  if (request.method === 'GET' || !request.headers.get('content-type')?.includes('application/json')) return undefined;
  try {
    const body: unknown = await readJson(request.clone());
    if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
    const selection = Object.fromEntries(TENANT_KEYS
      .filter((key) => Object.hasOwn(body, key))
      .map((key) => [key, (body as Record<string, unknown>)[key]]));
    return Object.keys(selection).length ? selection : undefined;
  } catch {
    // Invalid JSON remains the route parser's responsibility so it returns its standard 400 response.
    return undefined;
  }
};

const resolveTenantSelection = (supplied: unknown[]): { tenantId?: string; invalid: boolean } => {
  const parsed = supplied.map((selection) => tenantScopeSelectionSchema.safeParse(selection));
  const tenantIds: string[] = [];
  for (const selection of parsed) {
    if (!selection.success) return { invalid: true };
    for (const key of TENANT_KEYS) {
      const tenantId = selection.data[key];
      if (tenantId) tenantIds.push(tenantId);
    }
  }
  const distinct = [...new Set(tenantIds)];
  return distinct.length > 1
    ? { invalid: true }
    : { tenantId: distinct[0], invalid: false };
};

const getSelectedTenantId = async (request: Request, url: URL): Promise<{ tenantId?: string; invalid: boolean }> => {
  const supplied = collectUrlAndHeaderSelections(request, url);
  const bodySelection = await readBodyTenantSelection(request);
  if (bodySelection !== undefined) supplied.push(bodySelection);
  return resolveTenantSelection(supplied);
};

const shouldBypassTenantAuthorization = (path: string): boolean =>
  !path.startsWith('/api/') || isPublicRoute(path) || isSelfAuthorizedRoute(path);

const resolveUserTenantScope = (
  request: Request,
  user: WorkerAuthIdentity,
  selectedTenantId: string | undefined,
  path: string
): { tenantId?: string; error?: TenantAccessDecision } => {
  if (!user.tenantId) {
    if (isTenantIndependentRoute(path)) return {};
    return { error: { status: 403, message: AUTH_MESSAGES.TENANT_ASSIGNMENT_PENDING } };
  }

  if (selectedTenantId && selectedTenantId !== user.tenantId) {
    logger.warn('Rejected a tenant scope that does not match the authenticated user assignment', {
      requestId: request.headers.get('x-request-id') || undefined,
      userId: user.id,
      assignedTenantId: user.tenantId,
      requestedTenantId: selectedTenantId,
      path
    });
    return { error: { status: 403, message: AUTH_MESSAGES.TENANT_SCOPE_FORBIDDEN } };
  }

  const tenantId = user.tenantId;
  return { tenantId };
};

const buildAuthorizedTenantContext = (
  request: Request,
  environment: CloudflareEnvironment,
  user: WorkerAuthIdentity,
  tenantId?: string
): TenantAccessDecision => {
  const headers = new Headers(request.headers);
  headers.delete('x-resolved-tenant-id');
  if (tenantId) {
    headers.set('x-tenant-id', tenantId);
    headers.set('x-buyer-id', tenantId);
    headers.set(INTERNAL_TENANT_HEADER, tenantId);
  }
  return {
    request: new Request(request, { headers }),
    environment: {
      ...environment,
      REQUEST_TENANT_ID: tenantId,
      REQUEST_USER_ID: user.id,
      REQUEST_USER_ROLE: user.role
    }
  };
};

export const authorizeTenantRequest = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<TenantAccessDecision> => {
  const url = new URL(request.url);
  if (shouldBypassTenantAuthorization(url.pathname)) return { request, environment };

  const authorization = await authenticateWorkerUser(
    request, environment, isAdminOnlyRoute(request, url.pathname)
  );
  if (!authorization.user) return {
    status: authorization.status,
    message: authorization.message || AUTH_MESSAGES.UNAUTHORIZED
  };

  const selected = await getSelectedTenantId(request, url);
  if (selected.invalid) return { status: 400, message: AUTH_MESSAGES.TENANT_SCOPE_INVALID };
  const tenantScope = resolveUserTenantScope(request, authorization.user, selected.tenantId, url.pathname);
  if (tenantScope.error) return tenantScope.error;
  if (tenantScope.tenantId && !authorization.user.tenantActive) {
    return { status: 403, message: AUTH_MESSAGES.TENANT_UNAVAILABLE };
  }
  return buildAuthorizedTenantContext(request, environment, authorization.user, tenantScope.tenantId);
};
