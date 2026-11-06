import { describe, expect, it } from 'vitest';
import { loadAssessmentMaterialMappings } from '../../src/services/workerD1MaterialMappings';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';
import { vi } from 'vitest';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import logger from '../../src/utils/logger';
import { MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS } from '../../src/constants/module2D1Scoped';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const mapping = {
  sourceMaterialId: 'MAT-1', sourceDescription: 'Resin', sourceCategory: 'Chemicals',
  assignedUnspscCode: '12345678', assignedUnspscTitle: 'Resins', unspscSegment: '12',
  unspscFamily: '1234', unspscClass: '123456', unspscCommodity: '12345678', taxonomyVersion: 'v1',
  mappingMethod: 'MANUAL_REVIEW_REQUIRED', confidenceScore: 1, evidence: 'Reviewed from taxonomy.',
  reviewStatus: 'CLIENT_APPROVED', mappingDate: '2026-10-30T00:00:00.000Z', totalSpendInr: 100,
  totalSpendCr: 0.00001, transactionCount: 1, qualifyingSuppliersCount: 1, reviewedBy: 'Asha'
} as const;

describe('loadAssessmentMaterialMappings', () => {
  it('returns only schema-valid mappings bound to their persisted source id', async () => {
    const fixture = createWorkerDatabase();
    try {
      const insert = fixture.db.prepare(`INSERT INTO AssessmentMaterialMapping (
        assessment_id, source_material_id, payload_json, reviewed_by, updated_at
      ) VALUES (?, ?, ?, ?, ?)`);
      insert.run('A1', 'MAT-1', JSON.stringify(mapping), 'asha@example.test', '2026-10-30');
      insert.run('A1', 'MAT-2', '{broken-json', 'asha@example.test', '2026-10-30');
      insert.run('A1', 'MAT-3', JSON.stringify({ ...mapping, sourceMaterialId: 'OTHER' }), 'asha@example.test', '2026-10-30');
      insert.run('A1', 'MAT-4', JSON.stringify({ ...mapping, confidenceScore: 3 }), 'asha@example.test', '2026-10-30');

      await expect(loadAssessmentMaterialMappings(fixture.d1, 'A1', {
        requestId: 'req-mapping-read', tenantId: 'T1'
      }))
        .resolves.toEqual([expect.objectContaining({ sourceMaterialId: 'MAT-1', reviewStatus: 'CLIENT_APPROVED' })]);
      expect(logger.warn).toHaveBeenCalledWith(
        MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MESSAGE,
        expect.objectContaining({
          action: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.ACTION,
          assessmentId: 'A1', tenantId: 'T1', requestId: 'req-mapping-read', invalidRecordCount: 3,
          invalidJsonCount: 1, schemaInvalidCount: 1, sourceIdMismatchCount: 1,
          sampleSourceMaterialIds: ['MAT-2', 'MAT-3', 'MAT-4'],
          fallback: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.FALLBACK
        }),
        expect.any(SyntaxError)
      );
      expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain('broken-json');
      await expect(loadAssessmentMaterialMappings(fixture.d1, 'A2')).resolves.toEqual([]);
    } finally {
      fixture.close();
    }
  });

  it('returns an empty mapping list when D1 omits its results array', async () => {
    const all = vi.fn().mockResolvedValue({ results: undefined });
    const db = { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ all })) })) } as unknown as CloudflareD1Database;

    await expect(loadAssessmentMaterialMappings(db, 'A1')).resolves.toEqual([]);
    expect(all).toHaveBeenCalledOnce();
  });

  it('bounds invalid mapping identifiers and reports schema failures without stored values', async () => {
    const fixture = createWorkerDatabase();
    const insert = fixture.db.prepare(`INSERT INTO AssessmentMaterialMapping (
      assessment_id, source_material_id, payload_json, reviewed_by, updated_at
    ) VALUES (?, ?, ?, ?, ?)`);
    for (let index = 0; index <= MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MAX_SAMPLE_SOURCE_IDS; index += 1) {
      insert.run('A3', `MAT-${index}`, JSON.stringify({ sourceMaterialId: `MAT-${index}`, privateValue: 'secret' }),
        'reviewer@example.test', '2026-10-30');
    }
    vi.mocked(logger.warn).mockClear();
    try {
      await expect(loadAssessmentMaterialMappings(fixture.d1, 'A3')).resolves.toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MESSAGE,
        expect.objectContaining({
          invalidRecordCount: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MAX_SAMPLE_SOURCE_IDS + 1,
          invalidJsonCount: 0, schemaInvalidCount: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MAX_SAMPLE_SOURCE_IDS + 1,
          sourceIdMismatchCount: 0,
          sampleSourceMaterialIds: Array.from({ length: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MAX_SAMPLE_SOURCE_IDS },
            (_value, index) => `MAT-${index}`),
          omittedSampleCount: 1,
          schemaIssuePaths: expect.arrayContaining(['sourceDescription', 'assignedUnspscCode', 'reviewStatus']),
          fallback: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.FALLBACK
        }),
        expect.any(TypeError)
      );
      expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain('secret');
    } finally {
      fixture.close();
    }
  });
});
