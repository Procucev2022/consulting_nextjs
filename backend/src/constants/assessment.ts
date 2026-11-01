export const APP_OPERATING_MODES = {
  INTERNAL_ASSESSMENT: 'INTERNAL_ASSESSMENT',
  PUBLIC_SAAS: 'PUBLIC_SAAS'
} as const;

export type AppOperatingMode = (typeof APP_OPERATING_MODES)[keyof typeof APP_OPERATING_MODES];

export const NDA_STATUSES = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  NOT_REQUIRED: 'NOT_REQUIRED'
} as const;

export type NdaStatus = (typeof NDA_STATUSES)[keyof typeof NDA_STATUSES];

export const DATA_STATUSES = {
  NOT_RECEIVED: 'NOT_RECEIVED',
  RECEIVED: 'RECEIVED',
  VALIDATION_IN_PROGRESS: 'VALIDATION_IN_PROGRESS',
  VALIDATED: 'VALIDATED',
  REQUIRES_CLARIFICATION: 'REQUIRES_CLARIFICATION'
} as const;

export type DataStatus = (typeof DATA_STATUSES)[keyof typeof DATA_STATUSES];

export const ASSESSMENT_STATUSES = {
  CREATED: 'CREATED',
  NDA_PENDING: 'NDA_PENDING',
  DATA_PENDING: 'DATA_PENDING',
  DATA_RECEIVED: 'DATA_RECEIVED',
  MODULE_1_READY: 'MODULE_1_READY',
  ANALYSIS_IN_PROGRESS: 'ANALYSIS_IN_PROGRESS',
  PCBI_REVIEW: 'PCBI_REVIEW',
  REPORT_GENERATION: 'REPORT_GENERATION',
  ANALYST_REVIEW: 'ANALYST_REVIEW',
  APPROVED: 'APPROVED',
  DELIVERED: 'DELIVERED',
  ACCEPTED: 'ACCEPTED',
  CLOSED: 'CLOSED',
  BLOCKED: 'BLOCKED'
} as const;

export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[keyof typeof ASSESSMENT_STATUSES];

export const ASSESSMENT_ROLES = {
  INTERNAL_ADMIN: 'INTERNAL_ADMIN',
  ANALYST: 'ANALYST',
  CONSULTANT: 'CONSULTANT',
  CUSTOMER: 'CUSTOMER'
} as const;

export type AssessmentRole = (typeof ASSESSMENT_ROLES)[keyof typeof ASSESSMENT_ROLES];

export const AUDIT_ACTIONS = {
  ASSESSMENT_CREATED: 'ASSESSMENT_CREATED',
  NDA_STATUS_CHANGED: 'NDA_STATUS_CHANGED',
  DATA_RECEIVED: 'DATA_RECEIVED',
  FILE_UPLOADED: 'FILE_UPLOADED',
  DATA_VERSION_CREATED: 'DATA_VERSION_CREATED',
  ANALYSIS_STARTED: 'ANALYSIS_STARTED',
  ANALYSIS_COMPLETED: 'ANALYSIS_COMPLETED',
  PCBI_REVIEW_STARTED: 'PCBI_REVIEW_STARTED',
  CORRECTION_MADE: 'CORRECTION_MADE',
  NEW_DATA_VERSION_CREATED: 'NEW_DATA_VERSION_CREATED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_SUPERSEDED: 'REPORT_SUPERSEDED',
  ANALYST_APPROVAL: 'ANALYST_APPROVAL',
  DELIVERY_PACKAGE_GENERATED: 'DELIVERY_PACKAGE_GENERATED',
  REPORT_DELIVERED: 'REPORT_DELIVERED',
  ASSESSMENT_ACCEPTED: 'ASSESSMENT_ACCEPTED',
  ASSESSMENT_CLOSED: 'ASSESSMENT_CLOSED'
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const DEFAULT_ASSESSMENT_CONFIG = {
  operatingMode: APP_OPERATING_MODES.INTERNAL_ASSESSMENT,
  workspaceTitle: 'aiCEV | Internal Assessment Workspace',
  phaseName: 'PROCUCEV — 30-DAY INTERNAL VALIDATION PHASE',
  idPrefix: 'AIC',
  defaultAnalyst: 'analyst@procucev.com',
  defaultAdmin: 'admin@procucev.com'
} as const;

export const MANDATORY_MODULE_GATES = {
  // Module 1 (7 gates)
  M1_DATA_COMPLETENESS: 'M1_DATA_COMPLETENESS',
  M1_TRANSACTION_VALIDITY: 'M1_TRANSACTION_VALIDITY',
  M1_FX_COVERAGE: 'M1_FX_COVERAGE',
  M1_SUPPLIER_POPULATION: 'M1_SUPPLIER_POPULATION',
  M1_MATERIAL_GROUPS: 'M1_MATERIAL_GROUPS',
  M1_PLANTS: 'M1_PLANTS',
  M1_PERIOD_COVERAGE: 'M1_PERIOD_COVERAGE',

  // Module 2 (6 gates)
  M2_OPPORTUNITY_ELIGIBILITY: 'M2_OPPORTUNITY_ELIGIBILITY',
  M2_DENOMINATORS: 'M2_DENOMINATORS',
  M2_OPPORTUNITY_CALCULATIONS: 'M2_OPPORTUNITY_CALCULATIONS',
  M2_OVERLAP: 'M2_OVERLAP',
  M2_TRANSACTION_LINEAGE: 'M2_TRANSACTION_LINEAGE',
  M2_PROVEN_OPPORTUNITY_EVIDENCE: 'M2_PROVEN_OPPORTUNITY_EVIDENCE',

  // Module 3 (7 gates)
  M3_PCBI_MAPPING: 'M3_PCBI_MAPPING',
  M3_SOURCE: 'M3_SOURCE',
  M3_SOURCE_QUALITY: 'M3_SOURCE_QUALITY',
  M3_BENCHMARK_FREQUENCY: 'M3_BENCHMARK_FREQUENCY',
  M3_HISTORICAL_COVERAGE: 'M3_HISTORICAL_COVERAGE',
  M3_UNMAPPED_ITEMS: 'M3_UNMAPPED_ITEMS',
  M3_BENCHMARK_PRICE_GAP_CLASSIFICATION: 'M3_BENCHMARK_PRICE_GAP_CLASSIFICATION',

  // Module 4 (6 gates)
  M4_GROSS_OPPORTUNITY: 'M4_GROSS_OPPORTUNITY',
  M4_OVERLAP: 'M4_OVERLAP',
  M4_NET_OPPORTUNITY: 'M4_NET_OPPORTUNITY',
  M4_PROVEN_OPPORTUNITY: 'M4_PROVEN_OPPORTUNITY',
  M4_DELIVERY_RANGE: 'M4_DELIVERY_RANGE',
  M4_EVIDENCE_COMPLETENESS: 'M4_EVIDENCE_COMPLETENESS'
} as const;

export type MandatoryModuleGate = (typeof MANDATORY_MODULE_GATES)[keyof typeof MANDATORY_MODULE_GATES];

export const REVIEW_GATES = {
  ...MANDATORY_MODULE_GATES,
  // Legacy aliases for backward compatibility
  MODULE_1_RECONCILIATION: 'MODULE_1_RECONCILIATION',
  FX_COVERAGE_VALIDATION: 'FX_COVERAGE_VALIDATION',
  DATA_QUALITY_REVIEW: 'DATA_QUALITY_REVIEW',
  MODULE_2_VALIDATION: 'MODULE_2_VALIDATION',
  PCBI_REVIEW: 'PCBI_REVIEW',
  SAVINGS_RECONCILIATION: 'SAVINGS_RECONCILIATION',
  EVIDENCE_WORKBOOK_GENERATION: 'EVIDENCE_WORKBOOK_GENERATION',
  REPORT_GENERATION: 'REPORT_GENERATION'
} as const;

export type ReviewGate = (typeof REVIEW_GATES)[keyof typeof REVIEW_GATES];

export const DELIVERY_PACKAGE_ITEMS_SPEC = [
  { id: 'EXECUTIVE_OPPORTUNITY_BRIEF', title: 'Executive Opportunity Brief', format: 'PDF', fileSuffix: '_Executive_Opportunity_Brief.pdf' },
  { id: 'BOARDROOM_EVIDENCE_EDITION', title: 'Boardroom & Evidence Edition', format: 'PPTX', fileSuffix: '_Boardroom_Evidence_Edition.pptx' },
  { id: 'MODULE_1_REPORT', title: 'Module 1 report', format: 'PDF', fileSuffix: '_Module_1_Spend_Intelligence_Report.pdf' },
  { id: 'MODULE_2_REPORT', title: 'Module 2 report', format: 'PDF', fileSuffix: '_Module_2_Strategic_Sourcing_Report.pdf' },
  { id: 'PCBI_REPORT', title: 'PCBI report', format: 'PDF', fileSuffix: '_Module_3_PCBI_Benchmark_Report.pdf' },
  { id: 'MODULE_4_REPORT', title: 'Module 4 report', format: 'PDF', fileSuffix: '_Module_4_Savings_Engine_Report.pdf' },
  { id: 'EVIDENCE_WORKBOOK', title: 'Evidence workbook', format: 'XLSX', fileSuffix: '_Consolidated_Evidence_Workbook.xlsx' },
  { id: 'METHODOLOGY_ASSUMPTIONS', title: 'Methodology / assumptions', format: 'PDF', fileSuffix: '_Methodology_and_Assumptions.pdf' },
  { id: 'DATA_QUALITY_OBSERVATIONS', title: 'Data quality observations', format: 'PDF', fileSuffix: '_Data_Quality_Observations.pdf' },
  { id: 'RECOMMENDED_WAVE_1_ACTIONS', title: 'Recommended Wave 1 actions', format: 'PDF', fileSuffix: '_Recommended_Wave_1_Actions.pdf' }
] as const;

export const ASSESSMENT_DELIVERY_CONTENT_TYPES = Object.freeze({
  PDF: 'application/pdf',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});

export const ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT = Object.freeze({
  PAGE_WIDTH: 960,
  PAGE_HEIGHT: 540,
  LEFT: 48,
  TITLE_Y: 66,
  CONTENT_Y: 116,
  LINE_GAP: 20,
  BOTTOM: 492,
  PDF_FONT_SIZE: 11,
  PPTX_MAX_LINES: 18
});

export const ASSESSMENT_DELIVERY_ARTIFACT_LABELS = Object.freeze({
  provenance: 'Source: approved analysis snapshot and evidence rows stored in Cloudflare D1.',
  noMetrics: 'No persisted analytical metrics are available for this module on the selected analysis run.',
  noRecommendations: 'No D1-backed Wave 1 recommendations are attached to this approved analysis run.',
  emptyEvidence: 'No source rows were returned from D1 for this approved data version.',
  emptyValidation: 'No validation observations were returned from D1 for this approved data version.',
  generatedBy: 'Generated from the approved D1 analysis run; unavailable metrics are left unreported.'
});
export const ASSESSMENT_DELIVERY_MODULE_METRIC_KEYS: Readonly<Record<string, string>> = Object.freeze({
  MODULE_1_REPORT: 'module1Metrics',
  MODULE_2_REPORT: 'module2Metrics',
  PCBI_REPORT: 'pcbiMetrics',
  MODULE_4_REPORT: 'module4Metrics'
});
export const ASSESSMENT_DELIVERY_STORAGE_PREFIX = 'assessment-deliveries';

export const SYSTEM_BUILD_IDENTITY = Object.freeze({
  APP_VERSION: '1.0.2'
});

export const PERSISTENCE_ENVIRONMENTS = Object.freeze({
  TEST: 'TEST',
  DEVELOPMENT: 'DEVELOPMENT',
  DEFAULT: 'DEFAULT'
} as const);

export type PersistenceEnvironment =
  (typeof PERSISTENCE_ENVIRONMENTS)[keyof typeof PERSISTENCE_ENVIRONMENTS];

export const PERSISTENCE_CONFIG = Object.freeze({
  PRIMARY_FILENAME: 'assessments.json',
  BACKUP_FILENAME: 'assessments.json.bak',
  DEV_DIR_NAME: 'dev',
  TEST_DIR_NAME: 'test',
  TEST_ISOLATION_ERROR_CODE: 'CRITICAL_TEST_ISOLATION_BREACH',
  FAILED_TO_ESTABLISH_TEST_DIR_ERROR_CODE: 'FAILED_TO_ESTABLISH_ISOLATED_TEST_DIR'
});


