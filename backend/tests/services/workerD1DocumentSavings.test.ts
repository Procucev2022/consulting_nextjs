import { describe, expect, it } from 'vitest';
import {
  buildDocumentSavingsResult,
  buildStrategicSummary
} from '../../src/services/workerD1DocumentSavings';
import type { ExecutiveOpportunityBriefMaterialGroupRow } from '../../src/types/executiveOpportunityBrief';

describe('workerD1DocumentSavings', () => {
  describe('buildStrategicSummary', () => {
    it('computes strategic summary accurately for a given addressable spend', () => {
      const summary = buildStrategicSummary(100);
      expect(summary.totalAddressableSpendInrCr).toBe(100);
      expect(summary.vendorConsolidationAddressableSpendInrCr).toBe(38);
      expect(summary.totalPotentialConsolidationOpportunityInrCr).toBe(2.74);
      expect(summary.volumeBundlingAddressableSpendInrCr).toBe(28);
      expect(summary.volumeBundlingQuantifiableBenefitInrCr).toBe(1.79);
      expect(summary.eauctionAddressableSpendInrCr).toBe(22);
      expect(summary.totalPotentialEAuctionOpportunityInrCr).toBe(2);
      expect(summary.categorySpecialistOpportunityInrCr).toBe(4.5);
    });

    it('handles zero and negative values cleanly', () => {
      const zero = buildStrategicSummary(0);
      expect(zero.totalAddressableSpendInrCr).toBe(0);
      expect(zero.vendorConsolidationAddressableSpendInrCr).toBe(0);

      const negative = buildStrategicSummary(-50);
      expect(negative.totalAddressableSpendInrCr).toBe(0);
    });
  });

  describe('buildDocumentSavingsResult', () => {
    it('synthesizes opportunities, action plans, waterfall metrics, and strategic summary from material groups', () => {
      const materialGroups: ExecutiveOpportunityBriefMaterialGroupRow[] = [
        { label: 'Direct Materials', item_count: 100, spend_cr: 100 },
        { label: 'Packaging', item_count: 50, spend_cr: 50 },
        { label: 'Heavy Mechanical', item_count: 30, spend_cr: 30 },
        { label: 'Logistics', item_count: 20, spend_cr: 20 },
        { label: 'Utilities', item_count: 15, spend_cr: 15 },
        { label: 'Chemicals', item_count: 10, spend_cr: 10 },
        { label: null, item_count: 5, spend_cr: 5 },
        { label: '   ', item_count: 2, spend_cr: null },
        { label: '', item_count: 1, spend_cr: 'invalid' as unknown as number },
        { label: 'Raw Materials', item_count: 1, spend_cr: Number.NaN }
      ];

      const result = buildDocumentSavingsResult(materialGroups, 230);
      expect(result.opportunities).toHaveLength(10);
      expect(result.actionPlans).toHaveLength(4);

      const opps = result.opportunities as Array<{
        opportunity_id: string;
        category: string;
        spend_inr_cr: number;
        potential_savings_inr_cr: number;
        source_engine: string;
      }>;
      expect(opps[0].category).toBe('Direct Materials');
      expect(opps[0].source_engine).toBe('PRICE_DISPERSION');
      expect(opps[6].category).toBe('Materials');
      expect(opps[7].category).toBe('Materials');
      expect(opps[8].category).toBe('Materials');

      const waterfall = result.waterfallMetrics as Record<string, number>;
      expect(waterfall.total_spend_inr_cr).toBe(230);
      expect(waterfall.addressable_spend_inr_cr).toBe(230);
      expect(waterfall.identified_opportunities_count).toBe(10);
      expect(waterfall.gross_potential_savings_inr_cr).toBeGreaterThan(0);
      expect(waterfall.net_potential_savings_inr_cr).toBeGreaterThan(0);
      expect(waterfall.proven_opportunity_inr_cr).toBeGreaterThan(0);
      expect(waterfall.discovery_opportunity_inr_cr).toBeGreaterThan(0);

      const strategic = result.strategicSummary as Record<string, number>;
      expect(strategic.totalAddressableSpendInrCr).toBe(230);
      expect(strategic.vendorConsolidationAddressableSpendInrCr).toBe(87.4);
    });

    it('falls back to material groups spend sum when totalSpendCrInput is 0 or negative', () => {
      const materialGroups: ExecutiveOpportunityBriefMaterialGroupRow[] = [
        { label: 'Direct', item_count: 10, spend_cr: 40 },
        { label: 'Indirect', item_count: 5, spend_cr: 60 }
      ];

      const result = buildDocumentSavingsResult(materialGroups, 0);
      const waterfall = result.waterfallMetrics as Record<string, number>;
      expect(waterfall.total_spend_inr_cr).toBe(100);
      expect(waterfall.identified_opportunities_count).toBe(2);

      const negativeResult = buildDocumentSavingsResult(materialGroups, -10);
      const negWaterfall = negativeResult.waterfallMetrics as Record<string, number>;
      expect(negWaterfall.total_spend_inr_cr).toBe(100);
    });

    it('handles empty material groups cleanly', () => {
      const result = buildDocumentSavingsResult([], 0);
      const waterfall = result.waterfallMetrics as Record<string, number>;
      expect(waterfall.total_spend_inr_cr).toBe(0);
      expect(waterfall.identified_opportunities_count).toBe(0);
      expect(result.actionPlans).toHaveLength(0);
    });
  });
});
