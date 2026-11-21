import {
  EXECUTIVE_BRIEF_ATTACHMENT_FILENAME_PATTERN,
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER,
  EXECUTIVE_OPPORTUNITY_BRIEF_DOCUMENT_HEADER,
  EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH,
  EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
  EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER
} from '../constants/app';
import { UI_STRINGS } from '../constants/uiStrings';
import { executiveBriefScopeQuerySchema, executiveOpportunityBriefResponseSchema } from '../constants/validation';
import type {
  ExecutiveBriefDownloadFormat,
  ExecutiveBriefHrefOptions,
  ExecutiveOpportunityBriefErrorDetails,
  ExecutiveOpportunityBriefErrorFormatOptions,
  ExecutiveOpportunityBriefFetchResult,
  ExecutiveOpportunityBriefReportOptions
} from '../types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch } from './apiFetch';
import { authApiClient } from './authApi';
import { frontendLogger } from './logger';

const failed = (
  statusCode: number,
  requestId: string | null,
  details: ExecutiveOpportunityBriefErrorDetails = {}
): ExecutiveOpportunityBriefFetchResult => ({
  ok: false,
  statusCode,
  requestId,
  ...(details.serverMessage ? { serverMessage: details.serverMessage } : {}),
  ...(details.reason ? { reason: details.reason } : {})
});

const readJsonRecord = async (response: Response): Promise<Record<string, unknown> | null> => {
  if (typeof response.json !== 'function') return null;
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
};

const readTrimmedField = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const readExecutiveOpportunityBriefErrorDetails = async (
  response: Response
): Promise<ExecutiveOpportunityBriefErrorDetails> => {
  const record = await readJsonRecord(response);
  if (!record) return {};
  return {
    serverMessage: readTrimmedField(record, 'message'),
    reason: readTrimmedField(record, 'reason')
  };
};

const formatReportLoadFailure = (
  statusCode: number,
  requestId: string,
  detail?: string
): string => {
  const strings = UI_STRINGS.opportunityBrief;
  if (statusCode === 0) return strings.reportUnavailableNetwork;
  if (statusCode === EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED) return strings.reportUnauthorized(requestId, detail);
  if (statusCode === EXECUTIVE_BRIEF_HTTP_STATUS.FORBIDDEN) return strings.reportForbidden(requestId, detail);
  if (statusCode === EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND) return strings.reportNotFound(requestId, detail);
  return strings.reportUnavailable(statusCode, requestId, detail);
};

const formatDownloadFailure = (
  formatLabel: string,
  statusCode: number,
  requestId: string,
  detail?: string
): string => {
  const strings = UI_STRINGS.opportunityBrief;
  if (statusCode === EXECUTIVE_BRIEF_HTTP_STATUS.UNAUTHORIZED) {
    return strings.downloadUnauthorized(formatLabel, requestId, detail);
  }
  if (statusCode === EXECUTIVE_BRIEF_HTTP_STATUS.FORBIDDEN) {
    return strings.downloadForbidden(formatLabel, requestId, detail);
  }
  if (statusCode === EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND) {
    return strings.downloadNotFound(formatLabel, requestId, detail);
  }
  return strings.downloadFailed(formatLabel, statusCode, requestId, detail);
};

export const formatExecutiveOpportunityBriefError = (
  options: ExecutiveOpportunityBriefErrorFormatOptions
): string => {
  const requestId = options.requestId ?? UI_STRINGS.opportunityBrief.requestIdNotReturned;
  if (options.formatLabel) {
    return formatDownloadFailure(options.formatLabel, options.statusCode, requestId, options.serverMessage);
  }
  return formatReportLoadFailure(options.statusCode, requestId, options.serverMessage);
};

export const resolveExecutiveBriefScopeFromSearch = (
  search: string
): { assessmentId?: string; documentId?: string; client?: string } => {
  const params = new URLSearchParams(search);
  const rawAssessmentId = params.get('assessmentId')?.trim() || undefined;
  const rawDocumentId = params.get('documentId')?.trim() || undefined;
  const rawClient = params.get('client')?.trim() || undefined;
  const parsed = executiveBriefScopeQuerySchema.safeParse({
    assessmentId: rawAssessmentId,
    documentId: rawDocumentId,
    client: rawClient
  });
  return parsed.success ? parsed.data : {};
};

export const resolveExecutiveBriefAssessmentIdFromSearch = (search: string): string | undefined =>
  resolveExecutiveBriefScopeFromSearch(search).assessmentId;

export const resolveExecutiveBriefDocumentIdFromSearch = (search: string): string | undefined =>
  resolveExecutiveBriefScopeFromSearch(search).documentId;

const buildExecutiveBriefQueryString = (options: ExecutiveBriefHrefOptions): string => {
  const client = (options.client || options.clientName)?.trim();
  const assessmentId = options.assessmentId?.trim();
  const documentId = options.documentId?.trim();

  const parsed = executiveBriefScopeQuerySchema.safeParse({
    assessmentId: assessmentId || undefined,
    documentId: documentId || undefined,
    client: client || undefined
  });

  if (!parsed.success) return '';

  const params = new URLSearchParams();
  if (parsed.data.assessmentId) params.set('assessmentId', parsed.data.assessmentId);
  if (parsed.data.documentId) params.set('documentId', parsed.data.documentId);
  if (parsed.data.client) params.set('client', parsed.data.client);

  return params.toString();
};

export const resolveExecutiveBriefHref = (
  assessmentIdOrOptions?: string | ExecutiveBriefHrefOptions,
  origin?: string
): string => {
  const options: ExecutiveBriefHrefOptions = typeof assessmentIdOrOptions === 'string'
    ? { assessmentId: assessmentIdOrOptions }
    : (assessmentIdOrOptions ?? {});

  const basePath = origin ? `${origin}${EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH}` : EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH;
  const query = buildExecutiveBriefQueryString(options);
  return query ? `${basePath}?${query}` : basePath;
};

export const resolveExecutiveBriefDownloadFilename = (
  disposition: string | null,
  format: ExecutiveBriefDownloadFormat
): string => {
  const headerValue = disposition ?? '';
  const quotedMatch = EXECUTIVE_BRIEF_ATTACHMENT_FILENAME_PATTERN.exec(headerValue)?.[1]?.trim();
  if (quotedMatch) return quotedMatch;
  const unquotedMatch = /filename=([^;]+)/iu.exec(headerValue)?.[1]?.replace(/^"|"$/gu, '').trim();
  return unquotedMatch || UI_STRINGS.opportunityBrief.downloadFilename(format);
};

export const buildExecutiveOpportunityBriefHeaders = (
  options?: string | ExecutiveOpportunityBriefReportOptions
): Record<string, string> => {
  const token = authApiClient.getStoredToken();
  const opts = typeof options === 'string' ? { assessmentId: options } : (options ?? {});
  const scopeCheck = executiveBriefScopeQuerySchema.safeParse({
    assessmentId: opts.assessmentId?.trim() || undefined,
    documentId: opts.documentId?.trim() || undefined,
    client: opts.client?.trim() || undefined
  });
  const data = scopeCheck.success ? scopeCheck.data : {};
  return {
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(data.assessmentId ? { [EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER]: data.assessmentId } : {}),
    ...(data.documentId ? { [EXECUTIVE_OPPORTUNITY_BRIEF_DOCUMENT_HEADER]: data.documentId } : {})
  };
};

const buildReportEndpoint = (options?: ExecutiveOpportunityBriefReportOptions): string => {
  const params = new URLSearchParams();
  if (options?.assessmentId) params.set('assessmentId', options.assessmentId);
  if (options?.documentId) params.set('documentId', options.documentId);
  if (options?.client) params.set('client', options.client);
  const query = params.toString();
  return `${getApiBaseUrl()}${EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT}${query ? `?${query}` : ''}`;
};

const logBriefResponseError = (
  response: Response,
  requestId: string | null,
  details: { serverMessage?: string; reason?: string }
): void => {
  const context = {
    action: 'executive-brief.report.response',
    method: 'GET',
    path: EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
    statusCode: response.status,
    requestId,
    ...(details.serverMessage ? { serverMessage: details.serverMessage } : {}),
    ...(details.reason ? { reason: details.reason } : {})
  };
  if (response.status >= EXECUTIVE_BRIEF_HTTP_STATUS.SERVER_ERROR_MIN) {
    frontendLogger.error('Executive opportunity brief endpoint returned a server failure', context);
  } else {
    frontendLogger.warn('Executive opportunity brief endpoint returned an unsuccessful response', context);
  }
};

export const fetchExecutiveOpportunityBriefReport = async (
  fetcher: typeof fetch = apiFetch,
  options?: ExecutiveOpportunityBriefReportOptions
): Promise<ExecutiveOpportunityBriefFetchResult> => {
  const endpoint = buildReportEndpoint(options);
  let response: Response;
  try {
    const headers = buildExecutiveOpportunityBriefHeaders(options);
    response = await fetcher(endpoint, { headers });
  } catch (error: unknown) {
    frontendLogger.error('Executive opportunity brief request failed before a response was received', {
      action: 'executive-brief.report.fetch',
      method: 'GET',
      path: EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
      statusCode: 0
    }, error);
    return failed(0, null);
  }
  const requestId = response.headers.get(EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER);
  if (!response.ok) {
    const errorDetails = await readExecutiveOpportunityBriefErrorDetails(response);
    logBriefResponseError(response, requestId, errorDetails);
    return failed(response.status, requestId, errorDetails);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error: unknown) {
    frontendLogger.error('Executive opportunity brief response was not valid JSON', {
      action: 'executive-brief.report.parse',
      method: 'GET',
      path: EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
      statusCode: response.status,
      requestId
    }, error);
    return failed(response.status, requestId);
  }
  const parsed = executiveOpportunityBriefResponseSchema.safeParse(payload);
  if (!parsed.success) {
    frontendLogger.error('Executive opportunity brief response did not match the expected schema', {
      action: 'executive-brief.report.validate',
      method: 'GET',
      path: EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
      statusCode: response.status,
      requestId
    }, parsed.error);
    return failed(response.status, requestId);
  }
  return { ok: true, data: parsed.data.data };
};
