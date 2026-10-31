import { describe, expect, it } from 'vitest';
import { pcbiGapResolutionSchema, uploadCorrectedDatasetSchema } from '../../src/constants/orchestrationValidation';

const validUpload = {
  fileName: 'corrected.csv',
  fileSize: 8,
  checksum: 'a'.repeat(64),
  fileBase64: 'cG8sYW1vdW50',
  reason: 'INCORRECT_CATEGORY_MAPPING'
};

describe('uploadCorrectedDatasetSchema', () => {
  it('accepts a bounded dataset upload with optional explanation and checksum confirmation', () => {
    expect(uploadCorrectedDatasetSchema.safeParse({
      ...validUpload,
      expectedChecksum: validUpload.checksum,
      notes: 'Corrected material group assignments'
    }).success).toBe(true);
  });

  it('rejects missing content, invalid size, names, checksum formats, and unsupported correction reasons', () => {
    const cases = [
      { ...validUpload, fileName: ' ' },
      { ...validUpload, fileSize: 0 },
      { ...validUpload, fileSize: Number.MAX_SAFE_INTEGER },
      { ...validUpload, checksum: 'bad' },
      { ...validUpload, expectedChecksum: 'bad' },
      { ...validUpload, fileBase64: '' },
      { ...validUpload, reason: 'UNSUPPORTED_REASON' },
      { ...validUpload, notes: 'x'.repeat(2001) }
    ];
    for (const candidate of cases) expect(uploadCorrectedDatasetSchema.safeParse(candidate).success).toBe(false);
  });
});

describe('pcbiGapResolutionSchema', () => {
  it('accepts every supported resolution action with its required fields', () => {
    const cases = [
      { action: 'MAP_EXISTING', targetPcbiSeries: 'PCBI-1' },
      { action: 'ADD_MAP_PCBI', targetPcbiSeries: 'PCBI-1' },
      { action: 'EXCLUDE', exclusionReason: 'OTHER', exclusionNotes: 'No reliable evidence' },
      { action: 'MARK_NOT_BENCHMARKABLE' },
      { action: 'MARK_SERVICE' },
      { action: 'REQUEST_RESEARCH', researchNotes: 'Check current market data' }
    ];
    for (const candidate of cases) expect(pcbiGapResolutionSchema.safeParse(candidate).success).toBe(true);
  });

  it('rejects missing mapping targets, missing exclusion reasons, unreasoned OTHER exclusions, and invalid fields', () => {
    const cases = [
      { action: 'MAP_EXISTING' },
      { action: 'ADD_MAP_PCBI', targetPcbiSeries: ' ' },
      { action: 'EXCLUDE' },
      { action: 'EXCLUDE', exclusionReason: 'OTHER' },
      { action: 'MARK_SERVICE', exclusionReason: 'UNKNOWN' },
      { action: 'REQUEST_RESEARCH', researchNotes: 'x'.repeat(2001) },
      { action: 'NOT_SUPPORTED' }
    ];
    for (const candidate of cases) expect(pcbiGapResolutionSchema.safeParse(candidate).success).toBe(false);
  });
});
