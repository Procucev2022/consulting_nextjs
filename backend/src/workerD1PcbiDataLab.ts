import { D1_ROUTE_MESSAGES, D1_TABLES } from './constants/d1';
import { approveCommodityDataSchema, assignPcbiResearchSchema, detectUploadDomainSchema } from './constants/validation';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import { readJson, requestJsonFailureResult } from './workerHttp';
import type {
  PCBICommodityResearchWorkflowRow,
  PCBIDataLabDomainResult
} from './types/pcbiDataLabStorage';
import type { AssignPcbiResearchInput } from './types/validation';
import { requireWorkerDb } from './services/workerD1Query';
import logger from './utils/logger';
import { mapPcbiCommoditySource, uploadPcbiCommoditySource } from './workerD1PcbiDataLabUpload';
import {
  buildQueue, dashboard, getBenchmark, observationRows, promotions, sourceRows, workspace
} from './workerD1PcbiDataLabReadModel';

const jsonString = (value: unknown): string => typeof value === 'string' ? value : '';
const upper = (value: unknown): string => jsonString(value).trim().toUpperCase();
const id = (): string => crypto.randomUUID();

const detectDomain = async (request: Request): Promise<WorkerD1Result> => {
  const body: unknown = await readJson(request);
  const parsed = detectUploadDomainSchema.safeParse(body);
  if (!parsed.success) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabInvalid, errors: parsed.error.issues } };
  const text = `${parsed.data.fileName} ${parsed.data.fileContentSnippet || ''}`.toLowerCase().replace(/[_-]+/gu, ' ');
  const matchedSignatures: string[] = [];
  const customerTokens = ['purchase order', 'purchase history', 'customer data', 'customer_po', 'supplier', 'invoice', 'net price', 'order quantity'];
  const masterTokens = ['pcbi master', 'benchmark master', 'unspsc mapping', 'weekly index master'];
  const researchTokens = ['commodity', 'market price', 'benchmark index', 'historical price', 'price index'];
  const signatures = (tokens: string[]): string[] => tokens.filter((token) => text.includes(token));
  const customerMatches = signatures(customerTokens);
  const masterMatches = signatures(masterTokens);
  const researchMatches = signatures(researchTokens);
  let detectedDomain: PCBIDataLabDomainResult['detectedDomain'] = 'UNKNOWN';
  if (customerMatches.length >= 2 || /customer.*(?:po|purchase)|purchase history/i.test(parsed.data.fileName)) {
    detectedDomain = 'CUSTOMER_PURCHASE_HISTORY';
    matchedSignatures.push(...customerMatches);
    if (matchedSignatures.length === 0) matchedSignatures.push('customer purchase file name');
  }
  else if (masterMatches.length > 0) { detectedDomain = 'PCBI_MASTER_SYSTEM_DATA'; matchedSignatures.push(...masterMatches); }
  else if (researchMatches.length > 0) { detectedDomain = 'COMMODITY_RESEARCH_EVIDENCE'; matchedSignatures.push(...researchMatches); }
  const allowed = detectedDomain === 'UNKNOWN' ||
    (parsed.data.targetArea === 'MODULE_1_INGESTION' && detectedDomain === 'CUSTOMER_PURCHASE_HISTORY') ||
    (parsed.data.targetArea === 'PCBI_MASTER' && detectedDomain === 'PCBI_MASTER_SYSTEM_DATA') ||
    (parsed.data.targetArea === 'COMMODITY_DATA_LAB' && detectedDomain === 'COMMODITY_RESEARCH_EVIDENCE');
  const targetName = parsed.data.targetArea === 'MODULE_1_INGESTION' ? 'Module 1' : parsed.data.targetArea === 'PCBI_MASTER' ? 'PCBI Master' : 'Commodity Data Lab';
  const detection: PCBIDataLabDomainResult = {
    detectedDomain, targetArea: parsed.data.targetArea, isAllowedInTarget: allowed, matchedSignatures,
    ...(allowed ? {} : {
      errorMessage: D1_ROUTE_MESSAGES.pcbiDataLabDomainRejected(targetName),
      guidanceMessage: detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
        ? 'Upload customer purchase history through Module 1 ingestion.'
        : 'Upload PCBI master definitions through the PCBI Master tab.'
    })
  };
  return { data: { success: true, detection } };
};

const assignResearcher = async (
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
      if (db.batch) await db.batch(statements);
      else await Promise.all(statements.map((statement) => statement.run()));
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
      if (db.batch) await db.batch(statements);
      else await Promise.all(statements.map((statement) => statement.run()));
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

const approve = async (
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
  if (db.batch) await db.batch([insert, update]);
  else { await insert.run(); await update.run(); }
  logger.info('Promoted verified commodity evidence into PCBI catalog', {
    requestId, pcbiId: input.pcbiId, sourceId: source.source_id, catalogVersionId,
    observationCount: observations.length, approver: actorName
  });
  return { data: { success: true, result: {
    success: true, commodityId: input.commodityId, pcbiId: input.pcbiId, approvalStatus: 'ADMIN_APPROVED',
    catalogVersionCreated: true, catalogVersionId, message: 'Validated weekly observations were added to the active D1 PCBI series.'
  } } };
};

export const handlePcbiDataLabRoute = async (
  environment: CloudflareEnvironment, request: Request, url: URL, actorName: string
): Promise<WorkerD1Result> => {
  const requestId = request.headers.get('x-request-id') || id();
  const root = '/api/admin/pcbi/data-lab';
  const path = url.pathname.slice(root.length) || '/';
  const db = requireWorkerDb(environment.DB);
  try {
  if (path === '/detect-domain' && request.method === 'POST') return await detectDomain(request);
  if (path === '/upload-source' && request.method === 'POST') return await uploadPcbiCommoditySource(environment, request, actorName, requestId, { getBenchmark, detectDomain });
  if (path === '/approve' && request.method === 'POST') return await approve(environment, request, actorName, requestId);
  if (path === '/assignment' && request.method === 'POST') return await assignResearcher(db, request, actorName, requestId);
  if (path === '/dashboard' && request.method === 'GET') return dashboard(db, requestId);
  if (path === '/queue' && request.method === 'GET') {
    const queue = await buildQueue(db, requestId);
    return { data: { success: true, total: queue.length, queue } };
  }
  if (path === '/sources' && request.method === 'GET') {
    const rows = await sourceRows(db);
    return { data: { success: true, total: rows.length, sources: rows.map(mapPcbiCommoditySource) } };
  }
  if (path === '/version-history' && request.method === 'GET') {
    const rows = await promotions(db);
    return { data: { success: true, total: rows.length, versions: rows } };
  }
  const commodityMatch = path.match(/^\/commodity\/([^/]+)$/u);
  if (commodityMatch && request.method === 'GET') {
    const tab = url.searchParams.get('tab') || 'OVERVIEW';
    return workspace(db, decodeURIComponent(commodityMatch[1]), tab, requestId);
  }
  const allowedPath = ['/detect-domain', '/upload-source', '/approve', '/assignment', '/dashboard', '/queue', '/sources', '/version-history'].includes(path) || Boolean(commodityMatch);
  return {
    status: allowedPath ? 405 : 404,
    data: { success: false, message: allowedPath ? D1_ROUTE_MESSAGES.pcbiDataLabMethod : D1_ROUTE_MESSAGES.unknownPcbi }
  };
  } catch (error: unknown) {
    const failure = requestJsonFailureResult(request, error);
    if (failure) return failure;
    throw error;
  }
};


