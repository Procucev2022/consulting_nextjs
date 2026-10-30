import { D1_TABLES } from '../constants/d1';
import { categoryVendorRecordSchema } from '../constants/module2Persistence';
import type { CloudflareD1Database } from '../types/cloudflare';
import type {
  AlternateVendorIndexD1Row, AlternateVendorPoolCountD1Row, ParsedAlternateVendorCategory
} from '../types/module2AlternateSourcingD1';
import type { AlternateSourcingResult } from '../types/module2AlternateSourcing';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { AlternateSourcingQueryInput } from '../types/validation';
import logger from '../utils/logger';
import { queryD1Rows } from './workerD1Query';
import { buildAlternateSourcingResult, selectAlternateVendorCategoryKeys } from './workerD1AlternateSourcingProfiles';

const toCategory = (row: AlternateVendorIndexD1Row): ParsedAlternateVendorCategory => {
  const parsedPayload: unknown = JSON.parse(row.payload_json);
  const record = categoryVendorRecordSchema.parse(parsedPayload);
  return {
    categoryKey: row.category_key,
    categoryName: record.categoryName,
    distinctVendorCount: record.distinctVendorCount,
    stateCounts: record.stateCounts,
    topCities: record.topCities,
    contactMetrics: record.contactMetrics
  };
};

const distinctPoolCount = (row: AlternateVendorPoolCountD1Row | undefined): number | null => {
  if (!row) return null;
  const recordCount = Number(row.record_count);
  const count = Number(row.distinct_vendor_count);
  return Number.isFinite(recordCount) && recordCount > 0 && Number.isFinite(count) && count >= 0 ? count : null;
};

const loadDistinctPoolCount = async (
  db: CloudflareD1Database, categoryKeys: string[], requestId: string
): Promise<number | null> => {
  if (!categoryKeys.length) return null;
  const placeholders = categoryKeys.map(() => '?').join(', ');
  const rows = await queryD1Rows<AlternateVendorPoolCountD1Row>(db,
    'SELECT COUNT(DISTINCT vendor_norm) AS distinct_vendor_count, COUNT(*) AS record_count ' +
    `FROM ${D1_TABLES.alternateVendorCompany} WHERE category_key IN (${placeholders})`, categoryKeys, requestId);
  return distinctPoolCount(rows[0]);
};

export const loadAlternateSourcingResultFromD1 = async (
  db: CloudflareD1Database, assessmentId: string, transactions: StrategicInputTransaction[],
  options: AlternateSourcingQueryInput, requestId: string
): Promise<AlternateSourcingResult> => {
  const rows = await queryD1Rows<AlternateVendorIndexD1Row>(db,
    `SELECT category_key, payload_json FROM ${D1_TABLES.alternateVendors} ORDER BY category_name`, [], requestId);
  let categories: ParsedAlternateVendorCategory[];
  try {
    categories = rows.map(toCategory);
  } catch (error) {
    logger.error('D1 alternate vendor category data could not be parsed', { assessmentId, requestId }, error);
    throw error;
  }
  const categoryKeys = selectAlternateVendorCategoryKeys(transactions, categories);
  const poolCount = await loadDistinctPoolCount(db, categoryKeys, requestId);
  return buildAlternateSourcingResult(assessmentId, transactions, categories, poolCount, options);
};
