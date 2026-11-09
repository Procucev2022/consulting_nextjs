/**
 * Customer write handlers for the Analysis Orchestration API: recording a view, acknowledging a viewed
 * report, and requesting a correction. Customers act only on jobs they own.
 */
import logger from './utils/logger';
import type {
  AcknowledgementRow,
  AssessmentJobRow,
  CorrectionRow,
  OrchestrationHandler,
  OrchestrationRequestContext,
  ReportRow
} from './types/orchestrationD1';
import type { CorrectionRequestBody } from './types/orchestrationValidation';
import {
  ORCHESTRATION_ENTITY_TYPES,
  ORCHESTRATION_EVENT_TYPES,
  ORCHESTRATION_ID_PREFIX,
  ORCHESTRATION_NOTIFICATION_SEVERITY,
  VIEWED_REPORT_STATES
} from './constants/orchestration';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import {
  acknowledgeReportSchema,
  correctionRequestSchema,
  reportReferenceSchema
} from './constants/orchestrationValidation';
import { conflictError, jsonOk, parseWithSchema, readJsonBody } from './workerD1OrchestrationHttp';
import { loadAccessibleJob } from './workerD1OrchestrationAuth';
import { loadReportForJob } from './workerD1OrchestrationJobs';
import { mapAcknowledgement, mapCorrectionRequest } from './workerD1OrchestrationMapper';
import {
  acknowledgeReportStatement,
  buildAuditEvent,
  buildNotificationInput,
  buildNotificationRow,
  insertAcknowledgementStatementAfterChange,
  insertAuditStatement,
  insertAuditStatementAfterChange,
  insertCorrectionStatement,
  insertNotificationStatement,
  runCompareAndSetAtomically,
  runAtomically,
  viewReportStatement
} from './workerD1OrchestrationStore';

/** Records the first customer view of a submitted report. Repeat views succeed without changing state. */
export const recordCustomerView: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(reportReferenceSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  const report = await loadReportForJob(context.database, job, body.reportVersionId);
  if (VIEWED_REPORT_STATES.some((state) => state === report.workflow_state)) {
    return jsonOk({ success: true, message: ORCHESTRATION_MESSAGES.viewAlreadyRecorded }, context.request);
  }
  if (report.workflow_state !== 'SUBMITTED_TO_CUSTOMER') {
    throw conflictError(ORCHESTRATION_MESSAGES.reportNotVisible(report.report_version_id, report.workflow_state));
  }
  const viewed = await runCompareAndSetAtomically(context.database,
    viewReportStatement(context.database, report.report_version_id, context.runtime.now()),
    [insertAuditStatementAfterChange(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'CUSTOMER',
      eventType: ORCHESTRATION_EVENT_TYPES.REPORT_VIEWED,
      entityType: ORCHESTRATION_ENTITY_TYPES.REPORT_VERSION,
      entityId: report.report_version_id,
      previousState: 'SUBMITTED_TO_CUSTOMER',
      newState: 'CUSTOMER_VIEWED',
      metadata: null
    }))], {
    requestId: context.requestId,
    tenantId: job.tenant_id,
    assessmentId: job.assessment_id,
    action: context.url.pathname
  });
  if (!viewed) throw conflictError(ORCHESTRATION_MESSAGES.stateChanged);
  logger.info('Customer viewed submitted report', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    actorId: context.actor.userId,
    previousState: 'SUBMITTED_TO_CUSTOMER',
    newState: 'CUSTOMER_VIEWED'
  });
  return jsonOk({ success: true, message: ORCHESTRATION_MESSAGES.viewRecorded }, context.request);
};

/** Throws unless the report is in a state that accepts an acknowledgement (CUSTOMER_VIEWED). */
const assertAcknowledgeable = (report: ReportRow): void => {
  if (report.workflow_state === 'CUSTOMER_VIEWED') return;
  if (report.workflow_state === 'CUSTOMER_ACKNOWLEDGED') {
    throw conflictError(ORCHESTRATION_MESSAGES.reportAlreadyAcknowledged(report.report_version_id));
  }
  if (report.workflow_state === 'SUBMITTED_TO_CUSTOMER') {
    throw conflictError(ORCHESTRATION_MESSAGES.reportNotViewed(report.report_version_id));
  }
  throw conflictError(ORCHESTRATION_MESSAGES.reportNotVisible(report.report_version_id, report.workflow_state));
};

const buildAcknowledgement = (
  context: OrchestrationRequestContext,
  job: AssessmentJobRow,
  reportVersionId: string,
  notes: string | undefined
): AcknowledgementRow => ({
  acknowledgement_id: context.runtime.createId(ORCHESTRATION_ID_PREFIX.ACKNOWLEDGEMENT),
  report_version_id: reportVersionId,
  assessment_id: job.assessment_id,
  tenant_id: job.tenant_id,
  user_id: context.actor.userId,
  user_name: context.actor.userName,
  notes: notes ?? null,
  acknowledged_at: context.runtime.now()
});

/** Records one acknowledgement for a viewed report. The database rejects a second one for the same report. */
export const acknowledgeReport: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(acknowledgeReportSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  const report = await loadReportForJob(context.database, job, body.reportVersionId);
  assertAcknowledgeable(report);
  const acknowledgement = buildAcknowledgement(context, job, report.report_version_id, body.notes);
  const acknowledged = await runCompareAndSetAtomically(context.database,
    acknowledgeReportStatement(context.database, report.report_version_id, context.runtime.now()),
    [
      insertAcknowledgementStatementAfterChange(context.database, acknowledgement),
      insertAuditStatementAfterChange(context.database, buildAuditEvent(context.runtime, {
        tenantId: job.tenant_id,
        assessmentId: job.assessment_id,
        actorId: context.actor.userId,
        actorRole: 'CUSTOMER',
        eventType: ORCHESTRATION_EVENT_TYPES.REPORT_ACKNOWLEDGED,
        entityType: ORCHESTRATION_ENTITY_TYPES.ACKNOWLEDGEMENT,
        entityId: acknowledgement.acknowledgement_id,
        previousState: 'CUSTOMER_VIEWED',
        newState: 'CUSTOMER_ACKNOWLEDGED',
        metadata: { reportVersionId: report.report_version_id }
      }))
    ], {
      requestId: context.requestId,
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      action: context.url.pathname
    });
  if (!acknowledged) throw conflictError(ORCHESTRATION_MESSAGES.stateChanged);
  logger.info('Customer acknowledged report', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    acknowledgementId: acknowledgement.acknowledgement_id,
    actorId: context.actor.userId,
    previousState: 'CUSTOMER_VIEWED',
    newState: 'CUSTOMER_ACKNOWLEDGED'
  });
  return jsonOk({
    success: true,
    acknowledgement: mapAcknowledgement(acknowledgement),
    message: ORCHESTRATION_MESSAGES.acknowledged
  }, context.request);
};

const buildCorrectionRequest = (
  context: OrchestrationRequestContext,
  job: AssessmentJobRow,
  body: CorrectionRequestBody
): CorrectionRow => ({
  request_id: context.runtime.createId(ORCHESTRATION_ID_PREFIX.CORRECTION),
  assessment_id: job.assessment_id,
  tenant_id: job.tenant_id,
  user_id: context.actor.userId,
  category: body.category,
  description: body.description,
  supporting_file_name: body.supportingFileName ? body.supportingFileName : null,
  status: 'OPEN',
  reviewed_by: null,
  admin_response: null,
  created_at: context.runtime.now()
});

/** Stores a correction request as OPEN and notifies the administrators. */
export const requestCorrection: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(correctionRequestSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  const request = buildCorrectionRequest(context, job, body);
  const notification = buildNotificationRow(buildNotificationInput(context.runtime, {
    recipientType: 'ADMIN',
    tenantId: job.tenant_id,
    assessmentId: job.assessment_id,
    reportVersionId: null,
    title: ORCHESTRATION_MESSAGES.notificationCorrectionTitle,
    message: ORCHESTRATION_MESSAGES.notificationCorrectionMessage(job.customer_name, body.category, body.description),
    severity: ORCHESTRATION_NOTIFICATION_SEVERITY.WARNING,
    emailStatus: null,
    emailLastError: null
  }));
  await runAtomically(context.database, [
    insertCorrectionStatement(context.database, request),
    insertNotificationStatement(context.database, notification),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'CUSTOMER',
      eventType: ORCHESTRATION_EVENT_TYPES.CORRECTION_REQUESTED,
      entityType: ORCHESTRATION_ENTITY_TYPES.CORRECTION_REQUEST,
      entityId: request.request_id,
      previousState: null,
      newState: 'OPEN',
      metadata: { category: body.category }
    }))
  ], {
    requestId: context.requestId,
    tenantId: job.tenant_id,
    assessmentId: job.assessment_id,
    action: context.url.pathname
  });
  logger.info('Customer requested analysis correction', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    correctionRequestId: request.request_id,
    actorId: context.actor.userId,
    category: body.category
  });
  return jsonOk({
    success: true,
    request: mapCorrectionRequest(request),
    message: ORCHESTRATION_MESSAGES.correctionRequested
  }, context.request);
};

