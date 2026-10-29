/**
 * Evidence API router for /api/evidence/jobs/{jobId}/... Every path under the prefix gets a JSON
 * response: a served file, a JSON body, or a JSON error. The handler never returns null.
 */

import { EVIDENCE_ERROR_CATEGORIES, EVIDENCE_HTTP_STATUS, EVIDENCE_MESSAGES } from './constants/evidenceMessages';
import { EVIDENCE_ACTIONS, EVIDENCE_REQUEST_ID_PATTERN, EVIDENCE_ROUTE_PATTERNS } from './constants/evidenceRoutes';
import { EvidenceRequestError } from './services/evidenceRequestError';
import type { CloudflareEnvironment } from './types/cloudflare';
import type {
  EvidenceFailureContext,
  EvidenceRouteMatch,
  EvidenceRouteInput
} from './types/evidenceWorkbook';
import logger from './utils/logger';
import {
  serveInventory,
  serveSavingsDownload,
  serveSavingsInventory,
  serveSavingsTypeInventory,
  serveParity,
  servePackageDownload,
  serveWorkbookDownload
} from './workerD1EvidenceRoutes';
import { evidenceErrorResponse } from './workerD1EvidenceResponses';

const matchRoute = (pathname: string): EvidenceRouteMatch | null => {
  const inventory = EVIDENCE_ROUTE_PATTERNS.inventory.exec(pathname);
  if (inventory) {
    return { action: EVIDENCE_ACTIONS.INVENTORY, rawParams: { jobId: inventory[1] }, handler: serveInventory };
  }
  const parity = EVIDENCE_ROUTE_PATTERNS.parity.exec(pathname);
  if (parity) {
    return { action: EVIDENCE_ACTIONS.PARITY, rawParams: { jobId: parity[1] }, handler: serveParity };
  }
  const workbook = EVIDENCE_ROUTE_PATTERNS.workbookDownload.exec(pathname);
  if (workbook) {
    return {
      action: EVIDENCE_ACTIONS.WORKBOOK_DOWNLOAD,
      rawParams: { jobId: workbook[1], workbookType: workbook[2] },
      handler: serveWorkbookDownload
    };
  }
  const packageMatch = EVIDENCE_ROUTE_PATTERNS.packageDownload.exec(pathname);
  if (packageMatch) {
    return { action: EVIDENCE_ACTIONS.PACKAGE_DOWNLOAD, rawParams: { jobId: packageMatch[1] }, handler: servePackageDownload };
  }
  const savingsInventory = EVIDENCE_ROUTE_PATTERNS.savingsInventory.exec(pathname);
  if (savingsInventory) {
    return { action: EVIDENCE_ACTIONS.SAVINGS_INVENTORY, rawParams: { jobId: savingsInventory[1] }, handler: serveSavingsInventory };
  }
  const savingsTypeInventory = EVIDENCE_ROUTE_PATTERNS.savingsTypeInventory.exec(pathname);
  if (savingsTypeInventory) {
    return {
      action: EVIDENCE_ACTIONS.SAVINGS_INVENTORY,
      rawParams: { jobId: savingsTypeInventory[1], savingsType: savingsTypeInventory[2] },
      handler: serveSavingsTypeInventory
    };
  }
  const savingsDownload = EVIDENCE_ROUTE_PATTERNS.savingsDownload.exec(pathname);
  if (savingsDownload) {
    return {
      action: EVIDENCE_ACTIONS.SAVINGS_DOWNLOAD,
      rawParams: { jobId: savingsDownload[1], savingsType: savingsDownload[2] },
      handler: serveSavingsDownload
    };
  }
  return null;
};

const resolveRequestId = (incoming: string | null): string =>
  incoming !== null && EVIDENCE_REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();

const handleFailure = (request: Request, error: unknown, context: EvidenceFailureContext): Response => {
  if (error instanceof EvidenceRequestError) {
    const logContext = { ...context, statusCode: error.status, errorCategory: error.category };
    if (error.status >= EVIDENCE_HTTP_STATUS.SERVER_ERROR) {
      logger.error('Evidence request failed', logContext, error);
    } else {
      logger.warn('Evidence request rejected', logContext, error);
    }
    return evidenceErrorResponse(request, error, context.requestId);
  }
  logger.error('Evidence request failed with an unexpected error', { ...context, statusCode: EVIDENCE_HTTP_STATUS.SERVER_ERROR }, error);
  const unexpected = new EvidenceRequestError(
    EVIDENCE_HTTP_STATUS.SERVER_ERROR,
    EVIDENCE_ERROR_CATEGORIES.SERVER,
    EVIDENCE_MESSAGES.serverError(context.requestId)
  );
  return evidenceErrorResponse(request, unexpected, context.requestId);
};

export const handleEvidenceRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const startedAt = Date.now();
  const match = matchRoute(url.pathname);
  if (!match) {
    const error = new EvidenceRequestError(EVIDENCE_HTTP_STATUS.NOT_FOUND, EVIDENCE_ERROR_CATEGORIES.NOT_FOUND, EVIDENCE_MESSAGES.routeNotFound);
    logger.warn('Evidence route not found', { requestId, path: url.pathname, statusCode: EVIDENCE_HTTP_STATUS.NOT_FOUND });
    return evidenceErrorResponse(request, error, requestId);
  }
  if (request.method !== 'GET') {
    const error = new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.METHOD_NOT_ALLOWED,
      EVIDENCE_ERROR_CATEGORIES.VALIDATION,
      EVIDENCE_MESSAGES.methodNotAllowed
    );
    logger.warn('Evidence method not allowed', { requestId, path: url.pathname, method: request.method });
    return evidenceErrorResponse(request, error, requestId);
  }
  const input: EvidenceRouteInput = {
    request,
    environment,
    requestId,
    action: match.action,
    rawParams: match.rawParams,
    searchParams: url.searchParams
  };
  try {
    const response = await match.handler(input);
    logger.info('Evidence request served', {
      requestId,
      action: match.action,
      path: url.pathname,
      statusCode: response.status,
      durationMs: Date.now() - startedAt
    });
    return response;
  } catch (error: unknown) {
    return handleFailure(request, error, {
      requestId,
      action: match.action,
      path: url.pathname,
      durationMs: Date.now() - startedAt
    });
  }
};
