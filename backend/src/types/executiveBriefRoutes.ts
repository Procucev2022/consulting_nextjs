/**
 * Executive Brief route, authorization, and request-scope types used by the Worker handlers.
 */
export type ExecutiveBriefRouteKey =
  | 'report'
  | 'audit'
  | 'downloadPdf'
  | 'downloadPptx'
  | 'opportunityBriefPdf'
  | 'opportunityBriefPptx'
  | 'opportunityBriefReport'
  | 'email'
  | 'regenerate';

export type ExecutiveBriefHttpMethod = 'GET' | 'POST';

export type ExecutiveBriefDownloadFormat = 'pdf' | 'pptx';

export interface ExecutiveBriefRouteDefinition {
  key: ExecutiveBriefRouteKey;
  method: ExecutiveBriefHttpMethod;
  path: string;
}

export interface ExecutiveBriefAuthSuccess {
  ok: true;
  userId: string;
}

export interface ExecutiveBriefAuthFailure {
  ok: false;
  status: number;
  message: string;
}

export type ExecutiveBriefAuthOutcome = ExecutiveBriefAuthSuccess | ExecutiveBriefAuthFailure;

export interface ExecutiveBriefValidationIssue {
  path: string;
  message: string;
}

export interface ExecutiveBriefIssueInput {
  path: readonly PropertyKey[];
  message: string;
}

export type ExecutiveBriefParseResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; issues: ExecutiveBriefValidationIssue[]; statusCode?: number };
