import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_DEFAULT_FRONTEND_URL,
  CLOUDFLARE_HEALTH_PATH,
  CLOUDFLARE_MAX_AGE_SECONDS,
  CLOUDFLARE_SERVICE_NAME
} from './constants/cloudflare';
import type { CloudflareEnvironment, CloudflareExecutionContext } from './types/cloudflare';
import { handleAuthRoute } from './workerAuth';
import {
  mockTenant,
  initialIngestionQueue,
  initialValidationRecords,
  spendCategoriesData,
  categoryYearWiseDetails,
  vendorYearWiseDetails,
  vendorVolatilityRankings,
  initialSavingsOpportunities,
  conversionFunnelStages
} from './data/mockData';
import { yahooFinanceFXRates } from './constants/currency';

const workerState = {
  tenant: { ...mockTenant },
  ingestionQueue: [...initialIngestionQueue],
  validationRecords: [...initialValidationRecords],
  categories: [...spendCategoriesData],
  categoryDetails: [...categoryYearWiseDetails],
  vendorDetails: [...vendorYearWiseDetails],
  vendorRankings: [...vendorVolatilityRankings],
  opportunities: [...initialSavingsOpportunities],
  funnelStages: [...conversionFunnelStages]
};

const getCorsHeaders = (request: Request): Headers => {
  const headers = new Headers({
    'Access-Control-Allow-Methods': CLOUDFLARE_ALLOWED_METHODS,
    'Access-Control-Allow-Headers': CLOUDFLARE_ALLOWED_HEADERS,
    'Access-Control-Max-Age': CLOUDFLARE_MAX_AGE_SECONDS,
    Vary: 'Origin'
  });
  const origin = request.headers.get('Origin');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
};

const withCors = (response: Response, request: Request): Response => {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);
  corsHeaders.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
};

const jsonResponse = (body: Record<string, unknown>, status: number, request: Request): Response => {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }),
    request
  );
};

const getFrontendOrigin = (environment: CloudflareEnvironment): string => {
  return environment.FRONTEND_URL || CLOUDFLARE_DEFAULT_FRONTEND_URL;
};

const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const getTenant = async (environment: CloudflareEnvironment): Promise<Record<string, unknown>> => {
  if (!environment.DB) return workerState.tenant as unknown as Record<string, unknown>;
  const tenant = await environment.DB.prepare('SELECT * FROM TenantMaster LIMIT 1').first<Record<string, unknown>>();
  return tenant || workerState.tenant as unknown as Record<string, unknown>;
};

const apiData = (data: unknown, request: Request, extra: Record<string, unknown> = {}): Response => {
  return jsonResponse({ success: true, data, timestamp: new Date().toISOString(), ...extra }, 200, request);
};


const getIngestionData = (url: URL): { data: unknown } => {
  const tenantId = url.searchParams.get('buyerId') || url.searchParams.get('tenantId');
  const queue = tenantId
    ? workerState.ingestionQueue.filter((item) => item.tenant_id === tenantId)
    : workerState.ingestionQueue;
  return { data: { queue, validationRecords: workerState.validationRecords, summary: {
    totalFiles: queue.length,
    totalRecords: workerState.validationRecords.length,
    cleanCount: workerState.validationRecords.filter((item) => item.issue_flag === 'Passed Clean').length,
    anomaliesCount: workerState.validationRecords.filter((item) => item.issue_flag !== 'Passed Clean').length
  } } };
};

const remediateIngestion = (): { data: unknown } => {
  const records = workerState.validationRecords.map((record) => ({
    ...record,
    resolved: true,
    issue_flag: 'Passed Clean' as const,
    action_status: 'Ready' as const
  }));
  workerState.validationRecords = records;
  return { data: { updatedCount: records.length, records } };
};

const addIngestion = async (request: Request): Promise<{ data: unknown }> => {
  const body = await readJson(request);
  const item = {
    ...body,
    doc_id: body.doc_id || `DOC-INGEST-${Date.now()}`,
    tenant_id: body.tenant_id || workerState.tenant.tenant_id
  };
  workerState.ingestionQueue = [...workerState.ingestionQueue, item] as typeof workerState.ingestionQueue;
  return { data: workerState.ingestionQueue };
};

const updateIngestion = async (request: Request): Promise<{ data: unknown; status?: number }> => {
  const body = await readJson(request);
  const recordId = String(body.record_id || '');
  const updated = workerState.validationRecords.find((record) => record.record_id === recordId);
  if (!updated) return { data: { success: false, message: 'Validation record not found.' }, status: 404 };
  Object.assign(updated, body);
  return { data: updated };
};

const deleteIngestion = (url: URL): { data: unknown } => {
  workerState.ingestionQueue = url.pathname.includes('/document/')
    ? workerState.ingestionQueue.filter((item) => item.doc_id !== url.pathname.split('/').pop())
    : [];
  return { data: workerState.ingestionQueue };
};

const handleIngestion = async (request: Request, url: URL): Promise<{ data: unknown; status?: number }> => {
  if (request.method === 'GET') return getIngestionData(url);
  if (request.method === 'POST' && url.pathname.endsWith('/remediate')) return remediateIngestion();
  if (request.method === 'POST') return addIngestion(request);
  if (request.method === 'PATCH') return updateIngestion(request);
  if (request.method === 'DELETE') return deleteIngestion(url);
  return { data: { success: false, message: 'Unsupported ingestion operation.' }, status: 405 };
};

const handleConversion = async (request: Request): Promise<Record<string, unknown>> => {
  if (request.method === 'GET') return { data: workerState.funnelStages };
  const body = await readJson(request);
  const annualSpendCr = Number(body.annualSpendCr || 428.5);
  const savingsRate = Number(body.savingsRate || 9.4);
  const saasFeeRate = Number(body.saasFeeRate || 0.85);
  const grossSavingsCr = annualSpendCr * savingsRate / 100;
  const platformFeeCr = annualSpendCr * saasFeeRate / 100;
  return {
    data: {
      annualSpendCr,
      savingsRate,
      saasFeeRate,
      grossSavingsCr,
      platformFeeCr,
      netClientBenefitCr: grossSavingsCr - platformFeeCr,
      roiMultiple: grossSavingsCr / (platformFeeCr || 1)
    }
  };
};

const handleDatabase = (request: Request, environment: CloudflareEnvironment): Response => {
  const path = new URL(request.url).pathname;
  if (path.endsWith('/status')) {
    return apiData({
      isConnected: Boolean(environment.DB),
      provider: 'Cloudflare D1',
      serverTime: new Date().toISOString(),
      tablesCount: 1,
      totalRecords: 0
    }, request);
  }
  if (path.endsWith('/test-connection')) {
    return apiData({ success: Boolean(environment.DB), provider: 'Cloudflare D1' }, request);
  }
  return apiData({
    metrics: { totalQueries: 0, slowQueries: 0, cacheHitRatio: 0, averageDurationMs: 0, recentAudits: [] },
    cacheSize: 0
  }, request);
};

const handleIngestionRoute = async (request: Request, url: URL): Promise<Response> => {
  const result = await handleIngestion(request, url);
  return result.status
    ? jsonResponse(result.data as Record<string, unknown>, result.status, request)
    : apiData(result.data, request);
};

const handleStaticDataRoute = (request: Request, url: URL): Response | null => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/categories`) {
    return apiData({ categories: workerState.categories, categoryDetails: workerState.categoryDetails }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/vendors`) {
    return apiData({ vendorRankings: workerState.vendorRankings, vendorDetails: workerState.vendorDetails }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/savings`) {
    const total = workerState.opportunities.reduce((sum, item) => sum + (item.est_savings_inr_cr || 0), 0);
    return apiData({ opportunities: workerState.opportunities, totalPotentialSavingsCr: total }, request);
  }
  return null;
};

const handleFinancialRoute = async (request: Request, url: URL): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/conversion`) {
    const result = await handleConversion(request);
    return apiData(result.data, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/currency`) {
    const from = url.searchParams.get('from');
    const amount = Number(url.searchParams.get('amount') || 0);
    const rate = from ? yahooFinanceFXRates[from]?.currentRate || 1 : 1;
    const data = from
      ? { amount, fromCurrency: from, amountINR: amount * rate, exchangeRate: rate }
      : yahooFinanceFXRates;
    return apiData(data, request);
  }
  return null;
};

const handleReportRoute = (request: Request, url: URL): Response | null => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/report`) {
    return apiData({
      tenant: workerState.tenant,
      executiveSummary: {
        totalSpendEvaluatedCr: workerState.tenant.total_spend_evaluated_inr || 0,
        totalIdentifiedSavingsCr: 0,
        totalLineItemsAudited: workerState.validationRecords.length
      },
      categoryHighlights: workerState.categoryDetails,
      topActionableOpportunities: workerState.opportunities
    }, request);
  }
  return null;
};

const handleDataRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/ingestion`)) return handleIngestionRoute(request, url);
  const staticResponse = handleStaticDataRoute(request, url);
  if (staticResponse) return staticResponse;
  const financialResponse = await handleFinancialRoute(request, url);
  if (financialResponse) return financialResponse;
  const reportResponse = handleReportRoute(request, url);
  if (reportResponse) return reportResponse;
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/db/`)) return handleDatabase(request, environment);
  return jsonResponse({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404, request);
};

const handleApiRequest = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
  const url = new URL(request.url);
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME, database: Boolean(environment.DB) }, 200, request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/tenant` && request.method === 'GET') {
    return apiData(await getTenant(environment), request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/tenant` && request.method === 'PUT') {
    const body = await readJson(request);
    Object.assign(workerState.tenant, body);
    return apiData(workerState.tenant, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/auth/`)) {
    const authResult = await handleAuthRoute(request, environment, url);
    return jsonResponse(authResult.body, authResult.status, request);
  }
  return handleDataRoute(request, environment, url);
};

export const fetch = async (
  request: Request,
  environment: CloudflareEnvironment,
  executionContext: CloudflareExecutionContext
): Promise<Response> => {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    const response = withCors(new Response(null, { status: 204 }), request);
    response.headers.set(
      'Access-Control-Allow-Origin',
      environment.FRONTEND_URL || request.headers.get('Origin') || getFrontendOrigin(environment)
    );
    return response;
  }

  if (url.pathname === '/') {
    return jsonResponse({
      message: 'Consulting & Procurement Intelligence Platform - Cloudflare Worker API',
      status: 'online',
      version: '1.0.1-deployment-test',
      docs: `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`
    }, 200, request);
  }

  if (url.pathname.startsWith(CLOUDFLARE_API_PREFIX)) {
    return handleApiRequest(request, environment);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME }, 200, request);
  }

  executionContext.passThroughOnException();
  return jsonResponse({ success: false, message: 'Endpoint not found.' }, 404, request);
};

export default { fetch };