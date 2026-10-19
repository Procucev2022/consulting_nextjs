import { describe, it, expect } from 'vitest';
import {
  MANDATORY_CANONICAL_FIELDS,
  CANONICAL_FIELD_DEFINITIONS,
  NON_TRANSACTION_SHEET_KEYWORDS,
  CONFIDENCE_THRESHOLDS
} from '../../src/constants/schemaMatching';

describe('schemaMatching Constants Unit Tests', () => {
  it('defines mandatory canonical fields', () => {
    expect(MANDATORY_CANONICAL_FIELDS).toContain('vendorName');
    expect(MANDATORY_CANONICAL_FIELDS).toContain('documentDate');
    expect(MANDATORY_CANONICAL_FIELDS).toContain('netSpendAmount');
    expect(MANDATORY_CANONICAL_FIELDS.length).toBe(3);
  });

  it('validates canonical field definitions structure', () => {
    expect(CANONICAL_FIELD_DEFINITIONS.length).toBeGreaterThan(10);
    CANONICAL_FIELD_DEFINITIONS.forEach((def) => {
      expect(def.field).toBeTruthy();
      expect(def.label).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(Array.isArray(def.exactAliases)).toBe(true);
      expect(Array.isArray(def.normalizedAliases)).toBe(true);
      expect(def.exactAliases.length).toBeGreaterThan(0);
      expect(def.normalizedAliases.length).toBeGreaterThan(0);
    });
  });

  it('validates non-transaction sheet keywords', () => {
    expect(NON_TRANSACTION_SHEET_KEYWORDS).toContain('cover');
    expect(NON_TRANSACTION_SHEET_KEYWORDS).toContain('summary');
    expect(NON_TRANSACTION_SHEET_KEYWORDS).toContain('metadata');
    expect(NON_TRANSACTION_SHEET_KEYWORDS).toContain('lookup');
  });

  it('validates confidence thresholds', () => {
    expect(CONFIDENCE_THRESHOLDS.MIN_TRANSACTION_CONFIDENCE).toBe(0.40);
    expect(CONFIDENCE_THRESHOLDS.AUTO_SELECT_CLEAR_WINNER_DIFF).toBe(0.25);
    expect(CONFIDENCE_THRESHOLDS.DOMINANT_ROW_COUNT_RATIO).toBe(5.0);
  });
});
