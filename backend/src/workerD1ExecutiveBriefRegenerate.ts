/** POST regeneration reads the current D1 report and publishes fresh artifacts to R2. */
import logger from './utils/logger';
import { EXECUTIVE_BRIEF_HTTP_STATUS, EXECUTIVE_BRIEF_MESSAGES } from './constants/executiveBriefRouteConstants';
import { EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES } from './constants/executiveOpportunityBriefConstants';
import { executiveBriefRegenerateBodySchema } from './constants/executiveBriefValidation';
import { loadExecutiveOpportunityBriefFromD1 } from './services/executiveOpportunityBriefD1';
import { publishExecutiveBriefArtifacts } from './services/executiveBriefArtifactService';
import { authorizeExecutiveBriefAdmin } from './workerD1ExecutiveBriefAuth';
import {
  executiveBriefErrorResponse,
  executiveBriefJsonResponse,
  executiveBriefValidationResponse,
  resolveExecutiveBriefRequestId,
  toValidationIssues
} from './workerD1ExecutiveBriefResponses';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { ExecutiveBriefParseResult } from './types/executiveBriefRoutes';
import type { ExecutiveBriefRegenerateBody } from './types/executiveBriefValidation';
import type { ExecutiveOpportunityBriefReport } from './types/executiveOpportunityBrief';

const parseRegenerateBody = async (
  request: Request
): Promise<ExecutiveBriefParseResult<ExecutiveBriefRegenerateBody>> => {
  const raw = await request.text();
  if (raw.trim().length === 0) return { ok: true, data: {} };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, issues: [{ path: '', message: EXECUTIVE_BRIEF_MESSAGES.invalidJsonBody }] };
  }
  const parsed = executiveBriefRegenerateBodySchema.safeParse(json);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, issues: toValidationIssues(parsed.error.issues) };
};

const dataLoadFailure = (
  request: Request,
  requestId: string,
  reason: 'no-tenant' | 'ambiguous-tenant' | 'no-transactions'
): Response => {
  const status = reason === 'ambiguous-tenant' ? EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT : EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND;
  const message = {
    'no-tenant': EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.noTenant,
    'ambiguous-tenant': EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.ambiguousTenant,
    'no-transactions': EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.noTransactions
  }[reason];
  return executiveBriefErrorResponse(request, requestId, status, message, { reason });
};

export const handleExecutiveBriefRegenerate = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  const auth = await authorizeExecutiveBriefAdmin(request, environment);
  if (!auth.ok) {
    logger.warn('Rejected D1 executive brief regeneration', {
      requestId,
      action: 'regenerate',
      statusCode: auth.status
    });
    return executiveBriefErrorResponse(request, requestId, auth.status, auth.message);
  }
  const parsed = await parseRegenerateBody(request);
  if (!parsed.ok) {
    logger.warn('Rejected D1 executive brief regeneration body', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST,
      issueCount: parsed.issues.length
    });
    return executiveBriefValidationResponse(request, requestId, parsed.issues);
  }
  if (environment.DB === undefined) {
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable
    );
  }
  let report: ExecutiveOpportunityBriefReport;
  try {
    const loaded = await loadExecutiveOpportunityBriefFromD1(environment.DB);
    if (!loaded.ok) return dataLoadFailure(request, requestId, loaded.reason);
    report = loaded.report;
  } catch (error: unknown) {
    logger.error(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.queryFailed, {
      requestId,
      action: 'regenerate.loadD1',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      durationMs: Date.now() - startedAt
    }, error);
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.reportFailed(requestId)
    );
  }
  if (parsed.data.client !== undefined
    && parsed.data.client.toLocaleLowerCase() !== report.tenant.enterpriseName.toLocaleLowerCase()) {
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.tenantMismatch(parsed.data.client, report.tenant.enterpriseName)
    );
  }
  const bucket = environment.OBJECTS;
  if (bucket === undefined) {
    logger.error('D1 executive brief regeneration blocked because the R2 binding is missing', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE
    });
    return executiveBriefErrorResponse(request, requestId, EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE, EXECUTIVE_BRIEF_MESSAGES.r2Missing);
  }
  try {
    const artifacts = await publishExecutiveBriefArtifacts(bucket, report);
    const reportDate = report.generatedAt.slice(0, 10);
    logger.info('Published D1-backed executive brief artifacts to R2', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      tenantId: report.tenant.tenantId,
      artifactCount: artifacts.length,
      adminUserId: auth.userId,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefJsonResponse(request, requestId, EXECUTIVE_BRIEF_HTTP_STATUS.OK, {
      success: true,
      message: EXECUTIVE_BRIEF_MESSAGES.regenerated,
      data: { tenantId: report.tenant.tenantId, enterpriseName: report.tenant.enterpriseName, reportDate, artifacts }
    });
  } catch (error: unknown) {
    logger.error('Failed to publish D1-backed executive brief artifacts', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      durationMs: Date.now() - startedAt
    }, error);
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.publishFailed(requestId)
    );
  }
};
