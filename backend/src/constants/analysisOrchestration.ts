/**
 * Analysis Orchestration Constants (Prompt 302)
 */

import type {
  AnalysisJobStatus,
  PCBIExclusionReason,
  ReanalysisReason,
  AdminQualityGateChecklist
} from '../types/analysisOrchestration';

export const DEFAULT_SLA_HOURS = 48;
export const MIN_SPEND_COVERAGE_FOR_REPORT_PCT = 85.0;

export const ANALYSIS_JOB_STATUSES: readonly AnalysisJobStatus[] = [
  'UPLOADED',
  'MODULE_1_READY',
  'ANALYSIS_QUEUED',
  'PCBI_REVIEW_REQUIRED',
  'PCBI_REVIEW_IN_PROGRESS',
  'READY_FOR_GENERATION',
  'REPORT_GENERATED',
  'ADMIN_REVIEW',
  'ADMIN_APPROVED',
  'SUBMITTED_TO_CUSTOMER',
  'CUSTOMER_VIEWED',
  'CUSTOMER_ACKNOWLEDGED',
  'ANALYSIS_BLOCKED'
] as const;
export const EXCLUSION_REASONS: readonly {
  code: PCBIExclusionReason;
  label: string;
  requiresExplanation: boolean;
}[] = [
  { code: 'NOT_BENCHMARKABLE', label: 'Not benchmarkable', requiresExplanation: false },
  { code: 'CUSTOM_ENGINEERED_ITEM', label: 'Custom engineered item', requiresExplanation: false },
  { code: 'SERVICE', label: 'Service / Non-commodity', requiresExplanation: false },
  { code: 'NO_RELIABLE_MARKET_BENCHMARK', label: 'No reliable market benchmark', requiresExplanation: false },
  { code: 'INSUFFICIENT_MARKET_DATA', label: 'Insufficient market data', requiresExplanation: false },
  { code: 'CUSTOMER_SPECIFIC_SPECIFICATION', label: 'Customer-specific specification', requiresExplanation: false },
  { code: 'BELOW_MATERIALITY_THRESHOLD', label: 'Below materiality threshold', requiresExplanation: false },
  { code: 'OTHER', label: 'Other', requiresExplanation: true }
] as const;

export const REANALYSIS_REASONS: readonly { code: ReanalysisReason; label: string; requiresExplanation: boolean }[] = [
  { code: 'INCORRECT_CATEGORY_MAPPING', label: 'Incorrect category mapping', requiresExplanation: false },
  { code: 'MISSING_TRANSACTIONS', label: 'Missing transactions', requiresExplanation: false },
  { code: 'DUPLICATE_TRANSACTIONS', label: 'Duplicate transactions', requiresExplanation: false },
  { code: 'INCORRECT_SUPPLIER_MAPPING', label: 'Incorrect supplier mapping', requiresExplanation: false },
  { code: 'INCORRECT_PLANT_MAPPING', label: 'Incorrect plant mapping', requiresExplanation: false },
  { code: 'INCORRECT_QUANTITY_VALUE', label: 'Incorrect quantity/value', requiresExplanation: false },
  { code: 'INCORRECT_MATERIAL_DESCRIPTION', label: 'Incorrect material description', requiresExplanation: false },
  { code: 'CUSTOMER_CLARIFICATION', label: 'Customer clarification', requiresExplanation: false },
  { code: 'PCBI_MAPPING_CORRECTION', label: 'PCBI mapping correction', requiresExplanation: false },
  { code: 'OTHER', label: 'Other', requiresExplanation: true }
] as const;

export const DEFAULT_QUALITY_GATE_CHECKLIST: AdminQualityGateChecklist = {
  dataQuality: {
    sourceDataValidated: false,
    spendReconciles: false,
    duplicateChecksCompleted: false,
    classificationReviewed: false
  },
  pcbi: {
    requiredPcbiCategoriesResolved: false,
    benchmarkSourcesValidated: false,
    exclusionsDocumented: false,
    pcbiCoverageAcceptable: false
  },
  financial: {
    savingsCalculationsValidated: false,
    noDoubleCounting: false,
    overlapsHandled: false,
    exclusionsApplied: false,
    totalsReconcile: false
  },
  report: {
    module1Reviewed: false,
    module2Reviewed: false,
    module3Reviewed: false,
    module4Reviewed: false,
    executiveSummaryReviewed: false
  }
};

export const EMAIL_NOTIFICATION_CONSTANTS = {
  DEFAULT_SUBJECT: 'Your Procucev Procurement Analysis is Ready',
  DEFAULT_SENDER: 'Procucev Enterprise Solutions <noreply@procucev.com>',
  WORKSPACE_REPORT_PATH: '/#report-summary'
} as const;

export const INITIAL_PCBI_BENCHMARK_SERIES = [
  { seriesId: 'PCBI-SERIES-FE-MOLY-65', name: 'Ferro Molybdenum 65%', quality: 'A', source: 'SteelMint' },
  { seriesId: 'PCBI-SERIES-CAUSTIC-SODA-48', name: 'Caustic Soda Lye 48%', quality: 'A', source: 'ICIS Chemical' },
  { seriesId: 'PCBI-SERIES-DIESEL-HSD', name: 'High Speed Diesel (HSD)', quality: 'A', source: 'IOCL / Platts' },
  { seriesId: 'PCBI-SERIES-CORRUGATED-KRAFT', name: 'Kraft Liner Board 180 GSM', quality: 'B', source: 'PaperIndex' },
  { seriesId: 'PCBI-SERIES-HDPE-FILM', name: 'HDPE Film Grade', quality: 'A', source: 'Platts Polymers' }
] as const;
