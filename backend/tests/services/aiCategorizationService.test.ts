import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiCategorizationService, aiCategorizationService } from '../../src/services/aiCategorizationService';
import { geminiService } from '../../src/services/geminiService';
import { CLASSIFICATION_STATUS, EXTRACTION_STATUS } from '../../src/constants/ai';

describe('AiCategorizationService Unit Tests', () => {
  let service: AiCategorizationService;

  beforeEach(() => {
    service = new AiCategorizationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return NO_CONTENT when input items array is empty', async () => {
    const result = await service.categorizeLineItems([]);
    expect(result.status).toBe(CLASSIFICATION_STATUS.NO_CONTENT);
    expect(result.mappings).toEqual([]);
  });

  it('should categorize items successfully with Gemini generateJson', async () => {
    const mockMappings = [
      {
        rawLineText: 'Centrifugal Pump 5HP',
        vendorIdentified: 'Kirloskar Brothers',
        mappedUnspscCode: '40151503',
        unspscTitle: 'Centrifugal pumps',
        suggestedBucket: 'Fluid & Gas Handling',
        confidenceScore: 98,
        reason: 'Specific technical pump specification matched'
      }
    ];

    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: { mappings: mockMappings },
      model: 'gemini-3.6-flash',
      error: null
    });

    const result = await service.categorizeLineItems([
      { rawLineText: 'Centrifugal Pump 5HP', vendorIdentified: 'Kirloskar Brothers', amount: 45000 }
    ]);

    expect(result.status).toBe(CLASSIFICATION_STATUS.SUCCESS);
    expect(result.mappings.length).toBe(1);
    expect(result.mappings[0].mappedUnspscCode).toBe('40151503');
  });

  it('should fall back to UNSPSC taxonomy classification when Gemini fails', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.AI_FAILED,
      data: null,
      model: 'gemini-3.6-flash',
      error: 'Model timeout'
    });

    const result = await service.categorizeLineItems([
      { rawLineText: 'Bleached paperboard rolls', vendorIdentified: 'Vendor A', amount: 50000 }
    ]);

    expect(result.status).toBe(CLASSIFICATION_STATUS.SUCCESS);
    expect(result.mappings.length).toBe(1);
    expect(result.mappings[0].mappedUnspscCode).toBeDefined();
    expect(result.mappings[0].confidenceScore).toBeGreaterThanOrEqual(90);
  });

  it('should assign confidenceScore 0.0 and UNCLASSIFIED status when item is unknown', async () => {
    vi.spyOn(geminiService, 'generateJson').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.AI_FAILED,
      data: null,
      model: null,
      error: 'Model offline'
    });

    const result = await service.categorizeLineItems([
      { rawLineText: 'Unknown Random Proprietary Item 9999XYZ', vendorIdentified: 'Supplier Z', amount: 12500 }
    ]);

    expect(result.status).toBe(CLASSIFICATION_STATUS.SUCCESS);
    expect(result.mappings.length).toBe(1);
    const mapping = result.mappings[0];
    expect(mapping.mappedUnspscCode).toBe('00000000');
    expect(mapping.unspscTitle).toBe('Unclassified Commodity');
    expect(mapping.confidenceScore).toBe(0.0);
    expect(mapping.reason).toContain('UNCLASSIFIED');
    expect(mapping.rawLineText).toBe('Unknown Random Proprietary Item 9999XYZ');
    expect(mapping.vendorIdentified).toBe('Supplier Z');
  });
});
