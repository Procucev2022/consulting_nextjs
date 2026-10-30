import { describe, expect, it, vi } from 'vitest';
import { loadEAuctionPlanningAssumptions, saveEAuctionPlanningAssumption } from '../../src/services/workerD1EAuctionPlanningAssumptions';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';

const assumption = {
  id: 'ASSUMP-TEST', categoryOrMaterial: 'Packaging', minSavingsRate: 0.03,
  expectedSavingsRate: 0.055, maxSavingsRate: 0.09, rateSource: 'Auction index',
  referencePeriod: 'FY2024-FY2025', applicability: 'Multi-supplier standard packaging',
  approvalStatus: 'Proposed Planning Assumption — Approval Required' as const,
  confidence: 'MEDIUM' as const, isPlanningAssumptionOnly: true as const,
  notes: 'Must be approved before use.'
};

describe('D1 e-auction planning assumptions', () => {
  it('loads sorted assumptions and omits approval metadata when it has not been approved', async () => {
    const fixture = createWorkerDatabase();
    try {
      const insert = fixture.db.prepare(`INSERT INTO Module2EAuctionPlanningAssumption (
        assumption_id, category_or_material, min_savings_rate, expected_savings_rate, max_savings_rate,
        rate_source, reference_period, applicability, approval_status, approved_by, approved_date,
        confidence, is_planning_assumption_only, notes, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`);
      insert.run('ASSUMP-B', 'Packaging', 0.03, 0.055, 0.09, 'Index B', 'FY2024', 'Applicability',
        assumption.approvalStatus, null, null, 'MEDIUM', 'Seed note', 'D1 seed', '2026-10-30');
      insert.run('ASSUMP-A', 'Chemicals', 0.02, 0.04, 0.065, 'Index A', 'FY2025', 'Applicability',
        assumption.approvalStatus, null, null, 'HIGH', null, 'D1 seed', '2026-10-30');

      await expect(loadEAuctionPlanningAssumptions(fixture.d1)).resolves.toMatchObject([
        { id: 'ASSUMP-A', categoryOrMaterial: 'Chemicals', confidence: 'HIGH' },
        { id: 'ASSUMP-B', notes: 'Seed note', isPlanningAssumptionOnly: true }
      ]);
    } finally {
      fixture.close();
    }
  });

  it('upserts approved decisions and returns the persisted planning-only record', async () => {
    const fixture = createWorkerDatabase();
    try {
      const approved = {
        ...assumption, approvalStatus: 'APPROVED' as const,
        approvedBy: 'Procurement Admin', approvedDate: '2026-10-30T00:00:00.000Z'
      };
      const unapproved = { ...assumption, id: 'ASSUMP-UNAPPROVED', notes: '' };
      await expect(saveEAuctionPlanningAssumption(
        fixture.d1, unapproved, 'admin@example.test', '2026-10-30T00:30:00.000Z'
      )).resolves.toMatchObject({
        id: 'ASSUMP-UNAPPROVED', approvalStatus: assumption.approvalStatus, isPlanningAssumptionOnly: true
      });
      await expect(saveEAuctionPlanningAssumption(
        fixture.d1, approved, 'admin@example.test', '2026-10-30T01:00:00.000Z'
      )).resolves.toMatchObject(approved);
      const loaded = await loadEAuctionPlanningAssumptions(fixture.d1);
      expect(loaded).toHaveLength(2);
      expect(loaded[0]).toEqual(approved);
      expect(loaded[1]).toMatchObject({ id: 'ASSUMP-UNAPPROVED', approvalStatus: assumption.approvalStatus });
      expect(loaded[1]).not.toHaveProperty('approvedBy');
      expect(loaded[1]).not.toHaveProperty('approvedDate');
      expect(loaded[1]).not.toHaveProperty('notes');

      await saveEAuctionPlanningAssumption(fixture.d1, { ...approved, expectedSavingsRate: 0.06 },
        'admin@example.test', '2026-10-30T02:00:00.000Z');
      expect(fixture.db.prepare(`SELECT expected_savings_rate FROM Module2EAuctionPlanningAssumption
        WHERE assumption_id = ?`).get('ASSUMP-TEST')).toMatchObject({ expected_savings_rate: 0.06 });
    } finally {
      fixture.close();
    }
  });

  it('returns an empty list if the D1 adapter omits its result array', async () => {
    const all = vi.fn().mockResolvedValue({ results: undefined });
    const db = { prepare: vi.fn(() => ({ all })) } as unknown as CloudflareD1Database;
    await expect(loadEAuctionPlanningAssumptions(db)).resolves.toEqual([]);
    expect(all).toHaveBeenCalledOnce();
  });
});
