/**
 * Administrator handlers that send a report to the customer: approval and submission, and notification
 * resend. Approval requires a confirmed quality gate checklist for the exact report being approved.
 */
import logger from './utils/logger';
import type {
  AssessmentJobRow,
  NotificationRow,
  OrchestrationHandler,
  OrchestrationRequestContext
} from './types/orchestrationD1';
import {
  ORCHESTRATION_EMAIL_STATUS,
  ORCHESTRATION_ENTITY_TYPES,
  ORCHESTRATION_EVENT_TYPES,
  ORCHESTRATION_NOTIFICATION_SEVERITY
} from './constants/orchestration';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { reportReferenceSchema } from './constants/orchestrationValidation';
import {
  conflictError,
  jsonOk,
  parseWithSchema,
  readJsonBody,
  serviceUnavailableError
} from './workerD1OrchestrationHttp';
import { loadAccessibleJob } from './workerD1OrchestrationAuth';
import { loadReportForJob } from './workerD1OrchestrationJobs';
import { mapNotification } from './workerD1OrchestrationMapper';
import { formatAnalysisPeriod, isCustomerVisibleState } from './workerD1OrchestrationDerive';
import {
  buildAuditEvent,
  buildNotificationInput,
  buildNotificationRow,
  compareAndSet,
  findLatestChecklistRow,
  insertAuditStatement,
  insertNotificationStatement,
  runAtomically,
  submitReportStatement
} from './workerD1OrchestrationStore';

/** Customer notification that announces a submitted report. Email is not sent: the Worker has no provider. */
const buildCustomerNotificationDraft = (
  context: OrchestrationRequestContext,
  job: Pick<AssessmentJobRow, 'customer_id' | 'assessment_id' | 'assessment_period_start' | 'assessment_period_end'>,
  reportVersionId: string
): NotificationRow => buildNotificationRow(buildNotificationInput(context.runtime, {
  recipientType: 'CUSTOMER',
  tenantId: job.customer_id,
  assessmentId: job.assessment_id,
  reportVersionId,
  title: ORCHESTRATION_MESSAGES.notificationReportReadyTitle,
  message: ORCHESTRATION_MESSAGES.notificationReportReadyMessage(
    formatAnalysisPeriod(job.assessment_period_start, job.assessment_period_end)
  ),
  severity: ORCHESTRATION_NOTIFICATION_SEVERITY.SUCCESS,
  emailStatus: ORCHESTRATION_EMAIL_STATUS.NOT_SENT,
  emailLastError: ORCHESTRATION_MESSAGES.emailNotConfiguredLastError
}));

/** Submits a report to the customer after the quality gate checklist is confirmed for that report. */
export const approveAndSubmitReport: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(reportReferenceSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context.database, context.actor, context.params.jobId);
  const report = await loadReportForJob(context.database, job, body.reportVersionId);
  if (report.workflow_state !== 'ADMIN_REVIEW') {
    throw conflictError(
      ORCHESTRATION_MESSAGES.reportNotAwaitingReview(report.report_version_id, report.workflow_state)
    );
  }
  const checklist = await findLatestChecklistRow(context.database, report.report_version_id);
  if (checklist === null) throw conflictError(ORCHESTRATION_MESSAGES.checklistMissing(report.report_version_id));
  if (checklist.is_complete !== 1) {
    throw conflictError(ORCHESTRATION_MESSAGES.checklistIncomplete(checklist.unconfirmed_count));
  }
  const submitted = await compareAndSet(submitReportStatement(
    context.database,
    report.report_version_id,
    context.actor.userId,
    context.runtime.now()
  ));
  if (!submitted) throw conflictError(ORCHESTRATION_MESSAGES.stateChanged);
  await runAtomically(context.database, [
    insertNotificationStatement(
      context.database,
      buildCustomerNotificationDraft(context, job, report.report_version_id)
    ),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.customer_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.REPORT_SUBMITTED,
      entityType: ORCHESTRATION_ENTITY_TYPES.REPORT_VERSION,
      entityId: report.report_version_id,
      previousState: 'ADMIN_REVIEW',
      newState: 'SUBMITTED_TO_CUSTOMER',
      metadata: { emailStatus: ORCHESTRATION_EMAIL_STATUS.NOT_SENT }
    }))
  ]);
  logger.info('Report approved and submitted to customer', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    actorId: context.actor.userId,
    previousState: 'ADMIN_REVIEW',
    newState: 'SUBMITTED_TO_CUSTOMER'
  });
  return jsonOk({ success: true, message: ORCHESTRATION_MESSAGES.reportSubmitted }, context.request);
};

/**
 * The Worker has no email provider. The resend is recorded as a NOT_SENT notification and the request fails
 * with 503, so the admin never sees a false "sent" result.
 */
export const resendNotification: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(reportReferenceSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context.database, context.actor, context.params.jobId);
  const report = await loadReportForJob(context.database, job, body.reportVersionId);
  if (!isCustomerVisibleState(report.workflow_state)) {
    throw conflictError(ORCHESTRATION_MESSAGES.reportNotSubmitted(report.report_version_id));
  }
  const notification = buildCustomerNotificationDraft(context, job, report.report_version_id);
  await runAtomically(context.database, [
    insertNotificationStatement(context.database, notification),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.customer_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.NOTIFICATION_RESEND_ATTEMPTED,
      entityType: ORCHESTRATION_ENTITY_TYPES.NOTIFICATION,
      entityId: notification.notification_id,
      previousState: null,
      newState: null,
      metadata: { reportVersionId: report.report_version_id, emailStatus: ORCHESTRATION_EMAIL_STATUS.NOT_SENT }
    }))
  ]);
  logger.warn('Notification resend recorded as NOT_SENT: no email provider configured', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    actorId: context.actor.userId
  });
  throw serviceUnavailableError(ORCHESTRATION_MESSAGES.emailNotConfigured, {
    notification: mapNotification(notification)
  });
};
