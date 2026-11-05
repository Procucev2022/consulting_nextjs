import { D1_ROUTE_MESSAGES, D1_TABLES } from './constants/d1';
import { DEFAULT_CACHE_TTL_MS, D1_REFERENCE_CACHE_KEYS } from './constants/db';
import { PCBI_PUBLISHED_PAYLOAD_QUERY } from './constants/pcbiHistorical';
import { pcbiAdminImportSchema, pcbiAdminPublishSchema } from './constants/validation';
import { queryD1Rows } from './services/workerD1Query';
import { clearD1ReferenceDataCache } from './services/d1ReferenceDataCache';
import type { CloudflareD1Database } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import type { PCBIPublishedPayloadCacheEntry } from './types/pcbi';
import type { PcbiAdminImportInput } from './types/validation';
import logger from './utils/logger';
import { readJson, requestJsonFailureResult } from './workerHttp';

type ImportIssue = { field: string; message: string; row?: number };
type VersionRow = D1Record & {
  id: string;
  version: string;
  upload_id: string;
  status: string;
  metrics_json: string;
  validation_report_json: string;
  payload_json: string;
};

let publishedPayloadCache = new WeakMap<CloudflareD1Database, PCBIPublishedPayloadCacheEntry>();
let publishedPayloadLoads = new WeakMap<CloudflareD1Database, Promise<PcbiAdminImportInput | null>>();
let publishedPayloadGenerations = new WeakMap<CloudflareD1Database, number>();

const jsonObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const parseJsonField = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'string') return jsonObject(value);
  try { return jsonObject(JSON.parse(value)); } catch { return {}; }
};

const mapValue = (
  row: Record<string, unknown>,
  sheet: string,
  field: string,
  payload: PcbiAdminImportInput
): unknown => {
  const mappings = payload.mappings[sheet] || [];
  const mapping = mappings.find((entry) => entry.mappedField === field);
  return mapping ? row[mapping.excelColumn] : row[field];
};

export const mapPcbiImportRow = (
  row: Record<string, unknown>,
  sheet: string,
  payload: PcbiAdminImportInput,
  fields: string[]
): Record<string, unknown> => Object.fromEntries(fields.map((field) => [field, mapValue(row, sheet, field, payload)]));

const collectImportIssues = (payload: PcbiAdminImportInput): ImportIssue[] => {
  const issues: ImportIssue[] = [];
  if (payload.validationSummary.blockingErrorCount > 0) {
    issues.push({ field: 'validationSummary.blockingErrorCount', message: D1_ROUTE_MESSAGES.pcbiImportBlocked });
  }
  if (payload.benchmarks.length === 0) {
    issues.push({ field: 'benchmarks', message: D1_ROUTE_MESSAGES.pcbiImportBlocked });
  }
  const seenIds = new Set<string>();
  payload.benchmarks.forEach((row, index) => {
    const pcbiId = String(mapValue(row, 'PCBI_MASTER', 'pcbi_id', payload) ?? '').trim();
    const benchmarkName = String(mapValue(row, 'PCBI_MASTER', 'benchmark_name', payload) ?? '').trim();
    const benchmarkUnit = String(mapValue(row, 'PCBI_MASTER', 'benchmark_unit', payload) ?? '').trim();
    const currency = String(mapValue(row, 'PCBI_MASTER', 'currency', payload) ?? '').trim();
    if (!pcbiId) issues.push({ field: 'pcbi_id', message: 'A benchmark row is missing its PCBI ID.', row: index + 2 });
    if (!benchmarkName) issues.push({ field: 'benchmark_name', message: 'A benchmark row is missing its benchmark name.', row: index + 2 });
    if (!benchmarkUnit) issues.push({ field: 'benchmark_unit', message: 'A benchmark row is missing its unit of measure.', row: index + 2 });
    if (!currency) issues.push({ field: 'currency', message: 'A benchmark row is missing its currency.', row: index + 2 });
    if (pcbiId && seenIds.has(pcbiId)) issues.push({ field: 'pcbi_id', message: `Duplicate PCBI ID ${pcbiId}.`, row: index + 2 });
    if (pcbiId) seenIds.add(pcbiId);
  });
  payload.weeklyIndices.forEach((row, index) => {
    const pcbiId = String(mapValue(row, 'WEEKLY_INDEX', 'pcbi_id', payload) ?? '').trim();
    const weekStart = mapValue(row, 'WEEKLY_INDEX', 'week_start', payload);
    const indexValue = Number(mapValue(row, 'WEEKLY_INDEX', 'index_value', payload));
    if (!pcbiId) issues.push({ field: 'weeklyIndices.pcbi_id', message: 'A weekly index row is missing its PCBI ID.', row: index + 2 });
    if (typeof weekStart !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      issues.push({ field: 'weeklyIndices.week_start', message: 'Weekly index dates must use YYYY-MM-DD format.', row: index + 2 });
    }
    if (!Number.isFinite(indexValue) || indexValue <= 0) {
      issues.push({ field: 'weeklyIndices.index_value', message: 'Weekly index values must be positive numbers.', row: index + 2 });
    }
  });
  return issues;
};

const versionMetrics = (payload: PcbiAdminImportInput): Record<string, unknown> => ({
  benchmark_count: payload.benchmarks.length,
  weekly_records_count: payload.weeklyIndices.length,
  constituent_count: payload.constituents.length,
  unspsc_mappings_count: payload.unspscMappings.length,
  a_quality_count: payload.validationSummary.aQualityCount,
  b_quality_count: payload.validationSummary.bQualityCount,
  c_quality_count: payload.validationSummary.cQualityCount,
  total_benchmarkable_pct: payload.validationSummary.avgBenchmarkability,
  date_start: payload.validationSummary.dateStart,
  date_end: payload.validationSummary.dateEnd,
  warnings_count: payload.validationSummary.warningCount,
  errors_count: payload.validationSummary.blockingErrorCount
});

const serializeVersion = (row: VersionRow): Record<string, unknown> => ({
  id: row.id,
  version: row.version,
  upload_id: row.upload_id,
  file_name: row.file_name,
  file_size_mb: Number(row.file_size_mb || 0),
  upload_date: row.uploaded_at,
  uploaded_by: row.uploaded_by,
  effective_date: row.effective_date,
  status: row.status,
  metrics: parseJsonField(row.metrics_json),
  validation_report_json: row.validation_report_json,
  published_at: row.published_at || null,
  published_by: row.published_by || null
});

const readBody = async (request: Request): Promise<unknown> => readJson(request);

const invalidInput = (message: string, errors: unknown): WorkerD1Result => ({
  status: 400,
  data: { success: false, message, errors }
});

const conflict = (): WorkerD1Result => ({
  status: 409,
  data: { success: false, message: D1_ROUTE_MESSAGES.pcbiVersionConflict }
});

const insertVersion = async (
  db: CloudflareD1Database,
  payload: PcbiAdminImportInput,
  issues: ImportIssue[],
  requestId: string
): Promise<WorkerD1Result> => {
  const version = payload.version.toUpperCase();
  const existing = await db.prepare(`SELECT id FROM ${D1_TABLES.pcbiMasterVersions} WHERE version = ?`)
    .bind(version).first<{ id: string }>();
  if (existing) return conflict();
  const now = new Date().toISOString();
  const metrics = versionMetrics(payload);
  const uploadId = crypto.randomUUID();
  const id = crypto.randomUUID();
  const status = 'VALIDATED';
  await db.prepare(`
    INSERT INTO ${D1_TABLES.pcbiMasterVersions} (
      id, version, upload_id, file_name, file_size_mb, uploaded_by, uploaded_at, effective_date,
      status, metrics_json, validation_report_json, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, version, uploadId, payload.file_name, payload.file_size_mb, payload.uploaded_by, now,
    payload.validationSummary.dateStart || now.slice(0, 10), status,
    JSON.stringify(metrics), JSON.stringify({ ...payload.validationSummary, serverIssues: issues }), JSON.stringify(payload)
  ).run();
  logger.info('Persisted PCBI master version in D1', {
    requestId, version, uploadId, status, benchmarkCount: payload.benchmarks.length,
    weeklyIndexCount: payload.weeklyIndices.length
  });
  return {
    data: {
      success: true,
      version,
      upload_id: uploadId,
      status,
      import_date: now,
      successful_records: payload.validationSummary.validRecords,
      warning_records: payload.validationSummary.warningRecords,
      error_records: issues.length,
      records_excluded: issues.length,
      pcbi_records: payload.benchmarks.length,
      weekly_index_records: payload.weeklyIndices.length,
      constituent_records: payload.constituents.length,
      source_records: payload.sources.length,
      unspsc_mapping_records: payload.unspscMappings.length
    }
  };
};

const importVersion = async (
  db: CloudflareD1Database,
  request: Request,
  requestId: string
): Promise<WorkerD1Result> => {
  const parsed = pcbiAdminImportSchema.safeParse(await readBody(request));
  if (!parsed.success) return invalidInput(D1_ROUTE_MESSAGES.pcbiImportInvalid, parsed.error.issues);
  const issues = collectImportIssues(parsed.data);
  if (issues.length > 0) {
    return { status: 422, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiImportBlocked, errors: issues } };
  }
  return insertVersion(db, parsed.data, issues, requestId);
};

const publishVersion = async (
  db: CloudflareD1Database,
  request: Request,
  version: string,
  requestId: string
): Promise<WorkerD1Result> => {
  const parsed = pcbiAdminPublishSchema.safeParse(await readBody(request));
  if (!parsed.success) return invalidInput(D1_ROUTE_MESSAGES.pcbiPublishInvalid, parsed.error.issues);
  const row = await db.prepare(`SELECT * FROM ${D1_TABLES.pcbiMasterVersions} WHERE version = ?`)
    .bind(version).first<VersionRow>();
  if (!row) return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiVersionNotFound } };
  const payload = parseJsonField(row.payload_json) as unknown as PcbiAdminImportInput;
  const issues = collectImportIssues(payload);
  if (row.status !== 'VALIDATED' && row.status !== 'PUBLISHED' || issues.length > 0) {
    return { status: 422, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiPublishBlocked, errors: issues } };
  }
  const now = new Date().toISOString();
  const deactivate = db.prepare(`UPDATE ${D1_TABLES.pcbiMasterVersions} SET status = 'ARCHIVED' WHERE status = 'PUBLISHED' AND version <> ?`)
    .bind(version);
  const activate = db.prepare(`UPDATE ${D1_TABLES.pcbiMasterVersions} SET status = 'PUBLISHED', published_at = ?, published_by = ? WHERE version = ?`)
    .bind(now, parsed.data.published_by, version);
  if (db.batch) await db.batch([deactivate, activate]);
  else {
    await deactivate.run();
    await activate.run();
  }
  logger.info('Published active PCBI master version from D1', { requestId, version, publishedBy: parsed.data.published_by });
  return {
    data: {
      success: true,
      activeVersion: version,
      metrics: parseJsonField(row.metrics_json)
    }
  };
};

export const clearPublishedPcbiPayloadCache = (db?: CloudflareD1Database): void => {
  if (db) {
    publishedPayloadGenerations.set(db, (publishedPayloadGenerations.get(db) || 0) + 1);
    publishedPayloadCache.delete(db);
    publishedPayloadLoads.delete(db);
  } else {
    publishedPayloadCache = new WeakMap<CloudflareD1Database, PCBIPublishedPayloadCacheEntry>();
    publishedPayloadLoads = new WeakMap<CloudflareD1Database, Promise<PcbiAdminImportInput | null>>();
    publishedPayloadGenerations = new WeakMap<CloudflareD1Database, number>();
  }
};

export const getPublishedPcbiPayload = async (
  db: CloudflareD1Database, requestId?: string
): Promise<PcbiAdminImportInput | null> => {
  const cached = publishedPayloadCache.get(db);
  if (cached && cached.expiresAt > Date.now()) {
    logger.debug('Used cached published PCBI payload', {
      model: D1_TABLES.pcbiMasterVersions, cacheStatus: 'hit', requestId
    });
    return cached.payload;
  }
  if (cached) publishedPayloadCache.delete(db);
  const pending = publishedPayloadLoads.get(db);
  if (pending) {
    logger.debug('Joined in-flight published PCBI payload read', {
      model: D1_TABLES.pcbiMasterVersions, cacheStatus: 'coalesced', requestId
    });
    return pending;
  }
  const generation = publishedPayloadGenerations.get(db) || 0;
  const load = (async (): Promise<PcbiAdminImportInput | null> => {
    const [row] = await queryD1Rows<{ payload_json: string }>(db, PCBI_PUBLISHED_PAYLOAD_QUERY, [], requestId);
    const parsed = row ? pcbiAdminImportSchema.safeParse(parseJsonField(row.payload_json)) : null;
    const payload = parsed?.success ? parsed.data : null;
    if ((publishedPayloadGenerations.get(db) || 0) === generation) {
      publishedPayloadCache.set(db, { expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS, payload });
    }
    return payload;
  })();
  publishedPayloadLoads.set(db, load);
  try {
    return await load;
  } finally {
    if (publishedPayloadLoads.get(db) === load) publishedPayloadLoads.delete(db);
  }
};

export const handlePcbiAdminRoute = async (
  database: CloudflareD1Database,
  request: Request,
  url: URL
): Promise<WorkerD1Result> => {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const root = '/api/admin/pcbi';
  const path = url.pathname.slice(root.length) || '/';
  try {
  if (path === '/versions' && request.method === 'GET') {
    const rows = await database.prepare(`SELECT * FROM ${D1_TABLES.pcbiMasterVersions} ORDER BY uploaded_at DESC`).all<VersionRow>();
    const versions = rows.results.map(serializeVersion);
    const active = versions.find((version) => version.status === 'PUBLISHED');
    return { data: { success: true, total: versions.length, active_version: active?.version || null, versions } };
  }
  if (path === '/import' && request.method === 'POST') return await importVersion(database, request, requestId);
  const publishMatch = path.match(/^\/publish\/([^/]+)$/);
  if (publishMatch && request.method === 'POST') {
    const result = await publishVersion(database, request, decodeURIComponent(publishMatch[1]), requestId);
    clearPublishedPcbiPayloadCache(database);
    clearD1ReferenceDataCache(database, D1_REFERENCE_CACHE_KEYS.PCBI_BENCHMARKS);
    return result;
  }
  const versionMatch = path.match(/^\/versions\/([^/]+)$/);
  if (versionMatch && request.method === 'GET') {
    const row = await database.prepare(`SELECT * FROM ${D1_TABLES.pcbiMasterVersions} WHERE version = ?`)
      .bind(decodeURIComponent(versionMatch[1])).first<VersionRow>();
    return row
      ? { data: { success: true, version: serializeVersion(row) } }
      : { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiVersionNotFound } };
  }
  const allowedMethod = path === '/versions' ? 'GET' : path === '/import' ? 'POST' : 'GET or POST';
  return {
    status: path === '/versions' || path === '/import' || path.startsWith('/versions/') || path.startsWith('/publish/') ? 405 : 404,
    data: { success: false, message: D1_ROUTE_MESSAGES.pcbiAdminMethod(allowedMethod) }
  };
  } catch (error: unknown) {
    const failure = requestJsonFailureResult(request, error);
    if (failure) return failure;
    throw error;
  }
};

