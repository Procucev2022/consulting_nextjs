/**
 * Executive Brief Export & Dual-Format Types (Prompt 258)
 */

import type { ExecutiveBriefMetadata, ExecutiveFindingCard } from './executiveBriefTypes';

export type ExportGenerationStatus =
  | 'PREPARING'
  | 'GENERATING_PDF'
  | 'GENERATING_PPTX'
  | 'VALIDATING'
  | 'READY_FOR_DOWNLOAD'
  | 'EXPORT_BLOCKED';

export interface FinancialConsistencyCheck {
  totalSpendVarianceInr: number;
  addressableSpendVarianceInr: number;
  grossOpportunityVarianceInr: number;
  netDefensibleVarianceInr: number;
  approvedSavingsVarianceInr: number;
  realizedSavingsVarianceInr: number;
  isConsistent: boolean;
  status: 'PASS' | 'FAIL';
  errorMessage?: string;
}

export interface PptxInspectionResult {
  slideCount: number;
  hasBlankSlides: boolean;
  hasMissingText: boolean;
  hasClippedText: boolean;
  textObjectsEditable: boolean;
  shapesValid: boolean;
  tablesValid: boolean;
  isValid: boolean;
}

export interface ExecutiveBriefExportAudit {
  reportId: string;
  client: string;
  generationTimestamp: string;
  sourceDataVersion: string;
  pdfGenerated: boolean;
  pptxGenerated: boolean;
  pdfValidation: string;
  pptxValidation: string;
  financialReconciliation: {
    varianceInr: number;
    status: 'PASS' | 'FAIL';
  };
  pageCount: number;
  slideCount: number;
  fileSize: {
    pdfBytes: number;
    pptxBytes: number;
  };
  checksums: {
    pdfSha256: string;
    pptxSha256: string;
  };
  exportStatus: 'EXECUTIVE_BRIEF_EXPORT_READY' | 'EXECUTIVE_BRIEF_EXPORT_BLOCKED';
  blockedReason?: string;
}

export interface ReportHistoryEntry {
  reportId: string;
  reportVersion: string;
  generatedDate: string;
  generatedBy: string;
  dataVersion: string;
  clientName: string;
  analysisPeriod: string;
  pdfFileName: string;
  pptxFileName: string;
  pdfPath: string;
  pptxPath: string;
  exportStatus: string;
}

export interface ExecutiveBriefSummaryCardItem {
  id: string;
  label: string;
  valueInr: number;
  formattedValue: string;
  module: string;
  evidenceRef: string;
}

export interface ExecutiveBriefSlideGroup {
  groupId: string;
  groupNumber: string;
  title: string;
  slideRange: string;
  summary: string;
  background: string;
  objective: string;
  finding: string;
  evidence: string;
  outcome: string;
  recommendedAction: string;
  nextStep: string;
  detailCards: ExecutiveFindingCard[];
}

export interface ExecutiveBriefTraceabilityItem {
  findingId: string;
  module: string;
  category: string;
  item: string;
  supplier: string;
  erpRecord: string;
  calculation: string;
  opportunity: string;
  savings: string;
}

export interface ExecutiveBriefValidationChecklist {
  module1Validated: boolean;
  module2Validated: boolean;
  module3Validated: boolean;
  module4Validated: boolean;
  financialReconciliation: boolean;
  transactionTraceability: boolean;
  doubleCountingControls: boolean;
  dataLineage: boolean;
  securityControls: boolean;
  reportGenerationValidation: boolean;
}

export interface ExecutiveBriefArtifactItem {
  name: string;
  filename: string;
  description: string;
  endpoint: string;
}

export interface ExecutiveBriefClientProfile {
  clientName: string;
  analysisPeriod: string;
  group: string;
  reportVersion: string;
  confidentiality: string;
  status: string;
}

export interface ExecutiveBriefReportData {
  metadata: ExecutiveBriefMetadata;
  clientProfile: ExecutiveBriefClientProfile;
  summaryCards: ExecutiveBriefSummaryCardItem[];
  sections: ExecutiveBriefSlideGroup[];
  traceabilityLineage: ExecutiveBriefTraceabilityItem[];
  validationChecklist: ExecutiveBriefValidationChecklist;
  artifacts: ExecutiveBriefArtifactItem[];
}
