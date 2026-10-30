import { describe, expect, it } from 'vitest';
import type { ScopedModule2Analysis } from '../../src/types/module2D1Scoped';
import { buildModule2D1AuditDossier } from '../../src/services/workerD1SourcingAuditDossier';

const result = (transactions: ScopedModule2Analysis['transactions']): ScopedModule2Analysis => ({
  transactions,
  analysis: {
    summary: { categoriesAnalyzedCount: 0 }, profiles: [], handoffPackages: []
  } as ScopedModule2Analysis['analysis']
});

describe('buildModule2D1AuditDossier', () => {
  it('includes only scoped D1 analysis and reconciles spend from its included transaction rows', () => {
    const analysis = result([
      { id: 'TX-1', total_spend_inr: 150, vendor_name: 'Supplier', material_desc: 'Resin', quantity: 2, unit_price: 75 },
      { id: 'TX-2', total_spend_inr: 250, vendor_name: 'Supplier', material_desc: 'Resin', quantity: 2, unit_price: 125 }
    ]);
    const dossier = buildModule2D1AuditDossier('A-1', 'T-1', analysis, '2026-10-29T00:00:00.000Z');

    expect(dossier).toMatchObject({
      schemaVersion: '1.0', generatedAt: '2026-10-29T00:00:00.000Z', assessmentId: 'A-1', tenantId: 'T-1',
      source: { system: 'Cloudflare D1', table: 'ProcurementTransaction', includedRecords: 2, includedSpendInr: 400 },
      analysis: { summary: { categoriesAnalyzedCount: 0 }, categoryProfiles: [], opportunityLedger: [], handoffPackages: [] }
    });
    expect(dossier.savingsDisclosure).toContain('not verified');
  });

  it('handles an assessment with no valid D1 transaction rows without inventing spend', () => {
    const dossier = buildModule2D1AuditDossier('A-EMPTY', undefined, result([]), '2026-10-29T00:00:00.000Z');
    expect(dossier.tenantId).toBeNull();
    expect(dossier.source).toMatchObject({ includedRecords: 0, includedSpendInr: 0 });
  });
});
