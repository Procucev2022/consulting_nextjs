import { describe, it, expect } from 'vitest';
import {
  GEMINI_CONFIG,
  GEMINI_INLINE_MIME_TYPES,
  EXTRACTION_STATUS,
  CLASSIFICATION_STATUS,
  NEW_CATEGORY_SENTINEL,
  AI_MAX_LINE_ITEMS_IN_PROMPT,
  AI_MAX_CATEGORIES_IN_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
  CATEGORIZATION_SYSTEM_PROMPT,
  EXECUTIVE_REPORT_SYSTEM_PROMPT,
  ANOMALY_DETECTION_SYSTEM_PROMPT
} from '../../src/constants/ai';

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

  it('should define limits and non-empty prompt templates', () => {
    expect(AI_MAX_LINE_ITEMS_IN_PROMPT).toBe(150);
    expect(AI_MAX_CATEGORIES_IN_PROMPT).toBe(80);
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('enterprise procurement & PO data extraction engine');
    expect(CATEGORIZATION_SYSTEM_PROMPT).toContain('UNSPSC');
    expect(EXECUTIVE_REPORT_SYSTEM_PROMPT).toContain('Chief Procurement Officer');
    expect(ANOMALY_DETECTION_SYSTEM_PROMPT).toContain('anomaly detection engine');
  });
});
