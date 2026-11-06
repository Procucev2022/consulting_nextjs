import { D1_TABLES } from './constants/d1';
import { ASSESSMENT_STATUSES, DATA_STATUSES } from './constants/assessment';
import type { CloudflareD1Database } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import {
  ASSESSMENT_D1_ACTION_METHODS, ASSESSMENT_D1_DEFAULT_ACTORS, ASSESSMENT_D1_LIFECYCLE_ACTIONS,
  ASSESSMENT_D1_MESSAGES, ASSESSMENT_REVIEW_GATE_KEYS, ASSESSMENT_REVIEW_GATE_STATUSES
} from './constants/assessmentD1';
import {
  ASSESSMENT_DATA_VERSION_JSON_MAX_BYTES,
  assessmentReviewGateUpdateSchema, createAssessmentSchema
} from './constants/assessmentValidation';
import type { CloudflareEnvironment } from './types/cloudflare';
import { uploadAssessmentDataVersion, validateAssessmentDataVersion } from './services/assessmentDataVersionD1';
import { handleAssessmentLifecycleAction } from './services/assessmentLifecycleD1';
import type {
  AssessmentLifecycleActionContext, AssessmentSnapshotReadContext
} from './types/assessmentDataVersionD1';
import {
  mapD1Assessment, mapD1DataVersion, mapD1AnalysisRun, mapD1AuditLog,
  loadAssessmentSnapshots, loadAssessmentSnapshotsForIds, mapD1SnapshotCollection
} from './services/assessmentD1Mappers';
import { runAssessmentAnalysisFromD1 } from './services/assessmentAnalysisD1';
import { runStatements } from './services/assessmentDataVersionD1Helpers';
import { queryAll, queryFirst } from './services/assessmentD1Queries';
import { handleCustomerRoute } from './workerD1AssessmentCustomers';
import { readJson } from './workerHttp';
import logger from './utils/logger';
import { authenticateWorkerUser } from './workerAuth';

const loadScopedSnapshots = async (
  db: CloudflareD1Database,
  entryType: 'customer' | 'assessment',
  ids: string[],
  context?: AssessmentSnapshotReadContext
): Promise<Map<string, D1Record>> => loadAssessmentSnapshotsForIds(db, entryType, ids, context);

const loadReviewGates = async (db: CloudflareD1Database, assessmentId: string): Promise<D1Record[]> => {
  const rows = await queryAll<D1Record>(db,
    `SELECT gate_key, status, evidence_reference, review_note, reviewed_by, reviewed_at
      FROM ${D1_TABLES.assessmentReviewGates} WHERE assessment_id = ?`, [assessmentId]);
  const byKey = new Map(rows.map((row) => [String(row.gate_key), row]));
  return ASSESSMENT_REVIEW_GATE_KEYS.map((gateKey) => {
    const row = byKey.get(gateKey);
    return {
      assessmentId,
      gateKey,
      status: row && ASSESSMENT_REVIEW_GATE_STATUSES.includes(row.status as (typeof ASSESSMENT_REVIEW_GATE_STATUSES)[number])
        ? row.status : 'PENDING',
      evidenceReference: row?.evidence_reference ?? null,
      reviewNote: row?.review_note ?? null,
      reviewedBy: row?.reviewed_by ?? null,
      reviewedAt: row?.reviewed_at ?? null
    };
  });
};

const handleReviewGates = async (
  db: CloudflareD1Database,
  assessmentId: string,
  request: Request,
  environment: CloudflareEnvironment
): Promise<WorkerD1Result> => {
  const authentication = request.method === 'GET'
    ? null
    : await authenticateWorkerUser(request, environment, true);
  if (authentication !== null && !authentication.user) {
    return {
      status: authentication.status,
      data: { success: false, message: authentication.message || ASSESSMENT_D1_MESSAGES.reviewGatePermissionDenied }
    };
  }
  const assessment = await queryFirst<D1Record>(db,
    `SELECT assessment_id FROM ${D1_TABLES.assessments} WHERE assessment_id = ?`, [assessmentId]);
  if (!assessment) return { status: 404, data: { success: false, message: ASSESSMENT_D1_MESSAGES.reviewGateNotFound(assessmentId) } };
  if (request.method === 'GET') return { data: await loadReviewGates(db, assessmentId) };

  const reviewer = authentication?.user;
  if (!reviewer) return { status: 401, data: { success: false, message: ASSESSMENT_D1_MESSAGES.reviewGatePermissionDenied } };
  const body: unknown = await readJson(request);
  const parsed = assessmentReviewGateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, data: { success: false, message: ASSESSMENT_D1_MESSAGES.reviewGateValidation, errors: parsed.error.issues } };
  }
  const actorEmail = reviewer.email;
  const actorRole = reviewer.role;
  const now = new Date().toISOString();
  const { gateKey, status, evidenceReference, reviewNote } = parsed.data;
  const reviewedAt = status === 'PENDING' ? null : now;
  const reviewedBy = status === 'PENDING' ? null : actorEmail;
  const evidence = status === 'PENDING' ? null : evidenceReference || null;
  const note = status === 'PENDING' ? null : reviewNote || null;
  const update = db.prepare(`
    INSERT INTO ${D1_TABLES.assessmentReviewGates} (
      assessment_id, gate_key, status, evidence_reference, review_note, reviewed_by, reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(assessment_id, gate_key) DO UPDATE SET
      status = excluded.status, evidence_reference = excluded.evidence_reference,
      review_note = excluded.review_note, reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at
  `).bind(assessmentId, gateKey, status, evidence, note, reviewedBy, reviewedAt);
  const audit = db.prepare(`
    INSERT INTO ${D1_TABLES.auditLogs} (id, assessment_id, actor_email, actor_role, action, details_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    `AUD-${globalThis.crypto.randomUUID()}`, assessmentId, actorEmail, actorRole, 'REVIEW_GATE_UPDATED',
    JSON.stringify({ gateKey, status, evidenceReference: evidence, reviewNote: note })
  );
  await runStatements(db, [update, audit]);
  logger.info('Assessment review gate updated', {
    assessmentId, gateKey, status, actorEmail, requestId: request.headers.get('x-request-id') || undefined
  });
  return { data: await loadReviewGates(db, assessmentId) };
};

const getOperatingModeData = (): Record<string, unknown> => ({
  mode: 'INTERNAL_ASSESSMENT',
  isInternalAssessment: true,
  isPublicSaaS: false,
  workspaceTitle: 'Consulting Command Centre',
  phaseName: 'Phase 1: Diagnostic Assessment',
  features: {
    publicRegistration: false,
    tierUpgrade: false,
    subscriptionPurchase: false,
    customerSelfOnboarding: false,
    customerSaaSDashboard: false,
    assessmentCentre: true
  },
  allowedRoles: ['INTERNAL_ADMIN', 'INTERNAL_LEAD_PARTNER', 'INTERNAL_SENIOR_ANALYST', 'CLIENT_STAKEHOLDER']
});

const handleAssessmentAction = async (
  db: CloudflareD1Database,
  assessmentId: string,
  action: string,
  request: Request,
  environment: CloudflareEnvironment,
  tenantId: string,
  artifactId?: string
): Promise<WorkerD1Result> => {
  const allowedMethods = ASSESSMENT_D1_ACTION_METHODS[action];
  if (!allowedMethods) return { status: 404, data: { success: false, message: ASSESSMENT_D1_MESSAGES.unknownAction } };
  if (!allowedMethods.includes(request.method)) return {
    status: 405, data: { success: false, message: ASSESSMENT_D1_MESSAGES.unsupportedMethod }
  };
  const ownedAssessment = await queryFirst<D1Record>(db,
    `SELECT assessment_id FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [assessmentId, tenantId]);
  if (!ownedAssessment) return { status: 404, data: { success: false, message: ASSESSMENT_D1_MESSAGES.missingRecord(assessmentId) } };
  if (action === 'run-module1' || action === 'run-analysis') {
    return runAssessmentAnalysisFromD1({
      db, environment, assessmentId, body: await readJson(request),
      requestId: request.headers.get('x-request-id') || undefined
    }, action === 'run-module1' ? 'module1' : 'full');
  }
  if (action === 'review-gates') return handleReviewGates(db, assessmentId, request, environment);
  if (action === 'upload' || action === 'validate') {
    const body: unknown = action === 'upload'
      ? await readJson(request, ASSESSMENT_DATA_VERSION_JSON_MAX_BYTES)
      : await readJson(request);
    const context = {
      db,
      environment,
      assessmentId,
      body,
      requestId: request.headers.get('x-request-id') || undefined
    };
    return action === 'upload'
      ? uploadAssessmentDataVersion(context)
      : validateAssessmentDataVersion(context);
  }
  if (ASSESSMENT_D1_LIFECYCLE_ACTIONS.has(action)) {
    if (action === 'delivery-package' && artifactId) {
      if (request.method !== 'GET') return {
        status: 405, data: { success: false, message: ASSESSMENT_D1_MESSAGES.unsupportedMethod }
      };
      const artifactContext: AssessmentLifecycleActionContext = {
        db, environment, assessmentId, action, body: {},
        actorEmail: request.headers.get('x-user-email') || ASSESSMENT_D1_DEFAULT_ACTORS.internalAdminEmail,
        actorRole: request.headers.get('x-user-role') || ASSESSMENT_D1_DEFAULT_ACTORS.internalAdminRole,
        requestId: request.headers.get('x-request-id') || undefined
      };
      return handleAssessmentLifecycleAction(artifactContext, decodeURIComponent(artifactId));
    }
    const body: unknown = request.method === 'GET' ? {} : await readJson(request);
    const defaultActor = action === 'accept'
      ? { email: ASSESSMENT_D1_DEFAULT_ACTORS.customerEmail, role: ASSESSMENT_D1_DEFAULT_ACTORS.customerRole }
      : action === 'approve'
        ? { email: ASSESSMENT_D1_DEFAULT_ACTORS.analystEmail, role: ASSESSMENT_D1_DEFAULT_ACTORS.analystRole }
        : { email: ASSESSMENT_D1_DEFAULT_ACTORS.internalAdminEmail, role: ASSESSMENT_D1_DEFAULT_ACTORS.internalAdminRole };
    const context: AssessmentLifecycleActionContext = {
      db,
      environment,
      assessmentId,
      action: action as AssessmentLifecycleActionContext['action'],
      body,
      actorEmail: request.headers.get('x-user-email') || defaultActor.email,
      actorRole: request.headers.get('x-user-role') || defaultActor.role,
      requestId: request.headers.get('x-request-id') || undefined
    };
    return handleAssessmentLifecycleAction(context);
  }
  if (action === 'nda' && (request.method === 'PATCH' || request.method === 'POST')) {
    const body = await readJson(request) as D1Record;
    const ndaStatus = typeof body.ndaStatus === 'string' ? body.ndaStatus : 'SIGNED';
    await db.prepare(`UPDATE ${D1_TABLES.assessments} SET nda_status = ?, updated_at = CURRENT_TIMESTAMP WHERE assessment_id = ? AND tenant_id = ?`).bind(ndaStatus, assessmentId, tenantId).run();
    const updated = await queryFirst(db, `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [assessmentId, tenantId]);
    const snapshots = await loadAssessmentSnapshots(db, 'assessment', assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId, assessmentId
    });
    return { data: updated ? mapD1Assessment(updated, snapshots.get(assessmentId)) : null };
  }

  if (action === 'data-status' && (request.method === 'PATCH' || request.method === 'POST')) {
    const body = await readJson(request) as D1Record;
    const dataStatus = typeof body.dataStatus === 'string' ? body.dataStatus : 'VALIDATED';
    await db.prepare(`UPDATE ${D1_TABLES.assessments} SET data_status = ?, updated_at = CURRENT_TIMESTAMP WHERE assessment_id = ? AND tenant_id = ?`).bind(dataStatus, assessmentId, tenantId).run();
    const updated = await queryFirst(db, `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [assessmentId, tenantId]);
    const snapshots = await loadAssessmentSnapshots(db, 'assessment', assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId, assessmentId
    });
    return { data: updated ? mapD1Assessment(updated, snapshots.get(assessmentId)) : null };
  }

  if (action === 'audit') {
    const records = await queryAll(db, `SELECT * FROM ${D1_TABLES.auditLogs} WHERE assessment_id = ? ORDER BY timestamp DESC`, [assessmentId]);
    const snapshots = await loadAssessmentSnapshots(db, 'audit', assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId, assessmentId
    });
    return { data: mapD1SnapshotCollection(records, snapshots, mapD1AuditLog) };
  }

  const [assessment, versions, runs, auditLogs, snapshots, versionSnapshots, runSnapshots, auditSnapshots] = await Promise.all([
    queryFirst(db, `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [assessmentId, tenantId]),
    queryAll(db, `SELECT * FROM ${D1_TABLES.dataVersions} WHERE assessment_id = ?`, [assessmentId]),
    queryAll(db, `SELECT * FROM ${D1_TABLES.analysisRuns} WHERE assessment_id = ?`, [assessmentId]),
    queryAll(db, `SELECT * FROM ${D1_TABLES.auditLogs} WHERE assessment_id = ? ORDER BY timestamp DESC`, [assessmentId]),
    loadAssessmentSnapshots(db, 'assessment', assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId, assessmentId
    }),
    loadAssessmentSnapshots(db, 'version', assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId, assessmentId
    }),
    loadAssessmentSnapshots(db, 'run', assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId, assessmentId
    }),
    loadAssessmentSnapshots(db, 'audit', assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId, assessmentId
    })
  ]);
  if (!assessment) return { data: { success: false, message: `Assessment ${assessmentId} not found` }, status: 404 };
  return { data: {
    assessment: mapD1Assessment(assessment, snapshots.get(assessmentId)),
    versions: mapD1SnapshotCollection(versions, versionSnapshots, mapD1DataVersion),
    runs: mapD1SnapshotCollection(runs, runSnapshots, mapD1AnalysisRun),
    auditLogs: mapD1SnapshotCollection(auditLogs, auditSnapshots, mapD1AuditLog)
  } };
};

export const handleAssessmentRoute = async (
  db: CloudflareD1Database | undefined,
  subPath: string,
  request: Request,
  _url: URL,
  environment: CloudflareEnvironment = {}
): Promise<WorkerD1Result> => {
  if (!db) throw new Error('Cloudflare D1 binding DB is not configured');

  if (subPath === '/mode' || subPath.startsWith('/mode/')) return { data: getOperatingModeData() };
  if (subPath === '/system-info') {
    await db.prepare('SELECT 1 AS ok').first();
    return { data: { appVersion: '2.4.0', buildNumber: 'PROCUCEV-BUILD-2026.10', runtime: 'Cloudflare Workers (Edge)', d1Connected: true } };
  }

  const tenantId = environment.REQUEST_TENANT_ID;
  if (!tenantId) {
    logger.warn('Assessment request rejected because tenant scope is unavailable', {
      requestId: request.headers.get('x-request-id') || undefined,
      path: new URL(request.url).pathname
    });
    return { status: 403, data: { success: false, message: ASSESSMENT_D1_MESSAGES.tenantScopeRequired } };
  }

  if (subPath.startsWith('/customers')) return handleCustomerRoute(db, subPath, request, tenantId);

  if (subPath === '' || subPath === '/' || subPath.startsWith('/list')) {
    if (request.method === 'POST') {
      const parsed = createAssessmentSchema.safeParse(await readJson(request));
      if (!parsed.success) return { status: 400, data: { success: false, message: ASSESSMENT_D1_MESSAGES.assessmentValidation, errors: parsed.error.issues } };
      const body = parsed.data;
      const id = body.assessmentId || `AIC-${globalThis.crypto.randomUUID()}`;
      let customerId = body.customerId;
      let createdCustomerId: string | undefined;
      if (customerId) {
        const existingCustomer = await queryFirst<D1Record>(db,
          `SELECT customer_id, customer_name, industry, business_unit, company_website
            FROM ${D1_TABLES.customers} WHERE customer_id = ? AND tenant_id = ? AND status = 'ACTIVE'`, [customerId, tenantId]);
        if (!existingCustomer) return { status: 404, data: { success: false, message: ASSESSMENT_D1_MESSAGES.customerNotFound(customerId) } };
        body.customerName = String(existingCustomer.customer_name);
        body.industry = String(existingCustomer.industry);
        body.businessUnit = String(existingCustomer.business_unit || body.businessUnit || 'Default BU');
        body.companyWebsite = String(existingCustomer.company_website || body.companyWebsite || '');
      } else {
        customerId = `CUST-${globalThis.crypto.randomUUID()}`;
        createdCustomerId = customerId;
      }
      const assessmentInsert = db.prepare(`
        INSERT INTO ${D1_TABLES.assessments} (
          assessment_id, tenant_id, customer_id, customer_name, industry, business_unit, company_website,
          assessment_owner, currency, assessment_period_start, assessment_period_end, data_received_at,
          nda_status, data_status, assigned_analyst, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, tenantId, customerId, body.customerName, body.industry, body.businessUnit || 'Default BU',
        body.companyWebsite || null, body.assessmentOwner || body.assignedAnalyst, body.currency,
        body.assessmentPeriodStart, body.assessmentPeriodEnd, body.dataReceivedDate || null,
        body.ndaStatus, DATA_STATUSES.NOT_RECEIVED, body.assignedAnalyst, ASSESSMENT_STATUSES.CREATED,
        body.notes ?? body.initialNotes ?? null
      );
      const customerInsert = createdCustomerId ? db.prepare(`
        INSERT INTO ${D1_TABLES.customers} (
          customer_id, tenant_id, customer_name, industry, business_unit, company_website, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).bind(createdCustomerId, tenantId, body.customerName, body.industry,
        body.businessUnit || 'Default BU', body.companyWebsite || null) : null;
      try {
        if (customerInsert && db.batch) await db.batch([customerInsert, assessmentInsert]);
        else {
          if (customerInsert) await customerInsert.run();
          await assessmentInsert.run();
        }
      } catch (error) {
        if (createdCustomerId && !db.batch) {
          try {
            await db.prepare(`DELETE FROM ${D1_TABLES.customers} WHERE customer_id = ? AND tenant_id = ?`)
              .bind(createdCustomerId, tenantId).run();
          } catch (rollbackError) {
            logger.error('Failed to roll back an unlinked customer created with an assessment', {
              requestId: request.headers.get('x-request-id') || undefined, customerId: createdCustomerId
            }, rollbackError);
          }
        }
        logger.error('Failed to create tenant-scoped assessment', {
          requestId: request.headers.get('x-request-id') || undefined, assessmentId: id, tenantId
        }, error);
        throw error;
      }
      const created = await queryFirst(db,
        `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [id, tenantId]);
      logger.info('Tenant-scoped assessment created', {
        requestId: request.headers.get('x-request-id') || undefined, assessmentId: id, customerId, tenantId
      });
      return { data: created ? mapD1Assessment(created) : null, status: 201 };
    }
    const assessments = await queryAll(db,
      `SELECT * FROM ${D1_TABLES.assessments} WHERE tenant_id = ? ORDER BY created_at DESC`, [tenantId]);
    const snapshots = await loadScopedSnapshots(db, 'assessment', assessments.map((row) => String(row.assessment_id)), {
      requestId: request.headers.get('x-request-id') || undefined, tenantId
    });
    return { data: assessments.map((row) => mapD1Assessment(row, snapshots.get(String(row.assessment_id)))) };
  }

  const parts = subPath.replace(/^\//, '').split('/');
  return handleAssessmentAction(db, parts[0] || '', parts[1] || '', request, environment, tenantId, parts[2]);
};
