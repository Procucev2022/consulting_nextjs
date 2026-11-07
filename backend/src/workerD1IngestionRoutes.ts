import { ASSESSMENT_D1_MESSAGES } from './constants/assessmentD1';
import {
  D1_INGESTION_PAGE_QUERY_LIMIT, D1_INGESTION_REMEDIATED_RECORDS_QUERY,
  D1_INGESTION_REMEDIATION_CANDIDATES_QUERY, D1_REPORTING, D1_ROUTE_MESSAGES, D1_LOG_ACTIONS, D1_LOG_MESSAGES
} from './constants/d1';
import {
  ingestionDataQuerySchema, updateValidationRecordSchema, addIngestionFileSchema,
  uploadIngestionFileSchema, INGESTION_UPLOAD_JSON_MAX_BYTES
} from './constants/validation';
import type { IngestionDataQueryInput } from './types/validation';
import type { CloudflareD1Database, CloudflareD1MutationResult, CloudflareD1PreparedStatement, CloudflareEnvironment } from './types/cloudflare';
import logger from './utils/logger';
import {
  getTenantFromD1, getIngestionDataFromD1, parseStoredDetectedCurrencies, requireD1Binding
} from './workerD1';
import { apiData, jsonResponse, readJson } from './workerHttp';
import { importIngestionWorkbook } from './services/ingestionWorkbookImporter';
import { clearScopedModule2Cache } from './services/workerD1Module2Cache';
import { requireD1AtomicBatch, runD1Statements } from './services/workerD1Query';

const getIngestionData = async (
  environment: CloudflareEnvironment,
  page?: IngestionDataQueryInput,
  requestId?: string
): Promise<{ data: unknown; status?: number }> => {
  requireD1Binding(environment.DB);
  const tenantId = environment.REQUEST_TENANT_ID;
  if (!tenantId) return { data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired }, status: 403 };
  return { data: await getIngestionDataFromD1(environment.DB as CloudflareD1Database, tenantId, {
    queueCursor: page?.queueAfterUploadedAt && page.queueAfterDocId
      ? { uploadedAt: page.queueAfterUploadedAt, docId: page.queueAfterDocId }
      : undefined,
    validationCursor: page?.validationAfterCreatedAt && page.validationAfterRecordId
      ? { createdAt: page.validationAfterCreatedAt, recordId: page.validationAfterRecordId }
      : undefined,
    includeQueue: Boolean(page?.queueDocumentId || page?.queueAfterUploadedAt || (!page?.validationAfterCreatedAt && !page?.validationAfterRecordId)),
    includeValidationRecords: Boolean(page?.validationAfterCreatedAt || page?.validationAfterRecordId || page?.queueDocumentId || !page?.queueAfterUploadedAt),
    includeSummary: !page?.queueAfterUploadedAt && !page?.validationAfterCreatedAt,
    requestId
  }) };
};

const remediateIngestion = async (environment: CloudflareEnvironment, requestId?: string): Promise<{ data: unknown }> => {
  requireD1Binding(environment.DB);
  const database = environment.DB as CloudflareD1Database;
  const tenant = await getTenantFromD1(database, environment.REQUEST_TENANT_ID);
  const tenantId = String(tenant.tenant_id);
  const candidates = await database.prepare(D1_INGESTION_REMEDIATION_CANDIDATES_QUERY)
    .bind(tenantId, D1_REPORTING.maxDatasetLimit).all<Record<string, unknown>>();
  const updateStatements: CloudflareD1PreparedStatement[] = [];
  const candidateRecordIds: string[] = [];

  for (const record of candidates.results || []) {
    const amount = Number(record.amount);
    const rate = Number(record.remediation_fx_rate || 0);
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

    const statement = database.prepare(`
      UPDATE ValidationPreCheckRecord
      SET fx_rate_applied = ?, amount_inr = ?, inr_crores = ?, resolved = ?, issue_flag = ?, action_status = ?
      WHERE record_id = ? AND tenant_id = ?
    `).bind(rate, amountInr, inrCrores, resolved, issueFlag, actionStatus, record.record_id, tenantId);
    updateStatements.push(statement);
    candidateRecordIds.push(String(record.record_id));
  }

  const updatedRecordIds: string[] = [];
  if (updateStatements.length) {
    const operationContext = {
      action: D1_LOG_ACTIONS.ingestionRemediation,
      operation: D1_LOG_ACTIONS.ingestionRemediation,
      requestId,
      tenantId,
      statementCount: updateStatements.length
    };
    if (updateStatements.length > 1 && !database.batch) {
      requireD1AtomicBatch(database, operationContext, updateStatements.length);
    }
    let results: CloudflareD1MutationResult[];
    try {
      results = database.batch
        ? await database.batch(updateStatements) as CloudflareD1MutationResult[]
        : await Promise.all(updateStatements.map(async (statement) =>
          await statement.run() as CloudflareD1MutationResult));
    } catch (error: unknown) {
      logger.error(D1_LOG_MESSAGES.atomicWriteFailed, operationContext, error);
      throw error;
    }
    candidateRecordIds.forEach((recordId, index) => {
      const result = results[index];
      const affected = Number(result?.meta?.changes ?? result?.changes);
      if (affected > 0) updatedRecordIds.push(recordId);
    });
  }
  const updatedRecords = updatedRecordIds.length
    ? (await database.prepare(D1_INGESTION_REMEDIATED_RECORDS_QUERY)
      .bind(JSON.stringify(updatedRecordIds), tenantId).all<Record<string, unknown>>()).results
    : [];

  logger.info('D1-backed validation currency remediation completed', {
    updatedCount: updatedRecords.length,
    candidateCount: candidates.results?.length || 0,
    tenantId,
    requestId
  });
  return {
    data: {
      updatedCount: updatedRecords.length,
      skippedCount: Math.max(0, (candidates.results?.length || 0) - updatedRecords.length),
      records: updatedRecords.map((record) => ({
        ...record,
        resolved: Boolean(record.resolved)
      }))
    }
  };
};

const addIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const parsed = addIngestionFileSchema.safeParse(await readJson(request));
  if (!parsed.success) return {
    data: { success: false, message: D1_ROUTE_MESSAGES.validationFailed, errors: parsed.error.issues }, status: 400
  };
  const body = parsed.data;
  const fileName = body.file_name.trim();
  const database = requireD1Binding(environment.DB);
  const tenantId = environment.REQUEST_TENANT_ID;
  if (!tenantId) return { data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired }, status: 403 };
  const docId = body.doc_id || crypto.randomUUID();
  const fileType = body.file_type;
  const fileSizeMb = body.file_size_mb;
  const recordsCount = body.records_count;
  const convertedInrCrores = body.converted_inr_crores;
  const detectedCurrencies = JSON.stringify(body.detected_currencies);
  const result = await database.prepare(`
    INSERT INTO RawDocumentIngestion (
      doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count, converted_inr_crores, detected_currencies
    ) VALUES (?, ?, ?, ?, ?, 'Completed', 100, ?, ?, ?)
  `).bind(docId, tenantId, fileName, fileType, fileSizeMb, recordsCount, convertedInrCrores, detectedCurrencies).run();
  void result;
  const rows = await database.prepare('SELECT * FROM RawDocumentIngestion WHERE tenant_id = ? ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?')
    .bind(tenantId, D1_INGESTION_PAGE_QUERY_LIMIT).all();
  return { data: rows.results || [] };
};

const uploadIngestion = async (request: Request, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const database = requireD1Binding(environment.DB);
  const parsed = uploadIngestionFileSchema.safeParse(await readJson(request, INGESTION_UPLOAD_JSON_MAX_BYTES));
  if (!parsed.success) return {
    data: { success: false, message: D1_ROUTE_MESSAGES.validationFailed, errors: parsed.error.issues }, status: 400
  };
  const body = parsed.data;
  const fileName = body.fileName;
  const tenantId = environment.REQUEST_TENANT_ID;
  if (!tenantId) return { data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired }, status: 403 };
  const requestId = request.headers.get('x-request-id') || undefined;
  if (body.assessment_id) {
    const assessment = await database.prepare(
      'SELECT assessment_id FROM AssessmentRecord WHERE assessment_id = ? AND tenant_id = ?'
    ).bind(body.assessment_id, tenantId).first();
    if (!assessment) return { data: { success: false, message: ASSESSMENT_D1_MESSAGES.missingRecord(body.assessment_id) }, status: 404 };
  }
  const fileSizeMb = body.fileSizeMb ?? 1;
  const docId = `DOC-INGEST-${crypto.randomUUID()}`;
  const fileType = body.fileType || 'XLSX';
  const fileBase64 = body.fileBase64 || '';
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
          assessmentId: body.assessment_id,
          requestId
        });
      }
    }

    const recordsCount = imported.importedCount || body.recordsCount || 0;
    const convertedInrCrores = imported.importedCount ? imported.totalInrCrores : body.convertedInrCrores || 0;
    const currencies = imported.importedCount
      ? imported.detectedCurrencies
      : body.detectedCurrencies || [];
    const isSupportedExtraction = Boolean(bytes) && parseTransactions && ['XLSX', 'XLS', 'CSV'].includes(fileType);
    const extractionStatus = isSupportedExtraction ? 'Completed' : 'Pending';
    const extractionProgress = isSupportedExtraction ? 100 : 0;
    const persistenceStatements: CloudflareD1PreparedStatement[] = [database.prepare(`
      INSERT INTO RawDocumentIngestion (
        doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count, converted_inr_crores, detected_currencies
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(docId, tenantId, fileName, fileType, fileSizeMb, extractionStatus, extractionProgress, recordsCount, convertedInrCrores, JSON.stringify(currencies))];

    if (bytes) {
      persistenceStatements.push(database.prepare(`INSERT OR REPLACE INTO ObjectMetadata (object_key, tenant_id, filename, content_type, size_bytes, sha256, bucket) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(objectKey, tenantId, fileName, fileType, bytes.byteLength, '', environment.R2_BUCKET || ''));
    }
    await runD1Statements(database, persistenceStatements, {
      action: D1_LOG_ACTIONS.ingestionUploadPersist,
      operation: D1_LOG_ACTIONS.ingestionUploadPersist,
      requestId,
      tenantId,
      documentId: docId
    });
  } catch (error) {
    try {
      await runD1Statements(database, [
        database.prepare('DELETE FROM ProcurementTransaction WHERE source_document_id = ? AND tenant_id = ?').bind(docId, tenantId),
        database.prepare('DELETE FROM ValidationPreCheckRecord WHERE record_id LIKE ? AND tenant_id = ?').bind(`REC-${docId}-ROW-%`, tenantId),
        database.prepare('DELETE FROM RawDocumentIngestion WHERE doc_id = ? AND tenant_id = ?').bind(docId, tenantId),
        database.prepare('DELETE FROM ObjectMetadata WHERE object_key = ? AND tenant_id = ?').bind(objectKey, tenantId)
      ], {
        action: D1_LOG_ACTIONS.ingestionUploadRollback,
        operation: D1_LOG_ACTIONS.ingestionUploadRollback,
        requestId,
        tenantId,
        documentId: docId
      });
    } catch (cleanupError) {
      logger.error(D1_LOG_MESSAGES.ingestionUploadRollbackFailed, {
        action: D1_LOG_ACTIONS.ingestionUploadRollback,
        requestId,
        tenantId,
        docId
      }, cleanupError);
    }
    clearScopedModule2Cache(database, tenantId);
    if (objectStored) {
      try {
        await environment.OBJECTS?.delete(objectKey);
      } catch (cleanupError) {
        logger.error(D1_LOG_MESSAGES.ingestionUploadR2CleanupFailed, {
          action: D1_LOG_ACTIONS.ingestionUploadRollback,
          requestId,
          tenantId,
          docId,
          objectKey
        }, cleanupError);
      }
    }
    if (error instanceof Error && /workbook|row import limit|Only XLSX/u.test(error.message)) {
      return { data: { success: false, message: error.message }, status: 400 };
    }
    throw error;
  }

  logger.info('Persisted uploaded ingestion dataset in D1', {
    requestId,
    docId,
    tenantId,
    importedCount: imported.importedCount,
    validationCount: imported.validationCount
  });

  const queueRows = await database.prepare('SELECT * FROM RawDocumentIngestion WHERE tenant_id = ? ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?')
    .bind(tenantId, D1_INGESTION_PAGE_QUERY_LIMIT).all<Record<string, unknown>>();
  const ingestionQueue = queueRows.results.map((row) => ({
    ...row,
    detected_currencies: parseStoredDetectedCurrencies(row.detected_currencies, {
      requestId,
      tenantId,
      documentId: String(row.doc_id)
    })
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
  const database = requireD1Binding(environment.DB);
  const parsed = updateValidationRecordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return { data: { success: false, message: 'Validation update is invalid.', errors: parsed.error.issues }, status: 400 };
  }
  const tenantId = environment.REQUEST_TENANT_ID || request.headers.get('x-resolved-tenant-id') || undefined;
  if (!tenantId) return { data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired }, status: 403 };
  const body = parsed.data;
  const updated = await database.prepare(`
    UPDATE ValidationPreCheckRecord
    SET po_number = COALESCE(?, po_number), vendor_name = COALESCE(?, vendor_name), raw_desc = COALESCE(?, raw_desc),
        order_quantity = COALESCE(?, order_quantity), net_price = COALESCE(?, net_price),
        subtotal_raw = COALESCE(?, subtotal_raw), amount = COALESCE(?, amount), raw_currency = COALESCE(?, raw_currency),
        amount_inr = COALESCE(?, amount_inr), inr_crores = COALESCE(?, inr_crores),
        fx_rate_applied = COALESCE(?, fx_rate_applied), spend_year = COALESCE(?, spend_year),
        transaction_date = COALESCE(?, transaction_date), column_l_code = COALESCE(?, column_l_code),
        core_category = COALESCE(?, core_category), issue_flag = COALESCE(?, issue_flag),
        action_status = COALESCE(?, action_status), resolved = COALESCE(?, resolved)
    WHERE record_id = ? AND tenant_id = ?
      AND EXISTS (SELECT 1 FROM TenantMaster WHERE tenant_id = ?)
    RETURNING *
  `).bind(
    body.po_number ?? null, body.vendor_name ?? null, body.raw_desc ?? null,
    body.order_quantity ?? null, body.net_price ?? null, body.subtotal_raw ?? null, body.amount ?? null,
    body.raw_currency ?? null, body.amount_inr ?? null, body.inr_crores ?? null, body.fx_rate_applied ?? null,
    body.spend_year ?? null, body.transaction_date ?? null, body.column_l_code ?? null, body.core_category ?? null,
    body.issue_flag ?? null, body.action_status ?? null, body.resolved === undefined ? null : Number(body.resolved),
    body.record_id, tenantId, tenantId
  ).first<Record<string, unknown>>();
  return updated ? { data: { ...updated, resolved: Boolean((updated as Record<string, unknown>).resolved) } } : { data: { success: false, message: 'Validation record not found.' }, status: 404 };
};

const deleteIngestion = async (url: URL, environment: CloudflareEnvironment): Promise<{ data: unknown; status?: number }> => {
  const database = requireD1Binding(environment.DB);
  const tenant = await getTenantFromD1(database, environment.REQUEST_TENANT_ID);
  const tenantId = String(tenant.tenant_id);
  // "/document/" with an empty id must never fall through to the clear-all branch below.
  const documentId = url.pathname.includes('/document/') ? url.pathname.split('/document/').pop() : null;
  if (documentId === '') {
    return { data: { success: false, message: 'A document id is required after /document/ to delete one ingestion record.' }, status: 400 };
  }
  const documents = documentId
    ? await database.prepare('SELECT doc_id FROM RawDocumentIngestion WHERE doc_id = ? AND tenant_id = ?').bind(documentId, tenantId).all<{ doc_id: string }>()
    : await database.prepare('SELECT doc_id FROM RawDocumentIngestion WHERE tenant_id = ?').bind(tenantId).all<{ doc_id: string }>();
  for (const document of documents.results) {
    const objectRows = await database.prepare('SELECT object_key FROM ObjectMetadata WHERE tenant_id = ? AND object_key LIKE ?').bind(tenantId, `${document.doc_id}_%`).all<{ object_key: string }>();
    for (const object of objectRows.results) {
      if (environment.OBJECTS) await environment.OBJECTS.delete(object.object_key);
      await database.prepare('DELETE FROM ObjectMetadata WHERE object_key = ? AND tenant_id = ?').bind(object.object_key, tenantId).run();
    }
    await database.prepare('DELETE FROM ProcurementTransaction WHERE source_document_id = ? AND tenant_id = ?').bind(document.doc_id, tenantId).run();
    clearScopedModule2Cache(database, tenantId);
    await database.prepare('DELETE FROM ValidationPreCheckRecord WHERE record_id LIKE ? AND tenant_id = ?').bind(`REC-${document.doc_id}-ROW-%`, tenantId).run();
    await database.prepare('DELETE FROM RawDocumentIngestion WHERE doc_id = ? AND tenant_id = ?').bind(document.doc_id, tenantId).run();
  }
  logger.info('Deleted D1 ingestion documents and linked data', {
    documentCount: documents.results.length,
    requestedDocumentId: documentId || undefined,
    tenantId
  });
  const queue = await database.prepare('SELECT * FROM RawDocumentIngestion WHERE tenant_id = ? ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?')
    .bind(tenantId, D1_INGESTION_PAGE_QUERY_LIMIT).all();
  return { data: queue.results || [] };
};

const resetValidationRecords = async (environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  requireD1Binding(environment.DB);
  const database = environment.DB as CloudflareD1Database;
  const tenant = await getTenantFromD1(database, environment.REQUEST_TENANT_ID);
  const tenantId = String(tenant.tenant_id);
  await database.prepare('DELETE FROM ValidationPreCheckRecord WHERE tenant_id = ?').bind(tenantId).run();
  const records = await database.prepare('SELECT * FROM ValidationPreCheckRecord WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenantId).all();
  return { data: records.results || [] };
};

const resetIngestionDataset = async (environment: CloudflareEnvironment): Promise<{ data: unknown }> => {
  const database = requireD1Binding(environment.DB);
  const tenant = await getTenantFromD1(database, environment.REQUEST_TENANT_ID);
  const tenantId = String(tenant.tenant_id);
  const documents = await database.prepare('SELECT doc_id FROM RawDocumentIngestion WHERE tenant_id = ?').bind(tenantId).all<{ doc_id: string }>();
  const objects = await database.prepare('SELECT object_key FROM ObjectMetadata WHERE tenant_id = ?').bind(tenantId).all<{ object_key: string }>();
  for (const object of objects.results) {
    try {
      await environment.OBJECTS?.delete(object.object_key);
    } catch (error) {
      logger.warn('Failed to remove a tenant object during ingestion reset; metadata cleanup will continue', {
        tenantId, objectKey: object.object_key
      }, error);
    }
  }
  const documentIds = documents.results.map((document) => document.doc_id);
  if (documentIds.length) {
    const placeholders = documentIds.map(() => '?').join(', ');
    await database.prepare(`DELETE FROM ProcurementTransaction WHERE tenant_id = ? AND source_document_id IN (${placeholders})`)
      .bind(tenantId, ...documentIds).run();
    clearScopedModule2Cache(database, tenantId);
  }
  await database.prepare('DELETE FROM ValidationPreCheckRecord WHERE tenant_id = ?').bind(tenantId).run();
  await database.prepare('DELETE FROM ObjectMetadata WHERE tenant_id = ?').bind(tenantId).run();
  await database.prepare('DELETE FROM RawDocumentIngestion WHERE tenant_id = ?').bind(tenantId).run();
  logger.info('Reset tenant ingestion dataset', { tenantId, documentCount: documentIds.length, objectCount: objects.results.length });
  return { data: { success: true, tenantId, deletedDocuments: documentIds.length, deletedObjects: objects.results.length } };
};

const handleIngestion = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<{ data: unknown; status?: number }> => {
  if (request.method === 'GET') {
    const parsed = ingestionDataQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      logger.warn('Rejected invalid ingestion pagination cursor', {
        requestId: request.headers.get('x-request-id') || undefined,
        errors: parsed.error.issues
      });
      return { data: { success: false, message: D1_ROUTE_MESSAGES.validationFailed, errors: parsed.error.issues }, status: 400 };
    }
    return getIngestionData(environment, parsed.data, request.headers.get('x-request-id') || undefined);
  }
  if (request.method === 'POST' && (url.pathname.endsWith('/upload') || url.pathname.endsWith('/upload-object'))) return uploadIngestion(request, environment);
  if (request.method === 'POST' && url.pathname.endsWith('/remediate')) {
    return remediateIngestion(environment, request.headers.get('x-request-id') || undefined);
  }
  if (request.method === 'POST' && url.pathname.endsWith('/reset')) return resetIngestionDataset(environment);
  if (request.method === 'POST') return addIngestion(request, environment);
  if (request.method === 'PATCH') return updateIngestion(request, environment);
  if (request.method === 'DELETE' && url.pathname.endsWith('/validation-records')) return resetValidationRecords(environment);
  if (request.method === 'DELETE') return deleteIngestion(url, environment);
  return { data: { success: false, message: 'Unsupported ingestion operation.' }, status: 405 };
};

export const handleIngestionRoute = async (request: Request, environment: CloudflareEnvironment, url: URL): Promise<Response> => {
  const result = await handleIngestion(request, environment, url);
  return result.status
    ? jsonResponse(result.data as Record<string, unknown>, result.status, request)
    : apiData(result.data, request);
};
