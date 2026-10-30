/**
 * Certified figures for the Executive Brief. The CERTIFIED_* anchors mirror the RAW_* audit values that the
 * Express backend read from numericalAuditConstants. That module is not part of the Worker port, so the values
 * are declared here and checked against the presentation contract by the reconciliation service.
 */
import type { ExecutiveBriefValidationChecklist } from '../types/executiveBriefExportTypes';

export const INR_SYMBOL = '₹';
export const CRORE_UNIT_LABEL = 'Cr';
export const INR_PER_CRORE = 10000000;

export const CERTIFIED_TOTAL_SPEND_INR = 59203477681.66;
export const CERTIFIED_ADDRESSABLE_SPEND_INR = 49310000000;
export const CERTIFIED_GROSS_OPPORTUNITY_INR = 1731200000;
export const CERTIFIED_NET_DEFENSIBLE_INR = 936000000;
export const CERTIFIED_APPROVED_SAVINGS_INR = 479000000;
export const CERTIFIED_REALIZED_SAVINGS_INR = 680000000;
export const CERTIFIED_OPPORTUNITY_COUNT = 10;
export const CERTIFIED_CONFIDENCE_SUMMARY = {
  high: 7,
  medium: 3,
  low: 0,
  insufficient: 0
};
export const CERTIFIED_MODULES_INCLUDED: readonly string[] = ['Module 1', 'Module 2', 'Module 3', 'Module 4'];
export const CERTIFIED_SOURCE_DATA_VERSION = 'MODULE_1_4_CERTIFIED_V1.0';

/**
 * Attestations carried over from the certified pipeline. The Worker does not re-run Modules 1-4, so these
 * flags state the certified outcome. Only financialReconciliation is computed at request time.
 */
export const CERTIFIED_CHECKLIST_ATTESTATIONS: Omit<ExecutiveBriefValidationChecklist, 'financialReconciliation'> = {
  module1Validated: true,
  module2Validated: true,
  module3Validated: true,
  module4Validated: true,
  transactionTraceability: true,
  doubleCountingControls: true,
  dataLineage: true,
  securityControls: true,
  reportGenerationValidation: true
};

export const EXECUTIVE_BRIEF_STATUS_LABELS = {
  certified: 'CERTIFIED / READY',
  blocked: 'BLOCKED / VARIANCE DETECTED',
  confidentiality: 'CONFIDENTIAL - CLIENT USE ONLY'
} as const;

export const VARIANCE_DETECTED_MESSAGE = 'Financial reconciliation failure: Non-zero variance detected against certified ledger.';

export const CRORE_DECIMALS = 2;
export const THOUSANDS_SEPARATOR = ',';
export const THOUSANDS_SEPARATOR_REGEX = /\B(?=(\d{3})+(?!\d))/gu;
export const RECONCILIATION_TOLERANCE_INR = 0;
