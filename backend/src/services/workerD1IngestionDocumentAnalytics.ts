import {
  D1_INGESTION_ANALYTICS_LIMITS,
  D1_INGESTION_ANALYTICS_SQL
} from '../constants/d1IngestionAnalytics';
import { D1_INGESTION_PAGE_SIZE } from '../constants/d1';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1Record } from '../types/d1';
import type {
  D1DocumentEnrichmentOptions,
  D1DocumentIngestionAnalytics,
  D1EntityCountsRow
} from '../types/d1IngestionAnalytics';
import { queryD1Rows } from './workerD1Query';
import { validationRecordKeyRange } from '../utils/validationRecordKeys';
import { normalizeStoredIngestionRows } from '../workerD1';
import {
  buildMaterialGroups,
  buildMonthSummaries,
  buildPlantSummaries,
  toCrores
} from './workerD1IngestionDocumentFormatters';

export const loadDocumentTransactionAnalytics = async (
  db: CloudflareD1Database,
  tenantId: string,
  documentId: string,
  requestId?: string
): Promise<D1DocumentIngestionAnalytics | undefined> => {
  const countsRows = await queryD1Rows<D1EntityCountsRow>(
    db,
    D1_INGESTION_ANALYTICS_SQL.documentEntityCounts,
    [tenantId, documentId],
    requestId
  );
  const counts = countsRows[0];
  if (Number(counts.transactionCount) === 0) return undefined;

  const limit = D1_INGESTION_ANALYTICS_LIMITS.maxGroupedRows;
  const [groupRows, plantRows, monthRows] = await Promise.all([
    queryD1Rows(db, D1_INGESTION_ANALYTICS_SQL.documentMaterialGroups, [tenantId, documentId, limit], requestId),
    queryD1Rows(db, D1_INGESTION_ANALYTICS_SQL.documentPlants, [tenantId, documentId, limit], requestId),
    queryD1Rows(db, D1_INGESTION_ANALYTICS_SQL.documentMonths, [tenantId, documentId, limit], requestId)
  ]);
  const totalSpendCr = Number(counts.totalSpendCr);
  return {
    materialGroupSummaries: buildMaterialGroups(groupRows, totalSpendCr),
    plantSummaries: buildPlantSummaries(plantRows, totalSpendCr),
    monthWiseSummaries: buildMonthSummaries(monthRows),
    uniqueItemsCount: Number(counts.uniqueItemsCount),
    uniqueVendorsCount: Number(counts.uniqueVendorsCount)
  };
};

const loadValidationSummaryRow = async (
  db: CloudflareD1Database,
  tenantId: string,
  lowerBound: string,
  upperBound: string,
  requestId?: string
): Promise<D1Record> => {
  const [metrics] = await queryD1Rows(
    db,
    D1_INGESTION_ANALYTICS_SQL.documentValidationSummary,
    [tenantId, lowerBound, upperBound],
    requestId
  );
  return metrics;
};

const loadDocumentScopedValidation = async (
  db: CloudflareD1Database,
  tenantId: string,
  documentId: string,
  options: D1DocumentEnrichmentOptions
): Promise<{
  records: D1Record[];
  hasMore: boolean;
  nextCursor: { createdAt: string; recordId: string } | null;
  summaryMetrics?: D1Record;
} | undefined> => {
  const { lowerBound, upperBound } = validationRecordKeyRange(documentId);
  const cursor = options.validationCursor;
  const validationQuery = cursor
    ? D1_INGESTION_ANALYTICS_SQL.documentValidationRowsAfterCursor
    : D1_INGESTION_ANALYTICS_SQL.documentValidationRows;
  const limit = D1_INGESTION_ANALYTICS_LIMITS.pageLimit;
  const params = cursor
    ? [tenantId, lowerBound, upperBound, cursor.createdAt, cursor.createdAt, cursor.recordId, limit]
    : [tenantId, lowerBound, upperBound, limit];

  const pageRows = await queryD1Rows(db, validationQuery, params, options.requestId);
  if (pageRows.length === 0 && !cursor) return undefined;

  const hasMore = pageRows.length > D1_INGESTION_PAGE_SIZE;
  const records: D1Record[] = (hasMore ? pageRows.slice(0, D1_INGESTION_PAGE_SIZE) : pageRows).map(
    (row): D1Record => ({
      ...row,
      resolved: Boolean(row.resolved)
    })
  );
  const lastRow = hasMore ? records[records.length - 1] : undefined;
  const nextCursor = lastRow
    ? { createdAt: String(lastRow.created_at), recordId: String(lastRow.record_id) }
    : null;
  const summaryMetrics = options.includeSummary
    ? await loadValidationSummaryRow(db, tenantId, lowerBound, upperBound, options.requestId)
    : undefined;

  return { records, hasMore, nextCursor, summaryMetrics };
};

const buildScopedValidationSummary = (
  metrics: D1Record,
  baseSummary: Record<string, unknown>,
  availableCount: number,
  selectedSpendCr: number
): Record<string, unknown> => ({
  totalFiles: Number(baseSummary.totalFiles ?? availableCount),
  totalRecords: Number(metrics.totalRecords),
  cleanCount: Number(metrics.cleanCount),
  anomaliesCount: Number(metrics.anomaliesCount),
  allResolvedCount: Number(metrics.allResolvedCount),
  pendingActionsCount: Number(metrics.pendingActionsCount),
  conversionCount: Number(metrics.conversionCount),
  vendorDuplicationCount: Number(metrics.vendorDuplicationCount),
  itemDuplicationCount: Number(metrics.itemDuplicationCount),
  totalSpendCr: selectedSpendCr > 0
    ? toCrores(selectedSpendCr)
    : toCrores(metrics.totalSpendCr),
  pendingSpendCr: toCrores(metrics.pendingSpendCr)
});

const loadEnrichmentAvailableRows = async (
  db: CloudflareD1Database,
  tenantId: string,
  options: D1DocumentEnrichmentOptions
): Promise<D1Record[]> => {
  const availableSql = options.userId
    ? D1_INGESTION_ANALYTICS_SQL.availableDocumentsByUser
    : D1_INGESTION_ANALYTICS_SQL.availableDocuments;
  const availableParams = options.userId
    ? [tenantId, options.userId, D1_INGESTION_ANALYTICS_LIMITS.pageLimit]
    : [tenantId, D1_INGESTION_ANALYTICS_LIMITS.pageLimit];
  return queryD1Rows(db, availableSql, availableParams, options.requestId);
};

const buildUnownedSelectedResponse = async (
  db: CloudflareD1Database,
  tenantId: string,
  baseData: Record<string, unknown>,
  options: D1DocumentEnrichmentOptions
): Promise<Record<string, unknown>> => {
  const availableRows = await loadEnrichmentAvailableRows(db, tenantId, options);
  const availableDocuments = normalizeStoredIngestionRows(availableRows.slice(0, D1_INGESTION_PAGE_SIZE), {
    tenantId,
    requestId: options.requestId
  });
  return { ...baseData, availableDocuments, validationRecords: [], documentAnalytics: undefined };
};

const assembleEnrichedResponse = (
  baseData: Record<string, unknown>,
  availableDocuments: unknown[],
  scopedValidation: {
    records: D1Record[];
    hasMore: boolean;
    nextCursor: { createdAt: string; recordId: string } | null;
  } | undefined,
  summary: Record<string, unknown> | undefined,
  documentAnalytics: D1DocumentIngestionAnalytics | undefined
): Record<string, unknown> => {
  const basePagination = (baseData.pagination as Record<string, unknown> | undefined) ?? {};
  const result: Record<string, unknown> = {
    ...baseData,
    availableDocuments
  };
  if (scopedValidation) {
    result.validationRecords = scopedValidation.records;
    result.pagination = {
      ...basePagination,
      validationRecords: {
        hasMore: scopedValidation.hasMore,
        nextCursor: scopedValidation.nextCursor
      }
    };
  }
  if (summary) result.summary = summary;
  if (documentAnalytics) result.documentAnalytics = documentAnalytics;
  return result;
};

export const enrichSelectedDocumentIngestionResponse = async (
  db: CloudflareD1Database,
  tenantId: string,
  documentId: string,
  baseData: Record<string, unknown>,
  options: D1DocumentEnrichmentOptions
): Promise<Record<string, unknown>> => {
  const selectedQueue = Array.isArray(baseData.queue) ? (baseData.queue as D1Record[]) : [];
  if (options.userId && selectedQueue.length === 0) {
    return buildUnownedSelectedResponse(db, tenantId, baseData, options);
  }
  const shouldLoadAnalytics = options.includeSummary && !options.validationCursor;
  const [availableRows, scopedValidation, documentAnalytics] = await Promise.all([
    loadEnrichmentAvailableRows(db, tenantId, options),
    loadDocumentScopedValidation(db, tenantId, documentId, options),
    shouldLoadAnalytics
      ? loadDocumentTransactionAnalytics(db, tenantId, documentId, options.requestId)
      : Promise.resolve(undefined)
  ]);

  const availableDocuments = normalizeStoredIngestionRows(availableRows.slice(0, D1_INGESTION_PAGE_SIZE), {
    tenantId,
    requestId: options.requestId
  });
  const baseSummary = baseData.summary as Record<string, unknown> | undefined;
  const selectedSpendCr = Number(selectedQueue[0]?.converted_inr_crores ?? 0);

  const summary = scopedValidation?.summaryMetrics && baseSummary
    ? buildScopedValidationSummary(
      scopedValidation.summaryMetrics,
      baseSummary,
      availableDocuments.length,
      selectedSpendCr
    )
    : baseSummary;

  return assembleEnrichedResponse(baseData, availableDocuments, scopedValidation, summary, documentAnalytics);
};
