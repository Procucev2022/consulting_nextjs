import {
  EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
  EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER
} from '../constants/app';
import { executiveOpportunityBriefResponseSchema } from '../constants/validation';
import type { ExecutiveOpportunityBriefFetchResult } from '../types';
import { authApiClient } from './authApi';
import { frontendLogger } from './logger';

const failed = (statusCode: number, requestId: string | null): ExecutiveOpportunityBriefFetchResult => ({
  ok: false,
  statusCode,
  requestId
});

export const fetchExecutiveOpportunityBriefReport = async (
  fetcher: typeof fetch = fetch
): Promise<ExecutiveOpportunityBriefFetchResult> => {
  let response: Response;
  try {
    const token = authApiClient.getStoredToken();
    response = await fetcher(EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT, {
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    });
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
    const context = {
      action: 'executive-brief.report.response',
      method: 'GET',
      path: EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
      statusCode: response.status,
      requestId
    };
    if (response.status >= 500) {
      frontendLogger.error('Executive opportunity brief endpoint returned a server failure', context);
    } else {
      frontendLogger.warn('Executive opportunity brief endpoint returned an unsuccessful response', context);
    }
    return failed(response.status, requestId);
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
