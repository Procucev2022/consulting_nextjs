/**
 * GET handlers for the Executive Brief: report JSON, audit Markdown, PDF and PPTX downloads, and the 501 responses for
 * the Opportunity Brief downloads. These routes are public because the executive brief page sends no token.
 */
import logger from './utils/logger';
import { DEFAULT_CLIENT_PROFILE } from './constants/executiveBriefConstants';
import { EXECUTIVE_BRIEF_ARTIFACT_FILENAMES, EXECUTIVE_BRIEF_CONTENT_TYPES } from './constants/executiveBriefExportConstants';
import {
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_BRIEF_MESSAGES
} from './constants/executiveBriefRouteConstants';
import { executiveBriefClientQuerySchema } from './constants/executiveBriefValidation';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES
} from './constants/executiveOpportunityBriefConstants';
import { loadExecutiveOpportunityBriefFromD1 } from './services/executiveOpportunityBriefD1';
import {
  executiveOpportunityBriefContentType,
  executiveOpportunityBriefFilename,
  generateExecutiveOpportunityBriefPdf,
  generateExecutiveOpportunityBriefPptx
} from './services/executiveOpportunityBriefExport';
import { renderExecutiveBriefArtifact } from './services/executiveBriefArtifactService';
import { formatExecutiveBriefAuditMarkdown } from './services/executiveBriefMarkdown';
import { resolveCertifiedClientName, toReportDate } from './services/executiveBriefMetadataService';
import { assembleExecutiveBriefReport } from './services/executiveBriefReportService';
import {
  executiveBriefErrorResponse,
  executiveBriefFileResponse,
  executiveBriefJsonResponse,
  executiveBriefValidationResponse,
  resolveExecutiveBriefRequestId,
  toValidationIssues
} from './workerD1ExecutiveBriefResponses';
import type { ExecutiveBriefDownloadFormat, ExecutiveBriefScopeResult } from './types/executiveBriefRoutes';
import type { CloudflareEnvironment } from './types/cloudflare';

const encoder = new TextEncoder();

/**
 * Validates the optional client query parameter and resolves the certified client and the report date.
 * An omitted client resolves to the certified client. Any other client returns 404.
 */
const resolveScope = (request: Request, url: URL, requestId: string): ExecutiveBriefScopeResult => {
  const parsed = executiveBriefClientQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    logger.warn('Rejected executive brief query', {
      requestId,
      action: 'query',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST,
      issueCount: parsed.error.issues.length
    });
    return {
      ok: false,
      response: executiveBriefValidationResponse(request, requestId, toValidationIssues(parsed.error.issues))
    };
  }
  const requested = parsed.data.client ?? DEFAULT_CLIENT_PROFILE.clientName;
  const clientName = resolveCertifiedClientName(requested);
  if (clientName === null) {
    logger.warn('Requested client has no certified executive brief', {
      requestId,
      action: 'query',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND,
      client: requested
    });
    return {
      ok: false,
      response: executiveBriefErrorResponse(
        request,
        requestId,
        EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND,
        EXECUTIVE_BRIEF_MESSAGES.clientNotCertified(requested, DEFAULT_CLIENT_PROFILE.clientName)
      )
    };
  }
  return { ok: true, scope: { clientName, reportDate: toReportDate(new Date()) } };
};

const renderFailure = (
  request: Request,
  requestId: string,
  label: string,
  action: string,
  error: unknown,
  startedAt: number
): Response => {
  logger.error('Failed to render executive brief', {
    requestId,
    action,
    statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
    durationMs: Date.now() - startedAt
  }, error);
  return executiveBriefErrorResponse(
    request,
    requestId,
    EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
    EXECUTIVE_BRIEF_MESSAGES.renderFailed(label, requestId)
  );
};

export const handleExecutiveBriefReport = (request: Request, url: URL): Response => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  const scopeResult = resolveScope(request, url, requestId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }
  try {
    const report = assembleExecutiveBriefReport(scopeResult.scope.clientName, scopeResult.scope.reportDate);
    logger.info('Served executive brief report', {
      requestId,
      action: 'report',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      client: report.clientProfile.clientName,
      reconciled: report.validationChecklist.financialReconciliation,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefJsonResponse(request, requestId, EXECUTIVE_BRIEF_HTTP_STATUS.OK, { success: true, data: report });
  } catch (error: unknown) {
    return renderFailure(request, requestId, 'report data', 'report', error, startedAt);
  }
};

export const handleExecutiveBriefAudit = (request: Request, url: URL): Response => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  const scopeResult = resolveScope(request, url, requestId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }
  try {
    const report = assembleExecutiveBriefReport(scopeResult.scope.clientName, scopeResult.scope.reportDate);
    const markdown = formatExecutiveBriefAuditMarkdown(report);
    logger.info('Served executive brief audit', {
      requestId,
      action: 'audit',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      client: report.clientProfile.clientName,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefFileResponse(
      request,
      requestId,
      encoder.encode(markdown),
      EXECUTIVE_BRIEF_CONTENT_TYPES.MARKDOWN,
      EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT
    );
  } catch (error: unknown) {
    return renderFailure(request, requestId, 'audit', 'audit', error, startedAt);
  }
};

/**
 * Serves the PDF or PPTX. Export is blocked (409) when the financial reconciliation fails, so a file that disagrees
 * with the certified figures is never served.
 */
export const handleExecutiveBriefDownload = async (
  request: Request,
  url: URL,
  format: ExecutiveBriefDownloadFormat
): Promise<Response> => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  const action = `download.${format}`;
  const scopeResult = resolveScope(request, url, requestId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }
  try {
    const report = assembleExecutiveBriefReport(scopeResult.scope.clientName, scopeResult.scope.reportDate);
    if (!report.validationChecklist.financialReconciliation) {
      logger.warn('Blocked executive brief export by financial reconciliation', {
        requestId,
        action,
        statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT
      });
      return executiveBriefErrorResponse(
        request,
        requestId,
        EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT,
        EXECUTIVE_BRIEF_MESSAGES.blocked
      );
    }
    const artifact = await renderExecutiveBriefArtifact(format, report);
    logger.info('Served executive brief download', {
      requestId,
      action,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      format,
      client: report.clientProfile.clientName,
      bytes: artifact.body.byteLength,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefFileResponse(
      request,
      requestId,
      artifact.body,
      artifact.contentType,
      artifact.downloadFilename
    );
  } catch (error: unknown) {
    return renderFailure(request, requestId, format.toUpperCase(), action, error, startedAt);
  }
};

const opportunityBriefLoadFailure = (
  request: Request,
  requestId: string,
  reason: 'no-tenant' | 'ambiguous-tenant' | 'no-transactions'
): Response => {
  const status = reason === 'ambiguous-tenant'
    ? EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT
    : EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND;
  const message = reason === 'no-tenant'
    ? EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.noTenant
    : reason === 'ambiguous-tenant'
      ? EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.ambiguousTenant
      : EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.noTransactions;
  return executiveBriefErrorResponse(request, requestId, status, message, { reason });
};

export const handleOpportunityBriefReport = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  if (!environment.DB) {
    logger.warn(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable, {
      requestId,
      action: 'opportunityBrief.report',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE
    });
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable
    );
  }
  try {
    const loaded = await loadExecutiveOpportunityBriefFromD1(environment.DB);
    if (!loaded.ok) {
      return opportunityBriefLoadFailure(request, requestId, loaded.reason);
    }
    logger.info(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.servedReport, {
      requestId,
      action: 'opportunityBrief.report',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      tenantId: loaded.report.tenant.tenantId,
      transactionCount: loaded.report.metrics.transactionCount,
      opportunityCount: loaded.report.metrics.opportunityCount,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefJsonResponse(request, requestId, EXECUTIVE_BRIEF_HTTP_STATUS.OK, {
      success: true,
      data: loaded.report
    });
  } catch (error: unknown) {
    logger.error(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.queryFailed, {
      requestId,
      action: 'opportunityBrief.report',
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
};

export const handleOpportunityBriefDownload = async (
  request: Request,
  environment: CloudflareEnvironment,
  format: ExecutiveBriefDownloadFormat
): Promise<Response> => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  const action = `opportunityBrief.${format}`;
  if (!environment.DB) {
    logger.warn(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable, {
      requestId,
      action,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      format
    });
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable,
      { format }
    );
  }
  try {
    const loaded = await loadExecutiveOpportunityBriefFromD1(environment.DB);
    if (!loaded.ok) {
      return opportunityBriefLoadFailure(request, requestId, loaded.reason);
    }
    const artifact = format === 'pdf'
      ? generateExecutiveOpportunityBriefPdf(loaded.report)
      : await generateExecutiveOpportunityBriefPptx(loaded.report);
    const reportDate = loaded.report.generatedAt.slice(0, 10);
    const filename = executiveOpportunityBriefFilename(loaded.report.tenant.enterpriseName, format, reportDate);
    logger.info(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.servedDownload, {
      requestId,
      action,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      tenantId: loaded.report.tenant.tenantId,
      format,
      bytes: artifact.byteLength,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefFileResponse(request, requestId, artifact, executiveOpportunityBriefContentType(format), filename);
  } catch (error: unknown) {
    logger.error(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.queryFailed, {
      requestId,
      action,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      format,
      durationMs: Date.now() - startedAt
    }, error);
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.exportFailed(format, requestId),
      { format }
    );
  }
};
