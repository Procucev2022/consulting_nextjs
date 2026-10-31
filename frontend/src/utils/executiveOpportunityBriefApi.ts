import {
  EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT,
  EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER
} from '../constants/app';
import { executiveOpportunityBriefResponseSchema } from '../constants/validation';
import type { ExecutiveOpportunityBriefFetchResult } from '../types';

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
    response = await fetcher(EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT);
  } catch {
    return failed(0, null);
  }
  const requestId = response.headers.get(EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER);
  if (!response.ok) {
    return failed(response.status, requestId);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return failed(response.status, requestId);
  }
  const parsed = executiveOpportunityBriefResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return failed(response.status, requestId);
  }
  return { ok: true, data: parsed.data.data };
};
