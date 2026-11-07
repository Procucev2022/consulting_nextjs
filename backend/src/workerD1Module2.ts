import type { CloudflareD1Database } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import { eAuctionPlanningAssumptionSchema } from './constants/validation';
import logger from './utils/logger';
import { clearScopedModule2Cache, handleScopedModule2Route } from './services/workerD1Module2Scoped';
import { authenticateWorkerUser } from './workerAuth';
import type { EAuctionResult } from './types/module2EAuction';
import {
  MODULE2_D1_PENDING_ROUTES, MODULE2_D1_ROUTE_MESSAGES, MODULE2_D1_SCOPED_MESSAGES
} from './constants/module2D1Scoped';
import { MODULE2_D1_COMPLIANCE } from './constants/module2ProcurementComplianceD1';
import { buildProcurementComplianceWorkbook } from './services/workerD1ProcurementComplianceWorkbook';
import type { ProcurementComplianceResult } from './types/module2ProcurementCompliance';
import {
  handleBulkMaterialMappingUpdate, handleMaterialMappingUpdate, handleProcurementComplianceReview,
  handleSpecificationReview, procurementComplianceReport
} from './workerD1Module2ReviewRoutes';
import { handleModule2ReportRoute } from './workerD1Module2ReportRoutes';
import {
  loadEAuctionPlanningAssumptions, saveEAuctionPlanningAssumption
} from './services/workerD1EAuctionPlanningAssumptions';
import { readJson, requestJsonFailureResult } from './workerHttp';
import { handleModule2DataRoute } from './workerD1Module2DataRoutes';

const readRequestBody = async (request: Request): Promise<unknown> => {
  return readJson(request);
};

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
  if (normalized === '/e-auction/planning-assumptions') {
    if (request.method === 'GET') return { data: await loadEAuctionPlanningAssumptions(db) };
    if (request.method !== 'PUT') return { status: 405, data: {
      success: false, message: MODULE2_D1_ROUTE_MESSAGES.eAuctionPlanningAssumptionMethod
    } };
    const parsed = eAuctionPlanningAssumptionSchema.safeParse(await readRequestBody(request));
    if (!parsed.success) return { status: 400, data: {
      success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidEAuctionPlanningAssumption,
      errors: parsed.error.issues
    } };
    const authentication = await authenticateWorkerUser(request, { DB: db, AUTH_SECRET: authSecret }, true);
    if (!authentication.user) return { status: authentication.status, data: {
      success: false, message: authentication.message || MODULE2_D1_ROUTE_MESSAGES.eAuctionPlanningAssumptionAdminOnly
    } };
    const updatedAt = new Date().toISOString();
    const reviewedAssumption = {
      ...parsed.data,
      ...(parsed.data.approvalStatus === 'APPROVED'
        ? { approvedBy: authentication.user.name, approvedDate: updatedAt }
        : { approvedBy: undefined, approvedDate: undefined })
    };
    const assumption = await saveEAuctionPlanningAssumption(
      db, reviewedAssumption, authentication.user.email, updatedAt
    );
    clearScopedModule2Cache();
    logger.info('Persisted D1 e-auction planning assumption', {
      assumptionId: assumption.id, categoryOrMaterial: assumption.categoryOrMaterial,
      approved: assumption.approvalStatus === 'APPROVED', updatedBy: authentication.user.id
    });
    return { data: { success: true, message: MODULE2_D1_ROUTE_MESSAGES.eAuctionPlanningAssumptionSaved, assumption } };
  }
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
  if (normalized.startsWith('/procurement-compliance')) {
    if (normalized === '/procurement-compliance/review') {
      if (request.method !== 'POST') return { status: 405, data: {
        success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired
      } };
      return await handleProcurementComplianceReview(db, request, url, authSecret);
    }
    if (normalized !== '/procurement-compliance' && normalized !== '/procurement-compliance/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    if (request.method !== 'GET') return { status: 405, data: {
      success: false, message: MODULE2_D1_ROUTE_MESSAGES.method
    } };
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_ROUTE_MESSAGES.complianceScopeRequired
    } };
    const report = await procurementComplianceReport(db, request, url, assessmentId);
    if (!report || (report.status && report.status >= 400)) return report || {
      status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown }
    };
    if (normalized === '/procurement-compliance') return report;
    const file = buildProcurementComplianceWorkbook(report.data as ProcurementComplianceResult);
    const filename = `${MODULE2_D1_COMPLIANCE.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(file, { status: 200, headers: {
      'Content-Type': MODULE2_D1_COMPLIANCE.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
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
