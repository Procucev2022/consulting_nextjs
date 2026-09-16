import { geminiService } from './geminiService';
import { ANOMALY_DETECTION_SYSTEM_PROMPT, EXTRACTION_STATUS } from '../constants/ai';
import type { AnomalyAnalysisResult, AnomalyItem } from '../types/ai';
import logger from '../utils/logger';

export class AiAnomalyService {
  public async analyzeAnomalies(records: Array<{
    recordId: string;
    poNumber: string;
    vendorName: string;
    rawCurrency?: string | null;
    amount: number;
    amountInr?: number | null;
    issueFlag?: string;
  }>): Promise<AnomalyAnalysisResult> {
    if (!Array.isArray(records) || records.length === 0) {
      return {
        status: EXTRACTION_STATUS.NO_CONTENT,
        anomalies: [],
        summary: 'No pre-check records provided for anomaly analysis.',
        model: null,
        error: null
      };
    }

    const sample = records.slice(0, 50).map((r) => 
      `Record ID: ${r.recordId} | PO: ${r.poNumber} | Vendor: ${r.vendorName} | Currency: ${r.rawCurrency || 'INR'} | Amount: ${r.amount} | Current Issue: ${r.issueFlag || 'None'}`
    ).join('\n');

    const prompt = `${ANOMALY_DETECTION_SYSTEM_PROMPT}\n\nRECORDS TO ANALYZE:\n${sample}`;

    const result = await geminiService.generateJson<{ anomalies: AnomalyItem[]; summary: string }>({
      prompt,
      label: 'AI Pre-Check Anomaly Detection'
    });

    if (result.status !== EXTRACTION_STATUS.SUCCESS || !result.data) {
      logger.warn('AI anomaly analysis fallback to heuristic suggestions', {
        status: result.status,
        error: result.error
      });

      const heuristicAnomalies: AnomalyItem[] = records
        .filter((r) => r.issueFlag && r.issueFlag !== 'Valid')
        .map((r) => ({
          recordId: r.recordId,
          issueFlag: r.issueFlag || 'Anomaly Detected',
          suggestedFix: r.issueFlag?.includes('Currency')
            ? 'Apply official daily Yahoo Finance exchange rate conversion to INR'
            : r.issueFlag?.includes('Vendor')
            ? 'Merge duplicate vendor legal names into unified master entity'
            : 'Review line item price and unit of measure specification',
          actionStatus: r.issueFlag?.includes('Currency') ? 'Fix Currency' : 'Merge Vendor',
          confidence: 88
        }));

      return {
        status: EXTRACTION_STATUS.SUCCESS,
        anomalies: heuristicAnomalies,
        summary: `Identified ${heuristicAnomalies.length} validation anomalies requiring review.`,
        model: result.model,
        error: result.error
      };
    }

    return {
      status: EXTRACTION_STATUS.SUCCESS,
      anomalies: Array.isArray(result.data.anomalies) ? result.data.anomalies : [],
      summary: typeof result.data.summary === 'string' ? result.data.summary : 'Anomaly analysis complete.',
      model: result.model,
      error: null
    };
  }
}

export const aiAnomalyService = new AiAnomalyService();
