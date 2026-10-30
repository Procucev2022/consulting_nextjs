/**
 * Inventory of evidence workbooks and savings-type workbooks for one job.
 * A type is available only when D1 holds the rows it needs. Otherwise the item is listed with
 * isAvailable=false, sheetCount=0, and the reason in description.
 */

import { EVIDENCE_MESSAGES } from '../constants/evidenceMessages';
import {
  EVIDENCE_REQUIRED_ROLE,
  EVIDENCE_SAVINGS_METADATA,
  EVIDENCE_SAVINGS_TYPES,
  EVIDENCE_STATIC_UNAVAILABLE_REASONS,
  EVIDENCE_WORKBOOK_DESCRIPTIONS,
  EVIDENCE_WORKBOOK_FILENAMES,
  EVIDENCE_WORKBOOK_SHEETS,
  EVIDENCE_WORKBOOK_TITLES,
  EVIDENCE_WORKBOOK_TYPES
} from '../constants/evidenceWorkbook';
import type {
  CanonicalSavingsType,
  EvidenceAvailability,
  EvidenceInventoryItem,
  EvidenceSnapshot,
  EvidenceWorkbookType,
  SavingsTypeEvidenceInventoryItem
} from '../types/evidenceWorkbook';

const requirementReason = (satisfied: boolean, reason: string): string | null => (satisfied ? null : reason);

const ledgerAndRunReason = (snapshot: EvidenceSnapshot): string | null => {
  if (snapshot.ledger.rowCount === 0) return EVIDENCE_MESSAGES.ledgerEmpty(snapshot.jobId);
  return requirementReason(snapshot.activeRun !== null, EVIDENCE_MESSAGES.noApprovedRun(snapshot.jobId));
};

const dataUnavailableReason = (type: EvidenceWorkbookType, snapshot: EvidenceSnapshot): string | null => {
  const { jobId } = snapshot;
  switch (type) {
    case 'MODULE_1_EVIDENCE':
      return requirementReason(snapshot.ledger.rowCount > 0, EVIDENCE_MESSAGES.ledgerEmpty(jobId));
    case 'MODULE_2_EVIDENCE':
      return EVIDENCE_STATIC_UNAVAILABLE_REASONS.MODULE_2_EVIDENCE;
    case 'PCBI_EVIDENCE':
      return EVIDENCE_STATIC_UNAVAILABLE_REASONS.PCBI_EVIDENCE;
    case 'SAVINGS_ENGINE_EVIDENCE':
      return requirementReason(snapshot.activeRun !== null, EVIDENCE_MESSAGES.noApprovedRun(jobId));
    case 'FINANCIAL_VALIDATION':
    case 'MANAGEMENT_QUICK_SUMMARY_EVIDENCE':
      return ledgerAndRunReason(snapshot);
    case 'DATA_VERSION_DIFF':
      return requirementReason(snapshot.activeVersion !== null, EVIDENCE_MESSAGES.noDataVersion(jobId));
    case 'REPORT_EVIDENCE':
      return EVIDENCE_STATIC_UNAVAILABLE_REASONS.REPORT_EVIDENCE;
    case 'ANALYSIS_RUN_CONTROL':
      return requirementReason(snapshot.runs.length > 0, EVIDENCE_MESSAGES.noAnalysisRuns(jobId));
  }
};

export const evaluateWorkbookAvailability = (
  type: EvidenceWorkbookType,
  snapshot: EvidenceSnapshot
): EvidenceAvailability => {
  const reason = dataUnavailableReason(type, snapshot);
  return reason === null ? { isAvailable: true } : { isAvailable: false, reason };
};

export const buildEvidenceInventory = (snapshot: EvidenceSnapshot): EvidenceInventoryItem[] =>
  EVIDENCE_WORKBOOK_TYPES.map((type) => {
    const availability = evaluateWorkbookAvailability(type, snapshot);
    return {
      type,
      filename: EVIDENCE_WORKBOOK_FILENAMES[type],
      title: EVIDENCE_WORKBOOK_TITLES[type],
      description: availability.isAvailable ? EVIDENCE_WORKBOOK_DESCRIPTIONS[type] : availability.reason,
      sheetCount: availability.isAvailable ? EVIDENCE_WORKBOOK_SHEETS[type].length : 0,
      isAvailable: availability.isAvailable,
      requiredRole: EVIDENCE_REQUIRED_ROLE.WORKBOOK
    };
  });

export const savingsUnavailableReason = (type: CanonicalSavingsType): string => {
  const metadata = EVIDENCE_SAVINGS_METADATA[type];
  return EVIDENCE_MESSAGES.savingsTypeUnavailable(
    metadata.title,
    metadata.initiativeId,
    EVIDENCE_WORKBOOK_FILENAMES.SAVINGS_ENGINE_EVIDENCE
  );
};

export const buildSavingsInventory = (savingsType?: CanonicalSavingsType): SavingsTypeEvidenceInventoryItem[] => {
  const selected: readonly CanonicalSavingsType[] = savingsType === undefined ? EVIDENCE_SAVINGS_TYPES : [savingsType];
  return selected.map((type) => {
    const metadata = EVIDENCE_SAVINGS_METADATA[type];
    return {
      savingsType: type,
      initiativeId: metadata.initiativeId,
      filename: metadata.filename,
      title: metadata.title,
      description: savingsUnavailableReason(type),
      classificationNote: metadata.description,
      netAmountCr: 0,
      sheetCount: 0,
      isAvailable: false,
      requiredRole: EVIDENCE_REQUIRED_ROLE.SAVINGS
    };
  });
};
