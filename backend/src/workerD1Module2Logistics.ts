import { D1_ROUTE_MESSAGES, D1_TABLES } from './constants/d1';
import { module2LogisticsPackagingQuerySchema } from './constants/validation';
import { queryD1Rows, requireWorkerDb } from './services/workerD1Query';
import { AUTH_ROLES } from './constants/auth';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import logger from './utils/logger';
import { authenticateWorkerUser } from './workerAuth';

export const handleModule2LogisticsPackagingRoute = async (
  environment: CloudflareEnvironment,
  request: Request,
  url: URL
): Promise<WorkerD1Result> => {
  const database = requireWorkerDb(environment.DB);
  const requestId = request.headers.get('x-request-id') || undefined;
  if (request.method !== 'GET') {
    return { status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.module2LogisticsMethod } };
  }
  const parsed = module2LogisticsPackagingQuerySchema.safeParse({
    assessmentId: url.searchParams.get('assessmentId') ?? undefined
  });
  if (!parsed.success) {
    logger.warn('Module 2 logistics query rejected by validation', { requestId, issues: parsed.error.issues });
    return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.module2LogisticsInvalid, errors: parsed.error.issues } };
  }
  const authentication = await authenticateWorkerUser(request, environment);
  if (!authentication.user) {
    return {
      status: authentication.status,
      data: { success: false, message: authentication.message || D1_ROUTE_MESSAGES.module2LogisticsAuthFailed }
    };
  }
  const assessment = await database.prepare(`
    SELECT AssessmentRecord.customer_id, CustomerRecord.contact_email
    FROM AssessmentRecord
    LEFT JOIN CustomerRecord ON CustomerRecord.customer_id = AssessmentRecord.customer_id
    WHERE AssessmentRecord.assessment_id = ?
  `).bind(parsed.data.assessmentId).first<{ customer_id: string; contact_email: string | null }>();
  if (!assessment) {
    return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.module2LogisticsAssessmentNotFound } };
  }
  const ownsAssessment = assessment.contact_email?.trim().toLowerCase() === authentication.user.email.trim().toLowerCase();
  if (authentication.user.role !== AUTH_ROLES.ADMIN && !ownsAssessment) {
    logger.warn('Rejected Module 2 logistics request outside the caller assessment scope', {
      requestId,
      assessmentId: parsed.data.assessmentId,
      userId: authentication.user.id
    });
    return { status: 403, data: { success: false, message: D1_ROUTE_MESSAGES.module2LogisticsAccessDenied } };
  }
  const rows = await queryD1Rows<D1Record>(database, `
    SELECT candidate_id AS candidateId, assessment_id AS assessmentId, lane, material_category AS materialCategory,
      shipping_mode AS shippingMode, incoterms, shipment_count AS shipmentCount,
      current_freight_inr AS currentFreightInr, benchmark_freight_inr AS benchmarkFreightInr,
      packaging_spec AS packagingSpec, container_fill_pct AS containerFillPct,
      evidence_status AS evidenceStatus, is_demo AS isDemo, updated_at AS updatedAt
    FROM ${D1_TABLES.module2LogisticsCandidates}
    WHERE assessment_id = ?
    ORDER BY current_freight_inr DESC, candidate_id ASC
  `, [parsed.data.assessmentId], requestId);
  const candidates = rows.map((row) => ({ ...row, isDemo: Number(row.isDemo) === 1 }));
  logger.info('Loaded D1 logistics and packaging candidates', {
    requestId, assessmentId: parsed.data.assessmentId, rowCount: candidates.length,
    demoRowCount: candidates.filter((row) => row.isDemo).length
  });
  return { data: { success: true, candidates, count: candidates.length } };
};
