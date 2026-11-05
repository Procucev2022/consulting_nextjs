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
import { sendCommercialEmail } from './services/workerCommercialShared';
import { formatAnalysisPeriod, isCustomerVisibleState } from './workerD1OrchestrationDerive';
import {
  buildAuditEvent,
  buildNotificationInput,
  buildNotificationRow,
  changedRowCount,
  compareAndSet,
  findLatestChecklistRow,
  insertAuditStatement,
  insertNotificationStatement,
  runAtomically,
  submitReportStatement,
  updateNotificationEmailStatement
} from './workerD1OrchestrationStore';

interface NotificationEmailDelivery {
  status: 'NOT_SENT' | 'SENT' | 'FAILED';
  lastError: string | null;
  message: string;
}

const getNotificationEmailDelivery = async (
  context: OrchestrationRequestContext,
  job: AssessmentJobRow,
  notification: NotificationRow
): Promise<NotificationEmailDelivery> => {
  const environment = context.environment;
  if (!environment.RESEND_API_KEY || !environment.RESEND_FROM) {
    return {
      status: ORCHESTRATION_EMAIL_STATUS.NOT_SENT,
      lastError: ORCHESTRATION_MESSAGES.emailNotConfiguredLastError,
      message: ORCHESTRATION_MESSAGES.emailNotConfigured
    };
  }
  if (!job.customer_contact_email) {
    return {
      status: ORCHESTRATION_EMAIL_STATUS.NOT_SENT,
      lastError: ORCHESTRATION_MESSAGES.notificationRecipientMissing,
      message: ORCHESTRATION_MESSAGES.notificationRecipientMissing
    };
  }
  try {
    const result = await sendCommercialEmail(
      environment,
      job.customer_contact_email,
      notification.title,
      notification.message
    );
    if (result.sent) {
      return {
        status: ORCHESTRATION_EMAIL_STATUS.SENT,
        lastError: null,
        message: ORCHESTRATION_MESSAGES.notificationEmailSent
      };
    }
    const error = result.message || ORCHESTRATION_MESSAGES.emailNotConfiguredLastError;
    return {
      status: ORCHESTRATION_EMAIL_STATUS.FAILED,
      lastError: error,
      message: ORCHESTRATION_MESSAGES.notificationProviderFailed(error)
    };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : ORCHESTRATION_MESSAGES.emailNotConfiguredLastError;
    logger.error('Customer report notification email request failed', {
      requestId: context.requestId,
      assessmentId: job.assessment_id,
      reportVersionId: notification.report_version_id
    }, error);
    return {
      status: ORCHESTRATION_EMAIL_STATUS.FAILED,
      lastError: reason,
      message: ORCHESTRATION_MESSAGES.notificationProviderFailed(reason)
    };
  }
};

const deliverNotificationEmail = async (
  context: OrchestrationRequestContext,
  job: AssessmentJobRow,
  notification: NotificationRow,
  isRetry: boolean
): Promise<NotificationEmailDelivery> => {
  const delivery = await getNotificationEmailDelivery(context, job, notification);
  const update = await updateNotificationEmailStatement(
    context.database,
    notification.notification_id,
    delivery.status,
    delivery.lastError,
    isRetry
  ).run();
  if (changedRowCount(update) !== 1) {
    throw new Error(`Notification ${notification.notification_id} email status could not be persisted.`);
  }
  notification.email_status = delivery.status;
  notification.email_last_error = delivery.lastError;
  if (isRetry) notification.email_retry_count += 1;
  if (delivery.status === ORCHESTRATION_EMAIL_STATUS.SENT) {
    logger.info('Customer report notification email sent', {
      requestId: context.requestId,
      assessmentId: job.assessment_id,
      reportVersionId: notification.report_version_id,
      notificationId: notification.notification_id
    });
  } else {
    logger.warn('Customer report notification email was not sent', {
      requestId: context.requestId,
      assessmentId: job.assessment_id,
      reportVersionId: notification.report_version_id,
      notificationId: notification.notification_id,
      emailStatus: delivery.status
    });
  }
  return delivery;
};

/** Customer notification that announces a submitted report. */
const buildCustomerNotificationDraft = (
  context: OrchestrationRequestContext,
  job: Pick<AssessmentJobRow, 'tenant_id' | 'customer_id' | 'assessment_id' | 'assessment_period_start' | 'assessment_period_end'>,
  reportVersionId: string
): NotificationRow => buildNotificationRow(buildNotificationInput(context.runtime, {
  recipientType: 'CUSTOMER',
  tenantId: job.tenant_id,
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
  const job = await loadAccessibleJob(context, context.params.jobId);
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
  const notification = buildCustomerNotificationDraft(context, job, report.report_version_id);
  await runAtomically(context.database, [
    insertNotificationStatement(
      context.database,
      notification
    ),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.REPORT_SUBMITTED,
      entityType: ORCHESTRATION_ENTITY_TYPES.REPORT_VERSION,
      entityId: report.report_version_id,
      previousState: 'ADMIN_REVIEW',
      newState: 'SUBMITTED_TO_CUSTOMER',
      metadata: { notificationId: notification.notification_id }
    }))
  ]);
  const delivery = await deliverNotificationEmail(context, job, notification, false);
  const message = delivery.status === ORCHESTRATION_EMAIL_STATUS.SENT
    ? ORCHESTRATION_MESSAGES.reportSubmittedEmailSent
    : delivery.message === ORCHESTRATION_MESSAGES.emailNotConfigured
      ? ORCHESTRATION_MESSAGES.reportSubmitted
      : ORCHESTRATION_MESSAGES.reportSubmittedEmailPending(delivery.message);
  logger.info('Report approved and submitted to customer', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    actorId: context.actor.userId,
    previousState: 'ADMIN_REVIEW',
    newState: 'SUBMITTED_TO_CUSTOMER'
  });
  return jsonOk({ success: true, message, emailStatus: delivery.status }, context.request);
};

/** Resends the report notification using the configured transactional email provider. */
export const resendNotification: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(reportReferenceSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  const report = await loadReportForJob(context.database, job, body.reportVersionId);
  if (!isCustomerVisibleState(report.workflow_state)) {
    throw conflictError(ORCHESTRATION_MESSAGES.reportNotSubmitted(report.report_version_id));
  }
  const notification = buildCustomerNotificationDraft(context, job, report.report_version_id);
  await runAtomically(context.database, [
    insertNotificationStatement(context.database, notification),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.NOTIFICATION_RESEND_ATTEMPTED,
      entityType: ORCHESTRATION_ENTITY_TYPES.NOTIFICATION,
      entityId: notification.notification_id,
      previousState: null,
      newState: null,
      metadata: { reportVersionId: report.report_version_id, notificationId: notification.notification_id }
    }))
  ]);
  const delivery = await deliverNotificationEmail(context, job, notification, true);
  if (delivery.status !== ORCHESTRATION_EMAIL_STATUS.SENT) {
    throw serviceUnavailableError(delivery.message, { notification: mapNotification(notification) });
  }
  logger.info('Customer report notification resend completed', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    actorId: context.actor.userId,
    notificationId: notification.notification_id
  });
  return jsonOk({
    success: true,
    message: delivery.message,
    notification: mapNotification(notification)
  }, context.request);
};
