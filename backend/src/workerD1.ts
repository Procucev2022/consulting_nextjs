/**
 * Cloudflare Worker D1 access layer.
 *
 * This module intentionally performs no schema creation and contains no fallback
 * business data. D1 migrations and the idempotent seed command are deployment
 * concerns; request handlers only read or mutate persisted rows.
 */

import { D1_ROUTE_MESSAGES, D1_TABLES, D1_TAXONOMY_DEFAULT_LIMIT } from './constants/d1';
import { resolveWorkerRuntimeConfig } from './config/runtimeConfig';
import { queryD1Rows as queryAll } from './services/workerD1Query';
import { loadCanonicalAssessmentFromD1 } from './services/workerD1Canonical';
import type { CloudflareD1Database, CloudflareEnvironment } from './types/cloudflare';
import type { D1CurrencySpendRow, D1FxCurrencyRow, D1FxRateRow, D1MetricRow, D1MonthlySpendRow, D1TenantRow, D1TaxonomyRow, D1Record, WorkerD1Result } from './types/d1';
import type { CoreBucket, UNSPSCCommodityRecord } from './types/taxonomy';
import { readJson } from './workerHttp';
import { d1DatasetScopeSchema } from './constants/validation';
import logger from './utils/logger';
import {
  loadAssessmentSavingsFromD1, loadSavingsFromD1, updateActionPlanInD1, updateOpportunityStatusInD1
} from './services/workerD1Savings';

export type { WorkerD1Result } from './types/d1';

const requireDb = (db?: CloudflareD1Database): CloudflareD1Database => {
  if (!db) throw new Error('Cloudflare D1 binding DB is not configured');
  return db;
};

const queryFirst = async <T = D1Record>(db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<T | null> => {
  const statement = db.prepare(sql);
  const bound = values.length > 0 ? statement.bind(...values) : statement;
  return bound.first<T>();
};

const numberValue = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);

const parseCurrencies = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
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

export const ensureD1Initialized = async (db?: CloudflareD1Database): Promise<void> => {
  const database = requireDb(db);
  await database.prepare('SELECT 1 AS ok').first();
};

export const getTenantFromD1 = async (db?: CloudflareD1Database): Promise<D1TenantRow> => {
  const database = requireDb(db);
  const tenant = await queryFirst<D1TenantRow>(database, `SELECT * FROM ${D1_TABLES.tenant} ORDER BY created_at ASC LIMIT 1`);
  if (!tenant) throw new Error('D1 seed does not contain a tenant record');
  return tenant;
};

export const getIngestionDataFromD1 = async (db: CloudflareD1Database, tenantId?: string): Promise<Record<string, unknown>> => {
  const database = db;
  const queue = tenantId
    ? await queryAll(database, `SELECT * FROM ${D1_TABLES.ingestion} WHERE tenant_id = ? ORDER BY uploaded_at DESC`, [tenantId])
    : await queryAll(database, `SELECT * FROM ${D1_TABLES.ingestion} ORDER BY uploaded_at DESC`);
  const validationRecords = tenantId
    ? await queryAll(database, `
        SELECT validation.* FROM ${D1_TABLES.validation} AS validation
        LEFT JOIN ${D1_TABLES.transactions} AS txn
          ON txn.transaction_id = SUBSTR(validation.record_id, 5)
        WHERE txn.tenant_id = ? OR txn.transaction_id IS NULL
        ORDER BY validation.created_at DESC, validation.record_id DESC LIMIT 500
      `, [tenantId])
    : await queryAll(database, `SELECT * FROM ${D1_TABLES.validation} ORDER BY created_at DESC, record_id DESC LIMIT 500`);
  const normalizedQueue = queue.map((row) => ({ ...row, detected_currencies: parseCurrencies(row.detected_currencies) }));
  const normalizedRecords: D1Record[] = validationRecords.map((row) => ({ ...row, resolved: Boolean(row.resolved) }));
  return {
    queue: normalizedQueue,
    validationRecords: normalizedRecords,
    summary: {
      totalFiles: normalizedQueue.length,
      totalRecords: normalizedRecords.length,
      cleanCount: normalizedRecords.filter((row) => row.issue_flag === 'Passed Clean').length,
      anomaliesCount: normalizedRecords.filter((row) => row.issue_flag !== 'Passed Clean').length
    }
  };
};

export const getCanonicalModule1Data = async (
  db?: CloudflareD1Database,
  assessmentId?: string
): Promise<Record<string, unknown>> => {
  const database = requireDb(db);
  await ensureD1Initialized(database);
  if (assessmentId) return loadCanonicalAssessmentFromD1(database, assessmentId);
  const [categories, vendors, monthlySpend, currencyBreakdown, metricRows] = await Promise.all([
    queryAll(database, `SELECT * FROM ${D1_TABLES.categories} ORDER BY spend_inr_crores DESC`),
    queryAll(database, `SELECT * FROM ${D1_TABLES.vendors} ORDER BY total_3yr_spend_inr_cr DESC LIMIT 10`),
    queryAll<D1MonthlySpendRow>(database, `SELECT month_key, spend_inr_cr FROM ${D1_TABLES.monthlySpend} ORDER BY month_key ASC`),
    queryAll<D1CurrencySpendRow>(database, `SELECT currency, spend_inr_cr, percentage FROM ${D1_TABLES.currencySpend} ORDER BY spend_inr_cr DESC`),
    queryAll<D1MetricRow>(database, `SELECT metric_key, metric_value, metric_text FROM ${D1_TABLES.metrics}`)
  ]);
  const metrics = metricMap(metricRows);
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
  url: URL
): Promise<WorkerD1Result> => {
  const database = requireDb(db);
  await ensureD1Initialized(database);
  if (subPath === '/action-plan/update' && request.method !== 'POST') return {
    status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.savingsMethod }
  };
  if (subPath === '/action-plan/update') {
    const result = await updateActionPlanInD1(database, await readJson(request));
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
    const tenantId = url.searchParams.get('tenantId') ?? request.headers.get('x-tenant-id') ?? undefined;
    if (assessmentId !== undefined || tenantId !== undefined) {
      const parsed = d1DatasetScopeSchema.safeParse({ assessmentId, tenantId });
      if (!parsed.success) return { status: 400, data: {
        success: false, message: D1_ROUTE_MESSAGES.invalidDatasetScope, errors: parsed.error.issues
      } };
      if (!parsed.data.assessmentId) return { status: 400, data: {
        success: false, message: D1_ROUTE_MESSAGES.savingsAssessmentRequired
      } };
      return loadAssessmentSavingsFromD1(database, parsed.data.assessmentId, parsed.data.tenantId);
    }
    return { data: await loadSavingsFromD1(database) };
  }
  if (subPath === '/opportunity/status' && request.method === 'POST') {
    return updateOpportunityStatusInD1(database, await readJson(request));
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

export const getCurrencyRatesFromD1 = async (db: CloudflareD1Database): Promise<Record<string, unknown>> => {
  const currencies = await queryAll<D1FxCurrencyRow>(db, `SELECT * FROM ${D1_TABLES.fxCurrencies} ORDER BY currency`);
  const rates = await queryAll<D1FxRateRow>(db, `SELECT r.* FROM ${D1_TABLES.fxRates} r INNER JOIN (SELECT currency, MAX(rate_date) AS rate_date FROM ${D1_TABLES.fxRates} GROUP BY currency) latest ON latest.currency = r.currency AND latest.rate_date = r.rate_date`);
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
