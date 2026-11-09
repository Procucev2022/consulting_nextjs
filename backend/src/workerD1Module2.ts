import type { CloudflareD1Database } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import logger from './utils/logger';
import { handleScopedModule2Route } from './services/workerD1Module2Scoped';
import type { EAuctionResult } from './types/module2EAuction';
import {
  MODULE2_D1_PENDING_ROUTES, MODULE2_D1_ROUTE_MESSAGES, MODULE2_D1_SCOPED_MESSAGES
} from './constants/module2D1Scoped';
import {
  handleBulkMaterialMappingUpdate, handleMaterialMappingUpdate, handleSpecificationReview
} from './workerD1Module2ReviewRoutes';
import { handleModule2ReportRoute } from './workerD1Module2ReportRoutes';
import { loadEAuctionPlanningAssumptions } from './services/workerD1EAuctionPlanningAssumptions';
import { requestJsonFailureResult } from './workerHttp';
import { handleModule2DataRoute } from './workerD1Module2DataRoutes';
import { handleProcurementComplianceRoute } from './workerD1Module2ComplianceRoutes';
import { handleEAuctionPlanningAssumptionsRoute } from './workerD1Module2EAuctionRoutes';

export const handleModule2Route = async (
  db: CloudflareD1Database | undefined,
  subPath: string,
  request: Request,
  url: URL,
  authSecret?: string
): Promise<WorkerD1Result> => {
  if (!db) throw new Error('Cloudflare D1 binding DB is not configured');

  try {
  const normalized = subPath.replace(/^\/(sourcing|levers)/, '') || '/';
  const tenantId = request.headers.get('x-resolved-tenant-id') || '';
  const planningAssumptionsRoute = await handleEAuctionPlanningAssumptionsRoute(
    db, normalized, request, authSecret
  );
  if (planningAssumptionsRoute) return planningAssumptionsRoute;
  if (normalized === '/specification-rationalisation/review') {
    if (request.method !== 'POST') return {
      status: 405, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired }
    };
    return await handleSpecificationReview(db, request, url, authSecret);
  }
  if (normalized === '/vendor-consolidation/mappings/update') {
    if (request.method !== 'POST') return {
      status: 405, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired }
    };
    return await handleMaterialMappingUpdate(db, request, url, authSecret);
  }
  if (normalized === '/vendor-consolidation/mappings/bulk-update') {
    if (request.method !== 'POST') return {
      status: 405, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired }
    };
    return await handleBulkMaterialMappingUpdate(db, request, url, authSecret);
  }
  const complianceRoute = await handleProcurementComplianceRoute(db, normalized, request, url, authSecret);
  if (complianceRoute) return complianceRoute;
  if (MODULE2_D1_PENDING_ROUTES.has(normalized)) {
    logger.warn('Rejected sourcing action that has not been migrated to D1', {
      normalized, method: request.method, requestId: request.headers.get('x-request-id')
    });
    return { status: 501, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.pending } };
  }
  if (request.method !== 'GET') return {
    status: 405, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.method }
  };
  const reportRoute = await handleModule2ReportRoute(db, normalized, request, url);
  if (reportRoute) return reportRoute;

  const scoped = await handleScopedModule2Route(db, normalized, request, url);
  if (normalized === '/e-auction' && scoped && !(scoped.status && scoped.status >= 400) &&
      typeof scoped.data === 'object' && scoped.data !== null) {
    return { ...scoped, data: { ...(scoped.data as EAuctionResult),
      planningAssumptions: await loadEAuctionPlanningAssumptions(db) } };
  }
  if (scoped) return scoped;
  if (normalized.startsWith('/attribution-ledger') || normalized.startsWith('/supplier-risk') ||
      normalized.startsWith('/po-consolidation') || normalized.startsWith('/recurring-spend')) {
    return { status: 409, data: { success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired } };
  }

  const dataRoute = await handleModule2DataRoute(db, normalized, request, url, tenantId);
  if (dataRoute) return dataRoute;

  return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
  } catch (error: unknown) {
    const failure = requestJsonFailureResult(request, error);
    if (failure) return failure;
    throw error;
  }
};
