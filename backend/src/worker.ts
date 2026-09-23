import {
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_HEALTH_PATH,
  CLOUDFLARE_MAX_AGE_SECONDS,
  CLOUDFLARE_SERVICE_NAME
} from './constants/cloudflare';
import type { CloudflareEnvironment, CloudflareExecutionContext } from './types/cloudflare';
import { handleAuthRoute, handleAdminRoute } from './workerAuth';
import { geminiService } from './services/geminiService';
import { aiCategorizationService } from './services/aiCategorizationService';
import { aiReportService } from './services/aiReportService';
import { aiAnomalyService } from './services/aiAnomalyService';
import { lookupTaxonomy, searchTaxonomy, getAllTaxonomyRecords } from './services/taxonomyService';
import { EXTRACTION_STATUS, CLASSIFICATION_STATUS } from './constants/ai';
import type { AiCategorizationItem } from './types/ai';

const getCorsHeaders = (request: Request): Headers => {
  const origin = request.headers.get('Origin') || '*';
  const reqHeaders = request.headers.get('Access-Control-Request-Headers') || CLOUDFLARE_ALLOWED_HEADERS;
  const headers = new Headers({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': CLOUDFLARE_ALLOWED_METHODS,
    'Access-Control-Allow-Headers': reqHeaders,
    'Access-Control-Max-Age': CLOUDFLARE_MAX_AGE_SECONDS,
    Vary: 'Origin'
  });
  if (origin !== '*') {
    headers.set('Access-Control-Allow-Credentials', 'true');
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

const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const getTenant = async (environment: CloudflareEnvironment): Promise<Record<string, unknown>> => {
  if (environment.DB) {
    try {
      const tenant = await environment.DB.prepare('SELECT * FROM TenantMaster LIMIT 1').first<Record<string, unknown>>();
      if (tenant) return tenant;
    } catch {
      // fallback to baseline tenant
    }
  }
  return {
    tenant_id: 'TNT-GLOBAL-8902',
    enterprise_name: 'Enterprise Client',
    region: 'GLOBAL',
    base_currency: 'INR',
    status: 'ACTIVE',
    total_spend_evaluated: 0,
    total_spend_evaluated_inr: 0,
    major_sector: 'Direct & Indirect Procurement',
    minor_sector: 'Strategic Sourcing'
  };
};

const apiData = (data: unknown, request: Request, extra: Record<string, unknown> = {}): Response => {
  return jsonResponse({ success: true, data, timestamp: new Date().toISOString(), ...extra }, 200, request);
};

const getIngestionData = async (url: URL, environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  if (environment.DB) {
    try {
      const tenantId = url.searchParams.get('buyerId') || url.searchParams.get('tenantId');
      const queueStmt = tenantId
        ? environment.DB.prepare('SELECT * FROM RawDocumentIngestion WHERE tenant_id = ? ORDER BY uploaded_at DESC').bind(tenantId)
        : environment.DB.prepare('SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC');
      const queueRes = await queueStmt.all<Record<string, unknown>>();
      const queue = (queueRes.results || []).map((row: any) => ({
        ...row,
        detected_currencies: typeof row.detected_currencies === 'string'
          ? (() => { try { return JSON.parse(row.detected_currencies); } catch { return ['INR']; } })()
          : (row.detected_currencies || ['INR'])
      }));

      const valRes = await environment.DB.prepare('SELECT * FROM ValidationPreCheckRecord ORDER BY created_at DESC LIMIT 500').all<Record<string, unknown>>();
      const validationRecords = (valRes.results || []).map((row: any) => ({
        ...row,
        resolved: Boolean(row.resolved)
      }));

      return {
        data: {
          queue,
          validationRecords,
          summary: {
            totalFiles: queue.length,
            totalRecords: validationRecords.length,
            cleanCount: validationRecords.filter((item: any) => item.issue_flag === 'Passed Clean').length,
            anomaliesCount: validationRecords.filter((item: any) => item.issue_flag !== 'Passed Clean').length
          }
        }
      };
    } catch {
      // fallback
    }
  }
  return {
    data: {
      queue: [],
      validationRecords: [],
      summary: { totalFiles: 0, totalRecords: 0, cleanCount: 0, anomaliesCount: 0 }
    }
  };
};

const remediateIngestion = async (environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  if (environment.DB) {
    try {
      await environment.DB.prepare("UPDATE ValidationPreCheckRecord SET resolved = 1, issue_flag = 'Passed Clean', action_status = 'Ready'").run();
      const records = await environment.DB.prepare('SELECT * FROM ValidationPreCheckRecord ORDER BY created_at DESC LIMIT 500').all();
      return { data: { updatedCount: records.results?.length || 0, records: records.results || [] } };
    } catch {
      // ignore
    }
  }
  return { data: { updatedCount: 0, records: [] } };
};

const addIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  const body = await readJson(request);
  const docId = String(body.doc_id || `DOC-INGEST-${Date.now()}`);
  const tenantId = String(body.tenant_id || 'TNT-GLOBAL-8902');
  const fileName = String(body.file_name || 'dataset.xlsx');
  const fileType = String(body.file_type || 'XLSX');
  const fileSizeMb = Number(body.file_size_mb || 1.0);
  const recordsCount = Number(body.records_count || 0);
  const convertedInrCrores = Number(body.converted_inr_crores || 0);
  const detectedCurrencies = JSON.stringify(Array.isArray(body.detected_currencies) ? body.detected_currencies : ['INR']);

  if (environment.DB) {
    try {
      await environment.DB.prepare(`
        INSERT INTO RawDocumentIngestion (
          doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count, converted_inr_crores, detected_currencies
        ) VALUES (?, ?, ?, ?, ?, 'Completed', 100, ?, ?, ?)
      `).bind(docId, tenantId, fileName, fileType, fileSizeMb, recordsCount, convertedInrCrores, detectedCurrencies).run();
      const res = await environment.DB.prepare('SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC').all();
      return { data: res.results || [] };
    } catch {
      // ignore
    }
  }
  return { data: [] };
};

const uploadIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  const body = await readJson(request);
  const fileName = String(body.fileName || 'dataset.xlsx');
  const effectiveTenantId = String(
    body.tenant_id ||
    body.buyer_id ||
    request.headers.get('x-buyer-id') ||
    request.headers.get('x-tenant-id') ||
    'TNT-GLOBAL-8902'
  );
  const fileSizeMb = Number(body.fileSizeMb || 1.0);
  const docId = `DOC-INGEST-${Date.now()}`;
  const fileType = String(body.fileType || 'XLSX');
  const recordsCount = Number(body.recordsCount || 0);
  const convertedInrCrores = Number(body.convertedInrCrores || 0);
  const detectedCurrencies = JSON.stringify(Array.isArray(body.detectedCurrencies) ? body.detectedCurrencies : ['INR']);

  if (environment.DB) {
    try {
      await environment.DB.prepare(`
        INSERT INTO RawDocumentIngestion (
          doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count, converted_inr_crores, detected_currencies
        ) VALUES (?, ?, ?, ?, ?, 'Completed', 100, ?, ?, ?)
      `).bind(docId, effectiveTenantId, fileName, fileType, fileSizeMb, recordsCount, convertedInrCrores, detectedCurrencies).run();
    } catch {
      // ignore
    }
  }

  const queueRes = environment.DB
    ? await environment.DB.prepare('SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC').all<Record<string, unknown>>()
    : { results: [] };

  const parsedQueue = (queueRes.results || []).map((row: any) => ({
    ...row,
    detected_currencies: typeof row.detected_currencies === 'string'
      ? (() => { try { return JSON.parse(row.detected_currencies); } catch { return ['INR']; } })()
      : (Array.isArray(row.detected_currencies) ? row.detected_currencies : ['INR'])
  }));

  const objectMeta = {
    key: `raw-datasets/${Date.now()}_${fileName}`,
    size: Math.round(fileSizeMb * 1024 * 1024),
    uploadedAt: new Date().toISOString(),
    bucket: 'consulting-doc'
  };

  return {
    data: {
      objectMeta,
      ingestionQueue: parsedQueue
    }
  };
};

const updateIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const body = await readJson(request);
  const recordId = String(body.record_id || '');
  if (!recordId) return { data: { success: false, message: 'Missing record_id.' }, status: 400 };

  if (environment.DB) {
    try {
      await environment.DB.prepare(`
        UPDATE ValidationPreCheckRecord
        SET issue_flag = COALESCE(?, issue_flag),
            action_status = COALESCE(?, action_status),
            resolved = COALESCE(?, resolved)
        WHERE record_id = ?
      `).bind(body.issue_flag ?? null, body.action_status ?? null, body.resolved !== undefined ? (body.resolved ? 1 : 0) : null, recordId).run();
      const updated = await environment.DB.prepare('SELECT * FROM ValidationPreCheckRecord WHERE record_id = ?').first();
      return { data: updated || {} };
    } catch {
      // ignore
    }
  }
  return { data: { success: false, message: 'Validation record not found.' }, status: 404 };
};

const deleteIngestion = async (url: URL, environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  const docId = url.pathname.includes('/document/') ? url.pathname.split('/').pop() : null;
  if (environment.DB) {
    try {
      if (docId) {
        await environment.DB.prepare('DELETE FROM RawDocumentIngestion WHERE doc_id = ?').bind(docId).run();
      } else {
        await environment.DB.prepare('DELETE FROM RawDocumentIngestion').run();
      }
      const queue = await environment.DB.prepare('SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC').all();
      return { data: queue.results || [] };
    } catch {
      // ignore
    }
  }
  return { data: [] };
};

const handleIngestion = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<{ data: unknown; status?: number }> => {
  if (request.method === 'GET') return getIngestionData(url, environment);
  if (request.method === 'POST' && url.pathname.endsWith('/upload')) return uploadIngestion(request, environment);
  if (request.method === 'POST' && url.pathname.endsWith('/remediate')) return remediateIngestion(environment);
  if (request.method === 'POST') return addIngestion(request, environment);
  if (request.method === 'PATCH') return updateIngestion(request, environment);
  if (request.method === 'DELETE') return deleteIngestion(url, environment);
  return { data: { success: false, message: 'Unsupported ingestion operation.' }, status: 405 };
};

const handleConversion = async (request: Request, environment: CloudflareEnvironment): Promise<Record<string, unknown>> => {
  if (request.method === 'GET') {
    if (environment.DB) {
      try {
        const stages = await environment.DB.prepare('SELECT * FROM ConversionFunnelPhase').all();
        if (stages.results && stages.results.length > 0) return { data: stages.results };
      } catch {
        // ignore
      }
    }
    return { data: [] };
  }
  const body = await readJson(request);
  const annualSpendCr = Number(body.annualSpendCr || 0);
  const savingsRate = Number(body.savingsRate || 0);
  const saasFeeRate = Number(body.saasFeeRate || 0);
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
      roiMultiple: platformFeeCr > 0 ? grossSavingsCr / platformFeeCr : 0
    }
  };
};

const handleDatabase = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
  const path = new URL(request.url).pathname;
  if (path.endsWith('/status')) {
    let totalRecords = 0;
    if (environment.DB) {
      try {
        const [t1, t2, t3, t4, t5, t6] = await Promise.all([
          environment.DB.prepare('SELECT COUNT(*) as c FROM TenantMaster').first<any>(),
          environment.DB.prepare('SELECT COUNT(*) as c FROM RawDocumentIngestion').first<any>(),
          environment.DB.prepare('SELECT COUNT(*) as c FROM ValidationPreCheckRecord').first<any>(),
          environment.DB.prepare('SELECT COUNT(*) as c FROM SpendCategorySummary').first<any>(),
          environment.DB.prepare('SELECT COUNT(*) as c FROM VendorYearDetail').first<any>(),
          environment.DB.prepare('SELECT COUNT(*) as c FROM User').first<any>()
        ]);
        totalRecords = (t1?.c || 0) + (t2?.c || 0) + (t3?.c || 0) + (t4?.c || 0) + (t5?.c || 0) + (t6?.c || 0);
      } catch {
        // ignore
      }
    }
    return apiData({
      isConnected: Boolean(environment.DB),
      provider: 'Cloudflare D1 (consulting-db)',
      serverTime: new Date().toISOString(),
      tablesCount: 11,
      totalRecords
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

const handleIngestionRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  const result = await handleIngestion(request, environment, url);
  return result.status
    ? jsonResponse(result.data as Record<string, unknown>, result.status, request)
    : apiData(result.data, request);
};

const handleStaticDataRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/categories`) {
    if (environment.DB) {
      try {
        const [cats, details] = await Promise.all([
          environment.DB.prepare('SELECT * FROM SpendCategorySummary').all(),
          environment.DB.prepare('SELECT * FROM CategoryYearDetail').all()
        ]);
        return apiData({ categories: cats.results || [], categoryDetails: details.results || [] }, request);
      } catch {
        // ignore
      }
    }
    return apiData({ categories: [], categoryDetails: [] }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/vendors`) {
    if (environment.DB) {
      try {
        const [ranks, details] = await Promise.all([
          environment.DB.prepare('SELECT * FROM VendorPriceRank').all(),
          environment.DB.prepare('SELECT * FROM VendorYearDetail').all()
        ]);
        return apiData({ vendorRankings: ranks.results || [], vendorDetails: details.results || [] }, request);
      } catch {
        // ignore
      }
    }
    return apiData({ vendorRankings: [], vendorDetails: [] }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/savings`) {
    if (environment.DB) {
      try {
        const opps = await environment.DB.prepare('SELECT * FROM SavingsOpportunity').all();
        const opportunities = opps.results || [];
        const total = opportunities.reduce((sum: number, item: any) => sum + (Number(item.est_savings_inr_cr) || 0), 0);
        return apiData({ opportunities, totalPotentialSavingsCr: total }, request);
      } catch {
        // ignore
      }
    }
    return apiData({ opportunities: [], totalPotentialSavingsCr: 0 }, request);
  }
  return null;
};

const handleFinancialRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/conversion`) {
    const result = await handleConversion(request, environment);
    return apiData(result.data, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/currency`) {
    const from = url.searchParams.get('from')?.toUpperCase().trim();
    const amount = Number(url.searchParams.get('amount') || 0);

    const baseFXRates: Record<string, { ticker: string; currencyPair: string; currencyCode: string; name: string; currentRate: number; lastUpdated: string }> = {
      USD: { ticker: 'USDINR=X', currencyPair: 'USD / INR', currencyCode: 'USD', name: 'US Dollar', currentRate: 83.9, lastUpdated: 'Live Global FX Market (API)' },
      EUR: { ticker: 'EURINR=X', currencyPair: 'EUR / INR', currencyCode: 'EUR', name: 'Euro', currentRate: 91.2, lastUpdated: 'Live Global FX Market (API)' },
      GBP: { ticker: 'GBPINR=X', currencyPair: 'GBP / INR', currencyCode: 'GBP', name: 'British Pound', currentRate: 109.5, lastUpdated: 'Live Global FX Market (API)' },
      AED: { ticker: 'AEDINR=X', currencyPair: 'AED / INR', currencyCode: 'AED', name: 'UAE Dirham', currentRate: 22.8, lastUpdated: 'Live Global FX Market (API)' },
      JPY: { ticker: 'JPYINR=X', currencyPair: 'JPY / INR', currencyCode: 'JPY', name: 'Japanese Yen', currentRate: 0.56, lastUpdated: 'Live Global FX Market (API)' },
      SGD: { ticker: 'SGDINR=X', currencyPair: 'SGD / INR', currencyCode: 'SGD', name: 'Singapore Dollar', currentRate: 64.8, lastUpdated: 'Live Global FX Market (API)' },
      INR: { ticker: 'INR=X', currencyPair: 'INR / INR', currencyCode: 'INR', name: 'Indian Rupee (Base)', currentRate: 1.0, lastUpdated: 'Base Currency' }
    };

    try {
      const openRes = await globalThis.fetch('https://open.er-api.com/v6/latest/USD', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ConsultingPlatform/1.0' }
      });
      if (openRes.ok) {
        const openData: any = await openRes.json();
        const inrPerUsd = openData.rates?.INR;
        if (inrPerUsd && typeof inrPerUsd === 'number') {
          baseFXRates.USD.currentRate = Number(inrPerUsd.toFixed(2));
          if (openData.rates?.EUR) baseFXRates.EUR.currentRate = Number((inrPerUsd / openData.rates.EUR).toFixed(2));
          if (openData.rates?.GBP) baseFXRates.GBP.currentRate = Number((inrPerUsd / openData.rates.GBP).toFixed(2));
          if (openData.rates?.AED) baseFXRates.AED.currentRate = Number((inrPerUsd / openData.rates.AED).toFixed(2));
          if (openData.rates?.JPY) baseFXRates.JPY.currentRate = Number((inrPerUsd / openData.rates.JPY).toFixed(2));
          if (openData.rates?.SGD) baseFXRates.SGD.currentRate = Number((inrPerUsd / openData.rates.SGD).toFixed(2));
        }
      }
    } catch {
      // Safe live fallback
    }

    if (from) {
      const rate = baseFXRates[from]?.currentRate || 1.0;
      return apiData({
        amount,
        fromCurrency: from,
        amountINR: Number((amount * rate).toFixed(2)),
        exchangeRate: rate
      }, request);
    }
    return apiData(baseFXRates, request);
  }
  return null;
};

const handleReportRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/report`) {
    const tenant: any = await getTenant(environment);
    let totalSpendEvaluatedCr = 0;
    let totalLineItemsAudited = 0;
    let categoryHighlights: any[] = [];
    let topActionableOpportunities: any[] = [];

    if (environment.DB) {
      try {
        const [docSpend, recordsCount, catDetails, opps] = await Promise.all([
          environment.DB.prepare('SELECT SUM(converted_inr_crores) as totalSpend FROM RawDocumentIngestion').first<any>(),
          environment.DB.prepare('SELECT COUNT(*) as cnt FROM ValidationPreCheckRecord').first<any>(),
          environment.DB.prepare('SELECT * FROM CategoryYearDetail').all(),
          environment.DB.prepare('SELECT * FROM SavingsOpportunity').all()
        ]);
        totalSpendEvaluatedCr = docSpend?.totalSpend || tenant.total_spend_evaluated_inr || 0;
        totalLineItemsAudited = recordsCount?.cnt || 0;
        categoryHighlights = catDetails.results || [];
        topActionableOpportunities = opps.results || [];
      } catch {
        // ignore
      }
    }

    const totalIdentifiedSavingsCr = topActionableOpportunities.reduce(
      (sum: number, item: any) => sum + (Number(item.est_savings_inr_cr) || 0),
      0
    );

    return apiData({
      tenant,
      executiveSummary: {
        totalSpendEvaluatedCr: Number(totalSpendEvaluatedCr.toFixed(2)),
        totalIdentifiedSavingsCr: Number(totalIdentifiedSavingsCr.toFixed(2)),
        totalLineItemsAudited
      },
      categoryHighlights,
      topActionableOpportunities
    }, request);
  }
  return null;
};

const handleAiRoute = async (request: Request, url: URL): Promise<Response> => {
  const start = Date.now();
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/config` && request.method === 'GET') {
    const isConfigured = geminiService.isConfigured();
    const models = geminiService.resolveModelChain();
    return jsonResponse({
      success: true,
      configured: isConfigured,
      primaryModel: models[0] || null,
      fallbackModels: models.slice(1)
    }, 200, request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/extract` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const result = await geminiService.extractLineItems({
        documentText: body.documentText as string | undefined,
        inlineData: body.inlineData as string | undefined,
        mimeType: body.mimeType as string | undefined,
        fileName: body.fileName as string | undefined
      });
      return jsonResponse({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        items: [],
        error: errorObj.message || 'Internal AI Extraction Error'
      }, 500, request);
    }
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/categorize` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const items = (Array.isArray(body.items) ? body.items : []) as AiCategorizationItem[];
      const result = await aiCategorizationService.categorizeLineItems(items);
      return jsonResponse({
        success: result.status === CLASSIFICATION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: CLASSIFICATION_STATUS.AI_FAILED,
        mappings: [],
        error: errorObj.message || 'Internal AI Categorization Error'
      }, 500, request);
    }
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/executive-summary` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const result = await aiReportService.generateExecutiveSummary({
        tenantName: body.tenantName as string | undefined,
        totalSpendInrCr: Number(body.totalSpendInrCr || 0),
        categories: (body.categories as any) || [],
        vendors: (body.vendors as any) || [],
        currency: body.currency as string | undefined
      });
      return jsonResponse({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        data: null,
        error: errorObj.message || 'Internal AI Executive Report Error'
      }, 500, request);
    }
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/analyze-anomalies` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const records = (body.records as any) || [];
      const result = await aiAnomalyService.analyzeAnomalies(records);
      return jsonResponse({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        anomalies: [],
        error: errorObj.message || 'Internal AI Anomaly Detection Error'
      }, 500, request);
    }
  }

  return jsonResponse({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404, request);
};

const handleTaxonomyRoute = (request: Request, url: URL): Response => {
  const query = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || undefined;
  const lookup = url.searchParams.get('lookup') || undefined;

  if (lookup) {
    const match = lookupTaxonomy(lookup);
    return apiData(match || null, request);
  }

  if (!query) {
    const sample = getAllTaxonomyRecords(30);
    return jsonResponse({
      success: true,
      data: sample,
      total: sample.length,
      timestamp: new Date().toISOString()
    }, 200, request);
  }

  const results = searchTaxonomy(query, category);
  return jsonResponse({
    success: true,
    data: results,
    total: results.length,
    timestamp: new Date().toISOString()
  }, 200, request);
};

const handleDataRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/ingestion`)) return handleIngestionRoute(request, environment, url);
  const staticResponse = await handleStaticDataRoute(request, environment, url);
  if (staticResponse) return staticResponse;
  const financialResponse = await handleFinancialRoute(request, environment, url);
  if (financialResponse) return financialResponse;
  const reportResponse = await handleReportRoute(request, environment, url);
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
    if (environment.DB) {
      try {
        const tenantId = String(body.tenant_id || 'TNT-GLOBAL-8902');
        await environment.DB.prepare(`
          UPDATE TenantMaster 
          SET enterprise_name = COALESCE(?, enterprise_name),
              region = COALESCE(?, region),
              base_currency = COALESCE(?, base_currency),
              status = COALESCE(?, status),
              major_sector = COALESCE(?, major_sector),
              minor_sector = COALESCE(?, minor_sector),
              updated_at = CURRENT_TIMESTAMP
          WHERE tenant_id = ?
        `).bind(
          body.enterprise_name ?? null,
          body.region ?? null,
          body.base_currency ?? null,
          body.status ?? null,
          body.major_sector ?? null,
          body.minor_sector ?? null,
          tenantId
        ).run();
      } catch {
        // ignore
      }
    }
    return apiData(await getTenant(environment), request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/auth/`)) {
    const authResult = await handleAuthRoute(request, environment, url);
    return jsonResponse(authResult.body, authResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/admin`)) {
    const adminResult = await handleAdminRoute(request, environment, url);
    return jsonResponse(adminResult.body, adminResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/ai`)) {
    return handleAiRoute(request, url);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/taxonomy`)) {
    return handleTaxonomyRoute(request, url);
  }
  return handleDataRoute(request, environment, url);
};

export const fetch = async (
  request: Request,
  environment: CloudflareEnvironment,
  executionContext: CloudflareExecutionContext
): Promise<Response> => {
  try {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }), request);
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
      return await handleApiRequest(request, environment);
    }

    if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
      return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME }, 200, request);
    }

    executionContext.passThroughOnException();
    return jsonResponse({ success: false, message: 'Endpoint not found.' }, 404, request);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ success: false, message: errorMsg }, 500, request);
  }
};

export default { fetch };