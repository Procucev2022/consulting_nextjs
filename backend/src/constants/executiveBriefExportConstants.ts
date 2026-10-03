/**
 * Executive Brief Export Constants (Prompt 258)
 */

export const REPORT_EXPORT_VERSION = '1.1';
export const REPORT_ID_PREFIX = 'RPT-EXEC-';
export const REPORT_FILENAME_PREFIX = 'Procucev_Procurement_Value_Savings_Diagnostic_';

export const EXPORT_CONFIDENTIALITY_PREFIX = 'CONFIDENTIAL — PREPARED EXCLUSIVELY FOR ';

export const EXPORT_STATUSES = {
  PREPARING: 'Preparing Executive Brief...',
  GENERATING_PDF: 'Generating PDF...',
  GENERATING_PPTX: 'Generating PowerPoint...',
  VALIDATING: 'Validating...',
  READY_FOR_DOWNLOAD: 'Ready for Download',
  EXPORT_BLOCKED: 'Export Blocked'
} as const;

export const EXPORT_VALIDATION_ERRORS = {
  VARIANCE_DETECTED: 'Financial reconciliation failure: Non-zero variance detected against certified ledger.',
  PPTX_SLIDE_MISMATCH: 'PowerPoint validation failure: Slide count does not match certified specification.',
  PPTX_BLANK_SLIDES: 'PowerPoint validation failure: Detected empty or unpopulated slide containers.',
  PDF_RENDER_FAILURE: 'PDF validation failure: Page count mismatch or vector stream corruption.',
  DATA_INCONSISTENCY: 'Report consistency failure: Values in export artifacts do not reconcile.'
} as const;

export const DEFAULT_EXPORT_HISTORY = [
  {
    reportId: 'RPT-EXEC-20261001-001',
    reportVersion: '1.0',
    generatedDate: '2026-10-01 09:30 AM',
    generatedBy: 'Procucev Automated Savings Engine',
    dataVersion: 'MODULE_1_4_CERTIFIED_V1.0',
    clientName: 'UltraTech Cement Limited',
    analysisPeriod: 'April 2024 – March 2026 (24 Months)',
    pdfFileName: 'Procucev_Procurement_Value_Savings_Diagnostic_UltraTech_Cement_Limited_2026-10-01.pdf',
    pptxFileName: 'Procucev_Procurement_Value_Savings_Diagnostic_UltraTech_Cement_Limited_2026-10-01.pptx',
    pdfPath: 'EXECUTIVE_BRIEF.pdf',
    pptxPath: 'EXECUTIVE_BRIEF.pptx',
    exportStatus: 'CERTIFIED'
  }
];
