import { CLOUDFLARE_API_PREFIX } from './constants/cloudflare';
import { AI_LOG_MESSAGES, EXTRACTION_STATUS, CLASSIFICATION_STATUS } from './constants/ai';
import { AI_EXTRACT_JSON_MAX_BYTES } from './constants/validation';
import type { AiCategorizationItem } from './types/ai';
import type { CloudflareD1Database, CloudflareEnvironment } from './types/cloudflare';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import logger from './utils/logger';
import { geminiService } from './services/geminiService';
import { aiCategorizationService } from './services/aiCategorizationService';
import { aiReportService } from './services/aiReportService';
import { aiAnomalyService } from './services/aiAnomalyService';
import { lookupTaxonomyRecordFromD1 } from './workerD1';
import { jsonResponse, readJson, RequestBodyTooLargeError, RequestJsonParseError } from './workerHttp';

const requestJsonFailureResponse = (request: Request, error: unknown): Response | null => {
  const tooLarge = error instanceof RequestBodyTooLargeError;
  if (!(error instanceof RequestJsonParseError) && !tooLarge) return null;
  const message = tooLarge ? error.message : D1_ROUTE_MESSAGES.invalidJsonBody;
  logger.warn(tooLarge ? AI_LOG_MESSAGES.requestBodyTooLarge : AI_LOG_MESSAGES.invalidJsonBody, {
    requestId: request.headers.get('x-request-id') || undefined,
    method: request.method,
    path: new URL(request.url).pathname,
    statusCode: tooLarge ? 413 : 400,
    maxBytes: tooLarge ? error.maxBytes : undefined
  }, error instanceof RequestJsonParseError ? error.underlyingError : error);
  return jsonResponse({
    success: false,
    message: tooLarge ? message : D1_ROUTE_MESSAGES.validationFailed,
    errors: [{ path: 'body', message }]
  }, tooLarge ? 413 : 400, request);
};

const logAiFallback = (request: Request, url: URL, startedAt: number, error: unknown): void => {
  logger.error(AI_LOG_MESSAGES.fallbackReturned, {
    requestId: request.headers.get('x-request-id') || undefined,
    method: request.method,
    path: url.pathname,
    operation: url.pathname.split('/').pop(),
    statusCode: 500,
    durationMs: Date.now() - startedAt,
    fallbackApplied: true
  }, error);
};
export const handleAiRoute = async (request: Request, url: URL, environment: CloudflareEnvironment): Promise<Response> => {
  geminiService.configureForEnvironment(environment);
  aiCategorizationService.configureTaxonomyLookup(
    environment.DB ? (query) => lookupTaxonomyRecordFromD1(environment.DB as CloudflareD1Database, query) : undefined
  );
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
      const body = await readJson(request, AI_EXTRACT_JSON_MAX_BYTES);
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
      const invalidBodyResponse = requestJsonFailureResponse(request, err);
      if (invalidBodyResponse) return invalidBodyResponse;
      logAiFallback(request, url, start, err);
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
      const invalidBodyResponse = requestJsonFailureResponse(request, err);
      if (invalidBodyResponse) return invalidBodyResponse;
      logAiFallback(request, url, start, err);
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
      const invalidBodyResponse = requestJsonFailureResponse(request, err);
      if (invalidBodyResponse) return invalidBodyResponse;
      logAiFallback(request, url, start, err);
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
      const invalidBodyResponse = requestJsonFailureResponse(request, err);
      if (invalidBodyResponse) return invalidBodyResponse;
      logAiFallback(request, url, start, err);
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
