import { geminiService } from './geminiService';
import { CATEGORIZATION_SYSTEM_PROMPT, EXTRACTION_STATUS, CLASSIFICATION_STATUS, AI_MAX_LINE_ITEMS_IN_PROMPT } from '../constants/ai';
import type { AiCategorizationItem, CategorizationResult, AiCategorizationMapping } from '../types/ai';
import logger from '../utils/logger';

interface RawAiMapping {
  rawLineText?: string;
  vendorIdentified?: string;
  mappedUnspscCode?: string;
  unspscTitle?: string;
  suggestedBucket?: string;
  confidenceScore?: number;
  reason?: string;
}

export class AiCategorizationService {
  public async categorizeLineItems(items: AiCategorizationItem[]): Promise<CategorizationResult> {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        status: CLASSIFICATION_STATUS.NO_CONTENT,
        mappings: [],
        model: null,
        error: 'No items provided for categorization'
      };
    }

    const clampedItems = items.slice(0, AI_MAX_LINE_ITEMS_IN_PROMPT);
    const itemsPrompt = clampedItems
      .map((item, idx) => `${idx + 1}. Description: "${item.rawLineText}" | Vendor: "${item.vendorIdentified || 'Unknown'}" | Spend: ${item.amount ?? 0}`)
      .join('\n');

    const prompt = `${CATEGORIZATION_SYSTEM_PROMPT}\n\nPURCHASE LINE ITEMS TO CATEGORIZE:\n${itemsPrompt}`;

    const result = await geminiService.generateJson<{ mappings: RawAiMapping[] }>({
      prompt,
      label: 'UNSPSC AI Categorization'
    });

    if (result.status !== EXTRACTION_STATUS.SUCCESS || !result.data) {
      logger.warn('AI categorization fallback: Gemini call did not succeed', {
        status: result.status,
        error: result.error
      });
      return {
        status: CLASSIFICATION_STATUS.AI_FAILED,
        mappings: [],
        model: result.model,
        error: result.error || 'Categorization model failed'
      };
    }

    const rawMappings = Array.isArray(result.data.mappings) ? result.data.mappings : [];
    const mappings: AiCategorizationMapping[] = rawMappings.map((m: RawAiMapping) => ({
      rawLineText: typeof m?.rawLineText === 'string' ? m.rawLineText : '',
      vendorIdentified: typeof m?.vendorIdentified === 'string' ? m.vendorIdentified : 'Unknown',
      mappedUnspscCode: typeof m?.mappedUnspscCode === 'string' ? m.mappedUnspscCode : '43211500',
      unspscTitle: typeof m?.unspscTitle === 'string' ? m.unspscTitle : 'Industrial & Commercial Supplies',
      suggestedBucket: typeof m?.suggestedBucket === 'string' ? m.suggestedBucket : 'General Procurement',
      confidenceScore: typeof m?.confidenceScore === 'number' ? m.confidenceScore : 85,
      reason: typeof m?.reason === 'string' ? m.reason : 'Categorized via Gemini AI semantic mapping'
    }));

    return {
      status: CLASSIFICATION_STATUS.SUCCESS,
      mappings,
      model: result.model,
      error: null
    };
  }
}

export const aiCategorizationService = new AiCategorizationService();
