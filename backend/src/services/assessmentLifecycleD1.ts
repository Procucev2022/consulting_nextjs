import {
  assessmentAcceptanceSchema,
  assessmentDeliverySchema,
  analystApprovalSchema
} from '../constants/assessmentValidation';
import {
  ASSESSMENT_D1_MESSAGES as LIFECYCLE_MESSAGES,
  ASSESSMENT_REVIEW_GATE_KEYS
} from '../constants/assessmentD1';
import { ASSESSMENT_STATUSES, AUDIT_ACTIONS } from '../constants/assessment';
import { D1_TABLES } from '../constants/d1';
import type {
  AssessmentAuditStatement,
  AssessmentLifecycleActionContext,
  AssessmentLifecycleLoadedResult,
  AssessmentRunLoadedResult,
  AssessmentRow
} from '../types/assessmentDataVersionD1';
import type { AssessmentRecord } from '../types/assessment';
import type { D1Record, WorkerD1Result } from '../types/d1';
import {
  ASSESSMENT_SNAPSHOT_TYPE,
  assessmentSnapshotWrite,
  queryFirst,
  readAssessmentSnapshot,
  runStatements
} from './assessmentDataVersionD1Helpers';
import { loadAssessmentSnapshots, mapD1AnalysisRun, mapD1Assessment } from './assessmentD1Mappers';
import logger from '../utils/logger';
import { downloadAssessmentDeliveryArtifact, generateAssessmentDeliveryPackage } from './assessmentDeliveryPackageD1';

const LIFECYCLE_CHECKSUM = 'assessment-lifecycle';
const resultError = (status: number, message: string, errors?: unknown): WorkerD1Result => ({
  status,
  data: { success: false, message, ...(errors === undefined ? {} : { errors }) }
});

const auditStatement = (
  context: AssessmentLifecycleActionContext,
  action: string,
  details: D1Record = {}
): AssessmentAuditStatement => context.db.prepare(`
  INSERT INTO ${D1_TABLES.auditLogs} (id, assessment_id, actor_email, actor_role, action, details_json)
  VALUES (?, ?, ?, ?, ?, ?)
`).bind(
  `AUD-${globalThis.crypto.randomUUID()}`, context.assessmentId, context.actorEmail, context.actorRole,
  action, JSON.stringify(details)
);

const loadAssessment = async (
  context: AssessmentLifecycleActionContext
): Promise<AssessmentLifecycleLoadedResult> => {
  const row = await queryFirst<AssessmentRow>(context.db,
    `SELECT * FROM ${D1_TABLES.assessments}
      WHERE assessment_id = ?`, [context.assessmentId]);
  if (!row) {
    return { ok: false as const, result: resultError(404, LIFECYCLE_MESSAGES.missingRecord(context.assessmentId)) };
  }
  const snapshot = await readAssessmentSnapshot(context.db, ASSESSMENT_SNAPSHOT_TYPE, context.assessmentId,
    context.assessmentId, { requestId: context.requestId, tenantId: context.environment.REQUEST_TENANT_ID });
  return { ok: true as const, row, snapshot, assessment: mapD1Assessment(row, snapshot) };
};

const loadAnalysisRun = async (
  context: AssessmentLifecycleActionContext,
  analysisRunId: string
): Promise<AssessmentRunLoadedResult> => {
  const row = await queryFirst<D1Record>(context.db,
    `SELECT * FROM ${D1_TABLES.analysisRuns} WHERE assessment_id = ? AND analysis_run_id = ?`,
    [context.assessmentId, analysisRunId]);
  if (!row) return { ok: false as const, result: resultError(404, LIFECYCLE_MESSAGES.runNotFound(analysisRunId)) };
  const snapshots = await loadAssessmentSnapshots(context.db, 'run', context.assessmentId, {
    requestId: context.requestId, tenantId: context.environment.REQUEST_TENANT_ID,
    assessmentId: context.assessmentId
  });
  return { ok: true as const, row, run: mapD1AnalysisRun(row, snapshots.get(analysisRunId)) };
};

const validateReviewGates = async (context: AssessmentLifecycleActionContext): Promise<WorkerD1Result | null> => {
  const rows = await context.db.prepare(`
    SELECT gate_key FROM ${D1_TABLES.assessmentReviewGates}
    WHERE assessment_id = ? AND status = 'PASSED'
      AND length(trim(COALESCE(evidence_reference, ''))) > 0
  `).bind(context.assessmentId).all<{ gate_key: string }>();
  const passedKeys = new Set((rows.results || []).map((gate) => gate.gate_key));
  const pendingCount = ASSESSMENT_REVIEW_GATE_KEYS.filter((key) => !passedKeys.has(key)).length;
  return pendingCount > 0 ? resultError(400, LIFECYCLE_MESSAGES.reviewGatesPending(pendingCount)) : null;
};

const loadApprovalAnalysisRun = async (
  context: AssessmentLifecycleActionContext,
  analysisRunId: string,
  expectedDataVersionId?: string
): Promise<AssessmentRunLoadedResult> => {
  const loaded = await loadAnalysisRun(context, analysisRunId);
  if (!loaded.ok) return loaded;
  if (loaded.run.isSuperseded) {
    return { ok: false, result: resultError(400, LIFECYCLE_MESSAGES.runSuperseded) };
  }
  if (!loaded.run.allGatesPassed) {
    return { ok: false, result: resultError(400, LIFECYCLE_MESSAGES.gatesNotPassed) };
  }
  if (expectedDataVersionId && loaded.run.dataVersionId !== expectedDataVersionId) {
    return { ok: false, result: resultError(400, LIFECYCLE_MESSAGES.runVersionMismatch) };
  }
  return loaded;
};

const persistAssessment = async (
  context: AssessmentLifecycleActionContext,
  row: AssessmentRow,
  previous: D1Record,
  patch: D1Record,
  status: string,
  audit: AssessmentAuditStatement,
  additional: AssessmentAuditStatement[] = []
): Promise<AssessmentRecord> => {
  const snapshot = { ...previous, ...patch, assessmentId: context.assessmentId, status };
  await runStatements(context.db, [
    context.db.prepare(`UPDATE ${D1_TABLES.assessments} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE assessment_id = ?`)
      .bind(status, context.assessmentId),
    assessmentSnapshotWrite(context.db, ASSESSMENT_SNAPSHOT_TYPE, context.assessmentId, snapshot, LIFECYCLE_CHECKSUM),
    ...additional,
    audit
  ], {
    operation: `assessment.lifecycle.${context.action}.persist`,
    requestId: context.requestId,
    tenantId: context.environment.REQUEST_TENANT_ID,
    assessmentId: context.assessmentId
  });
  return mapD1Assessment({ ...row, status }, snapshot);
};

const approveAssessment = async (context: AssessmentLifecycleActionContext): Promise<WorkerD1Result> => {
  const parsed = analystApprovalSchema.safeParse(context.body);
  if (!parsed.success) return resultError(400, LIFECYCLE_MESSAGES.actionValidation, parsed.error.issues);
  if (!['INTERNAL_ADMIN', 'ANALYST'].includes(context.actorRole)) {
    return resultError(403, LIFECYCLE_MESSAGES.permissionDenied);
  }
  const loaded = await loadAssessment(context);
  if (!loaded.ok) return loaded.result;
  const { assessment, row, snapshot } = loaded;
  const gateError = await validateReviewGates(context);
  if (gateError) return gateError;
  const runId = parsed.data.analysisRunId || assessment.activeAnalysisRunId;
  if (!runId) return resultError(400, LIFECYCLE_MESSAGES.missingRun);
  const loadedRun = await loadApprovalAnalysisRun(context, runId, parsed.data.dataVersionId);
  if (!loadedRun.ok) return loadedRun.result;
  const { row: runRow, run } = loadedRun;
  const now = new Date().toISOString();
  const approved = await persistAssessment(context, row, snapshot, {
    approvedBy: context.actorEmail, approvedAt: now, approvalComment: parsed.data.approvalComment
  }, ASSESSMENT_STATUSES.APPROVED,
  auditStatement(context, AUDIT_ACTIONS.ANALYST_APPROVAL, {
    analysisRunId: run.analysisRunId, dataVersionId: run.dataVersionId, comment: parsed.data.approvalComment
  }), [context.db.prepare(`UPDATE ${D1_TABLES.analysisRuns} SET is_approved = 1 WHERE analysis_run_id = ?`)
    .bind(String(runRow.analysis_run_id))]);
  logger.info('Assessment approved by analyst', {
    assessmentId: context.assessmentId, approvedBy: context.actorEmail, requestId: context.requestId
  });
  return { data: approved };
};

const deliverAssessment = async (context: AssessmentLifecycleActionContext): Promise<WorkerD1Result> => {
  const parsed = assessmentDeliverySchema.safeParse(context.body);
  if (!parsed.success) return resultError(400, LIFECYCLE_MESSAGES.actionValidation, parsed.error.issues);
  const loaded = await loadAssessment(context);
  if (!loaded.ok) return loaded.result;
  const { assessment, row, snapshot } = loaded;
  if (assessment.isTestData && !parsed.data.isTestDelivery) {
    return resultError(400, LIFECYCLE_MESSAGES.testDeliveryRequired);
  }
  if (assessment.status !== ASSESSMENT_STATUSES.APPROVED) {
    return resultError(400, LIFECYCLE_MESSAGES.deliveryApprovalRequired(assessment.status));
  }
  const now = new Date().toISOString();
  const recipientEmail = parsed.data.recipientEmail || parsed.data.deliveredToEmail || '';
  const updated = await persistAssessment(context, row, snapshot, {
    deliveredBy: context.actorEmail, deliveredAt: now, deliveredToEmail: recipientEmail,
    deliveryChannel: parsed.data.deliveryChannel || 'EMAIL'
  }, ASSESSMENT_STATUSES.DELIVERED,
  auditStatement(context, AUDIT_ACTIONS.REPORT_DELIVERED, {
    deliveredToEmail: recipientEmail, notes: parsed.data.notes || parsed.data.deliveryNotes
  }));
  logger.info('Assessment delivered to customer', {
    assessmentId: context.assessmentId, deliveredTo: recipientEmail, requestId: context.requestId
  });
  return { data: updated };
};

const acceptAssessment = async (context: AssessmentLifecycleActionContext): Promise<WorkerD1Result> => {
  const parsed = assessmentAcceptanceSchema.safeParse(context.body ?? {});
  if (!parsed.success) return resultError(400, LIFECYCLE_MESSAGES.actionValidation, parsed.error.issues);
  const loaded = await loadAssessment(context);
  if (!loaded.ok) return loaded.result;
  const { assessment, row, snapshot } = loaded;
  const allowedStatuses = [ASSESSMENT_STATUSES.DELIVERED, ASSESSMENT_STATUSES.APPROVED] as string[];
  if (!allowedStatuses.includes(assessment.status)) {
    return resultError(400, LIFECYCLE_MESSAGES.acceptanceStatus(assessment.status));
  }
  if (!assessment.activeAnalysisRunId) return resultError(400, LIFECYCLE_MESSAGES.completedRunRequired);
  const loadedRun = await loadAnalysisRun(context, assessment.activeAnalysisRunId);
  if (!loadedRun.ok) return loadedRun.result;
  if (loadedRun.run.status.toUpperCase() !== 'COMPLETED') {
    return resultError(400, LIFECYCLE_MESSAGES.completedRunRequired);
  }
  const acceptedBy = parsed.data.acceptedBy || context.actorEmail;
  const now = new Date().toISOString();
  const updated = await persistAssessment(context, row, snapshot, {
    acceptedBy, acceptedAt: now, isReportAccepted: true, allModulesCompleted: true,
    acceptanceComment: parsed.data.acceptanceComment
  }, ASSESSMENT_STATUSES.ACCEPTED,
  auditStatement(context, AUDIT_ACTIONS.ASSESSMENT_ACCEPTED, {
    acceptedBy, comment: parsed.data.acceptanceComment
  }));
  logger.info('Assessment formally accepted by customer', {
    assessmentId: context.assessmentId, acceptedBy, requestId: context.requestId
  });
  return { data: updated };
};

const closeAssessment = async (context: AssessmentLifecycleActionContext): Promise<WorkerD1Result> => {
  const loaded = await loadAssessment(context);
  if (!loaded.ok) return loaded.result;
  const now = new Date().toISOString();
  const updated = await persistAssessment(context, loaded.row, loaded.snapshot, { closedAt: now },
    ASSESSMENT_STATUSES.CLOSED, auditStatement(context, AUDIT_ACTIONS.ASSESSMENT_CLOSED));
  logger.info('Assessment closed', { assessmentId: context.assessmentId, requestId: context.requestId });
  return { data: updated };
};

export const handleAssessmentLifecycleAction = (
  context: AssessmentLifecycleActionContext,
  artifactId?: string
): Promise<WorkerD1Result> => {
  switch (context.action) {
    case 'approve': return approveAssessment(context);
    case 'delivery-package': return artifactId
      ? downloadAssessmentDeliveryArtifact(context, artifactId)
      : generateAssessmentDeliveryPackage(context);
    case 'deliver': return deliverAssessment(context);
    case 'accept': return acceptAssessment(context);
    case 'close': return closeAssessment(context);
  }
};
