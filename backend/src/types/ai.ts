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

export interface GeminiConfig {
  API_KEY: string;
  BACKUP_KEYS: string[];
  BASE_URL: string;
  PRIMARY_MODEL: string;
  FALLBACK_MODELS: string[];
  REQUEST_TIMEOUT_MS: number;
  TOTAL_BUDGET_MS: number;
  MIN_ATTEMPT_MS: number;
  MAX_DOCUMENT_BYTES: number;
  MAX_DOCUMENT_TEXT_CHARS: number;
  TEMPERATURE: number;
}

export interface GeminiEnvironmentValues {
  GEMINI_API_KEY?: string;
  GEMINI_BACKUP_KEYS?: string;
  GEMINI_BASE_URL?: string;
  GEMINI_PRIMARY_MODEL?: string;
  GEMINI_FALLBACK_MODELS?: string;
  GEMINI_REQUEST_TIMEOUT_MS?: string | number;
  GEMINI_TOTAL_BUDGET_MS?: string | number;
  GEMINI_MIN_ATTEMPT_MS?: string | number;
  GEMINI_MAX_DOCUMENT_BYTES?: string | number;
  GEMINI_MAX_DOCUMENT_TEXT_CHARS?: string | number;
}

export interface GeminiRequestDocumentInput {
  documentText?: string;
  inlineData?: string;
  mimeType?: string;
  fileName?: string;
  requestId?: string;
}

export interface GeminiProviderAttemptFailureContext {
  model: string;
  modelIndex: number;
  keyIndex: number;
  modelCount: number;
  keyCount: number;
  requestId?: string;
  durationMs: number;
  action: string;
  message: string;
  label?: string;
}

export interface GeminiStructuredRequestInput extends GeminiRequestDocumentInput {
  promptText: string;
}

export interface GeminiInputValidationResult {
  isValid: boolean;
  errorStatus?: ExtractionStatus;
  errorMessage?: string;
}

export interface GeminiJsonGenerationInput extends GeminiRequestDocumentInput {
  prompt: string;
  label?: string;
}

export interface GeminiJsonGenerationResult<T> {
  status: ExtractionStatus;
  data: T | null;
  model: string | null;
  error: string | null;
}

export interface GeminiJsonGenerationDependencies {
  config: GeminiConfig;
  isConfigured: () => boolean;
  resolveModelChain: () => string[];
  resolveKeyChain: () => string[];
  buildRequestBody: (input: GeminiStructuredRequestInput) => unknown;
  validateExtractionInput: (input: GeminiRequestDocumentInput) => GeminiInputValidationResult;
  callModel: <T>(model: string, requestBody: unknown, timeoutMs: number, apiKey: string) => Promise<T>;
}

import type { UNSPSCCommodityRecord } from './taxonomy';
export type TaxonomyLookup = (query: string) => Promise<UNSPSCCommodityRecord | undefined>;

export interface RawAiMapping {
  rawLineText?: string;
  vendorIdentified?: string;
  mappedUnspscCode?: string;
  unspscTitle?: string;
  suggestedBucket?: string;
  confidenceScore?: number;
  reason?: string;
}
