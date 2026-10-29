/**
 * Builds evidence workbooks (.xlsx) and the complete analysis package (.zip) from one snapshot, so
 * every file in a package reports the same numbers.
 */

import * as XLSX from 'xlsx';
import { EVIDENCE_ERROR_CATEGORIES, EVIDENCE_HTTP_STATUS, EVIDENCE_MESSAGES } from '../constants/evidenceMessages';
import {
  EVIDENCE_PACKAGE_FILENAME_PREFIX,
  EVIDENCE_PACKAGE_INDEX_FILENAME,
  EVIDENCE_SHEET_LABELS,
  EVIDENCE_WORKBOOK_FILENAMES,
  EVIDENCE_WORKBOOK_TYPES
} from '../constants/evidenceWorkbook';
import type {
  EvidenceGeneratedWorkbook,
  EvidencePackageExclusion,
  EvidencePackageFile,
  EvidenceSheet,
  EvidenceSnapshot,
  EvidenceWorkbookMeta,
  EvidenceWorkbookType,
  EvidenceZipEntry,
  ParityValidationSummary
} from '../types/evidenceWorkbook';
import { buildSavingsInventory, evaluateWorkbookAvailability } from './evidenceInventoryService';
import {
  buildBridgeSheet,
  buildDataVersionSheet,
  buildKpiReconciliationSheet,
  buildRunsSheet,
  buildValidationSheet,
  buildVersionDiffSheet
} from './evidenceGovernanceSheets';
import { buildParitySummary } from './evidenceParityService';
import { buildLedgerSheets, buildParitySheet, buildReadmeSheet, buildSummarySheet } from './evidenceSheetCommon';
import { EvidenceRequestError } from './evidenceRequestError';
import { buildStoredZip } from './evidenceZipWriter';

const buildTypeSheets = (
  type: EvidenceWorkbookType,
  snapshot: EvidenceSnapshot,
  parity: ParityValidationSummary
): EvidenceSheet[] => {
  switch (type) {
    case 'MODULE_1_EVIDENCE':
      return buildLedgerSheets(snapshot);
    case 'SAVINGS_ENGINE_EVIDENCE':
      return [buildBridgeSheet(snapshot)];
    case 'FINANCIAL_VALIDATION':
      return [buildValidationSheet(snapshot, parity)];
    case 'DATA_VERSION_DIFF':
      return [buildDataVersionSheet(snapshot), buildVersionDiffSheet(snapshot)];
    case 'MANAGEMENT_QUICK_SUMMARY_EVIDENCE':
      return [buildKpiReconciliationSheet(parity)];
    case 'ANALYSIS_RUN_CONTROL':
      return [buildRunsSheet(snapshot)];
    default:
      return [];
  }
};

export const buildWorkbookSheets = (
  type: EvidenceWorkbookType,
  snapshot: EvidenceSnapshot,
  meta: EvidenceWorkbookMeta
): EvidenceSheet[] => {
  const parity = buildParitySummary(snapshot, type, snapshot.generatedAt);
  return [
    buildReadmeSheet(type, snapshot, meta),
    buildSummarySheet(snapshot, parity),
    ...buildTypeSheets(type, snapshot, parity),
    buildParitySheet(parity)
  ];
};

export const encodeWorkbook = (sheets: readonly EvidenceSheet[]): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  }
  const output: unknown = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  if (!(output instanceof ArrayBuffer)) {
    throw new TypeError('XLSX encoder did not return an ArrayBuffer for the xlsx output type');
  }
  return new Uint8Array(output);
};

export const buildWorkbookFile = (
  type: EvidenceWorkbookType,
  snapshot: EvidenceSnapshot,
  meta: EvidenceWorkbookMeta
): EvidenceGeneratedWorkbook => {
  const availability = evaluateWorkbookAvailability(type, snapshot);
  if (!availability.isAvailable) {
    throw new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.CONFLICT,
      EVIDENCE_ERROR_CATEGORIES.CONFLICT,
      EVIDENCE_MESSAGES.workbookUnavailable(snapshot.jobId, availability.reason)
    );
  }
  const sheets = buildWorkbookSheets(type, snapshot, meta);
  return {
    type,
    filename: EVIDENCE_WORKBOOK_FILENAMES[type],
    bytes: encodeWorkbook(sheets),
    sheetCount: sheets.length
  };
};

const buildPackageIndex = (
  snapshot: EvidenceSnapshot,
  meta: EvidenceWorkbookMeta,
  included: readonly EvidenceGeneratedWorkbook[],
  excluded: readonly EvidencePackageExclusion[]
): string => [
  EVIDENCE_SHEET_LABELS.packageTitle,
  `${EVIDENCE_SHEET_LABELS.jobId}: ${snapshot.jobId}`,
  `${EVIDENCE_SHEET_LABELS.generatedAt}: ${meta.generatedAt}`,
  '',
  `${EVIDENCE_SHEET_LABELS.packageIncluded}:`,
  ...included.map((file) => `  ${file.filename}`),
  '',
  `${EVIDENCE_SHEET_LABELS.packageExcluded}:`,
  ...excluded.map((item) => `  ${item.filename}: ${item.reason}`)
].join('\n');

const collectExclusions = (snapshot: EvidenceSnapshot): EvidencePackageExclusion[] => {
  const workbookExclusions = EVIDENCE_WORKBOOK_TYPES.flatMap((type): EvidencePackageExclusion[] => {
    const availability = evaluateWorkbookAvailability(type, snapshot);
    if (availability.isAvailable) return [];
    return [{ filename: EVIDENCE_WORKBOOK_FILENAMES[type], reason: availability.reason }];
  });
  const savingsExclusions = buildSavingsInventory().map((item) => ({
    filename: item.filename,
    reason: item.description
  }));
  return [...workbookExclusions, ...savingsExclusions];
};

export const requiresLedgerDetail = (type: EvidenceWorkbookType, snapshot: EvidenceSnapshot): boolean =>
  type === 'MODULE_1_EVIDENCE' && snapshot.ledger.rowCount > 0;

export const buildEvidencePackage = (snapshot: EvidenceSnapshot, meta: EvidenceWorkbookMeta): EvidencePackageFile => {
  const included = EVIDENCE_WORKBOOK_TYPES
    .filter((type) => evaluateWorkbookAvailability(type, snapshot).isAvailable)
    .map((type) => buildWorkbookFile(type, snapshot, meta));
  if (included.length === 0) {
    throw new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.CONFLICT,
      EVIDENCE_ERROR_CATEGORIES.CONFLICT,
      EVIDENCE_MESSAGES.packageEmpty(snapshot.jobId)
    );
  }
  const excluded = collectExclusions(snapshot);
  const indexText = buildPackageIndex(snapshot, meta, included, excluded);
  const entries: EvidenceZipEntry[] = [
    ...included.map((file) => ({ name: file.filename, bytes: file.bytes })),
    { name: EVIDENCE_PACKAGE_INDEX_FILENAME, bytes: new TextEncoder().encode(indexText) }
  ];
  return {
    filename: `${EVIDENCE_PACKAGE_FILENAME_PREFIX}${snapshot.jobId}.zip`,
    bytes: buildStoredZip(entries, new Date(meta.generatedAt)),
    includedCount: included.length,
    excludedCount: excluded.length
  };
};
