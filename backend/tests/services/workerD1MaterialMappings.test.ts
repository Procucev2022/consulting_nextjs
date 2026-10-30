import { describe, expect, it } from 'vitest';
import { loadAssessmentMaterialMappings } from '../../src/services/workerD1MaterialMappings';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';
import { vi } from 'vitest';
import type { CloudflareD1Database } from '../../src/types/cloudflare';

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

      await expect(loadAssessmentMaterialMappings(fixture.d1, 'A1'))
        .resolves.toEqual([expect.objectContaining({ sourceMaterialId: 'MAT-1', reviewStatus: 'CLIENT_APPROVED' })]);
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
});
