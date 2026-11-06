import {
  D1_PCBI_MASTER_FIELDS,
  D1_PCBI_UNSPSC_FIELDS,
  D1_REPORTING,
  D1_ROUTE_MESSAGES,
  D1_TABLES
} from './constants/d1';
import { approveCommodityDataSchema, assignPcbiResearchSchema, detectUploadDomainSchema } from './constants/validation';
import { SQL_PCBI_CUSTOMER_SPEND_BY_UNSPSC } from './constants/pcbiDataLabSql';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import type {
  CommodityWorkspaceDetail,
  CommodityResearchQueueRow,
  PCBIResearchDashboardMetrics
} from './types/pcbiCommodityDataLab';
import { readJson, requestJsonFailureResult } from './workerHttp';
import type {
  PCBICommodityBenchmarkRow,
  PCBICommodityObservationRow,
  PCBICommodityPromotionRow,
  PCBICommodityResearchAssignmentRow,
  PCBICommodityResearchWorkflowRow,
  PCBICommoditySourceRow,
  PCBICommoditySpendByUnspscRow,
  PCBICommoditySpendSummary,
  PCBIDataLabDomainResult
} from './types/pcbiDataLabStorage';
import type { AssignPcbiResearchInput, PcbiAdminImportInput } from './types/validation';
import { queryD1Rows, requireWorkerDb } from './services/workerD1Query';
import { getPublishedPcbiPayload, mapPcbiImportRow } from './workerD1PcbiAdmin';
import logger from './utils/logger';
import { mapPcbiCommoditySource, uploadPcbiCommoditySource } from './workerD1PcbiDataLabUpload';
import { countPcbiHighImpactGaps, countPcbiPriorities, prioritizePcbiResearchQueue } from './services/pcbiResearchPrioritization';

const jsonString = (value: unknown): string => typeof value === 'string' ? value : '';
const upper = (value: unknown): string => jsonString(value).trim().toUpperCase();
const id = (): string => crypto.randomUUID();

const benchmarkFromImported = (payload: PcbiAdminImportInput | null, pcbiId: string): PCBICommodityBenchmarkRow | null => {
  const imported = payload?.benchmarks.find((row) =>
    String(mapPcbiImportRow(row, 'PCBI_MASTER', payload, [...D1_PCBI_MASTER_FIELDS]).pcbi_id) === pcbiId
  );
  if (!payload || !imported) return null;
  const values = mapPcbiImportRow(imported, 'PCBI_MASTER', payload, [...D1_PCBI_MASTER_FIELDS]);
  return {
    pcbi_id: pcbiId,
    benchmark_name: jsonString(values.benchmark_name),
    benchmark_unit: jsonString(values.benchmark_unit),
    currency: jsonString(values.currency),
    geography: jsonString(values.geography),
    category: jsonString(values.category),
    sub_category: jsonString(values.sub_category),
    sector: jsonString(values.sector),
    quality_rating: jsonString(values.quality_rating),
    benchmarkability_percent: Number.isFinite(Number(values.benchmarkability_percent)) ? Number(values.benchmarkability_percent) : null,
    effective_from: jsonString(values.start_date) || null,
    start_date: jsonString(values.start_date) || null,
    end_date: jsonString(values.end_date) || null,
    applicable_sectors: null
  };
};

const getBenchmark = async (
  db: NonNullable<CloudflareEnvironment['DB']>, pcbiId: string, payload?: PcbiAdminImportInput | null
): Promise<PCBICommodityBenchmarkRow | null> => {
  const effectivePayload = payload === undefined ? await getPublishedPcbiPayload(db) : payload;
  const imported = benchmarkFromImported(effectivePayload, pcbiId);
  if (imported) return imported;
  return db.prepare(`SELECT * FROM ${D1_TABLES.pcbiBenchmarks} WHERE pcbi_id = ? AND active = 1`)
    .bind(pcbiId).first<PCBICommodityBenchmarkRow>();
};

const getBenchmarks = async (
  db: NonNullable<CloudflareEnvironment['DB']>, payload: PcbiAdminImportInput | null
): Promise<PCBICommodityBenchmarkRow[]> => {
  if (payload) {
    const imported = payload.benchmarks.map((row) => {
      const values = mapPcbiImportRow(row, 'PCBI_MASTER', payload, [...D1_PCBI_MASTER_FIELDS]);
      return {
        pcbi_id: jsonString(values.pcbi_id),
        benchmark_name: jsonString(values.benchmark_name),
        benchmark_unit: jsonString(values.benchmark_unit),
        currency: jsonString(values.currency),
        geography: jsonString(values.geography),
        category: jsonString(values.category),
        sub_category: jsonString(values.sub_category),
        sector: jsonString(values.sector),
        quality_rating: jsonString(values.quality_rating),
        benchmarkability_percent: Number.isFinite(Number(values.benchmarkability_percent)) ? Number(values.benchmarkability_percent) : null,
        effective_from: jsonString(values.start_date) || null,
        start_date: jsonString(values.start_date) || null,
        end_date: jsonString(values.end_date) || null,
        applicable_sectors: null
      } satisfies PCBICommodityBenchmarkRow;
    });
    return imported.filter((row) => row.pcbi_id.length > 0);
  }
  return queryD1Rows<PCBICommodityBenchmarkRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiBenchmarks} WHERE active = 1 ORDER BY category, sub_category, benchmark_name`);
};

const pcbiSpendByBenchmark = async (
  db: NonNullable<CloudflareEnvironment['DB']>,
  publishedPayload: PcbiAdminImportInput | null,
  requestId?: string
): Promise<Map<string, PCBICommoditySpendSummary>> => {
  const spendRows = await queryD1Rows<PCBICommoditySpendByUnspscRow>(
    db, SQL_PCBI_CUSTOMER_SPEND_BY_UNSPSC, [D1_REPORTING.inrPerCrore], requestId
  );
  const mappingRows = publishedPayload
    ? publishedPayload.unspscMappings.map((row) =>
      mapPcbiImportRow(row, 'UNSPSC_MAPPING', publishedPayload, [...D1_PCBI_UNSPSC_FIELDS]))
    : await queryD1Rows<Record<string, unknown>>(db,
      `SELECT unspsc_code, pcbi_id FROM ${D1_TABLES.pcbiMappings} WHERE active = 1`, [], requestId);
  const spendByCode = new Map(spendRows.map((row) => [
    String(row.unspsc_code).trim(), {
      spendInr: Math.max(0, Number(row.spend_inr) || 0),
      transactionCount: Math.max(0, Number(row.transaction_count) || 0)
    }
  ]));
  const result = new Map<string, PCBICommoditySpendSummary>();
  const seenMappings = new Set<string>();
  for (const mapping of mappingRows) {
    const code = String(mapping.unspsc_code || '').trim();
    const pcbiId = String(mapping.pcbi_id || '').trim();
    const key = `${code}:${pcbiId}`;
    const spend = spendByCode.get(code);
    if (!code || !pcbiId || !spend || seenMappings.has(key)) continue;
    seenMappings.add(key);
    const current = result.get(pcbiId) || { spendInr: 0, transactionCount: 0, unspscCodes: [] };
    current.spendInr += spend.spendInr;
    current.transactionCount += spend.transactionCount;
    current.unspscCodes.push(code);
    result.set(pcbiId, current);
  }
  return result;
};


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

const observationRows = async (db: NonNullable<CloudflareEnvironment['DB']>, pcbiId?: string): Promise<PCBICommodityObservationRow[]> => {
  const where = pcbiId ? ' WHERE o.pcbi_id = ?' : '';
  const values = pcbiId ? [pcbiId] : [];
  return queryD1Rows<PCBICommodityObservationRow>(db, `
    SELECT o.observation_id AS "observationId", o.source_id AS "sourceId", o.pcbi_id, o.observation_date AS "observation_date",
      o.observation_date AS "sourceDate", o.raw_value AS "raw_value", o.raw_unit AS "raw_unit",
      o.raw_currency AS "raw_currency", o.normalized_value AS "normalized_value", o.normalized_unit AS "normalized_unit",
      o.normalized_currency AS "normalized_currency", o.frequency, o.status, o.payload_json
    FROM ${D1_TABLES.pcbiCommodityObservations} o${where} ORDER BY o.observation_date DESC`, values);
};

const sourceRows = async (db: NonNullable<CloudflareEnvironment['DB']>, pcbiId?: string): Promise<PCBICommoditySourceRow[]> =>
  queryD1Rows<PCBICommoditySourceRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiCommoditySources}${pcbiId ? ' WHERE pcbi_id = ?' : ''} ORDER BY uploaded_at DESC`, pcbiId ? [pcbiId] : []);

const promotions = async (db: NonNullable<CloudflareEnvironment['DB']>, pcbiId?: string): Promise<PCBICommodityPromotionRow[]> =>
  queryD1Rows<PCBICommodityPromotionRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiCommodityPromotions}${pcbiId ? ' WHERE pcbi_id = ?' : ''} ORDER BY promoted_at DESC`, pcbiId ? [pcbiId] : []);

const researchAssignments = async (db: NonNullable<CloudflareEnvironment['DB']>): Promise<PCBICommodityResearchAssignmentRow[]> =>
  queryD1Rows<PCBICommodityResearchAssignmentRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiResearchAssignments} ORDER BY updated_at DESC`);

const researchWorkflows = async (db: NonNullable<CloudflareEnvironment['DB']>): Promise<PCBICommodityResearchWorkflowRow[]> =>
  queryD1Rows<PCBICommodityResearchWorkflowRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiResearchWorkflows} ORDER BY updated_at DESC`);

const dateRange = (dates: string[]): string => {
  if (dates.length === 0) return 'No published observations';
  const sorted = [...dates].sort();
  return `${sorted[0]} – ${sorted[sorted.length - 1]} (${dates.length} observations)`;
};

const buildQueue = async (
  db: NonNullable<CloudflareEnvironment['DB']>,
  requestId?: string,
  publishedPayloadOverride?: PcbiAdminImportInput | null
): Promise<CommodityResearchQueueRow[]> => {
  const publishedPayload = publishedPayloadOverride === undefined
    ? await getPublishedPcbiPayload(db)
    : publishedPayloadOverride;
  const [benchmarks, sources, observations, promoted, assignments, workflows, spendByBenchmark] = await Promise.all([
    getBenchmarks(db, publishedPayload), sourceRows(db), observationRows(db), promotions(db),
    researchAssignments(db), researchWorkflows(db),
    pcbiSpendByBenchmark(db, publishedPayload, requestId)
  ]);
  const assignmentsByPcbi = new Map(assignments.map((assignment) => [assignment.pcbi_id, assignment]));
  const workflowsByPcbi = new Map(workflows.map((workflow) => [workflow.pcbi_id, workflow]));
  const queue = benchmarks.map((benchmark): CommodityResearchQueueRow => {
    const relatedSources = sources.filter((source) => source.pcbi_id === benchmark.pcbi_id);
    const relatedObservations = observations.filter((observation) => observation.pcbi_id === benchmark.pcbi_id);
    const seriesPromoted = promoted.some((entry) => entry.pcbi_id === benchmark.pcbi_id);
    const latestSource = relatedSources[0];
    const assignment = assignmentsByPcbi.get(benchmark.pcbi_id);
    const workflow = workflowsByPcbi.get(benchmark.pcbi_id);
    const status: CommodityResearchQueueRow['currentStatus'] = seriesPromoted
      ? 'PRODUCTION_READY'
      : relatedObservations.length > 0 ? 'PARTIAL_HISTORY'
        : latestSource && latestSource.validation_status !== 'VALIDATED' ? 'SOURCE_UNVERIFIED' : 'NO_HISTORY';
    const researchStatus: CommodityResearchQueueRow['researchStatus'] = seriesPromoted
      ? 'RESOLVED'
      : relatedObservations.length > 0 ? 'DATA_UPLOADED'
        : latestSource ? 'SOURCE_IDENTIFIED' : 'QUEUED';
    const frequency = latestSource?.frequency as CommodityResearchQueueRow['availableFrequency'] | undefined;
    const customerSpend = spendByBenchmark.get(benchmark.pcbi_id) || { spendInr: 0, transactionCount: 0, unspscCodes: [] };
    const customerSpendCr = customerSpend.spendInr / D1_REPORTING.inrPerCrore;
    const start = benchmark.start_date || benchmark.effective_from || '';
    const end = benchmark.end_date || '';
    return {
      commodity: benchmark.benchmark_name,
      commodityId: benchmark.pcbi_id,
      module2Classification: benchmark.category,
      unspsc: customerSpend.unspscCodes.join(', '),
      customerSpend: customerSpendCr,
      customerSpendCr: customerSpendCr.toFixed(D1_REPORTING.decimalPlaces),
      transactionCount: customerSpend.transactionCount,
      pcbiId: benchmark.pcbi_id,
      seriesId: latestSource?.series_id || benchmark.pcbi_id,
      currentStatus: status,
      requiredHistory: start || end ? `${start || 'Not configured'} to ${end || 'Not configured'}` : 'Not configured in D1',
      availableHistory: dateRange(relatedObservations.map((row) => row.observation_date)),
      requiredFrequency: 'WEEKLY',
      requiredUnit: benchmark.benchmark_unit,
      requiredCurrency: benchmark.currency,
      requiredGeography: benchmark.geography,
      availableFrequency: frequency || 'NONE',
      sourceStatus: latestSource ? (latestSource.validation_status === 'VALIDATED' ? 'SOURCE_VERIFIED' : latestSource.validation_status) : 'NO_SOURCE',
      methodologyStatus: latestSource?.methodology_status || 'NOT_REVIEWED',
      priority: 'PENDING — Spend Link Required',
      priorityScore: 0,
      priorityReason: 'SPEND_LINK_REQUIRED',
      researchStatus,
      assignedTo: assignment?.assigned_to || null,
      assignedAt: assignment?.assigned_at || null,
      workflowStatus: workflow?.status || (seriesPromoted ? 'COMPLETED' : 'QUEUED'),
      workflowDueDate: workflow?.due_date || null,
      workflowNotes: workflow?.notes || '',
      lastUpdated: latestSource?.uploaded_at || '',
      action: status === 'PRODUCTION_READY' ? 'OPEN WORKSPACE' : 'UPLOAD SOURCE'
    };
  });
  return prioritizePcbiResearchQueue(queue);
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

const dashboard = async (db: NonNullable<CloudflareEnvironment['DB']>, requestId?: string): Promise<WorkerD1Result> => {
  const queue = await buildQueue(db, requestId);
  const metrics: PCBIResearchDashboardMetrics = {
    totalCommodities: queue.length,
    productionReadyCount: queue.filter((item) => item.currentStatus === 'PRODUCTION_READY').length,
    partialHistoryCount: queue.filter((item) => item.currentStatus === 'PARTIAL_HISTORY').length,
    noHistoryCount: queue.filter((item) => item.currentStatus === 'NO_HISTORY').length,
    missingCount: queue.filter((item) => item.currentStatus === 'MISSING').length,
    sourceUnverifiedCount: queue.filter((item) => item.currentStatus === 'SOURCE_UNVERIFIED').length,
    methodologyPendingCount: queue.filter((item) => item.methodologyStatus === 'PENDING' || item.methodologyStatus === 'NOT_REVIEWED').length,
    specificationMismatchCount: queue.filter((item) => item.currentStatus === 'SPECIFICATION_MISMATCH').length,
    frequencyMismatchCount: queue.filter((item) => item.currentStatus === 'FREQUENCY_MISMATCH').length,
    highImpactGapsCount: countPcbiHighImpactGaps(queue),
    queueByPriority: countPcbiPriorities(queue)
  };
  return { data: { success: true, metrics } };
};

const workspace = async (
  db: NonNullable<CloudflareEnvironment['DB']>, pcbiId: string, tab: string, requestId?: string
): Promise<WorkerD1Result> => {
  const publishedPayload = await getPublishedPcbiPayload(db);
  const benchmark = await getBenchmark(db, pcbiId, publishedPayload);
  if (!benchmark) return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabSourceNotFound } };
  const [sources, observations, promoted, spendByBenchmark, queue] = await Promise.all([
    sourceRows(db, pcbiId), observationRows(db, pcbiId), promotions(db, pcbiId),
    pcbiSpendByBenchmark(db, publishedPayload, requestId),
    buildQueue(db, requestId, publishedPayload)
  ]);
  const queuePriority = queue.find((row) => row.pcbiId === pcbiId);
  const customerSpend = spendByBenchmark.get(pcbiId) || { spendInr: 0, transactionCount: 0, unspscCodes: [] };
  const countVerified = observations.filter((row) => row.status === 'VERIFIED').length;
  const countReview = observations.length - countVerified;
  const candidate = sources.find((source) => source.validation_status === 'VALIDATED' && source.frequency === 'WEEKLY');
  const candidatePromoted = Boolean(candidate && promoted.some((entry) => entry.source_id === candidate.source_id));
  const canPromote = Boolean(candidate && countVerified > 0 && countReview === 0 && !candidatePromoted);
  const overview = {
    commodityId: pcbiId,
    commodityName: benchmark.benchmark_name,
    pcbiId,
    seriesId: sources[0]?.series_id || pcbiId,
    module2Classification: benchmark.category,
    unspsc: customerSpend.unspscCodes.join(', '),
    currentStatus: promoted.length > 0 ? 'PRODUCTION_READY' as const : observations.length > 0 ? 'PARTIAL_HISTORY' as const : 'NO_HISTORY' as const,
    customerSpendInr: customerSpend.spendInr,
    customerSpendCr: (customerSpend.spendInr / D1_REPORTING.inrPerCrore).toFixed(D1_REPORTING.decimalPlaces),
    transactionCount: customerSpend.transactionCount,
    requiredStartDate: benchmark.start_date || benchmark.effective_from || '',
    requiredEndDate: benchmark.end_date || '',
    requiredFrequency: 'WEEKLY' as const,
    requiredUnit: benchmark.benchmark_unit,
    requiredCurrency: benchmark.currency,
    requiredGeography: benchmark.geography,
    availableHistory: dateRange(observations.map((row) => row.observation_date)),
    priority: queuePriority?.priority || 'PENDING — Spend Link Required',
    priorityScore: queuePriority?.priorityScore || 0,
    priorityReason: queuePriority?.priorityReason || 'SPEND_LINK_REQUIRED',
    researchStatus: promoted.length > 0 ? 'RESOLVED' as const : observations.length > 0 ? 'DATA_UPLOADED' as const : sources.length > 0 ? 'SOURCE_IDENTIFIED' as const : 'QUEUED' as const,
    lastUpdated: sources[0]?.uploaded_at || ''
  };
  const detail: CommodityWorkspaceDetail = {
    overview,
    sources: sources.map(mapPcbiCommoditySource),
    extractedObservations: observations.map((row) => ({
      observationId: row.observationId,
      sourceId: row.sourceId,
      sourceDate: row.sourceDate,
      rawValue: Number(row.raw_value),
      rawUnit: row.raw_unit,
      rawCurrency: row.raw_currency,
      normalizedValue: Number(row.normalized_value),
      normalizedUnit: row.normalized_unit,
      normalizedCurrency: row.normalized_currency,
      frequency: row.frequency,
      status: row.status === 'VERIFIED' ? 'VERIFIED' : 'NEEDS_REVIEW'
    })),
    methodologyDetails: {
      methodologyId: `METHOD-${pcbiId}`,
      title: `Weekly evidence validation for ${benchmark.benchmark_name}`,
      status: sources.find((source) => source.methodology_status !== 'PENDING')?.methodology_status || 'PENDING',
      conversionRule: 'Values are not converted; source unit, currency, and geography must match the D1 benchmark definition.',
      governanceNotes: 'Catalog promotion requires a validated weekly source and an explicit administrator approval.'
    },
    validationSummary: {
      passed: observations.length > 0 && countReview === 0,
      totalObservations: observations.length,
      validObservations: countVerified,
      missingPeriods: [],
      criticalErrorsCount: countReview
    },
    approvalPackage: {
      isReadyForApproval: canPromote,
      canWriteToCatalog: canPromote,
      approvalGateStatus: canPromote ? 'APPROVED_READY_FOR_CATALOG' : promoted.length > 0 ? 'CATALOG_PUBLISHED' : 'LOCKED_PENDING_REVIEW',
      approverName: promoted[0]?.approver_name,
      approvedAt: promoted[0]?.promoted_at
    },
    activeTab: tab as CommodityWorkspaceDetail['activeTab']
  };
  return { data: { success: true, workspace: detail } };
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


