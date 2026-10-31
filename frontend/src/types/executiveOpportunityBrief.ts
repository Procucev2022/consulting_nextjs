import type { ExecutiveOpportunityBriefReportData } from './validation';

export interface ExecutiveOpportunityBriefDownloadPayload {
  readonly url: string;
  readonly filename: string;
}

export type ExecutiveOpportunityBriefFetchResult =
  | { ok: true; data: ExecutiveOpportunityBriefReportData }
  | { ok: false; statusCode: number; requestId: string | null };

export type ExecutiveOpportunityBriefLoadState =
  | { status: 'loading' }
  | { status: 'ready'; report: ExecutiveOpportunityBriefReportData }
  | { status: 'failed'; statusCode: number; requestId: string | null };
