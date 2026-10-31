/**
 * Read handlers for the Analysis Orchestration API (GET endpoints). Customers see only their own
 * jobs, and only after the job has data. Admins see every job.
 */
import type { AnalysisJob, AnalysisJobStatus } from './types/analysisOrchestration';
import type { OrchestrationHandler, OrchestrationRequestContext } from './types/orchestrationD1';
import { ORCHESTRATION_LIMITS } from './constants/orchestration';
import { jobsQuerySchema } from './constants/orchestrationValidation';
import { jsonOk, parseWithSchema } from './workerD1OrchestrationHttp';
import { mapAnalysisJob, mapAuditEvent, mapNotification } from './workerD1OrchestrationMapper';
import { buildJobDetail } from './workerD1OrchestrationJobs';
import { loadAccessibleJob } from './workerD1OrchestrationAuth';
import {
  buildReadiness,
  computeKpis,
  deriveJobStatus,
  isCustomerVisibleState,
  pcbiCoverageFromRows,
  readinessInputFromRow
} from './workerD1OrchestrationDerive';
import {
  countOpenCorrections,
  listJobRows,
  listPcbiGapRows,
  listRecentAuditRows,
  listRecentNotificationRows
} from './workerD1OrchestrationStore';

const dataOk = (context: OrchestrationRequestContext, data: unknown): Response =>
  jsonOk({ success: true, data, timestamp: context.runtime.now() }, context.request);

const matchesStatus = (status: AnalysisJobStatus, filter: string | undefined): boolean =>
  filter === undefined || filter === 'ALL' || status === filter;

const matchesSearch = (job: AnalysisJob, search: string | undefined): boolean => {
  if (search === undefined || search.length === 0) return true;
  const needle = search.toLowerCase();
  return [job.customerName, job.analysisJobId, job.tenantId].some((value) => value.toLowerCase().includes(needle));
};

export const listJobs: OrchestrationHandler = async (context) => {
  const query = parseWithSchema(jobsQuerySchema, Object.fromEntries(context.url.searchParams));
  const isAdmin = context.actor.role === 'ADMIN';
  const rows = await listJobRows(context.database, isAdmin ? null : context.actor.userId);
  const jobs = rows
    .filter((row) => isAdmin || row.current_version_id !== null)
    .map((row) => {
      const status = deriveJobStatus(row);
      const includeReport = isAdmin || isCustomerVisibleState(row.report_state);
      return { status, job: mapAnalysisJob(row, status, includeReport) };
    })
    .filter((entry) => matchesStatus(entry.status, query.status) && matchesSearch(entry.job, query.search))
    .map((entry) => entry.job);
  return dataOk(context, jobs);
};

export const getJob: OrchestrationHandler = async (context) => {
  const row = await loadAccessibleJob(context.database, context.actor, context.params.jobId);
  return dataOk(context, await buildJobDetail(context.database, row, context.actor));
};

export const getReadiness: OrchestrationHandler = async (context) => {
  const row = await loadAccessibleJob(context.database, context.actor, context.params.jobId);
  const [openCount, pcbiRows] = await Promise.all([
    countOpenCorrections(context.database, row.assessment_id),
    listPcbiGapRows(context.database, row.assessment_id, row.current_version_id)
  ]);
  return dataOk(context, buildReadiness(readinessInputFromRow(row, openCount, pcbiCoverageFromRows(pcbiRows))));
};

export const getAdminKpis: OrchestrationHandler = async (context) => {
  const rows = await listJobRows(context.database, null);
  const openCount = await countOpenCorrections(context.database, null);
  const jobs = rows.map((row) => ({
    status: deriveJobStatus(row),
    checklistComplete: row.checklist_complete === 1
  }));
  return dataOk(context, computeKpis(jobs, openCount));
};

export const getNotifications: OrchestrationHandler = async (context) => {
  const rows = await listRecentNotificationRows(context.database, ORCHESTRATION_LIMITS.notificationListLimit);
  return dataOk(context, rows.map((row) => mapNotification(row)));
};

export const getAuditTrail: OrchestrationHandler = async (context) => {
  const rows = await listRecentAuditRows(context.database, ORCHESTRATION_LIMITS.auditTrailLimit);
  return dataOk(context, rows.map((row) => mapAuditEvent(row)));
};
