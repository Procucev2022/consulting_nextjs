import { describe, it, expect, vi } from 'vitest';
import {
  buildModule2ConsolidatedSavingsSummary,
  loadModule2ConsolidatedSavingsFromD1
} from '../../src/services/workerD1Module2ConsolidatedSavings';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import * as briefSynthesis from '../../src/services/executiveOpportunityBriefSynthesis';
import * as briefD1 from '../../src/services/executiveOpportunityBriefD1';

describe('workerD1Module2ConsolidatedSavings', () => {
  describe('buildModule2ConsolidatedSavingsSummary', () => {
    it('builds a balanced summary with empty items', () => {
      const summary = buildModule2ConsolidatedSavingsSummary('', '');

      expect(summary.grossEstimatedSavingsCr).toBe(0);
      expect(summary.netEstimatedSavingsCr).toBe(0);
      expect(summary.totalOverlappingDeductionsCr).toBe(0);
      expect(summary.isArithmeticallyBalanced).toBe(true);
      expect(summary.leverSummaries).toHaveLength(10);
      expect(summary.opportunities).toHaveLength(0);
      expect(summary.certificationNotice).toBeDefined();
      expect(summary.disclosures.length).toBeGreaterThan(0);
    });

    it('builds canonical opportunities from raw ledger items and respects lever aggregation', () => {
      const rawLedger = [
        {
          opportunityId: 'OPP-1',
          category: 'Steel Tubes',
          materialIds: ['MAT-101'],
          eligibleSpendCr: 10.5,
          grossOpportunityCr: 1.2,
          overlapAmountCr: 0.2,
          netOpportunityCr: 1.0,
          status: 'PROVEN',
          sourceTransactionIds: ['TX-1', 'TX-2']
        },
        {
          opp_id: 'OPP-2',
          material_group: 'Packaging',
          spend_inr_cr: 5.0,
          potential_savings_inr_cr: 0.5,
          overlapAmountInr: 0,
          status: 'UNVERIFIED'
        },
        {
          opportunityId: 'OPP-L5',
          category: 'Payment Terms',
          leverId: 5,
          eligibleSpendInr: 20000000,
          estimatedGrossSavingsInr: 1000000
        }
      ];

      const summary = buildModule2ConsolidatedSavingsSummary('AIC-TEST-1', 'Acme Corp', rawLedger);

      expect(summary.assessmentId).toBe('AIC-TEST-1');
      expect(summary.customerName).toBe('Acme Corp');
      expect(summary.opportunities).toHaveLength(3);
      expect(summary.isArithmeticallyBalanced).toBe(true);

      const l1 = summary.leverSummaries.find((l) => l.leverId === 1);
      expect(l1).toBeDefined();
      expect(l1?.grossSavingsCr).toBeGreaterThan(0);
      expect(l1?.opportunitiesCount).toBe(2);

      const l5 = summary.leverSummaries.find((l) => l.leverId === 5);
      expect(l5).toBeDefined();
      expect(l5?.isPurchasePriceSavings).toBe(false);
      expect(l5?.grossSavingsCr).toBe(0);
      expect(l5?.opportunitiesCount).toBe(1);

      expect(summary.grossEstimatedSavingsCr).toBeCloseTo(1.7, 1);
      expect(summary.totalOverlappingDeductionsCr).toBeCloseTo(0.2, 1);
      expect(summary.netEstimatedSavingsCr).toBeCloseTo(1.5, 1);
    });

    it('handles numeric INR values and string fallbacks', () => {
      const item = {
        opportunityId: 'OPP-3',
        categoryOrMaterialName: 'Chemicals',
        categoryOrMaterialId: 'CHEM-01',
        eligibleSpendInr: 50000000,
        estimatedGrossSavingsInr: 5000000,
        overlapAmountInr: 1000000,
        netEstimatedSavingsInr: 4000000,
        overlappingOpportunityRefs: ['REF-1'],
        calculationBasis: 'Peer price spread',
        status: 'APPROVED',
        auditEvidenceSummary: 'Verified by audit'
      };

      const summary = buildModule2ConsolidatedSavingsSummary('A1', 'Test Client', [item]);
      expect(summary.opportunities[0].eligibleSpendCr).toBe(5);
      expect(summary.opportunities[0].estimatedGrossSavingsCr).toBe(0.5);
      expect(summary.opportunities[0].overlapAmountCr).toBe(0.1);
      expect(summary.opportunities[0].netEstimatedSavingsCr).toBe(0.4);
      expect(summary.opportunities[0].evidenceValidationStatus).toBe('VALIDATED_COMMERCIAL');
      expect(summary.opportunities[0].deduplicationStatus).toBe('DEDUPLICATED_OVERLAP');
      expect(summary.opportunities[0].auditEvidenceSummary).toBe('Verified by audit');
    });

    it('handles explicit Cr net opportunity without explicit INR', () => {
      const item = {
        category: 'Services',
        eligibleSpendCr: 5,
        estimatedGrossSavingsCr: 1,
        overlapAmountCr: 0.2,
        netOpportunityCr: 0.8,
        overlapGroup: 'OG-1'
      };

      const summary = buildModule2ConsolidatedSavingsSummary('A1', 'Client', [item]);
      expect(summary.opportunities[0].netEstimatedSavingsCr).toBe(0.8);
      expect(summary.opportunities[0].overlappingOpportunityRefs).toEqual(['OG-1']);
    });
  });

  describe('loadModule2ConsolidatedSavingsFromD1', () => {
    it('handles empty assessment customer_name and empty scope', async () => {
      const mockDb = {
        prepare: vi.fn((sql: string) => ({
          bind: vi.fn(() => ({
            all: vi.fn(async () => {
              if (sql.includes('AssessmentRecord')) {
                return { results: [{ customer_name: null }] };
              }
              return { results: [] };
            })
          }))
        }))
      } as unknown as CloudflareD1Database;

      const summary = await loadModule2ConsolidatedSavingsFromD1(mockDb, 'tenant-123', {
        assessmentId: 'ASSESS-NO-NAME'
      });
      expect(summary.customerName).toBe('ASSESS-NO-NAME');

      const emptyScopeSummary = await loadModule2ConsolidatedSavingsFromD1(mockDb, 'tenant-123', {});
      expect(emptyScopeSummary.assessmentId).toBe('');
      expect(emptyScopeSummary.customerName).toBe('Default Enterprise');
    });
    it('loads assessment name and tenant opportunities when assessmentId is supplied', async () => {
      const mockDb = {
        prepare: vi.fn((sql: string) => ({
          bind: vi.fn((...params: unknown[]) => ({
            all: vi.fn(async () => {
              if (sql.includes('AssessmentRecord')) {
                return { results: [{ customer_name: 'PQR Cement Ltd' }] };
              }
              if (sql.includes('SavingsOpportunity')) {
                return {
                  results: [
                    {
                      opp_id: 'OPP-D1-1',
                      category: 'Refractories',
                      est_savings_inr_cr: 2.5,
                      spend_inr_cr: 25.0
                    }
                  ]
                };
              }
              return { results: [] };
            })
          }))
        }))
      } as unknown as CloudflareD1Database;

      const summary = await loadModule2ConsolidatedSavingsFromD1(mockDb, 'tenant-123', {
        assessmentId: 'ASSESS-001'
      });

      expect(summary.customerName).toBe('PQR Cement Ltd');
      expect(summary.assessmentId).toBe('ASSESS-001');
      expect(summary.opportunities).toHaveLength(1);
      expect(summary.grossEstimatedSavingsCr).toBe(2.5);
    });

    it('synthesizes opportunities from document material groups when documentId is supplied', async () => {
      vi.spyOn(briefD1, 'resolveScopedTransactionMetrics').mockResolvedValueOnce({
        scopeType: 'DOCUMENT',
        sourceId: 'DOC-123',
        row: { transaction_count: 100, total_spend_cr: 50.0 }
      } as unknown as Awaited<ReturnType<typeof briefD1.resolveScopedTransactionMetrics>>);

      vi.spyOn(briefSynthesis, 'queryMaterialGroups').mockResolvedValueOnce([
        { label: 'Packaging Materials', spend_cr: 20.0, item_count: 40 },
        { label: 'Bearings', spend_cr: 10.0, item_count: 25 },
        { label: '', spend_cr: 0, item_count: 5 }
      ] as unknown as Awaited<ReturnType<typeof briefSynthesis.queryMaterialGroups>>);

      const mockDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn(() => ({
            all: vi.fn(async () => ({ results: [] }))
          }))
        }))
      } as unknown as CloudflareD1Database;

      const summary = await loadModule2ConsolidatedSavingsFromD1(mockDb, 'tenant-123', {
        documentId: 'DOC-123'
      });

      expect(summary.assessmentId).toBe('DOC-123');
      expect(summary.opportunities).toHaveLength(3);
      expect(summary.opportunities[0].categoryOrMaterialName).toBe('Packaging Materials');
      expect(summary.opportunities[2].categoryOrMaterialName).toBe('Material Group 3');
      expect(summary.grossEstimatedSavingsCr).toBeGreaterThan(0);
      expect(summary.isArithmeticallyBalanced).toBe(true);
    });

    it('falls back gracefully when document has no material groups or assessment is missing', async () => {
      vi.spyOn(briefD1, 'resolveScopedTransactionMetrics').mockResolvedValueOnce({
        scopeType: 'DOCUMENT',
        sourceId: 'DOC-EMPTY',
        row: { transaction_count: 0, total_spend_cr: 0 }
      } as unknown as Awaited<ReturnType<typeof briefD1.resolveScopedTransactionMetrics>>);

      const mockDb = {
        prepare: vi.fn((sql: string) => ({
          bind: vi.fn(() => ({
            all: vi.fn(async () => {
              if (sql.includes('SavingsOpportunity')) {
                return { results: [] };
              }
              return { results: [] };
            })
          }))
        }))
      } as unknown as CloudflareD1Database;

      const summary = await loadModule2ConsolidatedSavingsFromD1(mockDb, 'tenant-123', {
        documentId: 'DOC-EMPTY'
      });

      expect(summary.opportunities).toHaveLength(0);
      expect(summary.grossEstimatedSavingsCr).toBe(0);
      expect(summary.isArithmeticallyBalanced).toBe(true);
    });
  });
});
