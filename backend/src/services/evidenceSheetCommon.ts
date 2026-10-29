/**
 * Shared workbook sheets: README, SUMMARY, PARITY, and the ledger sheets (spend by supplier, plant,
 * and material group, plus capped transaction rows). Every value comes from the snapshot.
 */

import { EVIDENCE_TOLERANCE } from '../constants/evidenceParity';
import {
  EVIDENCE_CALCULATION_SOURCE,
  EVIDENCE_DISCLAIMER,
  EVIDENCE_SHEET_HEADERS,
  EVIDENCE_SHEET_LABELS,
  EVIDENCE_SHEET_NAMES,
  EVIDENCE_WORKBOOK_FILENAMES,
  EVIDENCE_WORKBOOK_TITLES
} from '../constants/evidenceWorkbook';
import type {
  EvidenceCell,
  EvidenceGroupRecord,
  EvidenceLedgerDetail,
  EvidenceLedgerRecord,
  EvidenceSheet,
  EvidenceSnapshot,
  EvidenceWorkbookMeta,
  EvidenceWorkbookType,
  ParityCheckResult,
  ParityValidationSummary
} from '../types/evidenceWorkbook';

export const orBlank = (value: EvidenceCell | null): EvidenceCell => value ?? '';

export const yesNo = (flag: boolean): string => (flag ? EVIDENCE_SHEET_LABELS.yes : EVIDENCE_SHEET_LABELS.no);

export const requireLedgerDetail = (snapshot: EvidenceSnapshot): EvidenceLedgerDetail => {
  if (snapshot.detail === null) {
    throw new Error(`Ledger detail was not loaded for job ${snapshot.jobId} before workbook generation`);
  }
  return snapshot.detail;
};

export const buildReadmeSheet = (
  type: EvidenceWorkbookType,
  snapshot: EvidenceSnapshot,
  meta: EvidenceWorkbookMeta
): EvidenceSheet => {
  const rows: EvidenceCell[][] = [
    [...EVIDENCE_SHEET_HEADERS.README],
    [EVIDENCE_SHEET_LABELS.workbook, type],
    [EVIDENCE_SHEET_LABELS.title, EVIDENCE_WORKBOOK_TITLES[type]],
    [EVIDENCE_SHEET_LABELS.filename, EVIDENCE_WORKBOOK_FILENAMES[type]],
    [EVIDENCE_SHEET_LABELS.jobId, snapshot.jobId],
    [EVIDENCE_SHEET_LABELS.customer, snapshot.assessment.customerName],
    [EVIDENCE_SHEET_LABELS.tenant, snapshot.tenantId],
    [EVIDENCE_SHEET_LABELS.dataVersion, snapshot.activeVersion?.dataVersionId ?? EVIDENCE_SHEET_LABELS.notRecorded],
    [EVIDENCE_SHEET_LABELS.analysisRun, snapshot.activeRun?.analysisRunId ?? EVIDENCE_SHEET_LABELS.notRecorded],
    [EVIDENCE_SHEET_LABELS.generatedAt, meta.generatedAt],
    [EVIDENCE_SHEET_LABELS.generatedBy, meta.generatedBy],
    [EVIDENCE_SHEET_LABELS.source, EVIDENCE_CALCULATION_SOURCE],
    [EVIDENCE_SHEET_LABELS.ledgerRows, snapshot.ledger.rowCount],
    [EVIDENCE_SHEET_LABELS.ledgerSpend, snapshot.ledger.totalCr],
    [EVIDENCE_SHEET_LABELS.disclaimer, EVIDENCE_DISCLAIMER]
  ];
  if (snapshot.detail !== null) {
    rows.push([
      EVIDENCE_SHEET_LABELS.transactionRows,
      `${snapshot.detail.sample.length} of ${snapshot.ledger.rowCount}`
    ]);
    rows.push([EVIDENCE_SHEET_LABELS.transactionCap, snapshot.detail.sampleLimit]);
  }
  return { name: EVIDENCE_SHEET_NAMES.README, rows };
};

export const buildSummarySheet = (snapshot: EvidenceSnapshot, parity: ParityValidationSummary): EvidenceSheet => {
  const rows: EvidenceCell[][] = [
    [...EVIDENCE_SHEET_HEADERS.SUMMARY_METRIC],
    [EVIDENCE_SHEET_LABELS.ledgerRows, snapshot.ledger.rowCount],
    [EVIDENCE_SHEET_LABELS.ledgerSpend, snapshot.ledger.totalCr],
    [EVIDENCE_SHEET_LABELS.dataVersion, parity.dataVersionId],
    [EVIDENCE_SHEET_LABELS.parityStatus, parity.overallStatus],
    [EVIDENCE_SHEET_LABELS.checksPassed, parity.passedChecks],
    [EVIDENCE_SHEET_LABELS.checksFailed, parity.failedChecks],
    [],
    [...EVIDENCE_SHEET_HEADERS.KPI]
  ];
  for (const check of parity.checks) {
    rows.push(parityCheckRow(check));
  }
  return { name: EVIDENCE_SHEET_NAMES.SUMMARY, rows };
};

export const buildParitySheet = (parity: ParityValidationSummary): EvidenceSheet => {
  const rows: EvidenceCell[][] = [[...EVIDENCE_SHEET_HEADERS.PARITY]];
  for (const check of parity.checks) {
    rows.push([
      check.kpi,
      check.uiValue,
      check.evidenceValue,
      check.sourceValue,
      check.unit,
      check.variance,
      check.tolerance,
      check.status,
      check.supportingSheet,
      check.notes
    ]);
  }
  return { name: EVIDENCE_SHEET_NAMES.PARITY, rows };
};

const shareOfLedger = (group: EvidenceGroupRecord, ledgerTotalCr: number): number =>
  ledgerTotalCr > 0
    ? Number(((group.totalCr / ledgerTotalCr) * 100).toFixed(EVIDENCE_TOLERANCE.VARIANCE_DECIMALS))
    : 0;

const buildGroupSheet = (
  name: string,
  groups: readonly EvidenceGroupRecord[],
  ledgerTotalCr: number
): EvidenceSheet => {
  const rows: EvidenceCell[][] = [[...EVIDENCE_SHEET_HEADERS.GROUP]];
  for (const group of groups) {
    rows.push([group.groupKey, group.rowCount, group.totalCr, shareOfLedger(group, ledgerTotalCr)]);
  }
  return { name, rows };
};

const buildTransactionRow = (record: EvidenceLedgerRecord): EvidenceCell[] => [
  record.transactionId,
  orBlank(record.sourceRowNumber),
  orBlank(record.poNumber),
  orBlank(record.poLine),
  orBlank(record.documentDateRaw),
  orBlank(record.supplierName),
  orBlank(record.materialCode),
  orBlank(record.shortText),
  orBlank(record.materialGroup),
  orBlank(record.plant),
  orBlank(record.orderQuantity),
  orBlank(record.orderUnit),
  orBlank(record.netPrice),
  orBlank(record.currency),
  orBlank(record.totalInrRaw),
  orBlank(record.totalInCrRaw)
];

const buildTransactionSheet = (detail: EvidenceLedgerDetail): EvidenceSheet => {
  const rows: EvidenceCell[][] = [[...EVIDENCE_SHEET_HEADERS.TRANSACTION]];
  for (const record of detail.sample) {
    rows.push(buildTransactionRow(record));
  }
  return { name: EVIDENCE_SHEET_NAMES.TRANSACTIONS, rows };
};

export const buildLedgerSheets = (snapshot: EvidenceSnapshot): EvidenceSheet[] => {
  const detail = requireLedgerDetail(snapshot);
  const ledgerTotalCr = snapshot.ledger.totalCr;
  return [
    buildGroupSheet(EVIDENCE_SHEET_NAMES.SUPPLIER_SPEND, detail.suppliers, ledgerTotalCr),
    buildGroupSheet(EVIDENCE_SHEET_NAMES.PLANT_SPEND, detail.plants, ledgerTotalCr),
    buildGroupSheet(EVIDENCE_SHEET_NAMES.MATERIAL_GROUPS, detail.materialGroups, ledgerTotalCr),
    buildTransactionSheet(detail)
  ];
};

export const parityCheckRow = (check: ParityCheckResult): EvidenceCell[] => [
  check.kpi,
  check.uiValue,
  check.evidenceValue,
  check.sourceValue,
  check.unit,
  check.status
];
