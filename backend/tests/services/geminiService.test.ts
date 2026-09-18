import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService, geminiService } from '../../src/services/geminiService';
import { EXTRACTION_STATUS } from '../../src/constants/ai';

describe('GeminiService Unit Tests', () => {
  let service: GeminiService;

  beforeEach(() => {
    service = new GeminiService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should check isConfigured and resolve fallback model chain', () => {
    expect(service.isConfigured()).toBe(true);
    const chain = service.resolveModelChain();
    expect(Array.isArray(chain)).toBe(true);
    expect(chain.length).toBeGreaterThan(0);
  });

  it('should extract response text from multi-part candidates', () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [{ text: '{"key":' }, { text: '"value"}' }]
          }
        }
      ]
    };
    expect(service.extractResponseText(payload)).toBe('{"key":"value"}');
    expect(service.extractResponseText(null)).toBe('');
    expect(service.extractResponseText({})).toBe('');
  });

  it('should parse extraction JSON stripping markdown code fences', () => {
    const fenced = '```json\n{"message": "success", "count": 10}\n```';
    const parsed = service.parseExtractionJson<{ message: string; count: number }>(fenced);
    expect(parsed).toEqual({ message: 'success', count: 10 });

    const raw = '  {"status": "ok"}  ';
    expect(service.parseExtractionJson(raw)).toEqual({ status: 'ok' });

    expect(service.parseExtractionJson('')).toBeNull();
    expect(service.parseExtractionJson('invalid json {')).toBeNull();
    expect(service.parseExtractionJson('no braces here')).toBeNull();
  });

  it('should handle generateJson with empty prompt', async () => {
    const result = await service.generateJson({ prompt: '' });
    expect(result.status).toBe(EXTRACTION_STATUS.NO_CONTENT);
  });

  it('should successfully execute generateJson when fetch resolves valid JSON', async () => {
    const mockJson = { items: [{ name: 'Valves', spend: 5000 }] };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockJson) }] } }]
      })
    } as any);

    const result = await service.generateJson({ prompt: 'Extract items', label: 'test' });
    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.data).toEqual(mockJson);
  });

  it('should handle model failure and try fallback in generateJson', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Model overloaded'
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"status":"fallback_success"}' }] } }]
        })
      } as any);

    const result = await service.generateJson({ prompt: 'Generate summary', label: 'fallback_test' });
    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.data).toEqual({ status: 'fallback_success' });
  });

  it('should return AI_FAILED when all models fail in generateJson', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable'
    } as any);

    const result = await service.generateJson({ prompt: 'Generate report' });
    expect(result.status).toBe(EXTRACTION_STATUS.AI_FAILED);
    expect(result.error).toBeDefined();
  });

  it('should extract line items from documentText', async () => {
    const mockExtracted = {
      documentTitle: 'PO 89012',
      detectedCurrency: 'INR',
      totalSpend: 150000,
      items: [
        {
          poNumber: 'PO-89012',
          vendorName: 'Siemens Ltd',
          itemDescription: 'High Pressure Valve 2 inch',
          quantity: 10,
          unit: 'Nos',
          unitPrice: 15000,
          totalAmount: 150000,
          currency: 'INR',
          date: '2025-01-10',
          suggestedCategory: 'Industrial Valves'
        }
      ]
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockExtracted) }] } }]
      })
    } as any);

    const result = await service.extractLineItems({
      documentText: 'PO-89012 Siemens Ltd High Pressure Valve 2 inch 10 Nos 15000 150000',
      fileName: 'PO_89012.pdf'
    });

    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.items.length).toBe(1);
    expect(result.items[0].vendorName).toBe('Siemens Ltd');
    expect(result.totalSpend).toBe(150000);
  });

  it('should return NO_CONTENT when no documentText or inlineData is provided', async () => {
    const result = await service.extractLineItems({});
    expect(result.status).toBe(EXTRACTION_STATUS.NO_CONTENT);
  });

  it('should validate unsupported mime type and document size', async () => {
    const unsupported = await service.extractLineItems({
      inlineData: 'SGVsbG8=',
      mimeType: 'application/exe'
    });
    expect(unsupported.status).toBe(EXTRACTION_STATUS.UNSUPPORTED_TYPE);

    const hugeData = 'A'.repeat(15000000);
    const tooLarge = await service.extractLineItems({
      inlineData: hugeData,
      mimeType: 'application/pdf'
    });
    expect(tooLarge.status).toBe(EXTRACTION_STATUS.DOCUMENT_TOO_LARGE);
  });

  it('should return NO_ITEMS_FOUND when model returns empty item array', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"items":[]}' }] } }]
      })
    } as any);

    const result = await service.extractLineItems({ documentText: 'Blank receipt text' });
    expect(result.status).toBe(EXTRACTION_STATUS.NO_ITEMS_FOUND);
  });
});
