import type { CloudflareD1Database, CloudflareD1PreparedStatement } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import type { WorkerAuthIdentity } from './types/auth';
import type {
  MaterialMappingBulkUpdateInput, MaterialMappingUpdateInput, ProcurementComplianceReviewInput,
  SpecificationReviewInput
} from './types/validation';
import {
  materialMappingBulkUpdateSchema, materialMappingUpdateSchema, procurementComplianceReviewSchema,
  specificationReviewSchema
} from './constants/validation';
import { MODULE2_D1_ROUTE_MESSAGES } from './constants/module2D1Scoped';
import { clearScopedModule2Cache, handleScopedModule2Route } from './services/workerD1Module2Scoped';
import { authenticateWorkerUser } from './workerAuth';
import { applySpecificationReviewHistory, loadSpecificationReviewHistory } from './services/workerD1SpecificationReviews';
import type { MaterialMappingEntry } from './types/module2MaterialMapping';
import type { VendorConsolidationResult } from './types/module2VendorConsolidation';
import type { SpecificationRationalisationResult } from './types/module2SpecificationRationalisation';
import type { ProcurementComplianceResult } from './types/module2ProcurementCompliance';
import logger from './utils/logger';
import { readJson } from './workerHttp';

export const executeMaterialMappingStatements = async (
  db: CloudflareD1Database,
  statements: CloudflareD1PreparedStatement[]
): Promise<void> => {
  if (statements.length === 0) return;
  if (db.batch) {
    await db.batch(statements);
    return;
  }
  await Promise.all(statements.map((statement) => statement.run()));
};

const withAssessmentScope = (url: URL, assessmentId: string): URL => {
  const scopedUrl = new URL(url);
  scopedUrl.searchParams.set('assessmentId', assessmentId);
  return scopedUrl;
};

const rejectUnauthenticatedMutation = async (
  request: Request, db: CloudflareD1Database, authSecret?: string
): Promise<{ user: WorkerAuthIdentity } | WorkerD1Result> => {
  const authentication = await authenticateWorkerUser(request, { DB: db, AUTH_SECRET: authSecret });
  return authentication.user ? { user: authentication.user } : {
    status: authentication.status,
    data: { success: false, message: authentication.message || 'Authentication required.' }
  };
};

export const specificationReport = async (
  db: CloudflareD1Database, request: Request, url: URL, assessmentId: string
): Promise<WorkerD1Result | null> => {
  const report = await handleScopedModule2Route(
    db, '/specification-rationalisation', request, withAssessmentScope(url, assessmentId)
  );
  if (!report || (report.status && report.status >= 400)) return report;
  const history = await loadSpecificationReviewHistory(db, assessmentId);
  return { ...report, data: applySpecificationReviewHistory(
    report.data as SpecificationRationalisationResult, history
  ) };
};

export const handleSpecificationReview = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = specificationReviewSchema.safeParse(await readJson(request));
  if (!parsed.success) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidSpecificationReview,
    errors: parsed.error.issues
  } };
  const auth = await rejectUnauthenticatedMutation(request, db, authSecret);
  if (!('user' in auth)) return auth;
  const payload: SpecificationReviewInput = parsed.data;
  const current = await specificationReport(db, request, url, payload.assessmentId);
  const candidate = (current?.data as SpecificationRationalisationResult | undefined)?.candidates
    .find((item) => item.candidateId === payload.candidateId);
  if (!candidate) return { status: 404, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.specificationCandidateNotFound
  } };
  const reviewedAt = new Date().toISOString();
  const reviewId = `SPEC-REV-${crypto.randomUUID()}`;
  await db.prepare(`
    INSERT INTO Module2SpecificationReview (
      review_id, assessment_id, candidate_id, reviewer_name, reviewer_role, review_date, status,
      technical_justification, proposed_standard, application_scope, rejection_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    reviewId, payload.assessmentId, payload.candidateId, auth.user.name,
    auth.user.role, reviewedAt, payload.status, payload.technicalJustification,
    payload.proposedStandard || null, payload.applicationScope || null, payload.rejectionReason || null
  ).run();
  const updated = await specificationReport(db, request, url, payload.assessmentId);
  logger.info('Persisted D1 specification technical review', {
    assessmentId: payload.assessmentId, candidateId: payload.candidateId,
    reviewId, reviewerId: auth.user.id, status: payload.status
  });
  return { data: updated?.data };
};

export const handleMaterialMappingUpdate = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = materialMappingUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidMaterialMapping,
    errors: parsed.error.issues
  } };
  const auth = await rejectUnauthenticatedMutation(request, db, authSecret);
  if (!('user' in auth)) return auth;
  const { assessmentId, ...payload } = parsed.data;
  const persisted = await persistMaterialMappingUpdates(db, request, url, assessmentId, [payload], auth.user);
  if (persisted.status) return persisted;
  const saved = (persisted.data as { mappings: MaterialMappingEntry[] }).mappings[0];
  return { data: { success: true, message: MODULE2_D1_ROUTE_MESSAGES.materialMappingSaved, mapping: saved } };
};

export const handleBulkMaterialMappingUpdate = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = materialMappingBulkUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidMaterialMapping,
    errors: parsed.error.issues
  } };
  const auth = await rejectUnauthenticatedMutation(request, db, authSecret);
  if (!('user' in auth)) return auth;
  const { assessmentId, mappings }: MaterialMappingBulkUpdateInput = parsed.data;
  const persisted = await persistMaterialMappingUpdates(db, request, url, assessmentId, mappings, auth.user);
  if (persisted.status) return persisted;
  return { data: {
    success: true, message: MODULE2_D1_ROUTE_MESSAGES.materialMappingSaved,
    mappings: (persisted.data as { mappings: MaterialMappingEntry[] }).mappings
  } };
};

const persistMaterialMappingUpdates = async (
  db: CloudflareD1Database,
  request: Request,
  url: URL,
  assessmentId: string,
  payloads: Array<Omit<MaterialMappingUpdateInput, 'assessmentId' | 'reviewedBy'>>,
  reviewer: WorkerAuthIdentity
): Promise<WorkerD1Result> => {
  const scopedUrl = withAssessmentScope(url, assessmentId);
  const current = await handleScopedModule2Route(db, '/vendor-consolidation', request, scopedUrl);
  const report = current?.data as VendorConsolidationResult | undefined;
  const mappingById = new Map((report?.mappingRegister || []).map((item) => [item.sourceMaterialId, item]));
  if (payloads.some((payload) => !mappingById.has(payload.sourceMaterialId))) return { status: 404, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.materialMappingTargetNotFound
  } };
  const taxonomyCodes = [...new Set(payloads.map((payload) => payload.unspscCode))];
  const taxonomyRows = await db.prepare(`
    SELECT commodity_code, commodity_title, class_code, family_code, segment_code, taxonomy_version, core_bucket
    FROM UNSPSCCommodity WHERE commodity_code IN (${taxonomyCodes.map(() => '?').join(', ')})
  `).bind(...taxonomyCodes).all<Record<string, unknown>>();
  const taxonomyByCode = new Map((taxonomyRows.results || []).map((row) => [String(row.commodity_code), row]));
  if (payloads.some((payload) => !taxonomyByCode.has(payload.unspscCode))) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.materialMappingTaxonomyNotFound
  } };
  const now = new Date().toISOString();
  const updatedMappings = payloads.map((payload) => {
    const currentMapping = mappingById.get(payload.sourceMaterialId) as MaterialMappingEntry;
    const taxonomy = taxonomyByCode.get(payload.unspscCode) as Record<string, unknown>;
    return {
      ...currentMapping,
      assignedUnspscCode: String(taxonomy.commodity_code),
      assignedUnspscTitle: String(taxonomy.commodity_title),
      unspscSegment: String(taxonomy.segment_code),
      unspscFamily: String(taxonomy.family_code),
      unspscClass: String(taxonomy.class_code),
      unspscCommodity: String(taxonomy.commodity_code),
      taxonomyVersion: String(taxonomy.taxonomy_version),
      coreBucket: typeof taxonomy.core_bucket === 'string' ? taxonomy.core_bucket : undefined,
      mappingMethod: payload.mappingMethod || 'MANUAL_REVIEW_REQUIRED',
      confidenceScore: payload.confidenceScore ?? 1,
      evidence: payload.reviewStatus === 'PROVISIONAL'
        ? payload.auditNotes || 'Unreviewed classification suggestion generated from assessment data.'
        : 'UNSPSC commodity selected from the D1 taxonomy and approved by an authenticated reviewer.',
      reviewStatus: payload.reviewStatus,
      mappingDate: now,
      reviewedBy: reviewer.name,
      auditNotes: payload.auditNotes
    } satisfies MaterialMappingEntry;
  });
  const statements = updatedMappings.map((mapping) => db.prepare(`
    INSERT INTO AssessmentMaterialMapping (
      assessment_id, source_material_id, payload_json, reviewed_by, updated_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(assessment_id, source_material_id) DO UPDATE SET
      payload_json = excluded.payload_json, reviewed_by = excluded.reviewed_by,
      updated_at = excluded.updated_at
  `).bind(
    assessmentId, mapping.sourceMaterialId, JSON.stringify(mapping), reviewer.email, now
  ));
  await executeMaterialMappingStatements(db, statements);
  clearScopedModule2Cache();
  logger.info('Persisted D1 assessment material classifications', {
    assessmentId, mappingCount: updatedMappings.length,
    reviewerId: reviewer.id, reviewStatus: payloads[0]?.reviewStatus
  });
  return { data: { mappings: updatedMappings } };
};

export const procurementComplianceReport = async (
  db: CloudflareD1Database, request: Request, url: URL, assessmentId: string
): Promise<WorkerD1Result | null> => handleScopedModule2Route(
  db, '/procurement-compliance', request, withAssessmentScope(url, assessmentId)
);

export const handleProcurementComplianceReview = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = procurementComplianceReviewSchema.safeParse(await readJson(request));
  if (!parsed.success) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidComplianceReview,
    errors: parsed.error.issues
  } };
  const auth = await rejectUnauthenticatedMutation(request, db, authSecret);
  if (!('user' in auth)) return auth;
  const payload: ProcurementComplianceReviewInput = parsed.data;
  const current = await procurementComplianceReport(db, request, url, payload.assessmentId);
  if (!current) return {
    status: 409, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.complianceExceptionNotFound }
  };
  if (current.status && current.status >= 400) return current;
  const exception = (current.data as ProcurementComplianceResult).exceptions
    .find((item) => item.exceptionId === payload.candidateId);
  if (!exception) return { status: 404, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.complianceExceptionNotFound
  } };
  const reviewedAt = new Date().toISOString();
  const reviewId = `COMPLIANCE-REV-${crypto.randomUUID()}`;
  await db.prepare(`
    INSERT INTO Module2ComplianceReview (
      review_id, assessment_id, exception_id, reviewer_name, reviewer_role, review_date, status,
      technical_justification, corrective_action_plan, dismissal_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    reviewId, payload.assessmentId, payload.candidateId, auth.user.name,
    auth.user.role, reviewedAt, payload.status, payload.technicalJustification,
    payload.correctiveActionPlan || null, payload.dismissalReason || null
  ).run();
  const updated = await procurementComplianceReport(db, request, url, payload.assessmentId);
  logger.info('Persisted D1 procurement compliance review', {
    assessmentId: payload.assessmentId, exceptionId: payload.candidateId,
    reviewId, reviewerId: auth.user.id, status: payload.status
  });
  return { data: updated?.data };
};
