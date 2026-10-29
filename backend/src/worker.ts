import {
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_HEALTH_PATH,
  CLOUDFLARE_SERVICE_NAME
} from './constants/cloudflare';
import type { CloudflareEnvironment, CloudflareExecutionContext, CloudflareD1Database } from './types/cloudflare';
import { handleAuthRoute, handleAdminRoute } from './workerAuth';
import {
  ensureD1Initialized,
  getCanonicalModule1Data,
  handleModule2Route,
  handlePcbiRoute,
  handleSavingsRoute,
  handleAssessmentRoute,
  handleCryptoRoute,
  getTenantFromD1,
  getIngestionDataFromD1,
  getTaxonomyFromD1,
  lookupTaxonomyRecordFromD1,
  getCurrencyRatesFromD1,
  getProcurementCategoryMappingsFromD1
} from './workerD1';
import { buildSchema, graphql, type GraphQLSchema } from 'graphql';
import { GRAPHQL_SCHEMA_SDL } from './constants/graphql';
import { createD1GraphqlResolvers } from './resolvers/d1GraphqlResolvers';
import { geminiService } from './services/geminiService';
import { aiCategorizationService } from './services/aiCategorizationService';
import { aiReportService } from './services/aiReportService';
import { aiAnomalyService } from './services/aiAnomalyService';
import { EXTRACTION_STATUS, CLASSIFICATION_STATUS } from './constants/ai';
import type { AiCategorizationItem } from './types/ai';
import {
  currencyQuerySchema, d1DatasetScopeSchema, deployOpportunitySchema, mergeVendorSchema,
  taxonomyQuerySchema, updateValidationRecordSchema
} from './constants/validation';
import logger from './utils/logger';
import { D1_REPORTING, D1_ROUTE_MESSAGES, D1_SCHEMA_TABLES_QUERY, D1_SCHEMA_COLUMNS_QUERY } from './constants/d1';
import type { D1SchemaTableRow, D1SchemaColumnRow } from './types/d1';
import { apiData, jsonResponse, notFoundResponse, readJson, withCors } from './workerHttp';
import { handleOrchestrationRoute } from './workerD1Orchestration';
import { handleEvidenceRoute } from './workerD1Evidence';
import { handleExecutiveBriefRoute } from './workerD1ExecutiveBrief';
import { importIngestionWorkbook } from './services/ingestionWorkbookImporter';

let cachedGraphqlSchema: GraphQLSchema | undefined;

// Built on first use. Building it at module scope fails on the Workers runtime, which rejects some
// operations (including the parser's tracing hooks) in global scope.
const getGraphqlSchema = (): GraphQLSchema => {
  cachedGraphqlSchema ??= buildSchema(GRAPHQL_SCHEMA_SDL);
  return cachedGraphqlSchema;
};

const ensureD1Tables = async (db?: CloudflareD1Database): Promise<void> => {
  await ensureD1Initialized(db);
};

const getTenant = async (environment: CloudflareEnvironment): Promise<Record<string, unknown>> => {
  await ensureD1Tables(environment.DB);
  return { ...await getTenantFromD1(environment.DB) };
};


const getIngestionData = async (url: URL, environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  await ensureD1Tables(environment.DB);
  const tenantId = url.searchParams.get('buyerId') || url.searchParams.get('tenantId') || undefined;
  return { data: await getIngestionDataFromD1(environment.DB as CloudflareD1Database, tenantId) };
};

const remediationEffectiveDate = (record: Record<string, unknown>): string | null => {
  const transactionDate = String(record.transaction_date || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) return transactionDate;
  const spendYear = Number(record.spend_year);
  return Number.isInteger(spendYear) && spendYear >= 1900 && spendYear <= 2200
    ? `${spendYear}-12-31`
    : null;
};

const remediateIngestion = async (environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  await ensureD1Tables(environment.DB);
  const database = environment.DB as CloudflareD1Database;
  const candidates = await database.prepare(`
    SELECT * FROM ValidationPreCheckRecord
    WHERE COALESCE(amount, 0) > 0 AND COALESCE(raw_currency, '') <> ''
    ORDER BY created_at DESC LIMIT ?
  `).bind(D1_REPORTING.maxDatasetLimit).all<Record<string, unknown>>();
  const updatedIds: string[] = [];

  for (const record of candidates.results || []) {
    const currency = String(record.raw_currency || '').trim().toUpperCase();
    const amount = Number(record.amount);
    const effectiveDate = remediationEffectiveDate(record);
    let rate = 0;
    if (currency === 'INR') {
      rate = 1;
    } else if (effectiveDate) {
      const reference = await database.prepare(`
        SELECT inr_per_unit FROM FxReferenceRate
        WHERE currency = ? AND rate_date <= ?
        ORDER BY rate_date DESC LIMIT 1
      `).bind(currency, effectiveDate).first<{ inr_per_unit: number }>();
      rate = Number(reference?.inr_per_unit || 0);
    }
    if (!Number.isFinite(rate) || rate <= 0) continue;

    const amountInr = amount * rate;
    const inrCrores = amountInr / D1_REPORTING.inrPerCrore;
    const clearsCurrencyIssue = /missing currency/i.test(String(record.issue_flag || '')) &&
      Boolean(String(record.vendor_name || '').trim()) && Boolean(String(record.raw_desc || '').trim());
    const resolved = clearsCurrencyIssue ? 1 : Number(record.resolved || 0);
    const issueFlag = clearsCurrencyIssue ? 'Passed Clean' : String(record.issue_flag || 'Passed Clean');
    const actionStatus = clearsCurrencyIssue ? 'Ready' : String(record.action_status || 'Ready');
    const changed = Number(record.fx_rate_applied || 0) !== rate ||
      Number(record.amount_inr || 0) !== amountInr || Number(record.inr_crores || 0) !== inrCrores ||
      Number(record.resolved || 0) !== resolved || String(record.issue_flag || '') !== issueFlag ||
      String(record.action_status || '') !== actionStatus;
    if (!changed) continue;

    await database.prepare(`
      UPDATE ValidationPreCheckRecord
      SET fx_rate_applied = ?, amount_inr = ?, inr_crores = ?, resolved = ?, issue_flag = ?, action_status = ?
      WHERE record_id = ?
    `).bind(rate, amountInr, inrCrores, resolved, issueFlag, actionStatus, record.record_id).run();
    updatedIds.push(String(record.record_id));
  }

  const records = await Promise.all(updatedIds.map((recordId) =>
    database.prepare('SELECT * FROM ValidationPreCheckRecord WHERE record_id = ?').bind(recordId).first<Record<string, unknown>>()
  ));
  logger.info('D1-backed validation currency remediation completed', {
    updatedCount: updatedIds.length,
    candidateCount: candidates.results?.length || 0
  });
  return {
    data: {
      updatedCount: updatedIds.length,
      skippedCount: Math.max(0, (candidates.results?.length || 0) - updatedIds.length),
      records: records.filter((record): record is Record<string, unknown> => Boolean(record)).map((record) => ({
        ...record,
        resolved: Boolean(record.resolved)
      }))
    }
  };
};

const addIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const body = await readJson(request);
  const fileName = typeof body.file_name === 'string' ? body.file_name.trim() : '';
  if (!fileName) return { data: { success: false, message: 'file_name is required for ingestion' }, status: 400 };
  const database = environment.DB;
  await ensureD1Tables(database);
  const tenantHeader = request.headers.get('x-buyer-id') || request.headers.get('x-tenant-id');
  const tenantId = String(body.tenant_id || body.buyer_id || tenantHeader || (await getTenantFromD1(database)).tenant_id);
  const docId = String(body.doc_id || crypto.randomUUID());
  const fileType = String(body.file_type || 'XLSX');
  const fileSizeMb = Number(body.file_size_mb || 1);
  const recordsCount = Number(body.records_count || 0);
  const convertedInrCrores = Number(body.converted_inr_crores || 0);
  const detectedCurrencies = JSON.stringify(Array.isArray(body.detected_currencies) ? body.detected_currencies : []);
  const result = await database?.prepare(`
    INSERT INTO RawDocumentIngestion (
      doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count, converted_inr_crores, detected_currencies
    ) VALUES (?, ?, ?, ?, ?, 'Completed', 100, ?, ?, ?)
  `).bind(docId, tenantId, fileName, fileType, fileSizeMb, recordsCount, convertedInrCrores, detectedCurrencies).run();
  void result;
  const rows = await database?.prepare('SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC').all();
  return { data: rows?.results || [] };
};

const uploadIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const database = environment.DB;
  await ensureD1Tables(database);
  if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
  const body = await readJson(request);
  const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
  if (!fileName) return { data: { success: false, message: 'fileName is required for upload' }, status: 400 };
  const tenantId = String(
    body.tenant_id || body.buyer_id || request.headers.get('x-buyer-id') || request.headers.get('x-tenant-id') ||
    (await getTenantFromD1(database)).tenant_id
  );
  const fileSizeMb = Number(body.fileSizeMb || 1);
  const docId = `DOC-INGEST-${crypto.randomUUID()}`;
  const fileType = String(body.fileType || 'XLSX').toUpperCase();
  const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64 : '';
  const parseTransactions = body.parseTransactions === true;
  const objectKey = `${docId}_${fileName}`;
  let imported = { importedCount: 0, validationCount: 0, totalInrCrores: 0, detectedCurrencies: [] as string[] };
  let bytes: Uint8Array | null = null;
  let objectStored = false;
  try {
    if (fileBase64) {
      if (!environment.OBJECTS) throw new Error('Cloudflare R2 binding OBJECTS is required for binary uploads');
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
      const binaryString = atob(cleanBase64);
      bytes = new Uint8Array(binaryString.length);
      for (let index = 0; index < binaryString.length; index += 1) bytes[index] = binaryString.charCodeAt(index);
      const contentType = fileType === 'XLSX'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : fileType === 'XLS' ? 'application/vnd.ms-excel'
          : fileType === 'CSV' ? 'text/csv'
            : fileType === 'PDF' ? 'application/pdf' : 'application/octet-stream';
      await environment.OBJECTS.put(objectKey, bytes, { httpMetadata: { contentType } });
      objectStored = true;
      if (parseTransactions && ['XLSX', 'XLS', 'CSV'].includes(fileType)) {
        imported = await importIngestionWorkbook({
          db: database,
          bytes,
          fileName,
          fileType,
          docId,
          tenantId,
          assessmentId: typeof body.assessment_id === 'string' ? body.assessment_id : undefined
        });
      }
    }

    const recordsCount = imported.importedCount || Number(body.recordsCount || 0);
    const convertedInrCrores = imported.importedCount ? imported.totalInrCrores : Number(body.convertedInrCrores || 0);
    const currencies = imported.importedCount
      ? imported.detectedCurrencies
      : Array.isArray(body.detectedCurrencies) ? body.detectedCurrencies : [];
    await database.prepare(`
      INSERT INTO RawDocumentIngestion (
        doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count, converted_inr_crores, detected_currencies
      ) VALUES (?, ?, ?, ?, ?, 'Completed', 100, ?, ?, ?)
    `).bind(docId, tenantId, fileName, fileType, fileSizeMb, recordsCount, convertedInrCrores, JSON.stringify(currencies)).run();

    if (bytes) {
      await database.prepare(`INSERT OR REPLACE INTO ObjectMetadata (object_key, tenant_id, filename, content_type, size_bytes, sha256, bucket) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(objectKey, tenantId, fileName, fileType, bytes.byteLength, '', environment.R2_BUCKET || '').run();
    }
  } catch (error) {
    try {
      await database.prepare('DELETE FROM ProcurementTransaction WHERE source_document_id = ?').bind(docId).run();
      await database.prepare('DELETE FROM ValidationPreCheckRecord WHERE record_id LIKE ?').bind(`REC-${docId}-ROW-%`).run();
      await database.prepare('DELETE FROM RawDocumentIngestion WHERE doc_id = ?').bind(docId).run();
      await database.prepare('DELETE FROM ObjectMetadata WHERE object_key = ?').bind(objectKey).run();
    } catch (cleanupError) {
      logger.error('Failed to roll back a D1 ingestion upload', { docId }, cleanupError);
    }
    if (objectStored) {
      try {
        await environment.OBJECTS?.delete(objectKey);
      } catch (cleanupError) {
        logger.error('Failed to remove the uploaded object after a D1 import failure', { docId }, cleanupError);
      }
    }
    if (error instanceof Error && /workbook|row import limit|Only XLSX/u.test(error.message)) {
      return { data: { success: false, message: error.message }, status: 400 };
    }
    throw error;
  }

  logger.info('Persisted uploaded ingestion dataset in D1', {
    requestId: request.headers.get('x-request-id') || undefined,
    docId,
    tenantId,
    importedCount: imported.importedCount,
    validationCount: imported.validationCount
  });

  const queueRows = await database.prepare('SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC').all<Record<string, unknown>>();
  const ingestionQueue = queueRows.results.map((row) => ({
    ...row,
    detected_currencies: typeof row.detected_currencies === 'string' ? (() => {
      try { return JSON.parse(row.detected_currencies as string); } catch { return []; }
    })() : []
  }));
  return { data: {
    docId,
    importedCount: imported.importedCount,
    validationCount: imported.validationCount,
    totalInrCrores: imported.totalInrCrores,
    detectedCurrencies: imported.detectedCurrencies,
    objectMeta: { key: objectKey, size: bytes?.byteLength ?? Math.round(fileSizeMb * 1024 * 1024), uploadedAt: new Date().toISOString(), bucket: environment.R2_BUCKET || '' },
    ingestionQueue
  } };
};

const updateIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const database = environment.DB;
  await ensureD1Tables(database);
  if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
  const parsed = updateValidationRecordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return { data: { success: false, message: 'Validation update is invalid.', errors: parsed.error.issues }, status: 400 };
  }
  const body = parsed.data;
  await database.prepare(`
    UPDATE ValidationPreCheckRecord
    SET po_number = COALESCE(?, po_number), vendor_name = COALESCE(?, vendor_name), raw_desc = COALESCE(?, raw_desc),
        order_quantity = COALESCE(?, order_quantity), net_price = COALESCE(?, net_price),
        subtotal_raw = COALESCE(?, subtotal_raw), amount = COALESCE(?, amount), raw_currency = COALESCE(?, raw_currency),
        amount_inr = COALESCE(?, amount_inr), inr_crores = COALESCE(?, inr_crores),
        fx_rate_applied = COALESCE(?, fx_rate_applied), spend_year = COALESCE(?, spend_year),
        transaction_date = COALESCE(?, transaction_date), column_l_code = COALESCE(?, column_l_code),
        core_category = COALESCE(?, core_category), issue_flag = COALESCE(?, issue_flag),
        action_status = COALESCE(?, action_status), resolved = COALESCE(?, resolved)
    WHERE record_id = ?
  `).bind(
    body.po_number ?? null, body.vendor_name ?? null, body.raw_desc ?? null,
    body.order_quantity ?? null, body.net_price ?? null, body.subtotal_raw ?? null, body.amount ?? null,
    body.raw_currency ?? null, body.amount_inr ?? null, body.inr_crores ?? null, body.fx_rate_applied ?? null,
    body.spend_year ?? null, body.transaction_date ?? null, body.column_l_code ?? null, body.core_category ?? null,
    body.issue_flag ?? null, body.action_status ?? null, body.resolved === undefined ? null : Number(body.resolved), body.record_id
  ).run();
  const updated = await database.prepare('SELECT * FROM ValidationPreCheckRecord WHERE record_id = ?').bind(body.record_id).first();
  return updated ? { data: { ...updated, resolved: Boolean((updated as Record<string, unknown>).resolved) } } : { data: { success: false, message: 'Validation record not found.' }, status: 404 };
};

const deleteIngestion = async (url: URL, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const database = environment.DB;
  await ensureD1Tables(database);
  if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
  // "/document/" with an empty id must never fall through to the clear-all branch below.
  const documentId = url.pathname.includes('/document/') ? url.pathname.split('/document/').pop() : null;
  if (documentId === '') {
    return { data: { success: false, message: 'A document id is required after /document/ to delete one ingestion record.' }, status: 400 };
  }
  const documents = documentId
    ? await database.prepare('SELECT doc_id FROM RawDocumentIngestion WHERE doc_id = ?').bind(documentId).all<{ doc_id: string }>()
    : await database.prepare('SELECT doc_id FROM RawDocumentIngestion').all<{ doc_id: string }>();
  for (const document of documents.results) {
    const objectRows = await database.prepare('SELECT object_key FROM ObjectMetadata WHERE object_key LIKE ?').bind(`${document.doc_id}_%`).all<{ object_key: string }>();
    for (const object of objectRows.results) {
      if (environment.OBJECTS) await environment.OBJECTS.delete(object.object_key);
      await database.prepare('DELETE FROM ObjectMetadata WHERE object_key = ?').bind(object.object_key).run();
    }
    await database.prepare('DELETE FROM ProcurementTransaction WHERE source_document_id = ?').bind(document.doc_id).run();
    await database.prepare('DELETE FROM ValidationPreCheckRecord WHERE record_id LIKE ?').bind(`REC-${document.doc_id}-ROW-%`).run();
    await database.prepare('DELETE FROM RawDocumentIngestion WHERE doc_id = ?').bind(document.doc_id).run();
  }
  logger.info('Deleted D1 ingestion documents and linked data', {
    documentCount: documents.results.length,
    requestedDocumentId: documentId || undefined
  });
  const queue = await database.prepare('SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC').all();
  return { data: queue.results || [] };
};

const resetValidationRecords = async (environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  await ensureD1Tables(environment.DB);
  const database = environment.DB as CloudflareD1Database;
  await database.prepare('DELETE FROM ValidationPreCheckRecord').run();
  const records = await database.prepare('SELECT * FROM ValidationPreCheckRecord ORDER BY created_at DESC').all();
  return { data: records.results || [] };
};

const handleIngestion = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<{ data: unknown; status?: number }> => {
  if (request.method === 'GET') return getIngestionData(url, environment);
  if (request.method === 'POST' && (url.pathname.endsWith('/upload') || url.pathname.endsWith('/upload-object'))) return uploadIngestion(request, environment);
  if (request.method === 'POST' && url.pathname.endsWith('/remediate')) return remediateIngestion(environment);
  if (request.method === 'POST') return addIngestion(request, environment);
  if (request.method === 'PATCH') return updateIngestion(request, environment);
  if (request.method === 'DELETE' && url.pathname.endsWith('/validation-records')) return resetValidationRecords(environment);
  if (request.method === 'DELETE') return deleteIngestion(url, environment);
  return { data: { success: false, message: 'Unsupported ingestion operation.' }, status: 405 };
};

const handleConversion = async (request: Request, environment: CloudflareEnvironment): Promise<Record<string, unknown>> => {
  if (request.method === 'GET') {
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
    const stages = await database.prepare('SELECT * FROM ConversionFunnelPhase ORDER BY phase_num ASC').all();
    return { data: stages.results || [] };
  }
  const body = await readJson(request);
  const annualSpendCr = Number(body.annualSpendCr || 0);
  const savingsRate = Number(body.savingsRate || 0);
  const saasFeeRate = Number(body.saasFeeRate || 0);
  const grossSavingsCr = annualSpendCr * savingsRate / 100;
  const platformFeeCr = annualSpendCr * saasFeeRate / 100;
  return { data: { annualSpendCr, savingsRate, saasFeeRate, grossSavingsCr, platformFeeCr, netClientBenefitCr: grossSavingsCr - platformFeeCr, roiMultiple: platformFeeCr > 0 ? grossSavingsCr / platformFeeCr : 0 } };
};

const handleDatabase = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
  const path = new URL(request.url).pathname;
  if (path.endsWith('/schema')) {
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
    const start = Date.now();
    const tables = await database.prepare(D1_SCHEMA_TABLES_QUERY).all<D1SchemaTableRow>();
    const data = await Promise.all(tables.results.map(async (table) => {
      const columns = await database.prepare(D1_SCHEMA_COLUMNS_QUERY).bind(table.name).all<D1SchemaColumnRow>();
      return {
        entity_name: table.name,
        primary_attributes: columns.results.map((column) => column.name).join(', '),
        system_usage: 'Cloudflare D1',
        sample_records: [],
        ddl: table.sql
      };
    }));
    logger.info('Read D1 database schema', { operation: 'SELECT', model: 'sqlite_master', affectedRows: data.length, cache: 'miss', durationMs: Date.now() - start, requestId: request.headers.get('x-request-id') });
    return apiData(data, request);
  }
  if (path.endsWith('/init') || path.endsWith('/seed')) {
    return jsonResponse({
      success: false,
      message: 'D1 schema and seed are deployment operations. Run the D1 migration and seed commands before serving traffic.'
    }, 405, request);
  }
  if (path.endsWith('/status')) {
    const database = environment.DB;
    if (!database) return jsonResponse({ success: false, message: 'Cloudflare D1 binding DB is not configured.' }, 503, request);
    await ensureD1Initialized(database);
    const tables = await database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all<{ name: string }>();
    const recordCount = await database.prepare(`SELECT
      (SELECT COUNT(*) FROM TenantMaster) +
      (SELECT COUNT(*) FROM RawDocumentIngestion) +
      (SELECT COUNT(*) FROM ValidationPreCheckRecord) +
      (SELECT COUNT(*) FROM SpendCategorySummary) +
      (SELECT COUNT(*) FROM VendorYearDetail) +
      (SELECT COUNT(*) FROM AssessmentRecord) +
      (SELECT COUNT(*) FROM ProcurementTransaction) AS totalRecords`).first<{ totalRecords: number }>();
    return apiData({
      isConnected: true,
      provider: 'Cloudflare D1',
      databaseName: environment.D1_DATABASE_NAME || null,
      serverTime: new Date().toISOString(),
      tablesCount: tables.results.length,
      totalRecords: Number(recordCount?.totalRecords || 0)
    }, request);
  }
  if (path.endsWith('/test-connection')) {
    return apiData({ success: Boolean(environment.DB), provider: 'Cloudflare D1' }, request);
  }
  return apiData({
    metrics: { totalQueries: 0, slowQueries: 0, cacheHitRatio: 0, averageDurationMs: 0, recentAudits: [] },
    cacheSize: 0
  }, request);
};

const handleIngestionRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  const result = await handleIngestion(request, environment, url);
  return result.status
    ? jsonResponse(result.data as Record<string, unknown>, result.status, request)
    : apiData(result.data, request);
};

const handleStaticDataRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/categories`) {
    if (request.method !== 'GET') return jsonResponse({ success: false, message: 'Categories support GET requests only.' }, 405, request);
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
    const [categories, categoryDetails] = await Promise.all([
      database.prepare('SELECT * FROM SpendCategorySummary ORDER BY spend_inr_crores DESC').all(),
      database.prepare('SELECT * FROM CategoryYearDetail ORDER BY rank ASC').all()
    ]);
    return apiData({ categories: categories.results, categoryDetails: categoryDetails.results }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/vendors`) {
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
    if (request.method === 'POST') {
      const parsed = mergeVendorSchema.safeParse(await readJson(request));
      if (!parsed.success) return jsonResponse({ success: false, message: 'Vendor merge request is invalid.', errors: parsed.error.issues }, 400, request);
      const { targetName, masterId, canonicalName } = parsed.data;
      const [vendorDetailCount, vendorRankCount] = await Promise.all([
        database.prepare('SELECT COUNT(*) AS count FROM VendorYearDetail WHERE master_vendor_id = ?').bind(masterId).first<{ count: number }>(),
        database.prepare('SELECT COUNT(*) AS count FROM VendorPriceRank WHERE master_id = ?').bind(masterId).first<{ count: number }>()
      ]);
      const affected = Number(vendorDetailCount?.count || 0) + Number(vendorRankCount?.count || 0);
      if (affected === 0) return jsonResponse({ success: false, message: `Supplier master ${masterId} was not found.` }, 404, request);
      const statements = [
        database.prepare('UPDATE VendorYearDetail SET vendor_name = ? WHERE master_vendor_id = ?').bind(canonicalName, masterId),
        database.prepare('UPDATE VendorPriceRank SET vendor_name = ? WHERE master_id = ?').bind(canonicalName, masterId)
      ];
      if (database.batch) await database.batch(statements);
      else await Promise.all(statements.map((statement) => statement.run()));
      logger.info('Supplier master name updated in D1', {
        targetName, masterId, canonicalName, affected, requestId: request.headers.get('x-request-id') || undefined
      });
      return apiData({ success: true, affected }, request);
    }
    if (request.method !== 'GET') return jsonResponse({ success: false, message: 'Vendor data supports GET and POST requests only.' }, 405, request);
    const [vendorRankings, vendorDetails] = await Promise.all([
      database.prepare('SELECT * FROM VendorPriceRank ORDER BY total_spend_inr_cr DESC').all(),
      database.prepare('SELECT * FROM VendorYearDetail ORDER BY total_3yr_spend_inr_cr DESC').all()
    ]);
    return apiData({ vendorRankings: vendorRankings.results, vendorDetails: vendorDetails.results }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/savings`) {
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
    if (request.method === 'POST') {
      const parsed = deployOpportunitySchema.safeParse(await readJson(request));
      if (!parsed.success) return jsonResponse({ success: false, message: 'Opportunity deployment request is invalid.', errors: parsed.error.issues }, 400, request);
      const { opp_id: opportunityId, targetModule } = parsed.data;
      await database.prepare(`
        UPDATE SavingsOpportunity SET recommended_module = ?, push_to_module = ?, status = 'DEPLOYED'
        WHERE opp_id = ?
      `).bind(targetModule, targetModule, opportunityId).run();
      const deployed = await database.prepare('SELECT * FROM SavingsOpportunity WHERE opp_id = ?').bind(opportunityId).first<Record<string, unknown>>();
      if (!deployed) return jsonResponse({ success: false, message: `Savings opportunity ${opportunityId} was not found.` }, 404, request);
      logger.info('Savings opportunity deployed from D1', {
        opportunityId, targetModule, requestId: request.headers.get('x-request-id') || undefined
      });
      return apiData(deployed, request);
    }
    if (request.method !== 'GET') return jsonResponse({ success: false, message: 'Savings data supports GET and POST requests only.' }, 405, request);
    const opportunities = await database.prepare('SELECT * FROM SavingsOpportunity ORDER BY est_savings_inr_cr DESC').all();
    const totalPotentialSavingsCr = opportunities.results.reduce((total, item) => total + Number((item as Record<string, unknown>).est_savings_inr_cr || 0), 0);
    return apiData({ opportunities: opportunities.results, totalPotentialSavingsCr }, request);
  }
  return null;
};

const handleFinancialRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/conversion`) {
    const result = await handleConversion(request, environment);
    return apiData(result.data, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/currency`) {
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
    const parsed = currencyQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) return jsonResponse({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400, request);
    const from = parsed.data.from || '';
    const amount = Number(parsed.data.amount || 0);
    const rates = await getCurrencyRatesFromD1(database);
    if (!from) return apiData(rates, request);
    const selected = rates[from] as { currentRate?: number; lastUpdated?: string | null } | undefined;
    if (!selected && from !== 'INR') return jsonResponse({ success: false, message: D1_ROUTE_MESSAGES.currencyNotFound(from) }, 400, request);
    const requestedDate = parsed.data.date || parsed.data.year;
    const effectiveDate = requestedDate == null ? null : /^\d{4}$/.test(String(requestedDate))
      ? `${requestedDate}-12-31`
      : String(requestedDate).slice(0, 10).replaceAll('/', '-');
    let rate = from === 'INR' ? 1 : Number(selected?.currentRate || 0);
    let rateDate = from === 'INR' ? effectiveDate : selected?.lastUpdated || null;
    if (from !== 'INR' && effectiveDate) {
      const historicalRate = await database.prepare(`
        SELECT inr_per_unit, rate_date FROM FxReferenceRate
        WHERE currency = ? AND rate_date <= ?
        ORDER BY rate_date DESC LIMIT 1
      `).bind(from, effectiveDate).first<{ inr_per_unit: number; rate_date: string }>();
      if (!historicalRate) {
        return jsonResponse({ success: false, message: D1_ROUTE_MESSAGES.currencyRateUnavailable(from, effectiveDate) }, 400, request);
      }
      rate = Number(historicalRate.inr_per_unit);
      rateDate = historicalRate.rate_date;
    }
    return apiData({ amount, fromCurrency: from, amountINR: Number((amount * rate).toFixed(2)), exchangeRate: rate, rateDate }, request);
  }
  return null;
};

const handleReportRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response | null> => {
  if (url.pathname !== `${CLOUDFLARE_API_PREFIX}/report`) return null;
  const database = environment.DB;
  await ensureD1Tables(database);
  if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
  const tenant = await getTenant(environment);
  const [docSpend, recordsCount, categoryDetails, opportunities] = await Promise.all([
    database.prepare('SELECT SUM(converted_inr_crores) AS totalSpend FROM RawDocumentIngestion').first<{ totalSpend: number }>(),
    database.prepare('SELECT COUNT(*) AS count FROM ValidationPreCheckRecord').first<{ count: number }>(),
    database.prepare('SELECT * FROM CategoryYearDetail ORDER BY rank ASC').all(),
    database.prepare('SELECT * FROM SavingsOpportunity ORDER BY est_savings_inr_cr DESC').all()
  ]);
  const totalSpendEvaluatedCr = Number(docSpend?.totalSpend || tenant.total_spend_evaluated_inr || 0);
  const totalIdentifiedSavingsCr = opportunities.results.reduce((total, row) => total + Number((row as Record<string, unknown>).est_savings_inr_cr || 0), 0);
  return apiData({
    tenant,
    executiveSummary: {
      totalSpendEvaluatedCr: Number(totalSpendEvaluatedCr.toFixed(2)),
      totalIdentifiedSavingsCr: Number(totalIdentifiedSavingsCr.toFixed(2)),
      totalLineItemsAudited: Number(recordsCount?.count || 0)
    },
    categoryHighlights: categoryDetails.results,
    topActionableOpportunities: opportunities.results
  }, request);
};

const handleAiRoute = async (request: Request, url: URL, environment: CloudflareEnvironment): Promise<Response> => {
  geminiService.configureForEnvironment(environment);
  aiCategorizationService.configureTaxonomyLookup(
    environment.DB ? (query) => lookupTaxonomyRecordFromD1(environment.DB as CloudflareD1Database, query) : undefined
  );
  const start = Date.now();
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/config` && request.method === 'GET') {
    const isConfigured = geminiService.isConfigured();
    const models = geminiService.resolveModelChain();
    return jsonResponse({
      success: true,
      configured: isConfigured,
      primaryModel: models[0] || null,
      fallbackModels: models.slice(1)
    }, 200, request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/extract` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const result = await geminiService.extractLineItems({
        documentText: body.documentText as string | undefined,
        inlineData: body.inlineData as string | undefined,
        mimeType: body.mimeType as string | undefined,
        fileName: body.fileName as string | undefined
      });
      return jsonResponse({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        items: [],
        error: errorObj.message || 'Internal AI Extraction Error'
      }, 500, request);
    }
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/categorize` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const items = (Array.isArray(body.items) ? body.items : []) as AiCategorizationItem[];
      const result = await aiCategorizationService.categorizeLineItems(items);
      return jsonResponse({
        success: result.status === CLASSIFICATION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: CLASSIFICATION_STATUS.AI_FAILED,
        mappings: [],
        error: errorObj.message || 'Internal AI Categorization Error'
      }, 500, request);
    }
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/executive-summary` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const result = await aiReportService.generateExecutiveSummary({
        tenantName: body.tenantName as string | undefined,
        totalSpendInrCr: Number(body.totalSpendInrCr || 0),
        categories: (body.categories as any) || [],
        vendors: (body.vendors as any) || [],
        currency: body.currency as string | undefined
      });
      return jsonResponse({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        data: null,
        error: errorObj.message || 'Internal AI Executive Report Error'
      }, 500, request);
    }
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ai/analyze-anomalies` && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const records = (body.records as any) || [];
      const result = await aiAnomalyService.analyzeAnomalies(records);
      return jsonResponse({
        success: result.status === EXTRACTION_STATUS.SUCCESS,
        ...result,
        durationMs: Date.now() - start
      }, 200, request);
    } catch (err: unknown) {
      const errorObj = err as Error;
      return jsonResponse({
        success: false,
        status: EXTRACTION_STATUS.AI_FAILED,
        anomalies: [],
        error: errorObj.message || 'Internal AI Anomaly Detection Error'
      }, 500, request);
    }
  }

  return jsonResponse({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404, request);
};

const handleTaxonomyRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  const validation = taxonomyQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  if (!validation.success) {
    logger.warn('Rejected invalid taxonomy query', { requestId, errors: validation.error.issues });
    return jsonResponse({ success: false, message: 'Validation failed', errors: validation.error.issues }, 400, request);
  }
  const start = Date.now();
  const database = environment.DB;
  await ensureD1Tables(database);
  if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
  const { q, category, lookup, limit, offset } = validation.data;
  const data = await getTaxonomyFromD1(database, q, category, lookup, limit, offset);
  const total = Array.isArray(data) ? data.length : data ? 1 : 0;
  logger.info('Read D1 commodity catalog page', { requestId, durationMs: Date.now() - start, operation: 'SELECT', model: 'UNSPSCCommodity', affectedRows: total, cache: 'miss' });
  const response = jsonResponse({ success: true, data, total, timestamp: new Date().toISOString() }, 200, request);
  response.headers.set('x-request-id', requestId);
  return response;
};

const handleGraphQLRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  try {
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) return jsonResponse({ errors: [{ message: 'Cloudflare D1 binding DB is not configured.' }] }, 503, request);
    let source = '';
    let variableValues: Record<string, unknown> | undefined;
    let operationName: string | undefined;

    if (request.method === 'POST') {
      const body = await readJson(request);
      source = String(body.query || '');
      variableValues = body.variables as Record<string, unknown> | undefined;
      operationName = body.operationName as string | undefined;
    } else if (request.method === 'GET') {
      source = url.searchParams.get('query') || '';
    }

    if (!source) return jsonResponse({ errors: [{ message: 'GraphQL query is required' }] }, 400, request);
    const tenant = await getTenantFromD1(database);
    const result = await graphql({
      schema: getGraphqlSchema(),
      source,
      rootValue: createD1GraphqlResolvers(),
      contextValue: {
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
        tenantId: tenant.tenant_id,
        timestamp: new Date().toISOString(),
        db: database
      },
      variableValues,
      operationName
    });
    return jsonResponse(result as Record<string, unknown>, 200, request);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ errors: [{ message: errorMsg }] }, 500, request);
  }
};

const handleDataRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/procurement/category-mappings` && request.method === 'GET') {
    await ensureD1Tables(environment.DB);
    if (!environment.DB) throw new Error('Cloudflare D1 binding DB is not configured');
    return apiData(await getProcurementCategoryMappingsFromD1(
      environment.DB,
      request.headers.get('x-request-id') || undefined
    ), request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/ingestion/canonical`) {
    const scope = d1DatasetScopeSchema.safeParse({
      assessmentId: url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id') ?? undefined
    });
    if (!scope.success) return jsonResponse({
      success: false, message: 'Validation failed', errors: scope.error.issues
    }, 400, request);
    const canonicalData = await getCanonicalModule1Data(environment.DB, scope.data.assessmentId);
    return apiData(canonicalData, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/ingestion`)) return handleIngestionRoute(request, environment, url);
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/module2`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/module2`.length) || '/';
    const result = await handleModule2Route(environment.DB, subPath, request, url);
    if (result.response) return withCors(result.response, request);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/pcbi`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/pcbi`.length) || '/';
    const result = await handlePcbiRoute(environment.DB, subPath, request, url);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/savings/`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/savings`.length);
    const result = await handleSavingsRoute(environment.DB, subPath, request, url);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/assessment`)) {
    const subPath = url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/assessment`.length) || '/';
    const result = await handleAssessmentRoute(environment.DB, subPath, request, url, environment);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/customers`)) {
    const subPath = '/customers' + (url.pathname.slice(`${CLOUDFLARE_API_PREFIX}/customers`.length) || '');
    const result = await handleAssessmentRoute(environment.DB, subPath, request, url, environment);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/crypto`)) {
    const result = await handleCryptoRoute(request, url, environment);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  const staticResponse = await handleStaticDataRoute(request, environment, url);
  if (staticResponse) return staticResponse;
  const financialResponse = await handleFinancialRoute(request, environment, url);
  if (financialResponse) return financialResponse;
  const reportResponse = await handleReportRoute(request, environment, url);
  if (reportResponse) return reportResponse;
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/db/`)) return handleDatabase(request, environment);
  return jsonResponse({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404, request);
};

const handleApiRequest = async (request: Request, environment: CloudflareEnvironment): Promise<Response> => {
  const url = new URL(request.url);
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`) {
    return jsonResponse({ status: 'ok', service: CLOUDFLARE_SERVICE_NAME, database: Boolean(environment.DB) }, 200, request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/tenant` && request.method === 'GET') {
    return apiData(await getTenant(environment), request);
  }

  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/tenant` && request.method === 'PUT') {
    const database = environment.DB;
    await ensureD1Tables(database);
    if (!database) throw new Error('Cloudflare D1 binding DB is not configured');
    const body = await readJson(request);
    const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : (await getTenantFromD1(database)).tenant_id;
    await database.prepare(`
      UPDATE TenantMaster
      SET enterprise_name = COALESCE(?, enterprise_name), region = COALESCE(?, region), base_currency = COALESCE(?, base_currency),
          status = COALESCE(?, status), major_sector = COALESCE(?, major_sector), minor_sector = COALESCE(?, minor_sector),
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ?
    `).bind(body.enterprise_name ?? null, body.region ?? null, body.base_currency ?? null, body.status ?? null, body.major_sector ?? null, body.minor_sector ?? null, tenantId).run();
    return apiData(await getTenant(environment), request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/auth/`)) {
    const authResult = await handleAuthRoute(request, environment, url);
    return jsonResponse(authResult.body, authResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/admin`)) {
    const adminResult = await handleAdminRoute(request, environment, url);
    return jsonResponse(adminResult.body, adminResult.status, request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/ai`)) {
    return handleAiRoute(request, url, environment);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/taxonomy`)) {
    return handleTaxonomyRoute(request, environment, url);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/graphql`) {
    return handleGraphQLRoute(request, environment, url);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/orchestration`)) {
    return (await handleOrchestrationRoute(request, environment, url)) ?? notFoundResponse(request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/evidence`)) {
    return (await handleEvidenceRoute(request, environment, url)) ?? notFoundResponse(request);
  }
  if (url.pathname.startsWith(`${CLOUDFLARE_API_PREFIX}/reports/executive-brief`)) {
    return (await handleExecutiveBriefRoute(request, environment, url)) ?? notFoundResponse(request);
  }
  return handleDataRoute(request, environment, url);
};

export const fetch = async (
  request: Request,
  environment: CloudflareEnvironment,
  executionContext: CloudflareExecutionContext
): Promise<Response> => {
  try {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }), request);
    }

    if (url.pathname === '/') {
      return jsonResponse({
        message: 'Consulting & Procurement Intelligence Platform - Cloudflare Worker API',
        status: 'online',
        version: '1.0.1-deployment-test',
        docs: `${CLOUDFLARE_API_PREFIX}${CLOUDFLARE_HEALTH_PATH}`
      }, 200, request);
    }

    if (url.pathname.startsWith(CLOUDFLARE_API_PREFIX)) {
      return await handleApiRequest(request, environment);
    }

    executionContext.passThroughOnException();
    return jsonResponse({ success: false, message: 'Endpoint not found.' }, 404, request);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const status = errorMsg.includes('Cloudflare D1') ? 503 : 500;
    return jsonResponse({ success: false, message: errorMsg }, status, request);
  }
};

export default { fetch };
