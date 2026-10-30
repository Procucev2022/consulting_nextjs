/**
 * POST /api/reports/executive-brief/regenerate. Requires an ADMIN bearer token. The handler renders PDF, PPTX, JSON,
 * and audit Markdown from the certified report and publishes them to R2 under executive-brief/<client>/<filename>.
 */
import logger from './utils/logger';
import { DEFAULT_CLIENT_PROFILE } from './constants/executiveBriefConstants';
import { EXECUTIVE_BRIEF_HTTP_STATUS, EXECUTIVE_BRIEF_MESSAGES } from './constants/executiveBriefRouteConstants';
import { executiveBriefRegenerateBodySchema } from './constants/executiveBriefValidation';
import { publishExecutiveBriefArtifacts } from './services/executiveBriefArtifactService';
import { resolveCertifiedClientName, toReportDate } from './services/executiveBriefMetadataService';
import { assembleExecutiveBriefReport } from './services/executiveBriefReportService';
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

const parseRegenerateBody = async (
  request: Request
): Promise<ExecutiveBriefParseResult<ExecutiveBriefRegenerateBody>> => {
  const raw = await request.text();
  if (raw.trim().length === 0) {
    return { ok: true, data: {} };
  }
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

export const handleExecutiveBriefRegenerate = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  const auth = await authorizeExecutiveBriefAdmin(request, environment);
  if (!auth.ok) {
    logger.warn('Rejected executive brief regeneration', {
      requestId,
      action: 'regenerate',
      statusCode: auth.status
    });
    return executiveBriefErrorResponse(request, requestId, auth.status, auth.message);
  }
  const parsed = await parseRegenerateBody(request);
  if (!parsed.ok) {
    logger.warn('Rejected executive brief regeneration body', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST,
      issueCount: parsed.issues.length
    });
    return executiveBriefValidationResponse(request, requestId, parsed.issues);
  }
  const requested = parsed.data.client ?? DEFAULT_CLIENT_PROFILE.clientName;
  const clientName = resolveCertifiedClientName(requested);
  if (clientName === null) {
    logger.warn('Regeneration requested for a client without a certified brief', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND,
      client: requested
    });
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND,
      EXECUTIVE_BRIEF_MESSAGES.clientNotCertified(requested, DEFAULT_CLIENT_PROFILE.clientName)
    );
  }
  const bucket = environment.OBJECTS;
  if (bucket === undefined) {
    logger.error('Executive brief regeneration blocked: OBJECTS binding is missing', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE
    });
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      EXECUTIVE_BRIEF_MESSAGES.r2Missing
    );
  }
  try {
    const reportDate = toReportDate(new Date());
    const report = assembleExecutiveBriefReport(clientName, reportDate);
    if (!report.validationChecklist.financialReconciliation) {
      logger.warn('Blocked executive brief regeneration by financial reconciliation', {
        requestId,
        action: 'regenerate',
        statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT,
        client: clientName
      });
      return executiveBriefErrorResponse(
        request,
        requestId,
        EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT,
        EXECUTIVE_BRIEF_MESSAGES.blocked
      );
    }
    const artifacts = await publishExecutiveBriefArtifacts(bucket, report);
    logger.info('Published regenerated executive brief artifacts to R2', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      client: clientName,
      artifactCount: artifacts.length,
      adminUserId: auth.userId,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefJsonResponse(request, requestId, EXECUTIVE_BRIEF_HTTP_STATUS.OK, {
      success: true,
      message: EXECUTIVE_BRIEF_MESSAGES.regenerated,
      data: { client: clientName, reportDate, artifacts }
    });
  } catch (error: unknown) {
    logger.error('Failed to publish regenerated executive brief artifacts', {
      requestId,
      action: 'regenerate',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      durationMs: Date.now() - startedAt
    }, error);
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      EXECUTIVE_BRIEF_MESSAGES.publishFailed(requestId)
    );
  }
};
