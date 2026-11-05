/**
 * Cloudflare Worker D1 access layer.
 *
 * This module intentionally performs no schema creation and contains no fallback
 * business data. D1 migrations and the idempotent seed command are deployment
 * concerns; request handlers only read or mutate persisted rows.
 */

import { D1_DEMO_TENANT_ID, D1_INGESTION_PAGE_QUERY_LIMIT, D1_INGESTION_PAGE_SIZE, D1_LOG_MESSAGES, D1_REPORTING, D1_ROUTE_MESSAGES, D1_TABLES, D1_TAXONOMY_DEFAULT_LIMIT } from './constants/d1';
import { D1_REFERENCE_CACHE_KEYS } from './constants/db';
import { resolveWorkerRuntimeConfig } from './config/runtimeConfig';
import { queryD1Rows as queryAll } from './services/workerD1Query';
import { getOrLoadD1ReferenceData } from './services/d1ReferenceDataCache';
import { loadCanonicalAssessmentFromD1 } from './services/workerD1Canonical';
import type { CloudflareD1Database, CloudflareEnvironment } from './types/cloudflare';
import type { D1CurrencySpendRow, D1FxCurrencyRow, D1FxRateRow, D1IngestionPageOptions, D1MetricRow, D1MonthlySpendRow, D1StoredCurrencyContext, D1TenantRow, D1TaxonomyRow, D1Record, WorkerD1Result } from './types/d1';
import type { CoreBucket, UNSPSCCommodityRecord } from './types/taxonomy';
import { readJson } from './workerHttp';
import { d1DatasetScopeSchema } from './constants/validation';
import logger from './utils/logger';
import {
  loadAssessmentSavingsFromD1, loadSavingsFromD1, updateActionPlanInD1, updateOpportunityStatusInD1
} from './services/workerD1Savings';

export type { WorkerD1Result } from './types/d1';

export const requireD1Binding = (db?: CloudflareD1Database): CloudflareD1Database => {
  if (!db) throw new Error('Cloudflare D1 binding DB is not configured');
  return db;
};

const queryFirst = async <T = D1Record>(db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<T | null> => {
  const statement = db.prepare(sql);
  const bound = values.length > 0 ? statement.bind(...values) : statement;
  return bound.first<T>();
};

const numberValue = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);

export const parseStoredDetectedCurrencies = (value: unknown, context: D1StoredCurrencyContext): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return [];
  const logFallback = (error: unknown): string[] => {
    logger.warn(D1_LOG_MESSAGES.invalidStoredCurrencyMetadata, {
      requestId: context.requestId,
      tenantId: context.tenantId,
      documentId: context.documentId,
      fallback: 'empty-currency-list'
    }, error);
    return [];
  };
  if (typeof value !== 'string') return logFallback(new TypeError('Stored currency metadata is not text.'));
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map(String)
      : logFallback(new TypeError('Stored currency metadata is not a JSON array.'));
  } catch (error: unknown) {
    return logFallback(error);
  }
};

const metricMap = (rows: D1MetricRow[]): Map<string, D1MetricRow> => new Map(rows.map((row) => [row.metric_key, row]));

const requiredMetric = (metrics: Map<string, D1MetricRow>, key: string): number => {
  const row = metrics.get(key);
  if (row?.metric_value == null || !Number.isFinite(Number(row.metric_value))) {
    throw new Error(`D1 seed is missing required dataset metric: ${key}`);
  }
  return Number(row.metric_value);
};

const toTaxonomyRecord = (row: D1TaxonomyRow): UNSPSCCommodityRecord => ({
  commodityCode: row.commodity_code,
  commodityTitle: row.commodity_title,
  classCode: row.class_code,
  classTitle: row.class_title,
  familyCode: row.family_code,
  familyTitle: row.family_title,
  segmentCode: row.segment_code,
  segmentTitle: row.segment_title,
  coreBucket: row.core_bucket as CoreBucket | undefined,
  classificationStatus: row.classification_status as 'CLASSIFIED' | 'UNCLASSIFIED' | undefined
});

export const getTenantFromD1 = async (db?: CloudflareD1Database, tenantId?: string): Promise<D1TenantRow> => {
  const database = requireD1Binding(db);
  if (!tenantId) throw new Error(D1_ROUTE_MESSAGES.tenantScopeRequired);
  const tenant = await queryFirst<D1TenantRow>(database,
    `SELECT * FROM ${D1_TABLES.tenant} WHERE tenant_id = ?`, [tenantId]);
  if (!tenant) throw new Error(D1_ROUTE_MESSAGES.tenantUnavailable(tenantId));
  return tenant;
};

export const getIngestionDataFromD1 = async (
  db: CloudflareD1Database,
  tenantId: string,
  page: D1IngestionPageOptions = {}
): Promise<Record<string, unknown>> => {
  const database = db;
  const queueCursor = page.queueCursor;
  const validationCursor = page.validationCursor;
  const includeQueue = page.includeQueue ?? true;
  const includeValidationRecords = page.includeValidationRecords ?? true;
  const queueSql = page.queueDocumentId
    ? `SELECT * FROM ${D1_TABLES.ingestion} WHERE tenant_id = ? AND doc_id = ? LIMIT 1`
    : queueCursor
    ? `SELECT * FROM ${D1_TABLES.ingestion} WHERE tenant_id = ? AND
       (uploaded_at < ? OR (uploaded_at = ? AND doc_id < ?))
       ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?`
    : `SELECT * FROM ${D1_TABLES.ingestion} WHERE tenant_id = ?
       ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?`;
  const validationSql = validationCursor
    ? `SELECT * FROM ${D1_TABLES.validation} WHERE tenant_id = ? AND
       (created_at < ? OR (created_at = ? AND record_id < ?))
       ORDER BY created_at DESC, record_id DESC LIMIT ?`
    : `SELECT * FROM ${D1_TABLES.validation}
       WHERE tenant_id = ? ORDER BY created_at DESC, record_id DESC LIMIT ?`;
  const [queuePage, validationPage, summaryRows] = await Promise.all([
    includeQueue
      ? queryAll(database, queueSql, page.queueDocumentId
        ? [tenantId, page.queueDocumentId]
        : queueCursor
          ? [tenantId, queueCursor.uploadedAt, queueCursor.uploadedAt, queueCursor.docId, D1_INGESTION_PAGE_QUERY_LIMIT]
          : [tenantId, D1_INGESTION_PAGE_QUERY_LIMIT])
      : Promise.resolve([]),
    includeValidationRecords
      ? queryAll(database, validationSql, validationCursor
        ? [tenantId, validationCursor.createdAt, validationCursor.createdAt, validationCursor.recordId, D1_INGESTION_PAGE_QUERY_LIMIT]
        : [tenantId, D1_INGESTION_PAGE_QUERY_LIMIT])
      : Promise.resolve([]),
    page.includeSummary === false
      ? Promise.resolve([] as D1Record[])
      : queryAll<D1Record>(database, `SELECT
      (SELECT COUNT(*) FROM ${D1_TABLES.ingestion} WHERE tenant_id = ?) AS total_files,
      validation.total_records, validation.clean_count, validation.anomalies_count,
      validation.all_resolved_count, validation.pending_actions_count,
      validation.conversion_count, validation.vendor_duplication_count, validation.item_duplication_count,
      validation.total_spend_cr, validation.pending_spend_cr
      FROM (
        SELECT COUNT(*) AS total_records,
          SUM(CASE WHEN issue_flag = 'Passed Clean' THEN 1 ELSE 0 END) AS clean_count,
          SUM(CASE WHEN issue_flag <> 'Passed Clean' THEN 1 ELSE 0 END) AS anomalies_count,
          SUM(CASE WHEN resolved = 1 OR issue_flag = 'Passed Clean' THEN 1 ELSE 0 END) AS all_resolved_count,
          SUM(CASE WHEN resolved = 0 AND issue_flag <> 'Passed Clean' THEN 1 ELSE 0 END) AS pending_actions_count,
          SUM(CASE WHEN resolved = 0 AND issue_flag IN ('Missing Currency Code', 'Tax Discrepancy') THEN 1 ELSE 0 END) AS conversion_count,
          SUM(CASE WHEN resolved = 0 AND issue_flag = 'Unmapped Supplier Name' THEN 1 ELSE 0 END) AS vendor_duplication_count,
          SUM(CASE WHEN resolved = 0 AND issue_flag = 'Duplicate Item Description' THEN 1 ELSE 0 END) AS item_duplication_count,
          COALESCE(SUM(COALESCE(inr_crores, amount_inr / ?, 0)), 0) AS total_spend_cr,
          COALESCE(SUM(CASE WHEN resolved = 0 AND issue_flag <> 'Passed Clean'
            THEN COALESCE(inr_crores, amount_inr / ?, 0) ELSE 0 END), 0) AS pending_spend_cr
        FROM ${D1_TABLES.validation} WHERE tenant_id = ?
      ) AS validation`,
      [tenantId, D1_REPORTING.inrPerCrore, D1_REPORTING.inrPerCrore, tenantId])
  ]);
  const summary = summaryRows[0] ?? null;
  const hasMoreQueue = !page.queueDocumentId && queuePage.length > D1_INGESTION_PAGE_SIZE;
  const hasMoreValidation = validationPage.length > D1_INGESTION_PAGE_SIZE;
  const queue = queuePage.slice(0, D1_INGESTION_PAGE_SIZE);
  const validationRecords = validationPage.slice(0, D1_INGESTION_PAGE_SIZE);
  const normalizedQueue = queue.map((row) => ({
    ...row,
    detected_currencies: parseStoredDetectedCurrencies(row.detected_currencies, {
      requestId: page.requestId,
      tenantId,
      documentId: String(row.doc_id)
    })
  }));
  const normalizedRecords: D1Record[] = validationRecords.map((row) => ({ ...row, resolved: Boolean(row.resolved) }));
  const lastQueue = queue.at(-1);
  const lastValidation = validationRecords.at(-1);
  return {
    queue: normalizedQueue,
    validationRecords: normalizedRecords,
    pagination: {
      queue: {
        hasMore: hasMoreQueue,
        nextCursor: hasMoreQueue && lastQueue
          ? { uploadedAt: String(lastQueue.uploaded_at), docId: String(lastQueue.doc_id) }
          : null
      },
      validationRecords: {
        hasMore: hasMoreValidation,
        nextCursor: hasMoreValidation && lastValidation
          ? { createdAt: String(lastValidation.created_at), recordId: String(lastValidation.record_id) }
          : null
      }
    },
    summary: summary ? {
      totalFiles: Number(summary?.total_files || 0),
      totalRecords: Number(summary?.total_records || 0),
      cleanCount: Number(summary?.clean_count || 0),
      anomaliesCount: Number(summary?.anomalies_count || 0),
      allResolvedCount: Number(summary?.all_resolved_count || 0),
      pendingActionsCount: Number(summary?.pending_actions_count || 0),
      conversionCount: Number(summary?.conversion_count || 0),
      vendorDuplicationCount: Number(summary?.vendor_duplication_count || 0),
      itemDuplicationCount: Number(summary?.item_duplication_count || 0),
      totalSpendCr: Number(summary?.total_spend_cr || 0),
      pendingSpendCr: Number(summary.pending_spend_cr || 0)
    } : undefined
  };
};

export const getCanonicalModule1Data = async (
  db?: CloudflareD1Database,
  assessmentId?: string,
  tenantId?: string
): Promise<Record<string, unknown>> => {
  const database = requireD1Binding(db);
  if (!tenantId) throw new Error(D1_ROUTE_MESSAGES.tenantScopeRequired);
  if (assessmentId) return loadCanonicalAssessmentFromD1(database, assessmentId, tenantId);
  const [categories, vendors, monthlySpend, currencyBreakdown, metricRows] = await Promise.all([
    queryAll(database, `SELECT * FROM ${D1_TABLES.categories} WHERE tenant_id = ? ORDER BY spend_inr_crores DESC`, [tenantId]),
    queryAll(database, `SELECT * FROM ${D1_TABLES.vendors} WHERE tenant_id = ? ORDER BY total_3yr_spend_inr_cr DESC LIMIT 10`, [tenantId]),
    queryAll<D1MonthlySpendRow>(database, `SELECT month_key, spend_inr_cr FROM ${D1_TABLES.monthlySpend} WHERE tenant_id = ? ORDER BY month_key ASC`, [tenantId]),
    queryAll<D1CurrencySpendRow>(database, `SELECT currency, spend_inr_cr, percentage FROM ${D1_TABLES.currencySpend} WHERE tenant_id = ? ORDER BY spend_inr_cr DESC`, [tenantId]),
    queryAll<D1MetricRow>(database, `SELECT metric_key, metric_value, metric_text FROM ${D1_TABLES.metrics} WHERE tenant_id = ?`, [tenantId])
  ]);
  const metrics = metricMap(metricRows);
  if (metrics.size === 0 && tenantId !== D1_DEMO_TENANT_ID) {
    return {
      validFxNormalizedSpendCr: 0, totalSpendCr: 0, sourceRowCount: 0, validRowCount: 0,
      validRecordsCount: 0, excludedRowCount: 0, excludedRecordsCount: 0, anomalyRowCount: 0,
      anomalyRecordsCount: 0, cleanSpendYieldPct: 0, top10ConcentrationPct: 0, supplierSpend: [],
      categorySpend: [], monthlySpend: [], currencyBreakdown: [], reconciliationStatus: 'NO_DATA', billingMonths: 0
    };
  }
  const totalSpendCr = requiredMetric(metrics, 'totalSpendCr');
  const topVendors = vendors.map((row) => ({
    supplierName: row.vendor_name,
    spend_inr_cr: numberValue(row.total_3yr_spend_inr_cr),
    sharePct: totalSpendCr > 0 ? numberValue(row.total_3yr_spend_inr_cr) / totalSpendCr * 100 : 0,
    paretoClass: 'A'
  }));
  const top10SpendCr = topVendors.reduce((total, row) => total + row.spend_inr_cr, 0);
  return {
    validFxNormalizedSpendCr: totalSpendCr,
    totalSpendCr,
    sourceRowCount: requiredMetric(metrics, 'sourceRowCount'),
    validRowCount: requiredMetric(metrics, 'validRowCount'),
    validRecordsCount: requiredMetric(metrics, 'validRowCount'),
    excludedRowCount: requiredMetric(metrics, 'excludedRowCount'),
    excludedRecordsCount: requiredMetric(metrics, 'excludedRowCount'),
    anomalyRowCount: requiredMetric(metrics, 'anomalyRowCount'),
    anomalyRecordsCount: requiredMetric(metrics, 'anomalyRowCount'),
    cleanSpendYieldPct: requiredMetric(metrics, 'cleanSpendYieldPct'),
    top10ConcentrationPct: totalSpendCr > 0 ? Number((top10SpendCr / totalSpendCr * 100).toFixed(2)) : 0,
    supplierSpend: topVendors,
    categorySpend: categories.map((row) => ({
      category: row.name || row.category,
      spend_inr_cr: numberValue(row.spend_inr_crores),
      sharePct: numberValue(row.share_pct),
      itemCount: numberValue(row.item_count),
      vendorCount: numberValue(row.vendor_count)
    })),
    monthlySpend,
    currencyBreakdown,
    reconciliationStatus: metrics.get('reconciliationStatus')?.metric_text || 'RECONCILED',
    billingMonths: requiredMetric(metrics, 'billingMonths')
  };
};

export { handleModule2Route } from './workerD1Module2';


export { handlePcbiRoute } from './workerD1Pcbi';

export const handleSavingsRoute = async (
  db: CloudflareD1Database | undefined,
  subPath: string,
  request: Request,
  url: URL,
  environment: CloudflareEnvironment = {}
): Promise<WorkerD1Result> => {
  const database = requireD1Binding(db);
  if (subPath === '/action-plan/update' && request.method !== 'POST') return {
    status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.savingsMethod }
  };
  if (subPath === '/action-plan/update') {
    const input = await readJson(request);
    const tenantId = environment.REQUEST_TENANT_ID;
    if (!tenantId) return { status: 403, data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired } };
    const result = await updateActionPlanInD1(database, input, tenantId);
    if (result.status === undefined) logger.info('Savings action plan updated in D1', {
      requestId: request.headers.get('x-request-id'), actionId: (result.data as { id?: string } | null)?.id
    });
    return result;
  }
  if ((subPath === '/consolidated' && request.method !== 'GET') ||
      (subPath === '/opportunity/status' && request.method !== 'POST')) return {
    status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.savingsMethod }
  };
  if (subPath === '/consolidated') {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id') ?? undefined;
    const requestedTenantId = url.searchParams.get('tenantId') ??
      (request.headers.get('x-resolved-tenant-id') ? undefined : request.headers.get('x-tenant-id') || undefined);
    const tenantId = environment.REQUEST_TENANT_ID || request.headers.get('x-resolved-tenant-id') || undefined;
    if (!tenantId) return { status: 403, data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired } };
    if (requestedTenantId && requestedTenantId !== tenantId) return {
      status: 403, data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeMismatch }
    };
    if (assessmentId !== undefined || requestedTenantId !== undefined) {
      const parsed = d1DatasetScopeSchema.safeParse({ assessmentId, tenantId: requestedTenantId });
      if (!parsed.success) return { status: 400, data: {
        success: false, message: D1_ROUTE_MESSAGES.invalidDatasetScope, errors: parsed.error.issues
      } };
      if (!parsed.data.assessmentId) return { status: 400, data: {
        success: false, message: D1_ROUTE_MESSAGES.savingsAssessmentRequired
      } };
      return loadAssessmentSavingsFromD1(
        database, parsed.data.assessmentId, tenantId, request.headers.get('x-request-id') || undefined
      );
    }
    return { data: await loadSavingsFromD1(database, tenantId) };
  }
  if (subPath === '/opportunity/status' && request.method === 'POST') {
    const input = await readJson(request);
    const tenantId = environment.REQUEST_TENANT_ID;
    if (!tenantId) return { status: 403, data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired } };
    return updateOpportunityStatusInD1(database, input, tenantId);
  }
  return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.unknownSavings } };
};

export { handleAssessmentRoute } from './workerD1Assessment';


export const getTaxonomyFromD1 = async (db: CloudflareD1Database, query: string, category: string, lookup: string, pageLimit = D1_TAXONOMY_DEFAULT_LIMIT, offset = 0): Promise<UNSPSCCommodityRecord | UNSPSCCommodityRecord[] | null> => {
  const searchTerm = (lookup || query).trim().toLowerCase();
  const limit = lookup ? 1 : pageLimit;
  const params: unknown[] = [];
  let sql = `SELECT * FROM ${D1_TABLES.taxonomy}`;
  if (searchTerm) {
    sql += ' WHERE (lower(commodity_code) = ? OR lower(commodity_title) LIKE ? OR lower(class_title) LIKE ? OR lower(family_title) LIKE ?)';
    params.push(searchTerm, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }
  if (category && category !== 'ALL') {
    sql += searchTerm ? ' AND core_bucket = ?' : ' WHERE core_bucket = ?';
    params.push(category);
  }
  sql += ' ORDER BY commodity_code LIMIT ? OFFSET ?';
  params.push(limit, lookup ? 0 : offset);
  const rows = await queryAll<D1TaxonomyRow>(db, sql, params);
  return lookup ? (rows[0] ? toTaxonomyRecord(rows[0]) : null) : rows.map(toTaxonomyRecord);
};

export const getCurrencyRatesFromD1 = async (
  db: CloudflareD1Database,
  requestId?: string
): Promise<Record<string, unknown>> => {
  const result = await getOrLoadD1ReferenceData<Record<string, unknown>>(
    db,
    D1_REFERENCE_CACHE_KEYS.CURRENCY_RATES,
    async () => {
      const currencies = await queryAll<D1FxCurrencyRow>(db, `SELECT * FROM ${D1_TABLES.fxCurrencies} ORDER BY currency`, [], requestId);
      const rates = await queryAll<D1FxRateRow>(db, `SELECT r.* FROM ${D1_TABLES.fxRates} r INNER JOIN (SELECT currency, MAX(rate_date) AS rate_date FROM ${D1_TABLES.fxRates} GROUP BY currency) latest ON latest.currency = r.currency AND latest.rate_date = r.rate_date`, [], requestId);
      const rateMap = new Map(rates.map((rate) => [rate.currency, rate]));
      return Object.fromEntries(currencies.map((currency) => {
        const rate = rateMap.get(currency.currency);
        return [currency.currency, {
          ticker: `${currency.currency}INR=X`,
          currencyPair: `${currency.currency} / INR`,
          currencyCode: currency.currency,
          name: currency.currency_name,
          currentRate: rate?.inr_per_unit || 0,
          lastUpdated: rate?.rate_date || null,
          coverageStatus: currency.coverage_status,
          source: rate?.source_name || currency.approved_source || null
        }];
      }));
    }
  );
  logger.debug('Resolved D1 currency reference cache', {
    model: D1_TABLES.fxRates, cacheStatus: result.cacheStatus, requestId
  });
  return result.value;
};

export const getProcurementCategoryMappingsFromD1 = async (
  db: CloudflareD1Database, requestId?: string
): Promise<Record<string, unknown>> => {
  const rows = await queryAll<{ material_group_code: string; category_name: string }>(
    db,
    `SELECT material_group_code, category_name FROM ${D1_TABLES.procurementCategoryMappings} ORDER BY material_group_code`,
    [], requestId
  );
  const mappings = Object.fromEntries(rows.map((row) => [row.material_group_code, row.category_name]));
  return { mappings, categories: [...new Set(rows.map((row) => row.category_name))].sort() };
};

export const handleCryptoRoute = async (
  request: Request,
  url: URL,
  environment: CloudflareEnvironment
): Promise<WorkerD1Result> => {
  if (url.pathname.endsWith('/encrypt') && request.method === 'POST') {
    const config = resolveWorkerRuntimeConfig(environment);
    const body = await readJson(request);
    const plaintext = typeof body.plaintext === 'string' ? body.plaintext : '';
    if (!plaintext) return { data: { success: false, message: 'plaintext is required' }, status: 400 };
    const keyBytes = new TextEncoder().encode(config.appEncryptionKey);
    if (keyBytes.length !== 32) return { data: { success: false, message: 'APP_ENCRYPTION_KEY must be 32 bytes' }, status: 500 };
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));
    const tag = encrypted.slice(encrypted.length - 16);
    const ciphertext = encrypted.slice(0, encrypted.length - 16);
    const b64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));
    return { data: { success: true, algorithm: 'aes-256-gcm', iv: b64(iv), tag: b64(tag), ciphertext: b64(ciphertext), compact: `aes256gcm:${b64(iv)}:${b64(tag)}:${b64(ciphertext)}` } };
  }
  return { data: { message: 'Crypto endpoint ready' } };
};

export const lookupTaxonomyRecordFromD1 = async (db: CloudflareD1Database, query: string): Promise<UNSPSCCommodityRecord | undefined> => {
  const result = await getTaxonomyFromD1(db, query, '', query);
  return result && !Array.isArray(result) ? result : undefined;
};
