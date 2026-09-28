/**
 * PCBI Worksheet Detection, Column Auto-Mapping & Date Utilities
 */

import {
  PCBI_TARGET_FIELDS,
  PCBI_WORKSHEET_PURPOSE_LABELS
} from '../constants/pcbiAdmin';
import type {
  PCBIWorksheetType,
  PCBIWorksheetDetection,
  PCBIColumnMapping
} from '../types/pcbiAdmin';

export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseExcelDate(val: unknown): string | null {
  if (typeof val === 'number' && !isNaN(val) && val > 0) {
    // Excel epoch offset (considering 1900 leap year bug: 25569 days between 1900-01-01 and 1970-01-01)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const trimmed = val.trim();
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return null;
}

const SHEET_NAME_PATTERNS: Array<{
  match: (n: string) => boolean;
  type: PCBIWorksheetType;
  confidence: number;
}> = [
  { match: (n) => n.includes('weekly index') || n.includes('weekly_index') || n.includes('weekly'), type: 'WEEKLY_INDEX', confidence: 95 },
  { match: (n) => n.includes('constituent') || n.includes('cost driver') || n.includes('raw material'), type: 'CONSTITUENTS', confidence: 95 },
  { match: (n) => n.includes('benchmark master') || n.includes('pcbi master') || n === 'pcbi_master' || n === 'benchmark_master', type: 'PCBI_MASTER', confidence: 95 },
  { match: (n) => n.includes('source') || n.includes('registry'), type: 'SOURCES', confidence: 90 },
  { match: (n) => n.includes('unspsc') || n.includes('duplicate') || n.includes('mapping'), type: 'UNSPSC_MAPPING', confidence: 85 }
];

function detectByName(normName: string): { type: PCBIWorksheetType; confidence: number } | null {
  for (const p of SHEET_NAME_PATTERNS) {
    if (p.match(normName)) {
      return { type: p.type, confidence: p.confidence };
    }
  }
  return null;
}

function detectByHeaders(normHeaders: string[]): { type: PCBIWorksheetType; confidence: number } | null {
  const hasWeekStart = normHeaders.some((h) => h.includes('week start') || h.includes('week_start') || h === 'date');
  const hasIndexVal = normHeaders.some((h) => h.includes('index value') || h.includes('index_val') || h === 'index');
  if (hasWeekStart && hasIndexVal) {
    return { type: 'WEEKLY_INDEX', confidence: 90 };
  }

  const hasConstituent = normHeaders.some((h) => h.includes('constituent') || h.includes('cost driver') || h.includes('raw material'));
  if (hasConstituent) {
    return { type: 'CONSTITUENTS', confidence: 88 };
  }

  const hasSourceFamily = normHeaders.some((h) => h.includes('source family') || h.includes('pcbi use'));
  if (hasSourceFamily) {
    return { type: 'SOURCES', confidence: 90 };
  }

  const hasCanonical = normHeaders.some((h) => h.includes('canonical benchmark key') || h.includes('unspsc'));
  const hasSector = normHeaders.some((h) => h.includes('sector') || h.includes('mapping'));
  if (hasCanonical && hasSector) {
    return { type: 'UNSPSC_MAPPING', confidence: 85 };
  }

  const hasPcbiId = normHeaders.some((h) => h.includes('pcbi id'));
  const hasCategory = normHeaders.some((h) => h.includes('category') || h.includes('benchmark'));
  if (hasPcbiId && hasCategory) {
    return { type: 'PCBI_MASTER', confidence: 85 };
  }

  return null;
}

export function detectSheetType(sheetName: string, headers: string[]): { type: PCBIWorksheetType; confidence: number } {
  const normName = normalizeHeader(sheetName);
  const byName = detectByName(normName);
  if (byName) return byName;

  const normHeaders = headers.map(normalizeHeader);
  const byHeaders = detectByHeaders(normHeaders);
  if (byHeaders) return byHeaders;

  const isInformational = normName.includes('readme') || normName.includes('coverage');
  return { type: 'OTHER', confidence: isInformational ? 75 : 50 };
}

export function detectWorksheets(
  sheetNames: string[],
  sheetDataMap: Record<string, Record<string, unknown>[]>
): PCBIWorksheetDetection[] {
  return sheetNames.map((name) => {
    const rows = sheetDataMap[name] || [];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const { type, confidence } = detectSheetType(name, headers);

    return {
      sheetName: name,
      detectedType: type,
      purposeLabel: PCBI_WORKSHEET_PURPOSE_LABELS[type],
      rowCount: rows.length,
      columnCount: headers.length,
      headers,
      confidence
    };
  });
}

function findBestFieldMatch(
  normCol: string,
  targetType: Exclude<PCBIWorksheetType, 'OTHER' | 'IGNORE'>
): { field: string; label: string; isRequired: boolean; confidence: number } | null {
  const fields = PCBI_TARGET_FIELDS[targetType] || [];

  for (const f of fields) {
    for (const alias of f.aliases) {
      const normAlias = normalizeHeader(alias);
      if (normCol === normAlias) {
        return { field: f.field, label: f.label, isRequired: f.isRequired, confidence: 100 };
      }
    }
  }

  for (const f of fields) {
    for (const alias of f.aliases) {
      const normAlias = normalizeHeader(alias);
      if (normCol.includes(normAlias) || normAlias.includes(normCol)) {
        return { field: f.field, label: f.label, isRequired: f.isRequired, confidence: 80 };
      }
    }
  }

  return null;
}

export function autoMapColumns(
  sheetType: PCBIWorksheetType,
  columns: string[],
  sampleRows: Record<string, unknown>[]
): PCBIColumnMapping[] {
  if (sheetType === 'OTHER' || sheetType === 'IGNORE') {
    return [];
  }

  const mappedSet = new Set<string>();

  return columns.map((col) => {
    const normCol = normalizeHeader(col);
    const match = findBestFieldMatch(normCol, sheetType);

    const sampleValues = sampleRows
      .slice(0, 3)
      .map((r) => String(r[col] ?? ''))
      .filter((v) => v !== '');

    if (match && !mappedSet.has(match.field)) {
      mappedSet.add(match.field);
      return {
        excelColumn: col,
        mappedField: match.field,
        fieldLabel: match.label,
        isRequired: match.isRequired,
        confidence: match.confidence,
        status: 'MAPPED',
        sampleValues
      };
    }

    return {
      excelColumn: col,
      mappedField: '',
      fieldLabel: 'Unmapped',
      isRequired: false,
      confidence: 0,
      status: 'OPTIONAL',
      sampleValues
    };
  });
}
