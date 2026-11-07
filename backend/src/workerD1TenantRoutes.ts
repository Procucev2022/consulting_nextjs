import { CLOUDFLARE_API_PREFIX } from './constants/cloudflare';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import { tenantUpdateSchema } from './constants/validation';
import type { CloudflareEnvironment } from './types/cloudflare';
import { getTenantFromD1, requireD1Binding } from './workerD1';
import logger from './utils/logger';
import { apiData, jsonResponse, readJson } from './workerHttp';

const getTenant = async (environment: CloudflareEnvironment): Promise<Record<string, unknown>> => {
  requireD1Binding(environment.DB);
  return { ...await getTenantFromD1(environment.DB, environment.REQUEST_TENANT_ID) };
};

export const handleTenantRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  if (url.pathname !== `${CLOUDFLARE_API_PREFIX}/tenant`) return null;
  if (request.method === 'GET') return apiData(await getTenant(environment), request);
  if (request.method !== 'PUT') return null;

  const database = requireD1Binding(environment.DB);
  const body = await readJson(request);
  const tenantId = environment.REQUEST_TENANT_ID;
  if (!tenantId) return jsonResponse({ success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired }, 403, request);
  const validation = tenantUpdateSchema.safeParse(body);
  if (!validation.success) {
    const requestId = request.headers.get('x-request-id');
    logger.warn(D1_ROUTE_MESSAGES.validationFailed, {
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      tenantId,
      operation: 'tenant-update',
      errors: validation.error.issues
    });
    return jsonResponse({
      success: false,
      message: D1_ROUTE_MESSAGES.validationFailed,
      errors: validation.error.issues
    }, 400, request);
  }
  const updates = validation.data;
  const updatedTenant = await database.prepare(`
    UPDATE TenantMaster
    SET enterprise_name = COALESCE(?, enterprise_name), region = COALESCE(?, region), base_currency = COALESCE(?, base_currency),
        total_spend_evaluated = COALESCE(?, total_spend_evaluated), total_spend_evaluated_inr = COALESCE(?, total_spend_evaluated_inr),
        status = COALESCE(?, status), major_sector = COALESCE(?, major_sector), minor_sector = COALESCE(?, minor_sector),
        updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = ?
    RETURNING *
  `).bind(
    updates.enterprise_name ?? null,
    updates.region ?? null,
    updates.base_currency ?? null,
    updates.total_spend_evaluated ?? null,
    updates.total_spend_evaluated_inr ?? null,
    updates.status ?? null,
    updates.major_sector ?? null,
    updates.minor_sector ?? null,
    tenantId
  ).first<Record<string, unknown>>();
  if (!updatedTenant) {
    const message = D1_ROUTE_MESSAGES.tenantUnavailable(tenantId);
    logger.warn(message, {
      requestId: request.headers.get('x-request-id') || undefined,
      method: request.method,
      path: new URL(request.url).pathname,
      tenantId,
      operation: 'tenant-update',
      affectedRows: 0
    });
    return jsonResponse({ success: false, message }, 404, request);
  }
  return apiData(updatedTenant, request);
};
