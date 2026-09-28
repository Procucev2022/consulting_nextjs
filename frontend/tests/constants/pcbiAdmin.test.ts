import { describe, it, expect } from 'vitest';
import {
  PCBI_SUPPORTED_FILE_EXTENSIONS,
  PCBI_MAX_PREVIEW_RECORDS,
  PCBI_TARGET_FIELDS,
  PCBI_WORKSHEET_PURPOSE_LABELS,
  PCBI_DEFINITION_STATUSES,
  PCBI_DATA_STATUSES,
  PCBI_SOURCE_STATUSES,
  PCBI_METHODOLOGY_STATUSES,
  PCBI_READINESS_STATUSES,
  PCBI_PREVIEW_STATUS_BADGES,
  PCBI_PROVENANCE_LINK_KEYS
} from '../../src/constants/pcbiAdmin';

describe('PCBI Admin Constants (frontend/src/constants/pcbiAdmin.ts)', () => {
  it('should define supported file extensions', () => {
    expect(PCBI_SUPPORTED_FILE_EXTENSIONS).toEqual(['.xlsx', '.csv']);
  });

  it('should set preview records cap to 50', () => {
    expect(PCBI_MAX_PREVIEW_RECORDS).toBe(50);
  });

  it('should define target fields for all required datasets', () => {
    expect(PCBI_TARGET_FIELDS.PCBI_MASTER.length).toBeGreaterThanOrEqual(10);
    expect(PCBI_TARGET_FIELDS.WEEKLY_INDEX.length).toBeGreaterThanOrEqual(5);
    expect(PCBI_TARGET_FIELDS.CONSTITUENTS.length).toBeGreaterThanOrEqual(4);
    expect(PCBI_TARGET_FIELDS.SOURCES.length).toBeGreaterThanOrEqual(2);
    expect(PCBI_TARGET_FIELDS.UNSPSC_MAPPING.length).toBeGreaterThanOrEqual(2);

    const pcbiIdField = PCBI_TARGET_FIELDS.PCBI_MASTER.find((f) => f.field === 'pcbi_id');
    expect(pcbiIdField?.isRequired).toBe(true);
  });

  it('should define purpose labels for all worksheet types', () => {
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.PCBI_MASTER).toBe('Benchmark Master');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.WEEKLY_INDEX).toBe('Weekly Index Series');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.CONSTITUENTS).toBe('Constituent Database');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.SOURCES).toBe('Benchmark Sources');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.UNSPSC_MAPPING).toBe('UNSPSC Mapping');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.OTHER).toBe('Informational / Other');
    expect(PCBI_WORKSHEET_PURPOSE_LABELS.IGNORE).toBe('Ignore Sheet');
  });

  it('should define Architecture QA status constants', () => {
    expect(PCBI_DEFINITION_STATUSES).toContain('DEFINED');
    expect(PCBI_DEFINITION_STATUSES).toContain('MISSING');
    expect(PCBI_DATA_STATUSES).toContain('COMPLETE');
    expect(PCBI_DATA_STATUSES).toContain('PARTIAL_HISTORY');
    expect(PCBI_SOURCE_STATUSES).toContain('CANDIDATE');
    expect(PCBI_SOURCE_STATUSES).toContain('VALIDATED');
    expect(PCBI_METHODOLOGY_STATUSES).toContain('APPROVED');
    expect(PCBI_READINESS_STATUSES).toContain('READY_FOR_VALIDATION');
    expect(PCBI_PREVIEW_STATUS_BADGES.SIMULATION_ONLY).toBe('SIMULATION_ONLY');
    expect(PCBI_PROVENANCE_LINK_KEYS.length).toBe(10);
  });
});

