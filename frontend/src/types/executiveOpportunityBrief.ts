import type { ExecutiveBriefDownloadFormat, ExecutiveOpportunityBriefReportData } from './validation';

export interface ExecutiveOpportunityBriefDownloadPayload {
  readonly url: string;
  readonly filename: string;
}

export interface ExecutiveOpportunityBriefReportOptions {
  readonly assessmentId?: string;
}

export type ExecutiveOpportunityBriefDownloadState = ExecutiveBriefDownloadFormat | null;

export type ExecutiveOpportunityBriefFetchResult =
  | { ok: true; data: ExecutiveOpportunityBriefReportData }
  | { ok: false; statusCode: number; requestId: string | null; serverMessage?: string; reason?: string };

export type ExecutiveOpportunityBriefLoadState =
  | { status: 'loading' }
  | { status: 'ready'; report: ExecutiveOpportunityBriefReportData }
  | { status: 'failed'; statusCode: number; requestId: string | null; serverMessage?: string; reason?: string };

export interface ExecutiveOpportunityBriefErrorFormatOptions {
  readonly statusCode: number;
  readonly requestId: string | null;
  readonly serverMessage?: string;
  readonly formatLabel?: string;
}

export interface ExecutiveOpportunityBriefErrorDetails {
  readonly serverMessage?: string;
  readonly reason?: string;
}
