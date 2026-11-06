/**
 * Administrator write handlers for the Analysis Orchestration API: quality gate, report generation and
 * supersession. Every state change is a compare-and-set update, and its audit event is written in the same
 * atomic batch. Approval and notification handlers live in workerD1OrchestrationAdminSubmit.ts.
 */
import logger from './utils/logger';
import type { OrchestrationHandler, OrchestrationRequestContext, ReportRow } from './types/orchestrationD1';
import {
  ORCHESTRATION_DEFAULTS,
  ORCHESTRATION_ENTITY_TYPES,
  ORCHESTRATION_EVENT_TYPES,
  ORCHESTRATION_ID_PREFIX
} from './constants/orchestration';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import {
  emptyBodySchema,
  qualityGateChecklistSchema,
  supersedeReportSchema
} from './constants/orchestrationValidation';
import { conflictError, jsonOk, parseWithSchema, readJsonBody } from './workerD1OrchestrationHttp';
import { loadAccessibleJob } from './workerD1OrchestrationAuth';
import { loadReportForJob } from './workerD1OrchestrationJobs';
import { mapReport } from './workerD1OrchestrationMapper';
import {
  buildReadiness,
  countUnconfirmedItems,
  isActiveReportState,
  pcbiCoverageFromRows,
  readinessInputFromRow
} from './workerD1OrchestrationDerive';
import {
  buildAuditEvent,
  compareAndSet,
  countOpenCorrections,
  insertAuditStatement,
  insertChecklistStatement,
  insertReportStatement,
  listPcbiGapRows,
  nextReportSequence,
  runAtomically,
  supersedeReportStatement
} from './workerD1OrchestrationStore';

const qualityGateMessage = (reportId: string | null, unconfirmedCount: number): string => {
  if (reportId === null) return ORCHESTRATION_MESSAGES.checklistWithoutReport;
  return unconfirmedCount === 0
    ? ORCHESTRATION_MESSAGES.checklistConfirmed
    : ORCHESTRATION_MESSAGES.checklistIncompleteSaved(unconfirmedCount);
};

/** Stores the checklist exactly as received. It counts as confirmed only when every item is true. */
export const recordQualityGate: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(qualityGateChecklistSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  const reportId = job.report_state === 'ADMIN_REVIEW' ? job.report_id : null;
  const unconfirmedCount = countUnconfirmedItems(body);
  const complete = unconfirmedCount === 0;
  const now = context.runtime.now();
  await runAtomically(context.database, [
    insertChecklistStatement(context.database, {
      checklist_id: context.runtime.createId(ORCHESTRATION_ID_PREFIX.CHECKLIST),
      assessment_id: job.assessment_id,
      report_version_id: reportId,
      checklist_json: JSON.stringify(body),
      is_complete: complete ? 1 : 0,
      unconfirmed_count: unconfirmedCount,
      confirmed_by: context.actor.userId,
      confirmed_at: complete ? now : null,
      created_at: now
    }),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.QUALITY_GATE_SAVED,
      entityType: ORCHESTRATION_ENTITY_TYPES.QUALITY_CHECKLIST,
      entityId: job.assessment_id,
      previousState: null,
      newState: null,
      metadata: { reportVersionId: reportId, unconfirmedCount, complete }
    }))
  ]);
  logger.info('Quality gate checklist saved', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    actorId: context.actor.userId,
    reportVersionId: reportId,
    unconfirmedCount
  });
  return jsonOk({ success: true, message: qualityGateMessage(reportId, unconfirmedCount) }, context.request);
};

const reportIdFor = (assessmentId: string, sequence: number): string =>
  `${ORCHESTRATION_DEFAULTS.reportIdPrefix}${assessmentId}${ORCHESTRATION_DEFAULTS.reportVersionInfix}${sequence}`;

const buildGeneratedReport = (
  context: OrchestrationRequestContext,
  assessmentId: string,
  sequence: number,
  runId: string,
  runVersionId: string
): ReportRow => {
  const now = context.runtime.now();
  return {
    report_version_id: reportIdFor(assessmentId, sequence),
    assessment_id: assessmentId,
    sequence_number: sequence,
    analysis_run_id: runId,
    data_version_id: runVersionId,
    workflow_state: 'ADMIN_REVIEW',
    generated_by: context.actor.userId,
    generated_at: now,
    submitted_by: null,
    submitted_at: null,
    customer_viewed_at: null,
    acknowledged_at: null,
    superseded_by: null,
    superseded_at: null,
    supersede_reason: null,
    created_at: now,
    updated_at: now
  };
};

/** Creates a report in ADMIN_REVIEW from the latest analysis run. Only one active report may exist per job. */
export const generateReport: OrchestrationHandler = async (context) => {
  parseWithSchema(emptyBodySchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  const [openCount, pcbiRows] = await Promise.all([
    countOpenCorrections(context.database, job.assessment_id, job.tenant_id),
    listPcbiGapRows(context.database, job.assessment_id, job.current_version_id, job.tenant_id)
  ]);
  const readiness = buildReadiness(readinessInputFromRow(job, openCount, pcbiCoverageFromRows(pcbiRows)));
  if (readiness.overallReadiness !== 'READY_TO_GENERATE' || job.run_id === null || job.run_version_id === null) {
    throw conflictError(ORCHESTRATION_MESSAGES.reportNotReady(readiness.blockingReasons), {
      blockingReasons: readiness.blockingReasons
    });
  }
  if (job.report_id !== null && isActiveReportState(job.report_state)) {
    throw conflictError(ORCHESTRATION_MESSAGES.reportAlreadyActive(job.report_id, job.report_state));
  }
  const sequence = await nextReportSequence(context.database, job.assessment_id, job.tenant_id);
  const report = buildGeneratedReport(context, job.assessment_id, sequence, job.run_id, job.run_version_id);
  await runAtomically(context.database, [
    insertReportStatement(context.database, report),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.REPORT_GENERATED,
      entityType: ORCHESTRATION_ENTITY_TYPES.REPORT_VERSION,
      entityId: report.report_version_id,
      previousState: null,
      newState: 'ADMIN_REVIEW',
      metadata: { analysisRunId: job.run_id, dataVersionId: job.run_version_id }
    }))
  ]);
  logger.info('Report generated and placed in admin review', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    actorId: context.actor.userId
  });
  return jsonOk({
    success: true,
    report: mapReport(report),
    message: ORCHESTRATION_MESSAGES.reportGenerated
  }, context.request);
};

/** Ends a report's life. The job returns to ready-for-generation unless another report is active. */
export const supersedeReport: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(supersedeReportSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  const report = await loadReportForJob(context.database, job, body.reportVersionId);
  if (report.workflow_state === 'SUPERSEDED') {
    throw conflictError(ORCHESTRATION_MESSAGES.reportAlreadySuperseded(report.report_version_id));
  }
  const superseded = await compareAndSet(supersedeReportStatement(
    context.database,
    report.report_version_id,
    context.actor.userId,
    context.runtime.now(),
    body.reason
  ));
  if (!superseded) throw conflictError(ORCHESTRATION_MESSAGES.stateChanged);
  await runAtomically(context.database, [
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.REPORT_SUPERSEDED,
      entityType: ORCHESTRATION_ENTITY_TYPES.REPORT_VERSION,
      entityId: report.report_version_id,
      previousState: report.workflow_state,
      newState: 'SUPERSEDED',
      metadata: { reason: body.reason }
    }))
  ]);
  logger.info('Report superseded by administrator', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    reportVersionId: report.report_version_id,
    actorId: context.actor.userId,
    previousState: report.workflow_state,
    newState: 'SUPERSEDED'
  });
  return jsonOk({
    success: true,
    message: ORCHESTRATION_MESSAGES.reportSuperseded(report.report_version_id)
  }, context.request);
};
