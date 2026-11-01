/** D1-backed Executive Brief report, audit, and export handlers. */
import logger from './utils/logger';
import { EXECUTIVE_BRIEF_ARTIFACT_FILENAMES, EXECUTIVE_BRIEF_CONTENT_TYPES } from './constants/executiveBriefExportConstants';
import { EXECUTIVE_BRIEF_HTTP_STATUS } from './constants/executiveBriefRouteConstants';
import { EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT, EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES } from './constants/executiveOpportunityBriefConstants';
import { executiveBriefEmailBodySchema } from './constants/executiveBriefValidation';
import {
  executiveOpportunityBriefContentType,
  executiveOpportunityBriefFilename,
  formatExecutiveOpportunityBriefAuditMarkdown,
  generateExecutiveOpportunityBriefPdf,
  generateExecutiveOpportunityBriefPptx
} from './services/executiveOpportunityBriefExport';
import { loadExecutiveOpportunityBriefFromD1 } from './services/executiveOpportunityBriefD1';
import {
  executiveBriefErrorResponse,
  executiveBriefFileResponse,
  executiveBriefJsonResponse,
  executiveBriefValidationResponse,
  resolveExecutiveBriefRequestId,
  toValidationIssues
} from './workerD1ExecutiveBriefResponses';
import type { ExecutiveBriefDownloadFormat } from './types/executiveBriefRoutes';
import type { ExecutiveOpportunityBriefRequestLoad } from './types/executiveOpportunityBrief';
import type { CloudflareEnvironment } from './types/cloudflare';
import { authenticateWorkerUser } from './workerAuth';
import { sendCommercialEmail } from './services/workerCommercialShared';
import { authorizeExecutiveBriefAdmin } from './workerD1ExecutiveBriefAuth';

const encoder = new TextEncoder();

const failureForMissingData = (
  request: Request,
  requestId: string,
  reason: 'no-tenant' | 'ambiguous-tenant' | 'no-transactions'
): Response => {
  const status = reason === 'ambiguous-tenant'
    ? EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT
    : EXECUTIVE_BRIEF_HTTP_STATUS.NOT_FOUND;
  const messages = {
    'no-tenant': EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.noTenant,
    'ambiguous-tenant': EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.ambiguousTenant,
    'no-transactions': EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.noTransactions
  };
  return executiveBriefErrorResponse(request, requestId, status, messages[reason], { reason });
};

const loadReport = async (
  request: Request,
  environment: CloudflareEnvironment,
  action: string
): Promise<ExecutiveOpportunityBriefRequestLoad> => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  const authorization = await authorizeExecutiveBriefAdmin(request, environment);
  if (!authorization.ok) {
    logger.warn('Rejected executive brief report request without administrator access', {
      requestId,
      action,
      statusCode: authorization.status
    });
    return {
      ok: false,
      response: executiveBriefErrorResponse(
        request,
        requestId,
        authorization.status,
        authorization.message
      )
    };
  }
  if (environment.DB === undefined) {
    logger.warn(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable, {
      requestId,
      action,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE
    });
    return {
      ok: false,
      response: executiveBriefErrorResponse(
        request,
        requestId,
        EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
        EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable
      )
    };
  }
  try {
    const loaded = await loadExecutiveOpportunityBriefFromD1(environment.DB);
    if (!loaded.ok) {
      return { ok: false, response: failureForMissingData(request, requestId, loaded.reason) };
    }
    return { ok: true, report: loaded.report, requestId, startedAt };
  } catch (error: unknown) {
    logger.error(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.queryFailed, {
      requestId,
      action,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      durationMs: Date.now() - startedAt
    }, error);
    return {
      ok: false,
      response: executiveBriefErrorResponse(
        request,
        requestId,
        EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
        EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.reportFailed(requestId)
      )
    };
  }
};

export const handleExecutiveBriefReport = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  const loaded = await loadReport(request, environment, 'executiveBrief.report');
  if (!loaded.ok) return loaded.response;
  logger.info(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.servedReport, {
    requestId: loaded.requestId,
    action: 'executiveBrief.report',
    statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
    tenantId: loaded.report.tenant.tenantId,
    transactionCount: loaded.report.metrics.transactionCount,
    opportunityCount: loaded.report.metrics.opportunityCount,
    durationMs: Date.now() - loaded.startedAt
  });
  return executiveBriefJsonResponse(request, loaded.requestId, EXECUTIVE_BRIEF_HTTP_STATUS.OK, {
    success: true,
    data: loaded.report
  });
};

export const handleExecutiveBriefAudit = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  const loaded = await loadReport(request, environment, 'executiveBrief.audit');
  if (!loaded.ok) return loaded.response;
  try {
    const audit = formatExecutiveOpportunityBriefAuditMarkdown(loaded.report);
    logger.info('Served D1-backed executive brief audit', {
      requestId: loaded.requestId,
      action: 'executiveBrief.audit',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      tenantId: loaded.report.tenant.tenantId,
      durationMs: Date.now() - loaded.startedAt
    });
    return executiveBriefFileResponse(
      request,
      loaded.requestId,
      encoder.encode(audit),
      EXECUTIVE_BRIEF_CONTENT_TYPES.MARKDOWN,
      EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT
    );
  } catch (error: unknown) {
    logger.error(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.queryFailed, {
      requestId: loaded.requestId,
      action: 'executiveBrief.audit',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      durationMs: Date.now() - loaded.startedAt
    }, error);
    return executiveBriefErrorResponse(
      request,
      loaded.requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.exportFailed('audit', loaded.requestId)
    );
  }
};

export const handleExecutiveBriefDownload = (
  request: Request,
  environment: CloudflareEnvironment,
  format: ExecutiveBriefDownloadFormat
): Promise<Response> => handleOpportunityBriefDownload(request, environment, format);

export const handleOpportunityBriefReport = handleExecutiveBriefReport;

export const handleExecutiveBriefEmail = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  const requestId = resolveExecutiveBriefRequestId(request);
  const startedAt = Date.now();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return executiveBriefValidationResponse(request, requestId, [{
      path: 'body',
      message: EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.invalidEmailRequest
    }]);
  }
  const parsed = executiveBriefEmailBodySchema.safeParse(body);
  if (!parsed.success) {
    logger.warn('Rejected invalid executive brief email request', {
      requestId,
      action: 'executiveBrief.email',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST,
      issueCount: parsed.error.issues.length
    });
    return executiveBriefValidationResponse(request, requestId, toValidationIssues(parsed.error.issues));
  }
  const auth = await authenticateWorkerUser(request, environment);
  if (!auth.user) {
    logger.warn('Rejected executive brief email request without an active account', {
      requestId,
      action: 'executiveBrief.email',
      statusCode: auth.status
    });
    return executiveBriefErrorResponse(
      request,
      requestId,
      auth.status,
      auth.message ?? EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailFailed(requestId)
    );
  }
  const loaded = await loadReport(request, environment, 'executiveBrief.email');
  if (!loaded.ok) return loaded.response;
  try {
    const subject = `${EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PPTX_TITLE} - ${loaded.report.tenant.enterpriseName}`;
    const content = JSON.stringify(loaded.report, null, 2);
    const delivery = await sendCommercialEmail(environment, parsed.data.buyerEmail, subject, content);
    if (!delivery.sent) {
      logger.error('Executive brief email delivery is unavailable', {
        requestId,
        action: 'executiveBrief.email',
        statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
        tenantId: loaded.report.tenant.tenantId,
        durationMs: Date.now() - startedAt
      });
      return executiveBriefErrorResponse(
        request,
        requestId,
        EXECUTIVE_BRIEF_HTTP_STATUS.SERVICE_UNAVAILABLE,
        delivery.message ?? EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailFailed(requestId)
      );
    }
    logger.info('Sent D1-backed executive brief by email', {
      requestId,
      action: 'executiveBrief.email',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      tenantId: loaded.report.tenant.tenantId,
      recipient: parsed.data.buyerEmail,
      userId: auth.user.id,
      durationMs: Date.now() - startedAt
    });
    return executiveBriefJsonResponse(request, requestId, EXECUTIVE_BRIEF_HTTP_STATUS.OK, {
      success: true,
      message: EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailSent
    });
  } catch (error: unknown) {
    logger.error('Failed to email D1-backed executive brief', {
      requestId,
      action: 'executiveBrief.email',
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      tenantId: loaded.report.tenant.tenantId,
      durationMs: Date.now() - startedAt
    }, error);
    return executiveBriefErrorResponse(
      request,
      requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailFailed(requestId)
    );
  }
};

export const handleOpportunityBriefDownload = async (
  request: Request,
  environment: CloudflareEnvironment,
  format: ExecutiveBriefDownloadFormat
): Promise<Response> => {
  const loaded = await loadReport(request, environment, `opportunityBrief.${format}`);
  if (!loaded.ok) return loaded.response;
  try {
    const artifact = format === 'pdf'
      ? generateExecutiveOpportunityBriefPdf(loaded.report)
      : await generateExecutiveOpportunityBriefPptx(loaded.report);
    const reportDate = loaded.report.generatedAt.slice(0, 10);
    const filename = executiveOpportunityBriefFilename(loaded.report.tenant.enterpriseName, format, reportDate);
    logger.info(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.servedDownload, {
      requestId: loaded.requestId,
      action: `opportunityBrief.${format}`,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
      tenantId: loaded.report.tenant.tenantId,
      format,
      bytes: artifact.byteLength,
      durationMs: Date.now() - loaded.startedAt
    });
    return executiveBriefFileResponse(
      request,
      loaded.requestId,
      artifact,
      executiveOpportunityBriefContentType(format),
      filename
    );
  } catch (error: unknown) {
    logger.error(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.queryFailed, {
      requestId: loaded.requestId,
      action: `opportunityBrief.${format}`,
      statusCode: EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      format,
      durationMs: Date.now() - loaded.startedAt
    }, error);
    return executiveBriefErrorResponse(
      request,
      loaded.requestId,
      EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR,
      EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.exportFailed(format, loaded.requestId),
      { format }
    );
  }
};
