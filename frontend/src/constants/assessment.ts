/**
 * Frontend Constants for aiCEV Internal Assessment Mode
 */

import type {
  AppOperatingMode,
  NdaStatus,
  DataStatus,
  AssessmentStatus,
  AssessmentRole,
  OperatingModeConfig,
  AssessmentModuleGate,
  AssessmentModule
} from '../types/assessment';

export const APP_OPERATING_MODES = {
  INTERNAL_ASSESSMENT: 'INTERNAL_ASSESSMENT' as AppOperatingMode,
  PUBLIC_SAAS: 'PUBLIC_SAAS' as AppOperatingMode
} as const;

export const NDA_STATUSES = {
  NOT_REQUESTED: 'NOT_REQUESTED' as NdaStatus,
  SENT: 'SENT' as NdaStatus,
  SIGNED: 'SIGNED' as NdaStatus,
  EXPIRED: 'EXPIRED' as NdaStatus
} as const;

export const DATA_STATUSES = {
  AWAITING_DATA: 'AWAITING_DATA' as DataStatus,
  RECEIVED: 'RECEIVED' as DataStatus,
  VALIDATING: 'VALIDATING' as DataStatus,
  VALIDATED: 'VALIDATED' as DataStatus,
  REJECTED: 'REJECTED' as DataStatus
} as const;

export const ASSESSMENT_STATUSES = {
  DRAFT: 'DRAFT' as AssessmentStatus,
  DATA_AWAITING: 'DATA_AWAITING' as AssessmentStatus,
  IN_PROGRESS: 'IN_PROGRESS' as AssessmentStatus,
  PCBI_REVIEW: 'PCBI_REVIEW' as AssessmentStatus,
  AWAITING_REVIEW: 'AWAITING_REVIEW' as AssessmentStatus,
  APPROVED: 'APPROVED' as AssessmentStatus,
  DELIVERED: 'DELIVERED' as AssessmentStatus,
  ACCEPTED: 'ACCEPTED' as AssessmentStatus,
  BLOCKED: 'BLOCKED' as AssessmentStatus
} as const;

export const ASSESSMENT_ROLES = {
  INTERNAL_ADMIN: 'INTERNAL_ADMIN' as AssessmentRole,
  ANALYST: 'ANALYST' as AssessmentRole,
  CONSULTANT: 'CONSULTANT' as AssessmentRole
} as const;

export const MANDATORY_MODULE_GATES = {
  // Module 1 (7 gates)
  M1_INPUT_ROW_RECONCILIATION: 'M1_INPUT_ROW_RECONCILIATION',
  M1_CURRENCY_NORMALIZATION: 'M1_CURRENCY_NORMALIZATION',
  M1_TAXONOMY_VALIDATION: 'M1_TAXONOMY_VALIDATION',
  M1_SUPPLIER_DEDUPLICATION: 'M1_SUPPLIER_DEDUPLICATION',
  M1_PLANT_MAPPING: 'M1_PLANT_MAPPING',
  M1_ANOMALY_EXCLUSION_SIGNOFF: 'M1_ANOMALY_EXCLUSION_SIGNOFF',
  M1_BASELINE_SPEND_SIGNOFF: 'M1_BASELINE_SPEND_SIGNOFF',

  // Module 2 (6 gates)
  M2_ADDRESSABLE_SPEND: 'M2_ADDRESSABLE_SPEND',
  M2_GROSS_OPPORTUNITY_POOL: 'M2_GROSS_OPPORTUNITY_POOL',
  M2_OVERLAP_DEDUCTION: 'M2_OVERLAP_DEDUCTION',
  M2_NET_DEFENSIBLE_OPPORTUNITY: 'M2_NET_DEFENSIBLE_OPPORTUNITY',
  M2_PROVEN_OPPORTUNITY: 'M2_PROVEN_OPPORTUNITY',
  M2_DELIVERY_RANGE: 'M2_DELIVERY_RANGE',

  // Module 3 (7 gates)
  M3_BENCHMARK_COVERAGE: 'M3_BENCHMARK_COVERAGE',
  M3_BENCHMARKABLE_SPEND: 'M3_BENCHMARKABLE_SPEND',
  M3_PRICE_GAP_ANALYTICAL_SIGNAL: 'M3_PRICE_GAP_ANALYTICAL_SIGNAL',
  M3_ANALYTICAL_ISOLATION: 'M3_ANALYTICAL_ISOLATION',
  M3_COMMODITY_INDEX_MAPPING: 'M3_COMMODITY_INDEX_MAPPING',
  M3_INDEXATION_METHODOLOGY_SIGNOFF: 'M3_INDEXATION_METHODOLOGY_SIGNOFF',
  M3_BENCHMARK_DATA_QUALITY_REVIEW: 'M3_BENCHMARK_DATA_QUALITY_REVIEW',

  // Module 4 (6 gates)
  M4_GROSS_OPPORTUNITY: 'M4_GROSS_OPPORTUNITY',
  M4_OVERLAP: 'M4_OVERLAP',
  M4_NET_OPPORTUNITY: 'M4_NET_OPPORTUNITY',
  M4_PROVEN_OPPORTUNITY: 'M4_PROVEN_OPPORTUNITY',
  M4_DELIVERY_RANGE: 'M4_DELIVERY_RANGE',
  M4_EVIDENCE_COMPLETENESS: 'M4_EVIDENCE_COMPLETENESS'
} as const;

export const ASSESSMENT_MODULES: readonly AssessmentModule[] = ['Module 1', 'Module 2', 'Module 3', 'Module 4'];

export const MODULE_GATES_LIST: AssessmentModuleGate[] = [
  // Module 1 (7 gates)
  { key: 'M1_INPUT_ROW_RECONCILIATION', module: 'Module 1', name: 'Input row reconciliation', standard: 'Reconcile imported and source row counts.' },
  { key: 'M1_CURRENCY_NORMALIZATION', module: 'Module 1', name: 'Currency normalization', standard: 'Review FX coverage and normalization evidence.' },
  { key: 'M1_TAXONOMY_VALIDATION', module: 'Module 1', name: 'Material group taxonomy', standard: 'Review material group mappings.' },
  { key: 'M1_SUPPLIER_DEDUPLICATION', module: 'Module 1', name: 'Supplier deduplication', standard: 'Review supplier identity matches and merges.' },
  { key: 'M1_PLANT_MAPPING', module: 'Module 1', name: 'Plant / location mapping', standard: 'Review operating unit and location mappings.' },
  { key: 'M1_ANOMALY_EXCLUSION_SIGNOFF', module: 'Module 1', name: 'Anomaly / exclusion sign-off', standard: 'Review quarantined rows, exclusions and anomalies.' },
  { key: 'M1_BASELINE_SPEND_SIGNOFF', module: 'Module 1', name: 'Baseline spend sign-off', standard: 'Reconcile evaluated spend to source transactions.' },

  // Module 2 (6 gates)
  { key: 'M2_ADDRESSABLE_SPEND', module: 'Module 2', name: 'Addressable spend baseline', standard: 'Review addressable spend rules and evidence.' },
  { key: 'M2_GROSS_OPPORTUNITY_POOL', module: 'Module 2', name: 'Gross opportunity pool', standard: 'Review source opportunities and calculations.' },
  { key: 'M2_OVERLAP_DEDUCTION', module: 'Module 2', name: 'Overlap deduction', standard: 'Review overlap identification and deductions.' },
  { key: 'M2_NET_DEFENSIBLE_OPPORTUNITY', module: 'Module 2', name: 'Net defensible opportunity', standard: 'Reconcile net opportunity to its components.' },
  { key: 'M2_PROVEN_OPPORTUNITY', module: 'Module 2', name: 'Proven opportunity', standard: 'Review evidence supporting validated opportunities.' },
  { key: 'M2_DELIVERY_RANGE', module: 'Module 2', name: 'Delivery range', standard: 'Review delivery assumptions and range calculations.' },

  // Module 3 (7 gates)
  { key: 'M3_BENCHMARK_COVERAGE', module: 'Module 3', name: 'Benchmark coverage', standard: 'Review benchmark coverage and exclusions.' },
  { key: 'M3_BENCHMARKABLE_SPEND', module: 'Module 3', name: 'Benchmarkable spend', standard: 'Reconcile benchmarkable spend to source records.' },
  { key: 'M3_PRICE_GAP_ANALYTICAL_SIGNAL', module: 'Module 3', name: 'Price-gap analytical signal', standard: 'Review price-gap calculations and evidence.' },
  { key: 'M3_ANALYTICAL_ISOLATION', module: 'Module 3', name: 'Analytical isolation', standard: 'Confirm analytical signals are isolated from savings.' },
  { key: 'M3_COMMODITY_INDEX_MAPPING', module: 'Module 3', name: 'Commodity index mapping verified', standard: 'Review commodity and index mappings.' },
  { key: 'M3_INDEXATION_METHODOLOGY_SIGNOFF', module: 'Module 3', name: 'Indexation methodology sign-off', standard: 'Review indexation model methodology.' },
  { key: 'M3_BENCHMARK_DATA_QUALITY_REVIEW', module: 'Module 3', name: 'Benchmark data quality review', standard: 'Review outliers, missing data and category coverage.' },

  // Module 4 (6 gates)
  { key: 'M4_GROSS_OPPORTUNITY', module: 'Module 4', name: 'Gross opportunity pool', standard: 'Reconcile gross opportunity to source records.' },
  { key: 'M4_OVERLAP', module: 'Module 4', name: 'Overlap allocation', standard: 'Review overlap allocation and exclusions.' },
  { key: 'M4_NET_OPPORTUNITY', module: 'Module 4', name: 'Net defensible opportunity', standard: 'Reconcile net opportunity calculations.' },
  { key: 'M4_PROVEN_OPPORTUNITY', module: 'Module 4', name: 'Proven opportunity', standard: 'Review evidence supporting proven opportunities.' },
  { key: 'M4_DELIVERY_RANGE', module: 'Module 4', name: 'Delivery range', standard: 'Review delivery assumptions and calculations.' },
  { key: 'M4_EVIDENCE_COMPLETENESS', module: 'Module 4', name: 'Evidence completeness', standard: 'Verify required source and lineage evidence is available.' }
];

export const REVIEW_GATES = {
  ...MANDATORY_MODULE_GATES,
  INPUT_VALIDATION_CLEAN: 'INPUT_VALIDATION_CLEAN',
  MODULE_1_RECONCILED: 'MODULE_1_RECONCILED',
  MODULE_2_SAVINGS_CONSISTENT: 'MODULE_2_SAVINGS_CONSISTENT',
  MODULE_3_COMPLETED: 'MODULE_3_COMPLETED',
  MODULE_4_BENCHMARKED: 'MODULE_4_BENCHMARKED',
  FORENSIC_EXCEPTION_REVIEWED: 'FORENSIC_EXCEPTION_REVIEWED',
  CURRENCY_FX_AUDITED: 'CURRENCY_FX_AUDITED',
  REPORT_CONSISTENCY_VERIFIED: 'REPORT_CONSISTENCY_VERIFIED'
} as const;

export const REVIEW_GATE_LABELS: Record<string, { title: string; description: string }> = {
  ...Object.fromEntries(MODULE_GATES_LIST.map((g) => [g.key, { title: g.name, description: g.standard }])),
  INPUT_VALIDATION_CLEAN: {
    title: 'Gate 1: Input Validation Clean',
    description: 'Source dataset parsed with schema adherence, header reconciliation, and zero unhandled exceptions.'
  },
  MODULE_1_RECONCILED: {
    title: 'Gate 2: Module 1 Reconciled',
    description: 'Valid FX-normalized spend, baseline, FX impact, excluded rows, and anomaly reconciliation.'
  },
  MODULE_2_SAVINGS_CONSISTENT: {
    title: 'Gate 3: Module 2 Savings Consistent',
    description: 'Volume pooling, supplier rationalization, rate arbitrage, and payment term opportunities verified.'
  },
  MODULE_3_COMPLETED: {
    title: 'Gate 4: Module 3 Completed',
    description: 'Price indexation, cost-breakdown indexing, and index-based risk drivers fully computed.'
  },
  MODULE_4_BENCHMARKED: {
    title: 'Gate 5: Module 4 Benchmarked',
    description: 'Category and supplier benchmark comparisons calculated with high confidence bands.'
  },
  FORENSIC_EXCEPTION_REVIEWED: {
    title: 'Gate 6: Forensic Exception Reviewed',
    description: 'Excluded rows, data anomalies, and quarantined records reviewed with signed audit sign-off.'
  },
  CURRENCY_FX_AUDITED: {
    title: 'Gate 7: Currency / FX Audited',
    description: 'FX reference rates validated against FX Master and verified for all non-INR invoice currencies.'
  },
  REPORT_CONSISTENCY_VERIFIED: {
    title: 'Gate 8: Report Consistency Verified',
    description: 'All totals in Executive Brief, Boardroom Report, and Evidence Workbooks cross-reconciled.'
  }
};

export const DEFAULT_ASSESSMENT_CONFIG: OperatingModeConfig = {
  mode: APP_OPERATING_MODES.INTERNAL_ASSESSMENT,
  isInternalAssessment: true,
  isPublicSaaS: false,
  workspaceTitle: 'aiCEV | Internal Assessment Workspace',
  phaseName: 'PROCUCEV — 30-DAY INTERNAL VALIDATION PHASE',
  features: {
    publicRegistration: false,
    tierUpgrade: false,
    subscriptionPurchase: false,
    customerSelfOnboarding: false,
    customerSaaSDashboard: false,
    assessmentCentre: true
  },
  allowedRoles: [
    ASSESSMENT_ROLES.INTERNAL_ADMIN,
    ASSESSMENT_ROLES.ANALYST,
    ASSESSMENT_ROLES.CONSULTANT
  ]
};

export const ASSESSMENT_STATUS_BADGES: Record<
  AssessmentStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  DRAFT: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: 'Draft' },
  DATA_AWAITING: { bg: 'bg-amber-950', text: 'text-amber-400', border: 'border-amber-800', label: 'Data Awaiting' },
  IN_PROGRESS: { bg: 'bg-blue-950', text: 'text-blue-400', border: 'border-blue-800', label: 'In Progress' },
  PCBI_REVIEW: { bg: 'bg-purple-950', text: 'text-purple-400', border: 'border-purple-800', label: 'PCBI Review' },
  AWAITING_REVIEW: { bg: 'bg-yellow-950', text: 'text-yellow-400', border: 'border-yellow-800', label: 'Awaiting Review' },
  MODULE_1_READY: { bg: 'bg-indigo-950', text: 'text-indigo-400', border: 'border-indigo-800', label: 'Module 1 Ready' },
  ANALYST_REVIEW: { bg: 'bg-amber-900', text: 'text-amber-300', border: 'border-amber-600', label: 'Analyst Review' },
  APPROVED: { bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-800', label: 'Approved' },
  DELIVERED: { bg: 'bg-teal-950', text: 'text-teal-400', border: 'border-teal-800', label: 'Delivered' },
  ACCEPTED: { bg: 'bg-emerald-900', text: 'text-emerald-300', border: 'border-emerald-600', label: 'Accepted' },
  BLOCKED: { bg: 'bg-rose-950', text: 'text-rose-400', border: 'border-rose-800', label: 'Blocked' }
};

export const DELIVERY_PACKAGE_TEMPLATES = [
  { id: 'EXECUTIVE_OPPORTUNITY_BRIEF', title: 'Executive Opportunity Brief', format: 'PDF', suffix: 'Executive_Opportunity_Brief.pdf' },
  { id: 'BOARDROOM_EVIDENCE_EDITION', title: 'Boardroom & Evidence Edition', format: 'PPTX', suffix: 'Boardroom_Evidence_Edition.pptx' },
  { id: 'MODULE_1_REPORT', title: 'Module 1 report', format: 'PDF', suffix: 'Module_1_Spend_Intelligence_Report.pdf' },
  { id: 'MODULE_2_REPORT', title: 'Module 2 report', format: 'PDF', suffix: 'Module_2_Strategic_Sourcing_Report.pdf' },
  { id: 'PCBI_REPORT', title: 'PCBI report', format: 'PDF', suffix: 'Module_3_PCBI_Benchmark_Report.pdf' },
  { id: 'MODULE_4_REPORT', title: 'Module 4 report', format: 'PDF', suffix: 'Module_4_Savings_Engine_Report.pdf' },
  { id: 'EVIDENCE_WORKBOOK', title: 'Evidence workbook', format: 'XLSX', suffix: 'Consolidated_Evidence_Workbook.xlsx' },
  { id: 'METHODOLOGY_ASSUMPTIONS', title: 'Methodology / assumptions', format: 'PDF', suffix: 'Methodology_and_Assumptions.pdf' },
  { id: 'DATA_QUALITY_OBSERVATIONS', title: 'Data quality observations', format: 'PDF', suffix: 'Data_Quality_Observations.pdf' },
  { id: 'RECOMMENDED_WAVE_1_ACTIONS', title: 'Recommended Wave 1 actions', format: 'PDF', suffix: 'Recommended_Wave_1_Actions.pdf' }
] as const;

export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = 1024 * BYTES_PER_KB;
export const ASSESSMENT_UPLOAD_MAX_MB = 100;
export const ASSESSMENT_UPLOAD_MAX_BYTES = ASSESSMENT_UPLOAD_MAX_MB * BYTES_PER_MB;
export const ASSESSMENT_UPLOAD_EXTENSIONS = ['.xlsx', '.csv', '.xls'] as const;
export const ASSESSMENT_UPLOAD_ACCEPT = ASSESSMENT_UPLOAD_EXTENSIONS.join(',');
// SHA-256 digest of an empty input. Used only when the Web Crypto API is unavailable or fails.
export const ASSESSMENT_CHECKSUM_FALLBACK_HEX = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
// Bytes converted per String.fromCharCode call when base64-encoding an uploaded file.
export const BASE64_ENCODE_CHUNK_BYTES = 0x8000;
