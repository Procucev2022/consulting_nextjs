import frontendLogger from './logger';
import type {
  ExtractionResult,
  CategorizationResult,
  ExecutiveReportResult,
  AnomalyAnalysisResult
} from '../types/ai';

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');

export const aiApiClient = {
  async checkConfig(): Promise<{
    success: boolean;
    configured: boolean;
    primaryModel: string | null;
    fallbackModels: string[];
  }> {
    frontendLogger.debug('Checking Gemini AI configuration');
    const res = await fetch(`${API_BASE}/api/ai/config`);
    return await res.json();
  },

  async extractDocument(payload: {
    documentText?: string;
    inlineData?: string;
    mimeType?: string;
    fileName?: string;
  }): Promise<ExtractionResult> {
    frontendLogger.info('Invoking Gemini document AI extraction', { fileName: payload.fileName });
    const res = await fetch(`${API_BASE}/api/ai/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async categorizeItems(items: Array<{
    rawLineText: string;
    vendorIdentified?: string;
    amount?: number;
  }>): Promise<CategorizationResult> {
    frontendLogger.info('Invoking Gemini UNSPSC AI categorization', { itemCount: items.length });
    const res = await fetch(`${API_BASE}/api/ai/categorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return await res.json();
  },

  async generateExecutiveSummary(payload: {
    tenantName?: string;
    totalSpendInrCr: number;
    categories: Array<{ name: string; spendInrCr: number; targetReductionPct: number }>;
    vendors: Array<{ vendorName: string; totalSpendInrCr: number; priceCreepPct?: number }>;
    currency?: string;
  }): Promise<ExecutiveReportResult> {
    frontendLogger.info('Generating AI executive strategic report via Gemini');
    const res = await fetch(`${API_BASE}/api/ai/executive-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async analyzeAnomalies(records: Array<{
    recordId: string;
    poNumber: string;
    vendorName: string;
    rawCurrency?: string | null;
    amount: number;
    amountInr?: number | null;
    issueFlag?: string;
  }>): Promise<AnomalyAnalysisResult> {
    frontendLogger.info('Running Gemini pre-check anomaly detection', { recordCount: records.length });
    const res = await fetch(`${API_BASE}/api/ai/analyze-anomalies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    });
    return await res.json();
  }
};
