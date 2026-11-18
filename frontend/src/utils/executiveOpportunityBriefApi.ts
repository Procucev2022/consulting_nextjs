import {
  EXECUTIVE_BRIEF_ATTACHMENT_FILENAME_PATTERN,
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER,
  EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH,
  EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
  EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER
} from '../constants/app';
import { UI_STRINGS } from '../constants/uiStrings';
import { executiveBriefScopeQuerySchema, executiveOpportunityBriefResponseSchema } from '../constants/validation';
import type {
  ExecutiveBriefDownloadFormat,
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

export const resolveExecutiveBriefAssessmentIdFromSearch = (search: string): string | undefined => {
  const rawAssessmentId = new URLSearchParams(search).get('assessmentId')?.trim();
  if (!rawAssessmentId) return undefined;
  const parsed = executiveBriefScopeQuerySchema.safeParse({ assessmentId: rawAssessmentId });
  return parsed.success ? parsed.data.assessmentId : undefined;
};

export const resolveExecutiveBriefHref = (assessmentId?: string, origin?: string): string => {
  const parsed = executiveBriefScopeQuerySchema.safeParse({ assessmentId: assessmentId?.trim() || undefined });
  const basePath = origin ? `${origin}${EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH}` : EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH;
  const validatedId = parsed.success ? parsed.data.assessmentId : undefined;
  return validatedId ? `${basePath}?assessmentId=${encodeURIComponent(validatedId)}` : basePath;
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
  assessmentId?: string
): Record<string, string> => {
  const token = authApiClient.getStoredToken();
  const scopeCheck = executiveBriefScopeQuerySchema.safeParse({
    assessmentId: assessmentId?.trim() || undefined
  });
  const scopedAssessmentId = scopeCheck.success ? scopeCheck.data.assessmentId : undefined;
  return {
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(scopedAssessmentId ? { [EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER]: scopedAssessmentId } : {})
  };
};

export const fetchExecutiveOpportunityBriefReport = async (
  fetcher: typeof fetch = apiFetch,
  options?: ExecutiveOpportunityBriefReportOptions
): Promise<ExecutiveOpportunityBriefFetchResult> => {
  const endpoint = `${getApiBaseUrl()}${EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT}`;
  let response: Response;
  try {
    const headers = buildExecutiveOpportunityBriefHeaders(options?.assessmentId);
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
    const context = {
      action: 'executive-brief.report.response',
      method: 'GET',
      path: EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
      statusCode: response.status,
      requestId,
      ...(errorDetails.serverMessage ? { serverMessage: errorDetails.serverMessage } : {}),
      ...(errorDetails.reason ? { reason: errorDetails.reason } : {})
    };
    if (response.status >= EXECUTIVE_BRIEF_HTTP_STATUS.SERVER_ERROR_MIN) {
      frontendLogger.error('Executive opportunity brief endpoint returned a server failure', context);
    } else {
      frontendLogger.warn('Executive opportunity brief endpoint returned an unsuccessful response', context);
    }
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
