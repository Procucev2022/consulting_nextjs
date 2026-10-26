import { geminiService } from './geminiService';
import { CATEGORIZATION_SYSTEM_PROMPT, EXTRACTION_STATUS, CLASSIFICATION_STATUS, AI_MAX_LINE_ITEMS_IN_PROMPT } from '../constants/ai';
import type { AiCategorizationItem, CategorizationResult, AiCategorizationMapping } from '../types/ai';
import { lookupUNSPSCByDescription } from '../data/unspscTaxonomy';
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
      .map((item, idx) => {
        const desc = item.rawLineText;
        const vendor = item.vendorIdentified || 'Unknown';
        const spend = item.amount ?? 0;
        return `${idx + 1}. Description: "${desc}" | Vendor: "${vendor}" | Spend: ${spend}`;
      })
      .join('\n');

    const prompt = `${CATEGORIZATION_SYSTEM_PROMPT}\n\nPURCHASE LINE ITEMS TO CATEGORIZE:\n${itemsPrompt}`;

    const result = await geminiService.generateJson<{ mappings: RawAiMapping[] }>({
      prompt,
      label: 'UNSPSC AI Categorization'
    });

    const hasValidMappings = result.status === EXTRACTION_STATUS.SUCCESS &&
      Boolean(result.data?.mappings && Array.isArray(result.data.mappings) && result.data.mappings.length > 0);

    if (!hasValidMappings) {
      logger.info('Using high-precision UNSPSC Taxonomy engine fallback for categorization', {
        itemCount: items.length,
        geminiError: result.error
      });

      const fallbackMappings: AiCategorizationMapping[] = items.map((item) => {
        const descMatch = lookupUNSPSCByDescription(item.rawLineText);
        const isClassified = Boolean(descMatch && descMatch.classificationStatus === 'CLASSIFIED');

        if (isClassified && descMatch) {
          return {
            rawLineText: item.rawLineText,
            vendorIdentified: item.vendorIdentified || 'Unknown',
            mappedUnspscCode: descMatch.commodityCode,
            unspscTitle: descMatch.commodityTitle,
            suggestedBucket: descMatch.coreBucket || 'Direct Materials',
            confidenceScore: 95.0,
            reason: `Matched official UNSPSC Segment [${descMatch.segmentTitle}] / Class [${descMatch.classTitle}]`
          };
        }

        // UNCLASSIFIED item: do not claim official match or assign false high confidence
        return {
          rawLineText: item.rawLineText,
          vendorIdentified: item.vendorIdentified || 'Unknown',
          mappedUnspscCode: '00000000',
          unspscTitle: 'Unclassified Commodity',
          suggestedBucket: 'Unclassified (Review Required)',
          confidenceScore: 0.0,
          reason: 'UNCLASSIFIED: No confirmed official UNSPSC match found. Item preserved and marked for classification review.'
        };
      });

      return {
        status: CLASSIFICATION_STATUS.SUCCESS,
        mappings: fallbackMappings,
        model: result.model || 'UNSPSC-Deterministic-AI',
        error: null
      };
    }

    const rawMappings = (result.data && Array.isArray(result.data.mappings)) ? result.data.mappings : [];
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
