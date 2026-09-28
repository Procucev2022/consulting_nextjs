import { describe, it, expect } from 'vitest';
import {
  PCBI_SUPPORTED_FILE_EXTENSIONS,
  PCBI_MAX_PREVIEW_RECORDS,
  PCBI_TARGET_FIELDS,
  PCBI_WORKSHEET_PURPOSE_LABELS
} from '../../src/constants/pcbiAdmin';

describe('PCBI Admin Constants (backend/src/constants/pcbiAdmin.ts)', () => {
  it('should define supported file extensions', () => {
    expect(PCBI_SUPPORTED_FILE_EXTENSIONS).toContain('.xlsx');
    expect(PCBI_SUPPORTED_FILE_EXTENSIONS).toContain('.csv');
  });

  it('should define max preview records', () => {
    expect(PCBI_MAX_PREVIEW_RECORDS).toBe(50);
  });

  it('should define target fields for all major datasets', () => {
    expect(PCBI_TARGET_FIELDS.PCBI_MASTER.length).toBeGreaterThan(5);
    expect(PCBI_TARGET_FIELDS.WEEKLY_INDEX.length).toBeGreaterThan(3);
    expect(PCBI_TARGET_FIELDS.CONSTITUENTS.length).toBeGreaterThan(2);
    expect(PCBI_TARGET_FIELDS.SOURCES.length).toBeGreaterThan(1);
    expect(PCBI_TARGET_FIELDS.UNSPSC_MAPPING.length).toBeGreaterThan(1);

    const masterIdField = PCBI_TARGET_FIELDS.PCBI_MASTER.find((f) => f.field === 'pcbi_id');
    expect(masterIdField?.isRequired).toBe(true);
    expect(masterIdField?.aliases).toContain('pcbi id');
  });

  it('should provide human readable worksheet purpose labels', () => {
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.PCBI_MASTER).toBe('Benchmark Master');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.WEEKLY_INDEX).toBe('Weekly Index Series');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.CONSTITUENTS).toBe('Constituent Database');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.SOURCES).toBe('Benchmark Sources');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.UNSPSC_MAPPING).toBe('UNSPSC Mapping');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.OTHER).toBe('Informational / Other');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.IGNORE).toBe('Ignore Sheet');
  });
});
