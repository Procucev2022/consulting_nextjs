export type ExportStatus =
  | 'IDLE'
  | 'PREPARING'
  | 'GENERATING_PDF'
  | 'GENERATING_PPTX'
  | 'VALIDATING'
  | 'EXECUTIVE_BRIEF_EXPORT_READY'
  | 'EXECUTIVE_BRIEF_EXPORT_BLOCKED';

export interface ExportReportHistoryItem {
  reportVersion: string;
  generatedDate: string;
  generatedBy: string;
  dataVersion: string;
  pdfAvailable: boolean;
  pptxAvailable: boolean;
  pdfPath?: string;
  pptxPath?: string;
}

export interface ExportReportDetails {
  sourceDataVersion: string;
  moduleVersions: {
    module1: string;
    module2: string;
    module3: string;
    module4: string;
  };
  analysisPeriod: string;
  generationTimestamp: string;
  validationStatus: string;
  financialReconciliation: {
    status: string;
    varianceInr: number;
    varianceDisplay: string;
  };
  evidenceCount: number;
  opportunityCount: number;
  savingsCount: number;
}

export interface ExecutiveBriefExportStatusResponse {
  success: boolean;
  status: ExportStatus;
  message: string;
  reportId: string;
  reportVersion: string;
  pdfPath: string | null;
  pptxPath: string | null;
  pdfPageCount: number;
  pptxSlideCount: number;
  financialVariance: string;
  pdfValidation: string;
  pptxValidation: string;
  securityValidation: string;
  exportAuditPath: string | null;
  reportDetails: ExportReportDetails;
  history: ExportReportHistoryItem[];
  error?: string;
}

export interface ExecutiveBriefExportPanelProps {
  tenantName?: string;
  onExportSuccess?: (format: 'pdf' | 'pptx', filename: string) => void;
  onExportFailure?: (format: 'pdf' | 'pptx', reason: string) => void;
}

export interface ExecutiveBriefSummaryCardItem {
  id: string;
  label: string;
  valueInr: number;
  formattedValue: string;
  module: string;
  evidenceRef: string;
}

export interface ExecutiveFindingDetailCard {
  findingId: string;
  title: string;
  finding?: string;
  background: string;
  objective: string;
  addressableBase?: string;
  evidence: string;
  analysis: string;
  methodology?: string;
  assumption?: string;
  outcome: string;
  expectedOutcome?: string;
  potentialValueInr: number;
  potentialValueDisplay: string;
  indicativeOpportunity?: string;
  confidence: string;
  confidenceRationale: string;
  riskConstraint: string;
  recommendedAction?: string;
  nextStep: string;
  owner: string;
  timeline: string;
  detailedAnalysisRef: string;
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
  detailCards: ExecutiveFindingDetailCard[];
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
  metadata: {
    client: string;
    reportDate: string;
    analysisPeriod: string;
    modulesIncluded: string[];
    transactionCount: number;
    totalSpendInr: number;
    addressableSpendInr: number;
    grossOpportunityInr: number;
    netDefensibleOpportunityInr: number;
    approvedSavingsInr: number;
    realizedSavingsInr: number;
    opportunityCount: number;
    reportVersion: string;
  };
  clientProfile: ExecutiveBriefClientProfile;
  summaryCards: ExecutiveBriefSummaryCardItem[];
  sections: ExecutiveBriefSlideGroup[];
  traceabilityLineage: ExecutiveBriefTraceabilityItem[];
  validationChecklist: ExecutiveBriefValidationChecklist;
  artifacts: ExecutiveBriefArtifactItem[];
}

export interface ExecutiveBriefHeaderNavProps {
  clientProfile: ExecutiveBriefClientProfile;
  isReady: boolean;
  onNavigateModule: (moduleKey: string) => void;
  activeModuleKey?: string;
}

export interface ExecutiveBriefSummaryCardsProps {
  cards: ExecutiveBriefSummaryCardItem[];
  onViewEvidence: (card: ExecutiveBriefSummaryCardItem) => void;
}

export interface ExecutiveBriefFormatCardsProps {
  clientName: string;
  pdfAvailable: boolean;
  pptxAvailable: boolean;
  isGenerating: boolean;
  onDownload: (format: 'pdf' | 'pptx') => void;
  onOpenRegenerateModal: () => void;
}

export interface ExecutiveBriefSlidePreviewProps {
  onOpenFullReport?: () => void;
  onDownloadPdf?: () => void;
  selectedSlideIndex: number;
  onSelectSlideIndex: (index: number) => void;
}

export interface ExecutiveBriefStructureAccordionProps {
  sections: ExecutiveBriefSlideGroup[];
  expandedGroupIds: string[];
  onToggleGroup: (groupId: string) => void;
  expandedDeepDives: string[];
  onToggleDeepDive: (deepDiveId: string) => void;
  onDrillEvidence: (findingId: string) => void;
}

export interface ExecutiveBriefTraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: ExecutiveBriefTraceabilityItem | null;
  items: ExecutiveBriefTraceabilityItem[];
}

export interface ExecutiveBriefAuditValidationPanelProps {
  checklist: ExecutiveBriefValidationChecklist;
  artifacts: ExecutiveBriefArtifactItem[];
  onDownloadArtifact: (artifact: ExecutiveBriefArtifactItem) => void;
}

export interface ExecutiveBriefRegenerateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRegenerating: boolean;
}

export interface ExecutiveBriefOpportunityTableRow {
  analysis: string;
  addressableSpend: string;
  assumptionMethod: string;
  indicativeOpportunity: string;
  benefitType: string;
  confidence: string;
  primaryAction: string;
}

export interface ExecutiveBriefOpportunityTableProps {
  onDrillOpportunity?: (analysisKey: string) => void;
}

export interface AssumptionTaxonomyItem {
  key: string;
  badge: string;
  title: string;
  definition: string;
  colorClass: string;
}

export interface ExecutiveBriefAssumptionsPanelProps {
  onSelectAssumption?: (key: string) => void;
}

export interface RealizationRoadmapStage {
  period: string;
  title: string;
  description: string;
}

export interface ExecutiveBriefSpecialDisplaysProps {
  onSelectLever?: (leverKey: string) => void;
}

