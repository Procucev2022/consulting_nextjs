import { taxonomyQuerySchema } from './constants/validation';
import { getTaxonomyFromD1, requireD1Binding } from './workerD1';
import type { CloudflareEnvironment } from './types/cloudflare';
import { jsonResponse } from './workerHttp';
import logger from './utils/logger';

export const handleTaxonomyRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  const validation = taxonomyQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  const requestId = request.headers.get('x-request-id') as string;
  if (!validation.success) {
    logger.warn('Rejected invalid taxonomy query', { requestId, errors: validation.error.issues });
    return jsonResponse({ success: false, message: 'Validation failed', errors: validation.error.issues }, 400, request);
  }
  const start = Date.now();
  const database = requireD1Binding(environment.DB);
  const { q, category, lookup, limit, offset } = validation.data;
  const data = await getTaxonomyFromD1(database, q, category, lookup, limit, offset);
  const total = Array.isArray(data) ? data.length : data ? 1 : 0;
  logger.info('Read D1 commodity catalog page', { requestId, durationMs: Date.now() - start, operation: 'SELECT', model: 'UNSPSCCommodity', affectedRows: total, cache: 'miss' });
  const response = jsonResponse({ success: true, data, total, timestamp: new Date().toISOString() }, 200, request);
  response.headers.set('x-request-id', requestId);
  return response;
};
