import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GEMINI_CONFIG,
  GEMINI_INLINE_MIME_TYPES,
  EXTRACTION_STATUS,
  CLASSIFICATION_STATUS,
  AI_LOG_MESSAGES,
  NEW_CATEGORY_SENTINEL,
  AI_MAX_LINE_ITEMS_IN_PROMPT,
  AI_MAX_CATEGORIES_IN_PROMPT,
  AI_TAXONOMY_LOOKUP_UNAVAILABLE,
  EXTRACTION_SYSTEM_PROMPT,
  PCBI_RESEARCH_PDF_EXTRACTION_PROMPT,
  CATEGORIZATION_SYSTEM_PROMPT,
  EXECUTIVE_REPORT_SYSTEM_PROMPT,
  ANOMALY_DETECTION_SYSTEM_PROMPT,
  resolveGeminiConfig
} from '../../src/constants/ai';

// dotenv would read backend/.env and refill the Gemini variables that the module-load tests unset.
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

describe('AI Constants and Prompts', () => {
  it('should have valid GEMINI_CONFIG defaults and properties', () => {
    expect(GEMINI_CONFIG.BASE_URL).toContain('generativelanguage.googleapis.com');
    expect(GEMINI_CONFIG.PRIMARY_MODEL).toBeDefined();
    expect(Array.isArray(GEMINI_CONFIG.FALLBACK_MODELS)).toBe(true);
    expect(GEMINI_CONFIG.REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    expect(GEMINI_CONFIG.TOTAL_BUDGET_MS).toBeGreaterThan(0);
    expect(GEMINI_CONFIG.TEMPERATURE).toBe(0.1);
  });

  it('should support required inline MIME types', () => {
    expect(GEMINI_INLINE_MIME_TYPES).toContain('application/pdf');
    expect(GEMINI_INLINE_MIME_TYPES).toContain('image/png');
    expect(GEMINI_INLINE_MIME_TYPES).toContain('text/csv');
  });

  it('should define extraction and classification status codes', () => {
    expect(EXTRACTION_STATUS.SUCCESS).toBe('SUCCESS');
    expect(EXTRACTION_STATUS.NOT_CONFIGURED).toBe('NOT_CONFIGURED');
    expect(EXTRACTION_STATUS.AI_FAILED).toBe('AI_FAILED');
    expect(CLASSIFICATION_STATUS.SUCCESS).toBe('SUCCESS');
    expect(NEW_CATEGORY_SENTINEL).toBe('NEW_CATEGORY_SUGGESTION');
  });

  it('should define detailed AI request and fallback log messages', () => {
    expect(AI_LOG_MESSAGES).toEqual({
      requestBodyTooLarge: 'AI endpoint rejected an oversized JSON request body',
      invalidJsonBody: 'AI endpoint rejected an invalid JSON request body',
      fallbackReturned: 'AI request failed; structured fallback response returned'
    });
  });

  it('should define limits and non-empty prompt templates', () => {
    expect(AI_MAX_LINE_ITEMS_IN_PROMPT).toBe(150);
    expect(AI_MAX_CATEGORIES_IN_PROMPT).toBe(80);
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('enterprise procurement & PO data extraction engine');
    expect(PCBI_RESEARCH_PDF_EXTRACTION_PROMPT).toContain('commodity benchmark observations');
    expect(PCBI_RESEARCH_PDF_EXTRACTION_PROMPT).toContain('Do not infer missing dates or values');
    expect(CATEGORIZATION_SYSTEM_PROMPT).toContain('UNSPSC');
    expect(EXECUTIVE_REPORT_SYSTEM_PROMPT).toContain('Chief Procurement Officer');
    expect(ANOMALY_DETECTION_SYSTEM_PROMPT).toContain('anomaly detection engine');
  });
});

const GEMINI_ENV_KEYS = [
  'GEMINI_API_KEY',
  'GEMINI_BACKUP_KEYS',
  'GEMINI_BASE_URL',
  'GEMINI_PRIMARY_MODEL',
  'GEMINI_FALLBACK_MODELS',
  'GEMINI_REQUEST_TIMEOUT_MS',
  'GEMINI_TOTAL_BUDGET_MS',
  'GEMINI_MIN_ATTEMPT_MS',
  'GEMINI_MAX_DOCUMENT_BYTES',
  'GEMINI_MAX_DOCUMENT_TEXT_CHARS'
] as const;

describe('AI Constants: status maps and lookups', () => {
  it('should define the complete extraction status map', () => {
    expect(EXTRACTION_STATUS).toEqual({
      SUCCESS: 'SUCCESS',
      NOT_CONFIGURED: 'NOT_CONFIGURED',
      NO_CONTENT: 'NO_CONTENT',
      DOCUMENT_TOO_LARGE: 'DOCUMENT_TOO_LARGE',
      UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
      AI_FAILED: 'AI_FAILED',
      NO_ITEMS_FOUND: 'NO_ITEMS_FOUND'
    });
  });

  it('should define the complete classification status map', () => {
    expect(CLASSIFICATION_STATUS).toEqual({
      SUCCESS: 'SUCCESS',
      INVALID_RESPONSE: 'INVALID_RESPONSE',
      AI_FAILED: 'AI_FAILED',
      NOT_CONFIGURED: 'NOT_CONFIGURED',
      NO_CONTENT: 'NO_CONTENT'
    });
  });

  it('should list the inline MIME types accepted for document processing', () => {
    expect(GEMINI_INLINE_MIME_TYPES).toEqual([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/heic',
      'text/plain',
      'text/csv'
    ]);
  });

  it('should explain that taxonomy lookup needs a configured D1 database', () => {
    expect(AI_TAXONOMY_LOOKUP_UNAVAILABLE).toContain('Configure the D1 database');
  });
});

describe('GEMINI_CONFIG built from process.env at module load', () => {
  const savedEnv: Partial<Record<(typeof GEMINI_ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of GEMINI_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    vi.resetModules();
  });

  afterEach(() => {
    for (const key of GEMINI_ENV_KEYS) {
      const value = savedEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    vi.resetModules();
  });

  it('should fall back to empty strings and zero values when Gemini variables are unset', async () => {
    const reloaded = await import('../../src/constants/ai');

    expect(reloaded.GEMINI_CONFIG).toEqual({
      API_KEY: '',
      BACKUP_KEYS: [],
      BASE_URL: '',
      PRIMARY_MODEL: '',
      FALLBACK_MODELS: [],
      REQUEST_TIMEOUT_MS: 0,
      TOTAL_BUDGET_MS: 0,
      MIN_ATTEMPT_MS: 0,
      MAX_DOCUMENT_BYTES: 0,
      MAX_DOCUMENT_TEXT_CHARS: 0,
      TEMPERATURE: 0.1
    });
  });

  it('should parse comma-separated keys and models and numeric limits from the environment', async () => {
    process.env.GEMINI_API_KEY = 'env-api-key';
    process.env.GEMINI_BACKUP_KEYS = ' backup-a , ,backup-b ';
    process.env.GEMINI_BASE_URL = 'https://gemini.example.test/models';
    process.env.GEMINI_PRIMARY_MODEL = 'primary-model';
    process.env.GEMINI_FALLBACK_MODELS = ' fallback-a, ,fallback-b ';
    process.env.GEMINI_REQUEST_TIMEOUT_MS = '1500';
    process.env.GEMINI_TOTAL_BUDGET_MS = '9000';
    process.env.GEMINI_MIN_ATTEMPT_MS = '250';
    process.env.GEMINI_MAX_DOCUMENT_BYTES = '2048';
    process.env.GEMINI_MAX_DOCUMENT_TEXT_CHARS = '4096';
    vi.resetModules();

    const reloaded = await import('../../src/constants/ai');

    expect(reloaded.GEMINI_CONFIG).toEqual({
      API_KEY: 'env-api-key',
      BACKUP_KEYS: ['backup-a', 'backup-b'],
      BASE_URL: 'https://gemini.example.test/models',
      PRIMARY_MODEL: 'primary-model',
      FALLBACK_MODELS: ['fallback-a', 'fallback-b'],
      REQUEST_TIMEOUT_MS: 1500,
      TOTAL_BUDGET_MS: 9000,
      MIN_ATTEMPT_MS: 250,
      MAX_DOCUMENT_BYTES: 2048,
      MAX_DOCUMENT_TEXT_CHARS: 4096,
      TEMPERATURE: 0.1
    });
  });
});

describe('resolveGeminiConfig', () => {
  it('should use module defaults for every non-key setting when the environment is empty', () => {
    const config = resolveGeminiConfig({});

    expect(config).toEqual({
      API_KEY: '',
      BACKUP_KEYS: [],
      BASE_URL: GEMINI_CONFIG.BASE_URL,
      PRIMARY_MODEL: GEMINI_CONFIG.PRIMARY_MODEL,
      FALLBACK_MODELS: GEMINI_CONFIG.FALLBACK_MODELS,
      REQUEST_TIMEOUT_MS: GEMINI_CONFIG.REQUEST_TIMEOUT_MS,
      TOTAL_BUDGET_MS: GEMINI_CONFIG.TOTAL_BUDGET_MS,
      MIN_ATTEMPT_MS: GEMINI_CONFIG.MIN_ATTEMPT_MS,
      MAX_DOCUMENT_BYTES: GEMINI_CONFIG.MAX_DOCUMENT_BYTES,
      MAX_DOCUMENT_TEXT_CHARS: GEMINI_CONFIG.MAX_DOCUMENT_TEXT_CHARS,
      TEMPERATURE: GEMINI_CONFIG.TEMPERATURE
    });
  });

  it('should prefer provided values and convert numeric strings and numbers', () => {
    const config = resolveGeminiConfig({
      GEMINI_API_KEY: 'key-1',
      GEMINI_BACKUP_KEYS: 'key-2, ,key-3',
      GEMINI_BASE_URL: 'https://example.test/models',
      GEMINI_PRIMARY_MODEL: 'model-a',
      GEMINI_FALLBACK_MODELS: 'model-b, model-c',
      GEMINI_REQUEST_TIMEOUT_MS: '1000',
      GEMINI_TOTAL_BUDGET_MS: 2000,
      GEMINI_MIN_ATTEMPT_MS: '300',
      GEMINI_MAX_DOCUMENT_BYTES: 4096,
      GEMINI_MAX_DOCUMENT_TEXT_CHARS: '8192'
    });

    expect(config).toEqual({
      API_KEY: 'key-1',
      BACKUP_KEYS: ['key-2', 'key-3'],
      BASE_URL: 'https://example.test/models',
      PRIMARY_MODEL: 'model-a',
      FALLBACK_MODELS: ['model-b', 'model-c'],
      REQUEST_TIMEOUT_MS: 1000,
      TOTAL_BUDGET_MS: 2000,
      MIN_ATTEMPT_MS: 300,
      MAX_DOCUMENT_BYTES: 4096,
      MAX_DOCUMENT_TEXT_CHARS: 8192,
      TEMPERATURE: 0.1
    });
  });

  it('should treat empty strings as unset and fall back to module defaults', () => {
    const config = resolveGeminiConfig({
      GEMINI_API_KEY: '',
      GEMINI_BACKUP_KEYS: '',
      GEMINI_BASE_URL: '',
      GEMINI_PRIMARY_MODEL: '',
      GEMINI_FALLBACK_MODELS: '',
      GEMINI_REQUEST_TIMEOUT_MS: '',
      GEMINI_TOTAL_BUDGET_MS: '',
      GEMINI_MIN_ATTEMPT_MS: '',
      GEMINI_MAX_DOCUMENT_BYTES: '',
      GEMINI_MAX_DOCUMENT_TEXT_CHARS: ''
    });

    expect(config.API_KEY).toBe('');
    expect(config.BACKUP_KEYS).toEqual([]);
    expect(config.BASE_URL).toBe(GEMINI_CONFIG.BASE_URL);
    expect(config.PRIMARY_MODEL).toBe(GEMINI_CONFIG.PRIMARY_MODEL);
    expect(config.FALLBACK_MODELS).toEqual(GEMINI_CONFIG.FALLBACK_MODELS);
    expect(config.REQUEST_TIMEOUT_MS).toBe(GEMINI_CONFIG.REQUEST_TIMEOUT_MS);
    expect(config.TOTAL_BUDGET_MS).toBe(GEMINI_CONFIG.TOTAL_BUDGET_MS);
    expect(config.MIN_ATTEMPT_MS).toBe(GEMINI_CONFIG.MIN_ATTEMPT_MS);
    expect(config.MAX_DOCUMENT_BYTES).toBe(GEMINI_CONFIG.MAX_DOCUMENT_BYTES);
    expect(config.MAX_DOCUMENT_TEXT_CHARS).toBe(GEMINI_CONFIG.MAX_DOCUMENT_TEXT_CHARS);
  });
});
