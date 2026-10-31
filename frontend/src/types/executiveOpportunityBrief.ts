import type { ExecutiveOpportunityBriefReportData } from './validation';

export type ExecutiveOpportunityBriefFetchResult =
  | { ok: true; data: ExecutiveOpportunityBriefReportData }
  | { ok: false; statusCode: number; requestId: string | null };

export type ExecutiveOpportunityBriefLoadState =
  | { status: 'loading' }
  | { status: 'ready'; report: ExecutiveOpportunityBriefReportData }
  | { status: 'failed'; statusCode: number; requestId: string | null };
