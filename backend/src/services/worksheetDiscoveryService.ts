/**
 * Dynamic Worksheet Discovery Service
 * 
 * Inspects, classifies, and selects transaction worksheets across heterogeneous
 * procurement workbooks without relying on hardcoded sheet positions or names.
 */

import * as XLSX from 'xlsx';
import type {
  WorksheetInspectionResult,
  WorkbookDiscoveryResult
} from '../types/worksheetDiscovery';
import { CONFIDENCE_THRESHOLDS } from '../constants/schemaMatching';
import { GenericSchemaMatcher } from './genericSchemaMatcher';
import {
  classifyNonTransactionSheet,
  classifyByFieldSignatures
} from './worksheetClassifier';

interface DiscoveredHeaderRow {
  bestHeaderRowIndex: number;
  bestHeaders: string[];
  bestMatchedFields: string[];
}

function findBestHeaderRow(
  ws: XLSX.WorkSheet,
  totalRowsInRange: number,
  range: XLSX.Range
): DiscoveredHeaderRow {
  const scanLimit = Math.min(15, totalRowsInRange);
  const rawMatrix: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    range: { s: { r: range.s.r, c: range.s.c }, e: { r: range.s.r + scanLimit - 1, c: range.e.c } },
    defval: null
  });

  let bestHeaderRowIndex = 0;
  let bestHeaderScore = -1;
  let bestHeaders: string[] = [];
  let bestMatchedFields: string[] = [];

  rawMatrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) return;
    const rowStrings = row.map((cell) => (cell != null ? String(cell).trim() : ''));
    const populatedStrings = rowStrings.filter((s) => s.length > 0);
    if (populatedStrings.length < 2) return;

    const matchResult = GenericSchemaMatcher.matchSchema(rowStrings);
    const matchedCount = matchResult.mappedFieldNames.length;
    const mandatoryMatchedCount = matchResult.mappedFieldNames.filter(
      (f) => f === 'vendorName' || f === 'documentDate' || f === 'netSpendAmount'
    ).length;

    const score = mandatoryMatchedCount * 4 + matchedCount * 2 + Math.min(populatedStrings.length, 10);
    if (score > bestHeaderScore) {
      bestHeaderScore = score;
      bestHeaderRowIndex = rowIndex;
      bestHeaders = rowStrings;
      bestMatchedFields = matchResult.mappedFieldNames;
    }
  });

  return { bestHeaderRowIndex, bestHeaders, bestMatchedFields };
}

function resolveDominantCandidate(
  candidateSheets: WorksheetInspectionResult[]
): { leader: WorksheetInspectionResult; isDominant: boolean } {
  candidateSheets.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.totalRows - a.totalRows;
  });

  const leader = candidateSheets[0];
  const runnerUp = candidateSheets[1];
  const confidenceDiff = leader.confidence - runnerUp.confidence;
  const rowRatio = runnerUp.totalRows > 0 ? leader.totalRows / runnerUp.totalRows : leader.totalRows;

  const isDominant =
    confidenceDiff >= CONFIDENCE_THRESHOLDS.AUTO_SELECT_CLEAR_WINNER_DIFF ||
    (leader.confidence >= 0.85 &&
      rowRatio >= CONFIDENCE_THRESHOLDS.DOMINANT_ROW_COUNT_RATIO &&
      runnerUp.totalRows < 100);

  return { leader, isDominant };
}

export class WorksheetDiscoveryService {
  /**
   * Evaluates all worksheets in a workbook and determines candidate transaction sheets.
   */
  public static discoverWorksheets(
    wb: XLSX.WorkBook,
    preferredSheetName?: string
  ): WorkbookDiscoveryResult {
    if (!wb?.SheetNames?.length) {
      return {
        inspectedSheets: [],
        selectedSheetName: null,
        selectionStatus: 'NO_USABLE_SHEET',
        selectionReason: 'Workbook contains no worksheets or is an unreadable structure.',
        candidateSheets: [],
        requiresAnalystSelection: false
      };
    }

    const inspectedSheets = wb.SheetNames.map((name) => this.inspectSingleSheet(wb.Sheets[name], name));

    if (preferredSheetName && wb.SheetNames.includes(preferredSheetName)) {
      return {
        inspectedSheets,
        selectedSheetName: preferredSheetName,
        selectionStatus: 'USER_SELECTED',
        selectionReason: `Analyst explicitly selected worksheet '${preferredSheetName}'.`,
        candidateSheets: inspectedSheets.filter((s) => s.isCandidate).map((s) => s.sheetName),
        requiresAnalystSelection: false
      };
    }

    const candidateSheets = inspectedSheets.filter((s) => s.isCandidate);
    if (candidateSheets.length === 0) {
      return {
        inspectedSheets,
        selectedSheetName: null,
        selectionStatus: 'NO_USABLE_SHEET',
        selectionReason: 'No worksheet in the workbook contained recognizable procurement transaction data.',
        candidateSheets: [],
        requiresAnalystSelection: false
      };
    }

    if (candidateSheets.length === 1) {
      const single = candidateSheets[0];
      return {
        inspectedSheets,
        selectedSheetName: single.sheetName,
        selectionStatus: 'AUTO_SELECTED',
        selectionReason: `Worksheet '${single.sheetName}' uniquely matched transaction data (${single.totalRows.toLocaleString()} rows, confidence ${(single.confidence * 100).toFixed(0)}%).`,
        candidateSheets: [single.sheetName],
        requiresAnalystSelection: false
      };
    }

    const { leader, isDominant } = resolveDominantCandidate(candidateSheets);
    if (isDominant) {
      return {
        inspectedSheets,
        selectedSheetName: leader.sheetName,
        selectionStatus: 'AUTO_SELECTED',
        selectionReason: `Worksheet '${leader.sheetName}' selected as dominant transaction source (${leader.totalRows.toLocaleString()} rows).`,
        candidateSheets: candidateSheets.map((s) => s.sheetName),
        requiresAnalystSelection: false
      };
    }

    return {
      inspectedSheets,
      selectedSheetName: null,
      selectionStatus: 'AMBIGUOUS',
      selectionReason: `Multiple candidate transaction worksheets detected (${candidateSheets.map((s) => `'${s.sheetName}'`).join(', ')}). Analyst selection required.`,
      candidateSheets: candidateSheets.map((s) => s.sheetName),
      requiresAnalystSelection: true
    };
  }

  /**
   * Deeply inspects an individual worksheet.
   */
  public static inspectSingleSheet(ws: XLSX.WorkSheet, sheetName: string): WorksheetInspectionResult {
    if (!ws?.['!ref']) {
      return {
        sheetName,
        totalRows: 0,
        totalColumns: 0,
        headerRowIndex: 0,
        headers: [],
        classification: 'EMPTY',
        confidence: 0,
        isCandidate: false,
        matchedCanonicalFields: [],
        reasons: ['Worksheet is empty or has no range reference.']
      };
    }

    const range = XLSX.utils.decode_range(ws['!ref']);
    const totalRowsInRange = range.e.r - range.s.r + 1;
    const totalColsInRange = range.e.c - range.s.c + 1;

    if (totalRowsInRange < 2) {
      return {
        sheetName,
        totalRows: totalRowsInRange,
        totalColumns: totalColsInRange,
        headerRowIndex: 0,
        headers: [],
        classification: 'EMPTY',
        confidence: 0,
        isCandidate: false,
        matchedCanonicalFields: [],
        reasons: ['Worksheet has fewer than 2 rows.']
      };
    }

    const { bestHeaderRowIndex, bestHeaders, bestMatchedFields } = findBestHeaderRow(ws, totalRowsInRange, range);
    const dataRowCount = Math.max(0, totalRowsInRange - (bestHeaderRowIndex + 1));

    const nonTxResult = classifyNonTransactionSheet(sheetName);
    const outcome = nonTxResult || classifyByFieldSignatures(bestMatchedFields, dataRowCount, totalColsInRange);

    const isCandidate =
      outcome.classification === 'TRANSACTION_TABLE' &&
      outcome.confidence >= CONFIDENCE_THRESHOLDS.MIN_TRANSACTION_CONFIDENCE &&
      dataRowCount >= 1;

    return {
      sheetName,
      totalRows: dataRowCount,
      totalColumns: totalColsInRange,
      headerRowIndex: bestHeaderRowIndex,
      headers: bestHeaders,
      classification: outcome.classification,
      confidence: outcome.confidence,
      isCandidate,
      matchedCanonicalFields: bestMatchedFields,
      reasons: [outcome.reason]
    };
  }

  /**
   * Extracts raw row objects from a designated worksheet using the discovered header row.
   */
  public static extractRowsFromSheet(
    ws: XLSX.WorkSheet,
    headerRowIndex = 0
  ): { headers: string[]; rows: Record<string, unknown>[] } {
    if (!ws?.['!ref']) {
      return { headers: [], rows: [] };
    }

    const range = XLSX.utils.decode_range(ws['!ref']);
    const rawMatrix: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      range: { s: { r: range.s.r + headerRowIndex, c: range.s.c }, e: range.e },
      defval: null
    });

    if (rawMatrix.length < 2) {
      return { headers: [], rows: [] };
    }

    const rawHeaderRow = (rawMatrix[0] as unknown[]) || [];
    const headers = rawHeaderRow.map((c, i) => (c != null && String(c).trim().length > 0 ? String(c) : `_COL_${i}`));

    const rows: Record<string, unknown>[] = [];
    for (let r = 1; r < rawMatrix.length; r++) {
      const rowArr = (rawMatrix[r] as unknown[]) || [];
      const hasAnyVal = rowArr.some((c) => c !== null && c !== undefined && String(c).trim().length > 0);
      if (!hasAnyVal) continue;

      const obj: Record<string, unknown> = {};
      headers.forEach((h, colIdx) => {
        obj[h] = rowArr[colIdx] ?? null;
      });
      rows.push(obj);
    }

    return { headers, rows };
  }
}
