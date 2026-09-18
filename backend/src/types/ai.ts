import type { EXTRACTION_STATUS, CLASSIFICATION_STATUS } from '../constants/ai';

export type ExtractionStatus = typeof EXTRACTION_STATUS[keyof typeof EXTRACTION_STATUS];
export type ClassificationStatus = typeof CLASSIFICATION_STATUS[keyof typeof CLASSIFICATION_STATUS];

export interface ExtractedProcurementItem {
  poNumber: string | null;
  vendorName: string | null;
  itemDescription: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  totalAmount: number;
  currency: string | null;
  date: string | null;
  suggestedCategory: string | null;
}

export interface ExtractionResult {
  status: ExtractionStatus;
  items: ExtractedProcurementItem[];
  model: string | null;
  documentTitle: string | null;
  detectedCurrency: string | null;
  totalSpend: number | null;
  error: string | null;
}

export interface AiCategorizationItem {
  rawLineText: string;
  vendorIdentified?: string;
  amount?: number;
}

export interface AiCategorizationMapping {
  rawLineText: string;
  vendorIdentified: string;
  mappedUnspscCode: string;
  unspscTitle: string;
  suggestedBucket: string;
  confidenceScore: number;
  reason: string;
}

export interface CategorizationResult {
  status: ClassificationStatus;
  mappings: AiCategorizationMapping[];
  model: string | null;
  error: string | null;
}

export interface SavingsOpportunityPayload {
  category: string;
  currentSpendInrCr: number;
  targetSavingsPct: number;
  estSavingsInrCr: number;
  actionableStrategy: string;
}

export interface StrategicRoadmapPhase {
  phase: string;
  actions: string[];
}

export interface ExecutiveReportData {
  executiveSummary: string;
  totalSpendEvaluated: number;
  topRiskObservations: string[];
  savingsOpportunities: SavingsOpportunityPayload[];
  vendorConsolidationRoadmap: string[];
  strategicRoadmapPhases: StrategicRoadmapPhase[];
}

export interface ExecutiveReportResult {
  status: ExtractionStatus;
  data: ExecutiveReportData | null;
  model: string | null;
  error: string | null;
}

export interface AnomalyItem {
  recordId: string;
  issueFlag: string;
  suggestedFix: string;
  actionStatus: string;
  confidence: number;
}

export interface AnomalyAnalysisResult {
  status: ExtractionStatus;
  anomalies: AnomalyItem[];
  summary: string;
  model: string | null;
  error: string | null;
}
