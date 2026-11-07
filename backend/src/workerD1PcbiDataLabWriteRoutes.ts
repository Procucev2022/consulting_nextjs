import { D1_ROUTE_MESSAGES, D1_TABLES } from './constants/d1';
import { approveCommodityDataSchema, assignPcbiResearchSchema } from './constants/validation';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import type { PCBICommodityResearchWorkflowRow } from './types/pcbiDataLabStorage';
import type { AssignPcbiResearchInput } from './types/validation';
import { requireWorkerDb, runD1Statements } from './services/workerD1Query';
import logger from './utils/logger';
import { getBenchmark, observationRows, promotions, sourceRows } from './workerD1PcbiDataLabReadModel';
import { readJson } from './workerHttp';

const jsonString = (value: unknown): string => typeof value === 'string' ? value : '';
const upper = (value: unknown): string => jsonString(value).trim().toUpperCase();
const id = (): string => crypto.randomUUID();

export const handlePcbiResearchAssignment = async (
  db: NonNullable<CloudflareEnvironment['DB']>, request: Request, actorName: string, requestId: string
): Promise<WorkerD1Result> => {
  const body: unknown = await readJson(request);
  const parsed = assignPcbiResearchSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn('PCBI research assignment rejected by validation', { requestId, issues: parsed.error.issues });
    return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiResearchAssignmentInvalid, errors: parsed.error.issues } };
  }
  const input: AssignPcbiResearchInput = parsed.data;
  const benchmark = await getBenchmark(db, input.pcbiId);
  if (!benchmark) {
    logger.warn('PCBI research assignment references an unknown benchmark', { requestId, pcbiId: input.pcbiId });
    return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiResearchAssignmentNotFound } };
  }
  const startedAt = performance.now();
  const updatedAt = new Date().toISOString();
  let savedWorkflow: PCBICommodityResearchWorkflowRow | null = null;
  try {
    if (input.assignee === null) {
      const statements = [
        db.prepare(`DELETE FROM ${D1_TABLES.pcbiResearchWorkflows} WHERE pcbi_id = ?`).bind(input.pcbiId),
        db.prepare(`DELETE FROM ${D1_TABLES.pcbiResearchAssignments} WHERE pcbi_id = ?`).bind(input.pcbiId)
      ];
      await runD1Statements(db, statements, {
        operation: 'pcbi.research.unassign', requestId,
        pcbiId: input.pcbiId
      });
    } else {
      const existingWorkflow = await db.prepare(`SELECT * FROM ${D1_TABLES.pcbiResearchWorkflows} WHERE pcbi_id = ?`)
        .bind(input.pcbiId).first<PCBICommodityResearchWorkflowRow>();
      const workflowStatus = input.status ?? existingWorkflow?.status ?? 'QUEUED';
      const dueDate = input.dueDate === undefined ? existingWorkflow?.due_date ?? null : input.dueDate;
      const notes = input.notes === undefined ? existingWorkflow?.notes ?? '' : input.notes;
      savedWorkflow = {
        pcbi_id: input.pcbiId, status: workflowStatus, due_date: dueDate, notes,
        updated_by: actorName, updated_at: updatedAt
      };
      const statements = [db.prepare(`
        INSERT INTO ${D1_TABLES.pcbiResearchAssignments}
          (pcbi_id, assigned_to, assigned_by, assigned_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(pcbi_id) DO UPDATE SET
          assigned_to = excluded.assigned_to,
          assigned_by = excluded.assigned_by,
          updated_at = excluded.updated_at
      `).bind(input.pcbiId, input.assignee, actorName, updatedAt, updatedAt), db.prepare(`
        INSERT INTO ${D1_TABLES.pcbiResearchWorkflows}
          (pcbi_id, status, due_date, notes, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(pcbi_id) DO UPDATE SET
          status = excluded.status,
          due_date = excluded.due_date,
          notes = excluded.notes,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
      `).bind(input.pcbiId, workflowStatus, dueDate, notes, actorName, updatedAt)];
      await runD1Statements(db, statements, {
        operation: 'pcbi.research.assign', requestId,
        pcbiId: input.pcbiId
      });
    }
  } catch (error) {
    logger.error('Failed to persist PCBI research assignment in D1', { requestId, pcbiId: input.pcbiId }, error);
    throw error;
  }
  logger.info('Persisted PCBI research assignment in D1', {
    requestId, pcbiId: input.pcbiId, assigned: input.assignee !== null,
    assignedTo: input.assignee, operation: input.assignee === null ? 'DELETE' : 'UPSERT',
    durationMs: Math.round(performance.now() - startedAt)
  });
  return {
    data: {
      success: true,
      assignment: input.assignee === null
        ? null
        : {
          pcbiId: input.pcbiId, assignedTo: input.assignee, assignedBy: actorName, updatedAt,
          workflowStatus: savedWorkflow?.status || 'QUEUED',
          dueDate: savedWorkflow?.due_date ?? null,
          notes: savedWorkflow?.notes || ''
        }
    }
  };
};

export const handlePcbiCommodityApproval = async (
  environment: CloudflareEnvironment, request: Request, actorName: string, requestId: string
): Promise<WorkerD1Result> => {
  const db = requireWorkerDb(environment.DB);
  const body: unknown = await readJson(request);
  const parsed = approveCommodityDataSchema.safeParse(body);
  if (!parsed.success) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabInvalid, errors: parsed.error.issues } };
  const input = parsed.data;
  const [benchmark, allSources, allObservations, allPromotions] = await Promise.all([
    getBenchmark(db, input.pcbiId), sourceRows(db, input.pcbiId), observationRows(db, input.pcbiId), promotions(db, input.pcbiId)
  ]);
  if (!benchmark) return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabSourceNotFound } };
  const source = allSources.find((item) => item.commodity_id === input.commodityId && item.validation_status === 'VALIDATED' && item.approval_status === 'UNDER_REVIEW');
  const observations = source ? allObservations.filter((row) => row.sourceId === source.source_id) : [];
  const issues: string[] = [];
  if (!source) issues.push('No validated evidence source is awaiting approval for this commodity.');
  if (source && source.frequency !== 'WEEKLY') issues.push('Only weekly evidence can currently be published to the PCBI index catalog.');
  if (source && upper(source.unit) !== upper(benchmark.benchmark_unit)) issues.push('Source unit does not match the D1 benchmark unit.');
  if (source && upper(source.currency) !== upper(benchmark.currency)) issues.push('Source currency does not match the D1 benchmark currency.');
  if (source && upper(source.geography) !== upper(benchmark.geography)) issues.push('Source geography does not match the D1 benchmark geography.');
  if (observations.length === 0) issues.push('No extracted observations are available for promotion.');
  if (observations.some((row) => row.status !== 'VERIFIED')) issues.push('Every observation must pass source validation before promotion.');
  if (allPromotions.some((item) => item.source_id === source?.source_id)) issues.push('This evidence source has already been promoted.');
  if (issues.length > 0 || !source) return { status: 422, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabApprovalBlocked, errors: issues } };

  const promotionId = id();
  const promotedAt = new Date().toISOString();
  const catalogVersionId = `PCBI-${promotionId}`;
  const insert = db.prepare(`INSERT INTO ${D1_TABLES.pcbiCommodityPromotions} (
    promotion_id, catalog_version_id, source_id, commodity_id, pcbi_id, approver_name, comments, promoted_at, observation_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(promotionId, catalogVersionId, source.source_id, input.commodityId, input.pcbiId, actorName,
      input.comments || null, promotedAt, observations.length);
  const update = db.prepare(`UPDATE ${D1_TABLES.pcbiCommoditySources}
    SET methodology_status = 'METHODOLOGY_APPROVED', approval_status = 'ADMIN_APPROVED'
    WHERE source_id = ?`).bind(source.source_id);
  await runD1Statements(db, [update, insert], {
    operation: 'pcbi.data_lab.approve', requestId,
    tenantId: environment.REQUEST_TENANT_ID, pcbiId: input.pcbiId, sourceId: source.source_id
  });
  logger.info('Promoted verified commodity evidence into PCBI catalog', {
    requestId, pcbiId: input.pcbiId, sourceId: source.source_id, catalogVersionId,
    observationCount: observations.length, approver: actorName
  });
  return { data: { success: true, result: {
    success: true, commodityId: input.commodityId, pcbiId: input.pcbiId, approvalStatus: 'ADMIN_APPROVED',
    catalogVersionCreated: true, catalogVersionId, message: 'Validated weekly observations were added to the active D1 PCBI series.'
  } } };
};
