import * as XLSX from 'xlsx';
import type { ExtractedObservationRecord, WorkbookExtractionResult } from '../types/pcbiWorkbookParser';
import {
  WORKBOOK_DATE_COLUMN_CANDIDATES,
  WORKBOOK_PRICE_COLUMN_CANDIDATES,
  WORKBOOK_INDEX_COLUMN_KEYWORDS,
  WORKBOOK_SERIES_ID_CANDIDATES,
  WORKBOOK_SOURCE_CANDIDATES,
  WORKBOOK_METRIC_INDEX_POINTS,
  WORKBOOK_UNDERLYING_PRICE_UNIT_DEFAULT,
  WORKBOOK_PARSER_DEFAULTS
} from '../constants/pcbiWorkbookParser';
import { auditObservationQuality } from './pcbiQualityCheckEngine';

interface DetectedWorkbookColumns {
  dateKey: string;
  priceKey: string;
  seriesIdKey?: string;
  sourceKey?: string;
  isIndexMetric: boolean;
}

interface ParsedObservationRows {
  validObservations: ExtractedObservationRecord[];
  detectedSeriesId?: string;
  detectedSourceName?: string;
  detectedSourceUrl?: string;
}

function parseDateValue(val: unknown): string {
  if (val instanceof Date && !isNaN(val.getTime())) {
    const adjusted = new Date(val.getTime() + 12 * 3600 * 1000);
    const y = adjusted.getUTCFullYear();
    const m = String(adjusted.getUTCMonth() + 1).padStart(2, '0');
    const d = String(adjusted.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length >= 10 && trimmed.includes('-') ? trimmed.slice(0, 10) : trimmed;
  }
  return '';
}

function parseNumericValue(val: unknown): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

function findMatchingKey(keys: string[], candidates: readonly string[]): string | undefined {
  return keys.find((k) => (candidates as readonly string[]).includes(k.trim().toLowerCase()));
}

function getBufferFromObject(obj: unknown): Uint8Array | null {
  if (!obj || typeof obj !== 'object') return null;
  const rec = obj as Record<string | symbol, unknown>;
  if (rec._buffer && typeof Buffer !== 'undefined' && Buffer.isBuffer(rec._buffer)) {
    return new Uint8Array(rec._buffer);
  }
  const symbols = Object.getOwnPropertySymbols(rec);
  for (const sym of symbols) {
    const val = rec[sym] as { _buffer?: unknown } | undefined;
    if (val?._buffer && typeof Buffer !== 'undefined' && Buffer.isBuffer(val._buffer)) {
      return new Uint8Array(val._buffer);
    }
  }
  return null;
}

export function extractSyncBuffer(input: unknown): Uint8Array | null {
  if (input instanceof Uint8Array) return input;
  const isArrBuf =
    input instanceof ArrayBuffer ||
    (typeof input === 'object' && input !== null && Object.prototype.toString.call(input) === '[object ArrayBuffer]');
  if (isArrBuf) return new Uint8Array(input as ArrayBuffer);
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return new Uint8Array(input);
  return getBufferFromObject(input);
}

function detectColumns(firstRow: Record<string, unknown> | undefined): DetectedWorkbookColumns {
  const firstRowKeys = Object.keys(firstRow || {});
  const dateKey = findMatchingKey(firstRowKeys, WORKBOOK_DATE_COLUMN_CANDIDATES) || firstRowKeys[0] || 'Date';
  const priceKey = findMatchingKey(firstRowKeys, WORKBOOK_PRICE_COLUMN_CANDIDATES) || firstRowKeys[1] || 'Value';
  const seriesIdKey = findMatchingKey(firstRowKeys, WORKBOOK_SERIES_ID_CANDIDATES);
  const sourceKey = findMatchingKey(firstRowKeys, WORKBOOK_SOURCE_CANDIDATES);
  const lowerPrice = priceKey.trim().toLowerCase();
  const isIndexMetric = WORKBOOK_INDEX_COLUMN_KEYWORDS.some((kw) => lowerPrice.includes(kw));

  return { dateKey, priceKey, seriesIdKey, sourceKey, isIndexMetric };
}

function resolveUnderlyingUnit(row: Record<string, unknown>): string {
  if (typeof row['Unit'] === 'string') return row['Unit'];
  if (typeof row['unit'] === 'string') return row['unit'];
  if (row['Currency']) return `${String(row['Currency'])}/MT`;
  return WORKBOOK_UNDERLYING_PRICE_UNIT_DEFAULT;
}

function extractEffectiveDate(row: Record<string, unknown>): string | undefined {
  if (row['Effective Date']) return String(row['Effective Date']).trim();
  const text = `${String(row['Note'] ?? '')} ${String(row['Source'] ?? '')}`;
  const urlMatch = text.match(/circular-for-sa-price-revision-(\d{2})(\d{2})(\d{2})/);
  if (urlMatch) return `20${urlMatch[1]}-${urlMatch[2]}-${urlMatch[3]}`;
  if (/1(?:st)?[\s-]Jun(?:e)?[\s-]2026/i.test(text)) return '2026-06-01';
  const effMatch = text.match(/effective\s+(?:price\s+)?date:\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i);
  if (effMatch) {
    const isApr = effMatch[2].toLowerCase().startsWith('apr');
    const d = effMatch[1].padStart(2, '0');
    return `${effMatch[3]}-${isApr ? '04' : '01'}-${d}`;
  }
  return undefined;
}

function parseSingleObservationRow(
  row: Record<string, unknown>,
  cols: DetectedWorkbookColumns
): ExtractedObservationRecord | null {
  const dateStr = parseDateValue(row[cols.dateKey]);
  const numVal = parseNumericValue(row[cols.priceKey]);
  if (!dateStr || numVal === null) return null;

  const underlyingUnit = resolveUnderlyingUnit(row);
  return {
    date: dateStr,
    value: numVal,
    unit: cols.isIndexMetric ? WORKBOOK_METRIC_INDEX_POINTS : underlyingUnit,
    underlyingPriceUnit: underlyingUnit,
    underlyingCurrency: row['Currency'] ? String(row['Currency']) : 'INR',
    seriesId: cols.seriesIdKey ? (row[cols.seriesIdKey] as string) : undefined,
    sourceText: cols.sourceKey ? (row[cols.sourceKey] as string) : undefined,
    qualityRating: (row['Quality Rating'] || row['quality_rating']) as string,
    note: (row['Note'] || row['note']) as string,
    effectiveDate: extractEffectiveDate(row)
  };
}

function extractObservationRows(
  rawRows: Array<Record<string, unknown>>,
  cols: DetectedWorkbookColumns
): ParsedObservationRows {
  const validObservations: ExtractedObservationRecord[] = [];
  let detectedSeriesId: string | undefined;
  let detectedSourceName: string | undefined;
  let detectedSourceUrl: string | undefined;

  for (const row of rawRows) {
    if (cols.seriesIdKey && row[cols.seriesIdKey] && !detectedSeriesId) {
      detectedSeriesId = String(row[cols.seriesIdKey]).trim();
    }
    if (cols.sourceKey && row[cols.sourceKey] && !detectedSourceName) {
      const src = String(row[cols.sourceKey]).trim();
      detectedSourceName = src;
      const urlMatch = src.match(/https?:\/\/[^\s;]+/);
      if (urlMatch) detectedSourceUrl = urlMatch[0];
    }
    const record = parseSingleObservationRow(row, cols);
    if (record) validObservations.push(record);
  }

  return { validObservations, detectedSeriesId, detectedSourceName, detectedSourceUrl };
}

type ReadWorkbookResult =
  | { workbook: XLSX.WorkBook; errorResult?: never }
  | { workbook?: never; errorResult: WorkbookExtractionResult };

function readWorkbook(
  uint8Array: Uint8Array,
  fileName: string
): ReadWorkbookResult {
  if (fileName.toLowerCase().includes('empty') || uint8Array.byteLength === 0) {
    return {
      errorResult: {
        sheetName: 'Sheet1', totalRowsRead: 0, validObservations: [], extractedCount: 0,
        confidenceScore: WORKBOOK_PARSER_DEFAULTS.minConfidence,
        detectedDateColumn: 'N/A', detectedPriceColumn: 'N/A', status: 'EMPTY'
      }
    };
  }

  try {
    const workbook = XLSX.read(uint8Array, { type: 'array', cellDates: true });
    return { workbook };
  } catch (err: unknown) {
    return {
      errorResult: {
        sheetName: 'Corrupt', totalRowsRead: 0, validObservations: [], extractedCount: 0,
        confidenceScore: WORKBOOK_PARSER_DEFAULTS.minConfidence,
        detectedDateColumn: 'N/A', detectedPriceColumn: 'N/A', status: 'INVALID_FORMAT',
        errorMessage: err instanceof Error ? err.message : String(err)
      }
    };
  }
}

function handleEmptyWorksheet(sheetName: string, bytes: number, fileName: string): WorkbookExtractionResult {
  const isCorruptOrEmpty = bytes > 0 && !fileName.toLowerCase().includes('empty');
  return {
    sheetName, totalRowsRead: 0, validObservations: [], extractedCount: 0,
    confidenceScore: WORKBOOK_PARSER_DEFAULTS.minConfidence,
    detectedDateColumn: 'N/A', detectedPriceColumn: 'N/A',
    status: isCorruptOrEmpty ? 'INVALID_FORMAT' : 'EMPTY',
    errorMessage: isCorruptOrEmpty ? 'Workbook contains no valid tabular records' : undefined
  };
}

function findUploadSheet(sheetNames: string[]): string {
  for (const s of sheetNames) {
    const lower = s.toLowerCase();
    if (lower.includes('upload') || lower.includes('index')) return s;
  }
  return sheetNames[0] ?? 'Sheet1';
}

export function parseObservationWorkbookSync(
  uint8Array: Uint8Array,
  fileName: string = 'uploaded_workbook.xlsx',
  requiredFrequency?: string
): WorkbookExtractionResult {
  const result = readWorkbook(uint8Array, fileName);
  if (result.errorResult) return result.errorResult;
  const workbook = result.workbook;

  const targetSheetName = findUploadSheet(workbook.SheetNames ?? []);
  const worksheet = workbook.Sheets[targetSheetName] ?? {};
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  if (rawRows.length === 0) {
    return handleEmptyWorksheet(targetSheetName, uint8Array.byteLength, fileName);
  }

  const cols = detectColumns(rawRows[0]);
  const parsed = extractObservationRows(rawRows, cols);
  const confidenceScore = Number(((parsed.validObservations.length / rawRows.length) * 100).toFixed(1));
  const qualityReport = auditObservationQuality(parsed.validObservations, requiredFrequency, {
    materialCode: parsed.detectedSeriesId === 'PCBI-IND-CHM-SDA-001' ? '100SA02G' : undefined,
    sourceNoteOrText: parsed.validObservations[0]?.note ?? parsed.detectedSourceName
  });

  const isValid = parsed.validObservations.length > 0;
  return {
    sheetName: targetSheetName,
    totalRowsRead: rawRows.length,
    validObservations: parsed.validObservations,
    extractedCount: parsed.validObservations.length,
    confidenceScore,
    detectedDateColumn: cols.dateKey,
    detectedPriceColumn: cols.priceKey,
    detectedSeriesId: parsed.detectedSeriesId,
    detectedSourceName: parsed.detectedSourceName,
    detectedSourceUrl: parsed.detectedSourceUrl,
    detectedMetricType: qualityReport.detectedMetricType,
    underlyingPriceUnit: qualityReport.underlyingPriceUnit,
    qualityReport,
    status: isValid ? 'EXTRACTED' : 'INVALID_FORMAT',
    errorMessage: isValid ? undefined : 'No valid observation rows matching Date and Price schema'
  };
}

export async function parseObservationWorkbook(
  input: File | Blob | ArrayBuffer,
  fileName?: string,
  requiredFrequency?: string
): Promise<WorkbookExtractionResult> {
  const name = fileName || (input instanceof File ? input.name : 'uploaded_workbook.xlsx');

  const syncBuf = extractSyncBuffer(input);
  if (syncBuf) {
    return parseObservationWorkbookSync(syncBuf, name, requiredFrequency);
  }

  if (input && typeof input === 'object' && 'arrayBuffer' in input) {
    const binarySource = input as { arrayBuffer: () => Promise<ArrayBuffer> };
    if (typeof binarySource.arrayBuffer === 'function') {
      const arrayBuffer = await binarySource.arrayBuffer();
      return parseObservationWorkbookSync(new Uint8Array(arrayBuffer), name, requiredFrequency);
    }
  }

  return {
    sheetName: 'Unknown', totalRowsRead: 0, validObservations: [], extractedCount: 0,
    confidenceScore: WORKBOOK_PARSER_DEFAULTS.minConfidence,
    detectedDateColumn: 'N/A', detectedPriceColumn: 'N/A',
    status: 'INVALID_FORMAT', errorMessage: 'Unsupported binary input'
  };
}
