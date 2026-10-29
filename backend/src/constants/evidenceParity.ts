/**
 * Parity check definitions. Each check compares three values for one KPI:
 * the UI value (AssessmentRecord), the evidence value (recomputed from the ledger or the bridge),
 * and the source value (the approved AssessmentAnalysisRun).
 */

import type { EvidenceParityCheckDefinition } from '../types/evidenceWorkbook';
import { EVIDENCE_SHEET_NAMES } from './evidenceWorkbook';

export const EVIDENCE_TOLERANCE = {
  FINANCIAL_CR: 0.0001,
  PERCENT_POINTS: 0.01,
  VARIANCE_DECIMALS: 6
} as const;

export const EVIDENCE_MISSING_VALUE_LABEL = 'Not recorded';

export const EVIDENCE_PERCENT_SCALE = 100;

export const EVIDENCE_PARITY_INPUT_LABELS = {
  UI: 'UI value',
  EVIDENCE: 'evidence value',
  SOURCE: 'source value'
} as const;

export const EVIDENCE_PARITY_CHECKS: readonly EvidenceParityCheckDefinition[] = [
  {
    key: 'TOTAL_SPEND',
    kpi: 'Total Spend',
    unit: 'INR Cr',
    tolerance: EVIDENCE_TOLERANCE.FINANCIAL_CR,
    supportingSheet: EVIDENCE_SHEET_NAMES.SUMMARY,
    workbookTypes: [
      'MODULE_1_EVIDENCE',
      'FINANCIAL_VALIDATION',
      'MANAGEMENT_QUICK_SUMMARY_EVIDENCE',
      'ANALYSIS_RUN_CONTROL'
    ]
  },
  {
    key: 'VALIDATED_SPEND',
    kpi: 'Validated Spend',
    unit: 'INR Cr',
    tolerance: EVIDENCE_TOLERANCE.FINANCIAL_CR,
    supportingSheet: EVIDENCE_SHEET_NAMES.SUMMARY,
    workbookTypes: [
      'MODULE_1_EVIDENCE',
      'FINANCIAL_VALIDATION',
      'MANAGEMENT_QUICK_SUMMARY_EVIDENCE',
      'ANALYSIS_RUN_CONTROL'
    ]
  },
  {
    key: 'NET_DEFENSIBLE_OPPORTUNITY',
    kpi: 'Net Defensible Opportunity',
    unit: 'INR Cr',
    tolerance: EVIDENCE_TOLERANCE.FINANCIAL_CR,
    supportingSheet: EVIDENCE_SHEET_NAMES.SUMMARY,
    workbookTypes: [
      'SAVINGS_ENGINE_EVIDENCE',
      'FINANCIAL_VALIDATION',
      'MANAGEMENT_QUICK_SUMMARY_EVIDENCE',
      'ANALYSIS_RUN_CONTROL'
    ]
  },
  {
    key: 'SAVINGS_PERCENT',
    kpi: 'Savings Percentage',
    unit: '%',
    tolerance: EVIDENCE_TOLERANCE.PERCENT_POINTS,
    supportingSheet: EVIDENCE_SHEET_NAMES.SUMMARY,
    workbookTypes: [
      'SAVINGS_ENGINE_EVIDENCE',
      'FINANCIAL_VALIDATION',
      'MANAGEMENT_QUICK_SUMMARY_EVIDENCE',
      'ANALYSIS_RUN_CONTROL'
    ]
  }
];
