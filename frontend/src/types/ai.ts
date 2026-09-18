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
  success: boolean;
  status: string;
  items: ExtractedProcurementItem[];
  model: string | null;
  documentTitle: string | null;
  detectedCurrency: string | null;
  totalSpend: number | null;
  durationMs?: number;
  error: string | null;
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
  success: boolean;
  status: string;
  mappings: AiCategorizationMapping[];
  model: string | null;
  durationMs?: number;
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
  success: boolean;
  status: string;
  data: ExecutiveReportData | null;
  model: string | null;
  durationMs?: number;
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
  success: boolean;
  status: string;
  anomalies: AnomalyItem[];
  summary: string;
  model: string | null;
  durationMs?: number;
  error: string | null;
}
