import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService, geminiService } from '../../src/services/geminiService';
import {
  AI_LOG_ACTIONS,
  AI_LOG_MESSAGES,
  EXTRACTION_STATUS,
  EXTRACTION_SYSTEM_PROMPT
} from '../../src/constants/ai';
import type { CloudflareEnvironment } from '../../src/types/cloudflare';
import type { GeminiConfig } from '../../src/types/ai';
import logger from '../../src/utils/logger';

// Logging is replaced so the suite neither writes backend/logs nor floods the console.
vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const CONFIGURED_ENV: CloudflareEnvironment = {
  GEMINI_API_KEY: 'primary-key',
  GEMINI_BACKUP_KEYS: 'backup-key-1, backup-key-2',
  GEMINI_BASE_URL: 'https://gemini.test/v1beta/models',
  GEMINI_PRIMARY_MODEL: 'model-primary',
  GEMINI_FALLBACK_MODELS: 'model-fallback-1, model-fallback-2',
  GEMINI_REQUEST_TIMEOUT_MS: '5000',
  GEMINI_TOTAL_BUDGET_MS: '60000',
  GEMINI_MIN_ATTEMPT_MS: '10',
  GEMINI_MAX_DOCUMENT_BYTES: '1000',
  GEMINI_MAX_DOCUMENT_TEXT_CHARS: '50'
};

describe('GeminiService Unit Tests', () => {
  let service: GeminiService;

  beforeEach(() => {
    service = new GeminiService();
    service.configureForEnvironment(CONFIGURED_ENV);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should check isConfigured and resolve fallback model chain', () => {
    expect(service.isConfigured()).toBe(true);
    const chain = service.resolveModelChain();
    expect(Array.isArray(chain)).toBe(true);
    expect(chain.length).toBeGreaterThan(0);
    const keyChain = service.resolveKeyChain();
    expect(Array.isArray(keyChain)).toBe(true);
    expect(keyChain.length).toBeGreaterThan(1);
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

  it('should handle failure in extractLineItems across models and keys', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Model not found'
    } as any);

    const result = await service.extractLineItems({ documentText: 'Line item text' });
    expect(result.status).toBe(EXTRACTION_STATUS.AI_FAILED);
    expect(result.error).toContain('404');
  });

  it('should rotate to backup key when first key responds with 429', async () => {
    let callCount = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async (url, init: any) => {
      callCount++;
      const apiKey = init?.headers?.['x-goog-api-key'];
      if (callCount === 1) {
        return {
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded'
        } as any;
      }
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ keyUsed: apiKey, success: true }) }] } }]
        })
      } as any;
    });

    const result = await service.generateJson<{ keyUsed: string; success: boolean }>({ prompt: 'Test backup key' });
    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.data?.success).toBe(true);
    expect(callCount).toBe(2);
  });

  it('should return NOT_CONFIGURED when API key is missing', async () => {
    const unconfiguredService = new GeminiService();
    vi.spyOn(unconfiguredService, 'isConfigured').mockReturnValue(false);
    const result = await unconfiguredService.extractLineItems({ documentText: 'sample text' });
    expect(result.status).toBe(EXTRACTION_STATUS.NOT_CONFIGURED);
  });

  it('should compute totalSpend from items reduce if not provided in JSON', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                items: [
                  { poNumber: 'PO-1', vendorName: 'V1', itemDescription: 'D1', quantity: 1, unitPrice: 100, totalAmount: 100 },
                  { poNumber: 'PO-2', vendorName: 'V2', itemDescription: 'D2', quantity: 2, unitPrice: 200, totalAmount: 400 }
                ]
              })
            }]
          }
        }]
      })
    } as any);

    const result = await service.extractLineItems({ documentText: 'text' });
    expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
    expect(result.totalSpend).toBe(500);
  });
});

// Services built below use explicit values and a vi.fn fetch stub. No request leaves the process,
// and results do not depend on backend/.env.
type PrivateAttemptHooks = {
  attemptModelExtraction: (...args: unknown[]) => Promise<unknown>;
};

type PrivateValidationHooks = {
  validateExtractionInput: (input: unknown) => { isValid: boolean; errorStatus?: string; errorMessage?: string };
};

const fetchMock = vi.fn<typeof fetch>();

const geminiOkResponse = (text: string): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    text: async () => text
  }) as unknown as Response;

const geminiErrorResponse = (status: number, detail: string): Response =>
  ({ ok: false, status, text: async () => detail }) as unknown as Response;

const configuredService = (overrides: CloudflareEnvironment = {}): GeminiService => {
  const service = new GeminiService();
  service.configureForEnvironment({ ...CONFIGURED_ENV, ...overrides });
  return service;
};

const overrideConfig = (target: GeminiService, overrides: Partial<GeminiConfig>): void => {
  const holder = target as unknown as { config: GeminiConfig };
  holder.config = { ...holder.config, ...overrides };
};

const requestParts = (callIndex: number): Array<Record<string, unknown>> => {
  const init = fetchMock.mock.calls[callIndex]?.[1];
  const body = JSON.parse(String(init?.body)) as { contents: Array<{ parts: Array<Record<string, unknown>> }> };
  return body.contents[0].parts;
};

describe('GeminiService configured behaviour', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('configuration', () => {
    it('should resolve the primary model before fallbacks and the API key before backups', () => {
      const service = configuredService();

      expect(service.isConfigured()).toBe(true);
      expect(service.resolveModelChain()).toEqual(['model-primary', 'model-fallback-1', 'model-fallback-2']);
      expect(service.resolveKeyChain()).toEqual(['primary-key', 'backup-key-1', 'backup-key-2']);
    });

    it('should drop duplicate keys from the key chain', () => {
      const service = configuredService({ GEMINI_API_KEY: 'same-key', GEMINI_BACKUP_KEYS: 'same-key, other-key' });

      expect(service.resolveKeyChain()).toEqual(['same-key', 'other-key']);
    });

    it('should treat backup keys alone as configured', () => {
      const service = configuredService({ GEMINI_API_KEY: undefined, GEMINI_BACKUP_KEYS: 'backup-only' });

      expect(service.isConfigured()).toBe(true);
      expect(service.resolveKeyChain()).toEqual(['backup-only']);
    });

    it('should report not configured when no key of any kind is set', () => {
      const service = configuredService({ GEMINI_API_KEY: undefined, GEMINI_BACKUP_KEYS: undefined });

      expect(service.isConfigured()).toBe(false);
      expect(service.resolveKeyChain()).toEqual([]);
    });

    it('should tolerate a missing backup key list when reporting configuration', () => {
      const service = configuredService();
      overrideConfig(service, { BACKUP_KEYS: undefined });

      expect(service.resolveKeyChain()).toEqual(['primary-key']);
      expect(service.isConfigured()).toBe(true);

      overrideConfig(service, { API_KEY: '' });
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('response parsing', () => {
    it('should ignore non-text parts when extracting response text', () => {
      const text = configuredService().extractResponseText({
        candidates: [{ content: { parts: [{ inline_data: { mime_type: 'image/png', data: 'AAAA' } }, { text: 'kept' }] } }]
      });

      expect(text).toBe('kept');
    });

    it('should parse JSON inside a fence without a language tag', () => {
      expect(configuredService().parseExtractionJson('```\n{"a": 1}\n```')).toEqual({ a: 1 });
    });

    it('should parse JSON surrounded by prose', () => {
      expect(configuredService().parseExtractionJson('Here is the result: {"ok": true} Thanks!')).toEqual({ ok: true });
    });

    it('should return null when the braced text is not valid JSON', () => {
      expect(configuredService().parseExtractionJson('{not: valid json}')).toBeNull();
    });
  });

  describe('callModel', () => {
    it('should post the body to the model endpoint with the supplied API key', async () => {
      fetchMock.mockResolvedValueOnce(geminiOkResponse('{"value": 7}'));

      const parsed = await configuredService().callModel<{ value: number }>('model-x', { hello: 'world' }, 3000, 'key-x');

      expect(parsed).toEqual({ value: 7 });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://gemini.test/v1beta/models/model-x:generateContent');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', 'x-goog-api-key': 'key-x' });
      expect(init?.body).toBe(JSON.stringify({ hello: 'world' }));
    });

    it('should default to the primary API key when none is supplied', async () => {
      fetchMock.mockResolvedValueOnce(geminiOkResponse('{"ok": 1}'));

      await configuredService().callModel('model-default', {});

      const [, init] = fetchMock.mock.calls[0];
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', 'x-goog-api-key': 'primary-key' });
    });

    it('should report the status and at most 200 characters of an error body', async () => {
      fetchMock.mockResolvedValueOnce(geminiErrorResponse(500, 'x'.repeat(300)));

      const error = await configuredService()
        .callModel('model-x', {}, 3000, 'key')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(`Gemini model-x responded 500: ${'x'.repeat(200)}`);
    });

    it('should use an empty detail when the error body cannot be read', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => {
          throw new Error('stream closed');
        }
      } as unknown as Response);

      await expect(configuredService().callModel('model-x', {}, 3000, 'key')).rejects.toThrow(/^Gemini model-x responded 503: $/);
    });

    it('should reject a successful response that contains no parseable JSON', async () => {
      const prose = `I cannot produce JSON for this document. ${'filler '.repeat(30)}`;
      fetchMock.mockResolvedValueOnce(geminiOkResponse(prose));

      await expect(configuredService().callModel('model-x', {}, 3000, 'key')).rejects.toThrow(
        `Gemini model-x returned no parseable JSON: ${prose.slice(0, 100)}`
      );
    });

    it('should abort the request when the timeout elapses', async () => {
      fetchMock.mockImplementation(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('request aborted by timer')));
          })
      );

      await expect(configuredService().callModel('model-slow', {}, 1, 'key')).rejects.toThrow('request aborted by timer');
      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    });
  });

  describe('generateJson', () => {
    it('should return NOT_CONFIGURED with a warning and no model call when no key exists', async () => {
      const service = configuredService({ GEMINI_API_KEY: undefined, GEMINI_BACKUP_KEYS: undefined });

      const result = await service.generateJson({ prompt: 'Summarize', label: 'empty-config' });

      expect(result).toEqual({
        status: EXTRACTION_STATUS.NOT_CONFIGURED,
        data: null,
        model: null,
        error: 'GEMINI_API_KEY not set'
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Gemini empty-config skipped: GEMINI_API_KEY is not set',
        { label: 'empty-config' },
        expect.any(Error)
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should treat a non-string prompt as empty content', async () => {
      const result = await configuredService().generateJson({ prompt: undefined as unknown as string });

      expect(result).toEqual({
        status: EXTRACTION_STATUS.NO_CONTENT,
        data: null,
        model: null,
        error: 'Prompt is empty'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should log a failed attempt, retry the next key, and log the successful model with its label', async () => {
      fetchMock
        .mockResolvedValueOnce(geminiErrorResponse(500, 'Busy'))
        .mockResolvedValueOnce(geminiOkResponse('{"status":"done"}'));

      const result = await configuredService().generateJson({
        prompt: 'Summarize',
        label: 'report',
        requestId: 'report-request-1'
      });

      expect(result).toEqual({
        status: EXTRACTION_STATUS.SUCCESS,
        data: { status: 'done' },
        model: 'model-primary',
        error: null
      });
      expect(logger.warn).toHaveBeenCalledWith(AI_LOG_MESSAGES.jsonGenerationAttemptFailed, expect.objectContaining({
        action: AI_LOG_ACTIONS.jsonGenerationAttempt,
        provider: 'gemini',
        model: 'model-primary',
        label: 'report',
        requestId: 'report-request-1',
        statusCode: 500,
        durationMs: expect.any(Number),
        fallbackAttemptConfigured: true,
        error: 'Gemini model-primary responded 500: Busy'
      }), expect.objectContaining({
        name: 'Error',
        message: 'Gemini model-primary responded 500: Busy',
        stack: expect.any(String)
      }));
      expect(logger.info).toHaveBeenCalledWith(AI_LOG_MESSAGES.jsonGenerationSucceeded, {
        action: AI_LOG_ACTIONS.jsonGenerationSucceeded,
        provider: 'gemini',
        model: 'model-primary',
        label: 'report',
        requestId: 'report-request-1',
        durationMs: expect.any(Number)
      });
    });

    it('should send inline PDF data and file name with a structured extraction prompt', async () => {
      fetchMock.mockResolvedValueOnce(geminiOkResponse('{"observations":[{"observationDate":"2026-10-01","value":25}]}'));

      const result = await configuredService().generateJson({
        prompt: 'Extract dated commodity prices',
        label: 'research-pdf',
        inlineData: 'JVBERi0xLjQ=',
        mimeType: 'application/pdf',
        fileName: 'steel-index.pdf'
      });

      expect(result).toMatchObject({ status: EXTRACTION_STATUS.SUCCESS, model: 'model-primary' });
      expect(requestParts(0)).toEqual([
        { text: 'Extract dated commodity prices' },
        { text: '\nDOCUMENT FILE NAME: steel-index.pdf' },
        { inline_data: { mime_type: 'application/pdf', data: 'JVBERi0xLjQ=' } }
      ]);
    });

    it('should reject unsupported inline types and oversized inline data before calling the model', async () => {
      const service = configuredService();

      const unsupported = await service.generateJson({ prompt: 'Extract', inlineData: 'YQ==', mimeType: 'application/octet-stream' });
      const oversized = await service.generateJson({ prompt: 'Extract', inlineData: 'A'.repeat(1335), mimeType: 'application/pdf' });

      expect(unsupported).toMatchObject({ status: EXTRACTION_STATUS.UNSUPPORTED_TYPE, data: null });
      expect(oversized).toMatchObject({ status: EXTRACTION_STATUS.DOCUMENT_TOO_LARGE, data: null });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should stop without calling the model when the total budget is already spent', async () => {
      const result = await configuredService({ GEMINI_TOTAL_BUDGET_MS: '0' }).generateJson({ prompt: 'Summarize' });

      expect(result).toEqual({ status: EXTRACTION_STATUS.AI_FAILED, data: null, model: null, error: '' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should skip the remaining keys for a model after a 404 and try the next model', async () => {
      fetchMock.mockResolvedValue(geminiErrorResponse(404, 'Model not found'));

      const result = await configuredService().generateJson({ prompt: 'Summarize' });

      const urls = fetchMock.mock.calls.map(([url]) => String(url));
      expect(urls).toHaveLength(3);
      expect(urls[0]).toContain('/model-primary:generateContent');
      expect(urls[1]).toContain('/model-fallback-1:generateContent');
      expect(urls[2]).toContain('/model-fallback-2:generateContent');
      expect(result.status).toBe(EXTRACTION_STATUS.AI_FAILED);
      expect(result.error).toBe(
        'model-primary: Gemini model-primary responded 404: Model not found | ' +
          'model-fallback-1: Gemini model-fallback-1 responded 404: Model not found | ' +
          'model-fallback-2: Gemini model-fallback-2 responded 404: Model not found'
      );
    });
  });

  describe('extractLineItems', () => {
    it('should send inline document data with its MIME type and the file name', async () => {
      fetchMock.mockResolvedValueOnce(
        geminiOkResponse('{"documentTitle":"Doc","items":[{"itemDescription":"Pump","totalAmount":10}]}')
      );

      const result = await configuredService().extractLineItems({
        inlineData: 'SGVsbG8=',
        mimeType: 'application/pdf',
        fileName: 'scan.pdf'
      });

      expect(result).toMatchObject({
        status: EXTRACTION_STATUS.SUCCESS,
        documentTitle: 'Doc',
        detectedCurrency: 'INR',
        totalSpend: 10,
        model: 'model-primary'
      });
      expect(requestParts(0)).toEqual([
        { text: EXTRACTION_SYSTEM_PROMPT },
        { text: '\nDOCUMENT FILE NAME: scan.pdf' },
        { inline_data: { mime_type: 'application/pdf', data: 'SGVsbG8=' } }
      ]);
    });

    it('should trim document text to the configured character limit', async () => {
      fetchMock.mockResolvedValueOnce(geminiOkResponse('{"items":[]}'));

      const result = await configuredService().extractLineItems({ documentText: `  ${'A'.repeat(60)}  ` });

      expect(result.status).toBe(EXTRACTION_STATUS.NO_ITEMS_FOUND);
      expect(requestParts(0)).toEqual([
        { text: EXTRACTION_SYSTEM_PROMPT },
        { text: `\nDOCUMENT TEXT:\n${'A'.repeat(50)}` }
      ]);
    });

    it('should accept inline data at the size limit and reject data one unit over it', async () => {
      fetchMock.mockResolvedValueOnce(geminiOkResponse('{"items":[{"itemDescription":"Seal","totalAmount":5}]}'));
      const service = configuredService();

      const atLimit = await service.extractLineItems({ inlineData: 'A'.repeat(1334), mimeType: 'image/png' });
      expect(atLimit.status).toBe(EXTRACTION_STATUS.SUCCESS);

      const overLimit = await service.extractLineItems({ inlineData: 'A'.repeat(1335), mimeType: 'image/png' });
      expect(overLimit.status).toBe(EXTRACTION_STATUS.DOCUMENT_TOO_LARGE);
      expect(overLimit.error).toBe('Document exceeds size limit');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should reject inline data that has no MIME type', async () => {
      const result = await configuredService().extractLineItems({ inlineData: 'SGVsbG8=' });

      expect(result.status).toBe(EXTRACTION_STATUS.UNSUPPORTED_TYPE);
      expect(result.error).toBe('MIME type "undefined" is not supported for AI document processing');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should report no content when document text and inline data are blank', async () => {
      const result = await configuredService().extractLineItems({ documentText: '   ', inlineData: '   ' });

      expect(result.status).toBe(EXTRACTION_STATUS.NO_CONTENT);
      expect(result.error).toBe('Neither document text nor file data was provided for extraction');
    });

    it('should report no content when called without arguments', async () => {
      const result = await configuredService().extractLineItems();

      expect(result.status).toBe(EXTRACTION_STATUS.NO_CONTENT);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should return NOT_CONFIGURED with a warning and no model call when no key exists', async () => {
      const service = configuredService({ GEMINI_API_KEY: undefined, GEMINI_BACKUP_KEYS: undefined });

      const result = await service.extractLineItems({ documentText: 'Text' });

      expect(result).toMatchObject({ status: EXTRACTION_STATUS.NOT_CONFIGURED, error: 'GEMINI_API_KEY not configured' });
      expect(logger.warn).toHaveBeenCalledWith(
        'Gemini extraction skipped: GEMINI_API_KEY is not set',
        {},
        expect.any(Error)
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should stop when the remaining budget is below the minimum attempt time', async () => {
      const result = await configuredService({ GEMINI_TOTAL_BUDGET_MS: '0' }).extractLineItems({
        documentText: 'Line text'
      });

      expect(result).toMatchObject({ status: EXTRACTION_STATUS.AI_FAILED, error: '', items: [] });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should retry with the backup key after a non-404 failure and log the failed attempt', async () => {
      fetchMock
        .mockResolvedValueOnce(geminiErrorResponse(500, 'Server busy'))
        .mockResolvedValueOnce(geminiOkResponse('{"items":[{"itemDescription":"Gasket","totalAmount":7}]}'));

      const result = await configuredService().extractLineItems({
        documentText: 'Gasket 7',
        requestId: 'extract-request-1'
      });

      expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
      expect(result.model).toBe('model-primary');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ 'x-goog-api-key': 'backup-key-1' });
      expect(logger.warn).toHaveBeenCalledWith(AI_LOG_MESSAGES.extractionAttemptFailed, expect.objectContaining({
        action: AI_LOG_ACTIONS.extractionAttempt,
        provider: 'gemini',
        model: 'model-primary',
        requestId: 'extract-request-1',
        statusCode: 500,
        durationMs: expect.any(Number),
        fallbackAttemptConfigured: true,
        error: 'Gemini model-primary responded 500: Server busy'
      }), expect.objectContaining({
        name: 'Error',
        message: 'Gemini model-primary responded 500: Server busy',
        stack: expect.any(String)
      }));
    });

    it('logs non-Error provider failures and continues through the fallback chain', async () => {
      fetchMock.mockRejectedValueOnce('network unavailable')
        .mockResolvedValueOnce(geminiOkResponse('{"items":[{"itemDescription":"Gasket","totalAmount":7}]}'));

      const result = await configuredService().extractLineItems({ documentText: 'Gasket 7' });

      expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
      expect(logger.warn).toHaveBeenCalledWith(AI_LOG_MESSAGES.extractionAttemptFailed, expect.objectContaining({
        model: 'model-primary',
        error: 'network unavailable',
        fallbackAttemptConfigured: true
      }), 'network unavailable');
    });

    it('logs when a provider failure has no backup key or model available', async () => {
      fetchMock.mockResolvedValueOnce(geminiErrorResponse(500, 'Unavailable'));
      const service = configuredService();
      overrideConfig(service, {
        PRIMARY_MODEL: 'model-only',
        FALLBACK_MODELS: [],
        BACKUP_KEYS: []
      });

      const result = await service.extractLineItems({ documentText: 'Gasket 7' });

      expect(result.status).toBe(EXTRACTION_STATUS.AI_FAILED);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(AI_LOG_MESSAGES.extractionAttemptFailed, expect.objectContaining({
        model: 'model-only',
        statusCode: 500,
        fallbackAttemptConfigured: false
      }), expect.any(Error));
    });

    it('should move to the next model after a 404 and report that model', async () => {
      fetchMock
        .mockResolvedValueOnce(geminiErrorResponse(404, 'Gone'))
        .mockResolvedValueOnce(geminiOkResponse('{"items":[{"itemDescription":"Ring","totalAmount":3}]}'));

      const result = await configuredService().extractLineItems({ documentText: 'Ring' });

      expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
      expect(result.model).toBe('model-fallback-1');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(AI_LOG_MESSAGES.extractionAttemptFailed, expect.objectContaining({
        statusCode: 404,
        fallbackAttemptConfigured: true
      }), expect.objectContaining({ message: 'Gemini model-primary responded 404: Gone' }));
    });

    it('logs when a missing provider model has no fallback model left', async () => {
      fetchMock.mockResolvedValue(geminiErrorResponse(404, 'Gone'));

      const result = await configuredService().extractLineItems({ documentText: 'Line text' });

      expect(result.status).toBe(EXTRACTION_STATUS.AI_FAILED);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenLastCalledWith(AI_LOG_MESSAGES.extractionAttemptFailed, expect.objectContaining({
        model: 'model-fallback-2',
        statusCode: 404,
        fallbackAttemptConfigured: false
      }), expect.any(Error));
    });

    it('should use the file name as the document title when the model returns a non-text title', async () => {
      fetchMock.mockResolvedValueOnce(
        geminiOkResponse('{"documentTitle": 12, "items":[{"itemDescription":"Bolt","totalAmount":2}]}')
      );

      const result = await configuredService().extractLineItems({ documentText: 'Bolt', fileName: 'po-2025.pdf' });

      expect(result.documentTitle).toBe('po-2025.pdf');
    });

    it('should report no items with empty metadata when the response omits the items array', async () => {
      fetchMock.mockResolvedValueOnce(geminiOkResponse('{"documentTitle":"Empty"}'));

      const result = await configuredService().extractLineItems({ documentText: 'x' });

      expect(result).toEqual({
        status: EXTRACTION_STATUS.NO_ITEMS_FOUND,
        items: [],
        model: 'model-primary',
        documentTitle: null,
        detectedCurrency: null,
        totalSpend: null,
        error: null
      });
    });

    it('should normalize sparse items and drop items whose description is blank', async () => {
      const payload = {
        items: [
          {
            poNumber: ' PO-9 ',
            vendorName: ' Vendor ',
            itemDescription: ' Valve ',
            quantity: 2,
            unit: ' Nos ',
            unitPrice: 5,
            totalAmount: 10,
            currency: ' INR ',
            date: ' 2025-01-01 ',
            suggestedCategory: ' Valves '
          },
          { quantity: '3', unit: 7, itemDescription: '   ' },
          { totalAmount: 'n/a' },
          {}
        ]
      };
      fetchMock.mockResolvedValueOnce(geminiOkResponse(JSON.stringify(payload)));

      const result = await configuredService().extractLineItems({ documentText: 'Mixed rows' });

      expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
      expect(result.items).toEqual([
        {
          poNumber: 'PO-9',
          vendorName: 'Vendor',
          itemDescription: 'Valve',
          quantity: 2,
          unit: 'Nos',
          unitPrice: 5,
          totalAmount: 10,
          currency: 'INR',
          date: '2025-01-01',
          suggestedCategory: 'Valves'
        },
        {
          poNumber: null,
          vendorName: null,
          itemDescription: 'Unnamed Item',
          quantity: null,
          unit: null,
          unitPrice: null,
          totalAmount: 0,
          currency: null,
          date: null,
          suggestedCategory: null
        },
        {
          poNumber: null,
          vendorName: null,
          itemDescription: 'Unnamed Item',
          quantity: null,
          unit: null,
          unitPrice: null,
          totalAmount: 0,
          currency: null,
          date: null,
          suggestedCategory: null
        }
      ]);
      expect(result.totalSpend).toBe(10);
    });

    it('should return an empty list when transformRawItems receives null', () => {
      const service = configuredService() as unknown as { transformRawItems: (items: null) => unknown[] };

      expect(service.transformRawItems(null)).toEqual([]);
    });

    it('should try the next key when a model attempt returns no result', async () => {
      const service = configuredService();
      const attemptSpy = vi
        .spyOn(service as unknown as PrivateAttemptHooks, 'attemptModelExtraction')
        .mockResolvedValueOnce(null);
      fetchMock.mockResolvedValueOnce(geminiOkResponse('{"items":[{"itemDescription":"Nut","totalAmount":1}]}'));

      const result = await service.extractLineItems({ documentText: 'Nut' });

      expect(attemptSpy).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(EXTRACTION_STATUS.SUCCESS);
      expect(result.items).toHaveLength(1);
    });

    it('should report an invalid input when validation returns no status or message', async () => {
      const service = configuredService();
      const validateSpy = vi
        .spyOn(service as unknown as PrivateValidationHooks, 'validateExtractionInput')
        .mockReturnValueOnce({ isValid: false });

      const result = await service.extractLineItems({ documentText: 'Text' });

      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ status: EXTRACTION_STATUS.AI_FAILED, error: 'Invalid input' });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
