import { D1_LEVERS, D1_REPORTING, D1_ROUTE_MESSAGES, D1_TABLES, D1_UNCLASSIFIED_LINE_ITEM } from './constants/d1';
import type { CloudflareD1Database } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import { queryD1Rows as queryAll } from './services/workerD1Query';
import {
  d1DatasetScopeSchema, materialMappingBulkUpdateSchema, materialMappingUpdateSchema, specificationReviewSchema,
  procurementComplianceReviewSchema, eAuctionPlanningAssumptionSchema
} from './constants/validation';
import logger from './utils/logger';
import { clearScopedModule2Cache, handleScopedModule2Route } from './services/workerD1Module2Scoped';
import { authenticateWorkerUser } from './workerAuth';
import {
  MODULE2_D1_DIRECT_PRICE, MODULE2_D1_EAUCTION, MODULE2_D1_PENDING_ROUTES, MODULE2_D1_ROUTE_MESSAGES,
  MODULE2_D1_SCOPED_MESSAGES, MODULE2_D1_VOLUME_EXPORT
} from './constants/module2D1Scoped';
import { buildVolumeAggregationWorkbook } from './services/workerD1VolumeAggregationWorkbook';
import type { VolumeAggregationResult } from './types/module2VolumeAggregation';
import { buildEAuctionWorkbook } from './services/workerD1EAuctionWorkbook';
import type { EAuctionResult } from './types/module2EAuction';
import { buildDirectPriceWorkbook } from './services/workerD1DirectPriceWorkbook';
import type { DirectPriceImprovementResult } from './types/module2DirectPriceImprovement';
import { MODULE2_D1_PAYMENT_TERMS } from './constants/module2PaymentTermsD1';
import { buildPaymentTermsWorkbook } from './services/workerD1PaymentTermsWorkbook';
import type { PaymentTermsResult } from './types/module2PaymentTerms';
import { MODULE2_D1_VENDOR_CONSOLIDATION } from './constants/module2VendorConsolidationD1';
import { buildVendorConsolidationWorkbook } from './services/workerD1VendorConsolidationWorkbook';
import type { VendorConsolidationResult } from './types/module2VendorConsolidation';
import { MODULE2_D1_CATEGORY_SPECIALISATION } from './constants/module2CategorySpecialisationD1';
import type { CategorySpecialisationResult } from './types/module2CategorySpecialisation';
import { buildCategorySpecialisationWorkbook } from './services/workerD1CategorySpecialisationWorkbook';
import { MODULE2_D1_SPECIFICATION_RATIONALISATION } from './constants/module2SpecificationRationalisationD1';
import type { SpecificationRationalisationResult } from './types/module2SpecificationRationalisation';
import { buildSpecificationRationalisationWorkbook } from './services/workerD1SpecificationRationalisationWorkbook';
import { applySpecificationReviewHistory, loadSpecificationReviewHistory } from './services/workerD1SpecificationReviews';
import type { MaterialMappingEntry } from './types/module2MaterialMapping';
import { MODULE2_D1_COMPLIANCE } from './constants/module2ProcurementComplianceD1';
import { buildProcurementComplianceWorkbook } from './services/workerD1ProcurementComplianceWorkbook';
import type { ProcurementComplianceResult } from './types/module2ProcurementCompliance';
import {
  loadEAuctionPlanningAssumptions, saveEAuctionPlanningAssumption
} from './services/workerD1EAuctionPlanningAssumptions';
import { loadAssessmentMaterialMappings } from './services/workerD1MaterialMappings';

const queryFirst = async <T = D1Record>(db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<T | null> => {
  const statement = db.prepare(sql);
  const bound = values.length > 0 ? statement.bind(...values) : statement;
  return bound.first<T>();
};

const numberValue = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);

const toLineItem = (row: D1Record, mapping?: MaterialMappingEntry): D1Record => ({
  ...D1_UNCLASSIFIED_LINE_ITEM,
  mapping_id: row.transaction_id, line_item_id: row.transaction_id,
  material_code: row.material_code, material_desc: row.short_text, raw_desc: row.short_text,
  vendor_identified: row.supplier_name, master_supplier_id: row.supplier_code,
  ...(mapping ? {
    unspsc_code: mapping.assignedUnspscCode,
    unspsc_category_name: mapping.assignedUnspscTitle,
    unspsc_commodity_title: mapping.assignedUnspscTitle,
    core_bucket: mapping.coreBucket || '',
    status: mapping.reviewStatus === 'CLIENT_APPROVED' || mapping.reviewStatus === 'TAXONOMY_VERIFIED'
      ? 'Confirmed' : 'Pending Review'
  } : {}),
  unit_price: numberValue(row.net_price), qty: numberValue(row.order_quantity),
  total_spend: numberValue(row.total_inr_raw), amount_inr: numberValue(row.total_inr_raw),
  inr_crores: numberValue(row.total_inr_raw) / D1_REPORTING.inrPerCrore,
  raw_currency: row.currency, invoice_date: row.document_date_raw, po_number: row.po_number
});

const buildDashboardData = (
  categories: D1Record[],
  opportunities: D1Record[],
  topVendors: D1Record[],
  tenantSpend: number,
  assessment: D1Record | null
): Record<string, unknown> => {
  const totalSavings = opportunities.reduce((total, row) => total + numberValue(row.est_savings_inr_cr), 0);
  const totalSpend = tenantSpend;
  const leverSpend = (lever: RegExp): number => opportunities.filter((row) => lever.test(String(row.lever)))
    .reduce((total, row) => total + numberValue(row.current_spend_inr_cr), 0);
  const leverSavings = (lever: RegExp): number => opportunities.filter((row) => lever.test(String(row.lever)))
    .reduce((total, row) => total + numberValue(row.est_savings_inr_cr), 0);
  const auctionSpend = leverSpend(D1_LEVERS.eauction);
  const auctionSavings = leverSavings(D1_LEVERS.eauction);
  const consolidationSpend = leverSpend(D1_LEVERS.consolidation);
  const consolidationSavings = leverSavings(D1_LEVERS.consolidation);
  const volumeSpend = leverSpend(D1_LEVERS.volume);
  const volumeSavings = leverSavings(D1_LEVERS.volume);
  const overlap = assessment ? numberValue(assessment.overlap_deductions_cr) : 0;
  const netSavings = assessment ? numberValue(assessment.net_defensible_opportunity_cr) : totalSavings;

  return {
    totalEvaluatedSpendCr: totalSpend,
    totalIdentifiedSavingsCr: Number(totalSavings.toFixed(D1_REPORTING.decimalPlaces)),
    savingsYieldPct: totalSpend > 0 ? Number((totalSavings / totalSpend * 100).toFixed(D1_REPORTING.decimalPlaces)) : 0,
    categoriesCount: categories.length,
    opportunitiesCount: opportunities.length,
    topVendorsCount: topVendors.length,
    categories,
    opportunities,
    topVendors,
    totalAddressableSpendInr: totalSpend * D1_REPORTING.inrPerCrore,
    totalAddressableSpendInrCr: totalSpend,
    eauctionAddressableSpendInr: auctionSpend * D1_REPORTING.inrPerCrore,
    eauctionAddressableSpendInrCr: auctionSpend,
    totalPotentialEAuctionOpportunityInr: auctionSavings * D1_REPORTING.inrPerCrore,
    totalPotentialEAuctionOpportunityInrCr: auctionSavings,
    vendorConsolidationAddressableSpendInr: consolidationSpend * D1_REPORTING.inrPerCrore,
    vendorConsolidationAddressableSpendInrCr: consolidationSpend,
    totalPotentialConsolidationOpportunityInr: consolidationSavings * D1_REPORTING.inrPerCrore,
    totalPotentialConsolidationOpportunityInrCr: consolidationSavings,
    volumeBundlingAddressableSpendInr: volumeSpend * D1_REPORTING.inrPerCrore,
    volumeBundlingAddressableSpendInrCr: volumeSpend,
    volumeBundlingQuantifiableBenefitInr: volumeSavings * D1_REPORTING.inrPerCrore,
    volumeBundlingQuantifiableBenefitInrCr: volumeSavings,
    grossQuantifiableBenefitInr: totalSavings * D1_REPORTING.inrPerCrore,
    grossQuantifiableBenefitInrCr: Number(totalSavings.toFixed(D1_REPORTING.decimalPlaces)),
    totalOverlappingOpportunityInr: overlap * D1_REPORTING.inrPerCrore,
    totalOverlappingOpportunityInrCr: overlap,
    netQuantifiableOpportunityInr: netSavings * D1_REPORTING.inrPerCrore,
    netQuantifiableOpportunityInrCr: netSavings,
    overallDataConfidence: opportunities.length ? 'HIGH' : 'INSUFFICIENT_DATA'
  };
};

const readRequestBody = async (request: Request): Promise<unknown> => {
  try { return await request.json(); } catch { return null; }
};

const withAssessmentScope = (url: URL, assessmentId: string): URL => {
  const scopedUrl = new URL(url);
  scopedUrl.searchParams.set('assessmentId', assessmentId);
  return scopedUrl;
};

const rejectUnauthenticatedMutation = async (
  request: Request, db: CloudflareD1Database, authSecret?: string
): Promise<{ user: { id: string; name: string; email: string; role: 'USER' | 'ADMIN' } } | WorkerD1Result> => {
  const authentication = await authenticateWorkerUser(request, { DB: db, AUTH_SECRET: authSecret });
  return authentication.user ? { user: authentication.user } : {
    status: authentication.status,
    data: { success: false, message: authentication.message || 'Authentication required.' }
  };
};

const specificationReport = async (
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

const handleSpecificationReview = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = specificationReviewSchema.safeParse(await readRequestBody(request));
  if (!parsed.success) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidSpecificationReview,
    errors: parsed.error.issues
  } };
  const auth = await rejectUnauthenticatedMutation(request, db, authSecret);
  if (!('user' in auth)) return auth;
  const payload = parsed.data;
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

const handleMaterialMappingUpdate = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = materialMappingUpdateSchema.safeParse(await readRequestBody(request));
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

const handleBulkMaterialMappingUpdate = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = materialMappingBulkUpdateSchema.safeParse(await readRequestBody(request));
  if (!parsed.success) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidMaterialMapping,
    errors: parsed.error.issues
  } };
  const auth = await rejectUnauthenticatedMutation(request, db, authSecret);
  if (!('user' in auth)) return auth;
  const { assessmentId, mappings } = parsed.data;
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
  payloads: Array<{
    sourceMaterialId: string;
    unspscCode: string;
    reviewStatus: 'PROVISIONAL' | 'CLIENT_APPROVED' | 'TAXONOMY_VERIFIED';
    confidenceScore?: number;
    mappingMethod?: MaterialMappingEntry['mappingMethod'];
    auditNotes?: string;
  }>,
  reviewer: { id: string; name: string; email: string }
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
  if (db.batch) await db.batch(statements);
  else await Promise.all(statements.map((statement) => statement.run()));
  clearScopedModule2Cache();
  logger.info('Persisted D1 assessment material classifications', {
    assessmentId, mappingCount: updatedMappings.length,
    reviewerId: reviewer.id, reviewStatus: payloads[0]?.reviewStatus
  });
  return { data: { mappings: updatedMappings } };
};

const procurementComplianceReport = async (
  db: CloudflareD1Database, request: Request, url: URL, assessmentId: string
): Promise<WorkerD1Result | null> => handleScopedModule2Route(
  db, '/procurement-compliance', request, withAssessmentScope(url, assessmentId)
);

const handleProcurementComplianceReview = async (
  db: CloudflareD1Database, request: Request, url: URL, authSecret?: string
): Promise<WorkerD1Result> => {
  const parsed = procurementComplianceReviewSchema.safeParse(await readRequestBody(request));
  if (!parsed.success) return { status: 400, data: {
    success: false, message: MODULE2_D1_ROUTE_MESSAGES.invalidComplianceReview,
    errors: parsed.error.issues
  } };
  const auth = await rejectUnauthenticatedMutation(request, db, authSecret);
  if (!('user' in auth)) return auth;
  const payload = parsed.data;
  const current = await procurementComplianceReport(db, request, url, payload.assessmentId);
  if (!current || (current.status && current.status >= 400)) return current || {
    status: 409, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.complianceExceptionNotFound }
  };
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

export const handleModule2Route = async (
  db: CloudflareD1Database | undefined,
  subPath: string,
  request: Request,
  url: URL,
  authSecret?: string
): Promise<WorkerD1Result> => {
  if (!db) throw new Error('Cloudflare D1 binding DB is not configured');
  await db.prepare('SELECT 1 AS ok').first();

  const normalized = subPath.replace(/^\/(sourcing|levers)/, '') || '/';
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
    return handleSpecificationReview(db, request, url, authSecret);
  }
  if (normalized === '/vendor-consolidation/mappings/update') {
    if (request.method !== 'POST') return {
      status: 405, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired }
    };
    return handleMaterialMappingUpdate(db, request, url, authSecret);
  }
  if (normalized === '/vendor-consolidation/mappings/bulk-update') {
    if (request.method !== 'POST') return {
      status: 405, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired }
    };
    return handleBulkMaterialMappingUpdate(db, request, url, authSecret);
  }
  if (normalized.startsWith('/procurement-compliance')) {
    if (normalized === '/procurement-compliance/review') {
      if (request.method !== 'POST') return { status: 405, data: {
        success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired
      } };
      return handleProcurementComplianceReview(db, request, url, authSecret);
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
  if (normalized.startsWith('/specification-rationalisation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/specification-rationalisation' && normalized !== '/specification-rationalisation/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await specificationReport(db, request, url, assessmentId);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/specification-rationalisation') return report;
    const workbook = buildSpecificationRationalisationWorkbook(
      report.data as SpecificationRationalisationResult
    );
    const filename = `${MODULE2_D1_SPECIFICATION_RATIONALISATION.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_SPECIFICATION_RATIONALISATION.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized.startsWith('/category-specialisation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/category-specialisation' && normalized !== '/category-specialisation/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, '/category-specialisation', request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/category-specialisation') return report;
    const workbook = buildCategorySpecialisationWorkbook(report.data as CategorySpecialisationResult);
    const filename = `${MODULE2_D1_CATEGORY_SPECIALISATION.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_CATEGORY_SPECIALISATION.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized === '/export') {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    return await handleScopedModule2Route(db, normalized, request, url) ?? {
      status: 501, data: { success: false, message: MODULE2_D1_SCOPED_MESSAGES.unavailable }
    };
  }
  if (normalized.startsWith('/volume-aggregation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized === '/volume-aggregation/export-excel') {
      const report = await handleScopedModule2Route(db, '/volume-aggregation', request, url);
      if (!report) {
        return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
      }
      if (report.status && report.status >= 400) return report;
      if (typeof report.data !== 'object' || report.data === null) return {
        status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown }
      };
      const file = buildVolumeAggregationWorkbook(report.data as VolumeAggregationResult);
      const filename = `${MODULE2_D1_VOLUME_EXPORT.FILENAME_PREFIX}${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
      return { data: null, response: new Response(file, { status: 200, headers: {
        'Content-Type': MODULE2_D1_VOLUME_EXPORT.MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`
      } }) };
    }
  }
  if (normalized.startsWith('/e-auction')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized === '/e-auction/export-excel') {
      const report = await handleScopedModule2Route(db, '/e-auction', request, url);
      if (!report || typeof report.data !== 'object' || report.data === null) {
        return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
      }
      if (report.status && report.status >= 400) return report;
      const data = { ...(report.data as EAuctionResult),
        planningAssumptions: await loadEAuctionPlanningAssumptions(db) };
      const file = buildEAuctionWorkbook(data);
      const filename = `${MODULE2_D1_EAUCTION.EXPORT.FILENAME_PREFIX}${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
      return { data: null, response: new Response(file, { status: 200, headers: {
        'Content-Type': MODULE2_D1_EAUCTION.EXPORT.MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`
      } }) };
    }
  }
  if (normalized.startsWith('/direct-price-improvement')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized === '/direct-price-improvement/export-excel') {
      const report = await handleScopedModule2Route(db, '/direct-price-improvement', request, url);
      if (!report || typeof report.data !== 'object' || report.data === null) {
        return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
      }
      if (report.status && report.status >= 400) return report;
      const file = buildDirectPriceWorkbook(report.data as DirectPriceImprovementResult);
      const filename = `${MODULE2_D1_DIRECT_PRICE.EXPORT.FILENAME_PREFIX}${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
      return { data: null, response: new Response(file, { status: 200, headers: {
        'Content-Type': MODULE2_D1_DIRECT_PRICE.EXPORT.MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`
      } }) };
    }
  }
  if (normalized.startsWith('/payment-terms')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/payment-terms' && normalized !== '/payment-terms/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, '/payment-terms', request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/payment-terms') return report;
    const workbook = buildPaymentTermsWorkbook(report.data as PaymentTermsResult);
    const filename = `${MODULE2_D1_PAYMENT_TERMS.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_PAYMENT_TERMS.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized.startsWith('/vendor-consolidation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/vendor-consolidation' && normalized !== '/vendor-consolidation/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, '/vendor-consolidation', request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/vendor-consolidation') return report;
    const workbook = buildVendorConsolidationWorkbook(report.data as VendorConsolidationResult);
    const filename = `${MODULE2_D1_VENDOR_CONSOLIDATION.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_VENDOR_CONSOLIDATION.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized.startsWith('/alternate-sourcing')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/alternate-sourcing') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, normalized, request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    return report;
  }
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

  if (normalized.startsWith('/overview') || normalized.startsWith('/dashboard')) {
    const [categories, opportunities, topVendors, tenant, assessment] = await Promise.all([
      queryAll(db, `SELECT * FROM ${D1_TABLES.categories} ORDER BY spend_inr_crores DESC`),
      queryAll(db, `SELECT * FROM ${D1_TABLES.opportunities} ORDER BY est_savings_inr_cr DESC`),
      queryAll(db, `SELECT * FROM ${D1_TABLES.vendors} ORDER BY total_3yr_spend_inr_cr DESC LIMIT 10`),
      queryFirst(db, `SELECT * FROM ${D1_TABLES.tenant} ORDER BY created_at ASC LIMIT 1`),
      queryFirst(db, `SELECT overlap_deductions_cr, net_defensible_opportunity_cr FROM ${D1_TABLES.assessments} ORDER BY created_at ASC LIMIT 1`)
    ]);
    const tenantSpend = numberValue(tenant?.total_spend_evaluated_inr);
    return { data: buildDashboardData(categories, opportunities, topVendors, tenantSpend, assessment) };
  }

  if (normalized.startsWith('/categories') || normalized.startsWith('/profiles')) {
    const profiles = await queryAll(db, `SELECT * FROM ${D1_TABLES.categories} ORDER BY spend_inr_crores DESC`);
    return { data: { profiles, count: profiles.length } };
  }

  if (normalized.startsWith('/category/')) {
    const catId = decodeURIComponent(normalized.slice('/category/'.length));
    const profile = await queryFirst(db, `SELECT * FROM ${D1_TABLES.categories} WHERE id = ? OR name = ?`, [catId, catId]);
    return { data: profile };
  }

  if (normalized.startsWith('/suppliers') || normalized.startsWith('/top-50-vendors') || normalized.startsWith('/top50-vendors')) {
    const suppliers = await queryAll(db, `SELECT * FROM ${D1_TABLES.vendors} ORDER BY total_3yr_spend_inr_cr DESC LIMIT 50`);
    return { data: { suppliers, count: suppliers.length } };
  }

  if (normalized.startsWith('/opportunities') || normalized.startsWith('/opportunity-ledger')) {
    const opportunities = await queryAll(db, `SELECT * FROM ${D1_TABLES.opportunities} ORDER BY est_savings_inr_cr DESC`);
    return { data: opportunities };
  }

  if (normalized.startsWith('/waterfall') || normalized.startsWith('/bridge')) {
    return { data: await queryAll(db, `SELECT * FROM ${D1_TABLES.funnel} ORDER BY phase_num ASC`) };
  }

  if (normalized.startsWith('/canonical-input') || normalized.startsWith('/line-items')) {
    const scope = d1DatasetScopeSchema.safeParse({
      assessmentId: url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id') ?? undefined,
      tenantId: url.searchParams.get('tenantId') ?? request.headers.get('x-tenant-id') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined
    });
    if (!scope.success) {
      logger.warn('D1 dataset scope validation failed', {
        errors: scope.error.issues, requestId: request.headers.get('x-request-id')
      });
      return { status: 400, data: {
        success: false, message: D1_ROUTE_MESSAGES.invalidDatasetScope, errors: scope.error.issues
      } };
    }
    const { assessmentId, tenantId, limit } = scope.data;
    const filters = [assessmentId ? 'assessment_id = ?' : 'assessment_id IS NULL'];
    const values: unknown[] = assessmentId ? [assessmentId] : [];
    if (tenantId) { filters.push('tenant_id = ?'); values.push(tenantId); }
    values.push(limit);
    const items = await queryAll(db,
      `SELECT transaction_id, po_number, supplier_code, supplier_name, material_code, short_text, total_inr_raw, ` +
      'net_price, currency, order_quantity, document_date_raw ' +
      `FROM ${D1_TABLES.transactions} WHERE ${filters.join(' AND ')} ORDER BY source_row_number ASC LIMIT ?`, values);
    if (!normalized.startsWith('/line-items')) return { data: items };
    const savedMappings = assessmentId ? await loadAssessmentMaterialMappings(db, assessmentId) : [];
    const mappingByMaterial = new Map(savedMappings.map((mapping) => [mapping.sourceMaterialId, mapping]));
    return { data: { lineItems: items.map((item) => {
      const key = String(item.material_code || '').trim().toLocaleUpperCase('en-US');
      return toLineItem(item, mappingByMaterial.get(key));
    }) } };
  }

  if (normalized.startsWith('/handoff')) {
    return { status: 409, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.handoffScope } };
  }

  if (normalized.startsWith('/consolidated-savings')) {
    const opportunities = await queryAll(db, `SELECT * FROM ${D1_TABLES.opportunities} ORDER BY est_savings_inr_cr DESC`);
    return { data: { success: true, opportunities, count: opportunities.length } };
  }

  return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
};
