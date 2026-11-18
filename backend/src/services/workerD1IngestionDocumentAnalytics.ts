import {
  D1_INGESTION_ANALYTICS_LIMITS,
  D1_INGESTION_ANALYTICS_SQL,
  D1_INGESTION_MONTH_NAMES
} from '../constants/d1IngestionAnalytics';
import { D1_INGESTION_PAGE_SIZE } from '../constants/d1';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1Record } from '../types/d1';
import type {
  D1DocumentEnrichmentOptions,
  D1DocumentIngestionAnalytics,
  D1DocumentMaterialGroupSummary,
  D1DocumentMonthSummary,
  D1DocumentPlantSummary,
  D1EntityCountsRow
} from '../types/d1IngestionAnalytics';
import { queryD1Rows } from './workerD1Query';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';
import { validationRecordKeyRange } from '../utils/validationRecordKeys';
import { normalizeStoredIngestionRows } from '../workerD1';

const toCrores = (value: unknown): number => Number(Number(value).toFixed(2));

const toUsdMillions = (spendCr: number): number => {
  const inrTotal = spendCr * D1_INGESTION_ANALYTICS_LIMITS.inrPerCrore;
  const usdTotal = inrTotal / D1_INGESTION_ANALYTICS_LIMITS.usdFallbackRate;
  return Number((usdTotal / 1_000_000).toFixed(2));
};

const toSharePct = (partCr: number, totalCr: number): number =>
  totalCr > 0 ? Number(((partCr / totalCr) * 100).toFixed(1)) : 0;

const formatMonthLabel = (monthKey: string): string => {
  const [yearPart, monthPart] = monthKey.split('-');
  const label = D1_INGESTION_MONTH_NAMES[Number(monthPart) - 1];
  return label ? `${label} ${yearPart}` : monthKey;
};

const formatFiscalYear = (monthKey: string): string => {
  const [yearText, monthText] = monthKey.split('-');
  const yearNum = Number(yearText);
  const monthNum = Number(monthText);
  const fyYear = monthNum >= D1_INGESTION_ANALYTICS_LIMITS.fiscalYearStartMonth ? yearNum + 1 : yearNum;
  return `FY${String(fyYear).slice(-2)}`;
};

const buildMaterialGroups = (
  rows: D1Record[],
  totalSpendCr: number
): D1DocumentMaterialGroupSummary[] =>
  rows.map((row) => {
    const groupCode = String(row.group_code);
    const spendCr = toCrores(row.spend_inr_cr);
    const resolvedName = resolveHumanReadableCategory(null, groupCode);
    const groupName = resolvedName !== 'Unmapped Category'
      ? `${resolvedName} (${groupCode})`
      : groupCode === D1_INGESTION_ANALYTICS_LIMITS.unspecifiedGroupCode
        ? D1_INGESTION_ANALYTICS_LIMITS.unspecifiedGroupLabel
        : groupCode;
    const itemCount = Number(row.unique_items_count);
    const vendorsCount = Number(row.unique_vendors_count);
    return {
      group_code: groupCode,
      group_name: groupName,
      primary_segment: D1_INGESTION_ANALYTICS_LIMITS.defaultMaterialSegment,
      spend_inr_cr: spendCr,
      spend_usd_m: toUsdMillions(spendCr),
      share_pct: toSharePct(spendCr, totalSpendCr),
      records_count: Number(row.records_count),
      po_count: Number(row.po_count),
      unique_items_count: itemCount,
      unique_vendors_count: vendorsCount,
      item_count: itemCount,
      active_vendors_count: vendorsCount,
      sample_item: row.sample_item ? String(row.sample_item) : undefined,
      top_supplier: row.top_supplier ? String(row.top_supplier) : undefined,
      total_spend_inr_cr: spendCr
    };
  });

const buildPlantSummaries = (rows: D1Record[], totalSpendCr: number): D1DocumentPlantSummary[] =>
  rows.map((row) => {
    const plantCode = String(row.plant_code);
    const spendCr = toCrores(row.spend_inr_cr);
    const poCount = Number(row.po_count);
    const vendorsCount = Number(row.unique_vendors_count);
    return {
      plant_code: plantCode,
      plant_name: plantCode === D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantCode
        ? D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantLabel
        : plantCode,
      region: D1_INGESTION_ANALYTICS_LIMITS.defaultPlantRegion,
      location: D1_INGESTION_ANALYTICS_LIMITS.defaultPlantLocation,
      records_count: Number(row.records_count),
      po_count: poCount,
      total_po_count: poCount,
      spend_inr_cr: spendCr,
      spend_usd_m: toUsdMillions(spendCr),
      share_pct: toSharePct(spendCr, totalSpendCr),
      unique_items_count: Number(row.unique_items_count),
      unique_vendors_count: vendorsCount,
      active_vendors_count: vendorsCount,
      top_material_group: row.top_material_group
        ? String(row.top_material_group)
        : D1_INGESTION_ANALYTICS_LIMITS.defaultMaterialSegment
    };
  });

const buildMonthSummaries = (rows: D1Record[]): D1DocumentMonthSummary[] =>
  rows.map((row) => {
    const monthKey = String(row.month_key);
    const spendCr = toCrores(row.spend_inr_cr);
    const recordsCount = Number(row.records_count);
    const vendorsCount = Number(row.unique_vendors_count);
    return {
      month_key: monthKey,
      month_label: formatMonthLabel(monthKey),
      fiscal_year: formatFiscalYear(monthKey),
      spend_inr_cr: spendCr,
      spend_usd_m: toUsdMillions(spendCr),
      records_count: recordsCount,
      po_count: Number(row.po_count),
      line_items_count: recordsCount,
      vendors_count: vendorsCount,
      unique_items_count: Number(row.unique_items_count),
      unique_vendors_count: vendorsCount,
      top_material_group: row.top_material_group
        ? String(row.top_material_group)
        : D1_INGESTION_ANALYTICS_LIMITS.defaultMaterialSegment,
      top_plant: row.top_plant
        ? String(row.top_plant)
        : D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantCode
    };
  });

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

export const enrichSelectedDocumentIngestionResponse = async (
  db: CloudflareD1Database,
  tenantId: string,
  documentId: string,
  baseData: Record<string, unknown>,
  options: D1DocumentEnrichmentOptions
): Promise<Record<string, unknown>> => {
  const shouldLoadAnalytics = options.includeSummary && !options.validationCursor;
  const [availableRows, scopedValidation, documentAnalytics] = await Promise.all([
    queryD1Rows(
      db,
      D1_INGESTION_ANALYTICS_SQL.availableDocuments,
      [tenantId, D1_INGESTION_ANALYTICS_LIMITS.pageLimit],
      options.requestId
    ),
    loadDocumentScopedValidation(db, tenantId, documentId, options),
    shouldLoadAnalytics
      ? loadDocumentTransactionAnalytics(db, tenantId, documentId, options.requestId)
      : Promise.resolve(undefined)
  ]);

  const availableDocuments = normalizeStoredIngestionRows(availableRows.slice(0, D1_INGESTION_PAGE_SIZE), {
    tenantId,
    requestId: options.requestId
  });
  const basePagination = (baseData.pagination as Record<string, unknown> | undefined) ?? {};
  const baseSummary = baseData.summary as Record<string, unknown> | undefined;
  const selectedQueue = Array.isArray(baseData.queue) ? (baseData.queue as D1Record[]) : [];
  const selectedSpendCr = Number(selectedQueue[0]?.converted_inr_crores ?? 0);

  const summary = scopedValidation?.summaryMetrics && baseSummary
    ? buildScopedValidationSummary(
      scopedValidation.summaryMetrics,
      baseSummary,
      availableDocuments.length,
      selectedSpendCr
    )
    : baseSummary;

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
