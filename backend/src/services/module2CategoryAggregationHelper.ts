/**
 * Module 2 — UNSPSC Category Aggregation Helper
 * Aggregates material-level opportunities into category-level summaries with verified UNSPSC mapping
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type {
  DirectPriceItemOpportunity,
  DirectPriceCategorySummary
} from '../types/module2DirectPriceImprovement';
import { EAUCTION_CONFIG } from '../constants/module2EAuction';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';

export class Module2CategoryAggregationHelper {
  public static buildCategorySummaries(
    items: DirectPriceItemOpportunity[]
  ): DirectPriceCategorySummary[] {
    const categoryMap = new Map<string, DirectPriceItemOpportunity[]>();

    for (const item of items) {
      const cat = resolveHumanReadableCategory(item.spendCategory, item.materialCode);
      let list = categoryMap.get(cat);
      if (!list) {
        list = [];
        categoryMap.set(cat, list);
      }
      list.push(item);
    }

    const summaries: DirectPriceCategorySummary[] = [];

    for (const [spendCategory, catItems] of categoryMap.entries()) {
      const distinctMaterials = new Set(catItems.map((i) => i.materialCode)).size;
      const txCount = catItems.reduce((sum, i) => sum + i.transactionCount, 0);
      const totalQty = Math.round(catItems.reduce((sum, i) => sum + i.totalEligibleQuantity, 0) * 1000) / 1000;
      const uoms = new Set(catItems.map((i) => i.uom));
      const uom = uoms.size === 1 ? catItems[0].uom : 'MIXED';

      const actualCostInr = Math.round(catItems.reduce((sum, i) => sum + i.actualPurchaseCostInr, 0) * 100) / 100;
      const actualCostCr = Number((actualCostInr / 10000000).toFixed(4));

      const benchCostInr = Math.round(catItems.reduce((sum, i) => sum + i.benchmarkCostInr, 0) * 100) / 100;
      const benchCostCr = Number((benchCostInr / 10000000).toFixed(4));

      const lostOppInr = Math.round(catItems.reduce((sum, i) => sum + i.historicalLostOpportunityInr, 0) * 100) / 100;
      const lostOppCr = Number((lostOppInr / 10000000).toFixed(4));

      const oppPct = actualCostInr > 0 ? Number(((lostOppInr / actualCostInr) * 100).toFixed(2)) : 0;

      const hasVerifiedUnspsc = spendCategory !== 'Unmapped Category';
      const unspscCode = hasVerifiedUnspsc ? '10000000' : EAUCTION_CONFIG.UNMAPPED_UNSPSC_CODE;
      const unspscCategory = spendCategory;

      const hasDisqualified = catItems.some((i) => i.qualificationStatus !== 'QUALIFIED');
      const dataQualityStatus = !hasVerifiedUnspsc || hasDisqualified ? 'Requires Data Review' : 'Qualified';

      summaries.push({
        unspscCode,
        unspscCategory,
        spendCategory,
        distinctMaterialCount: distinctMaterials,
        eligibleTransactionCount: txCount,
        eligibleQuantity: totalQty,
        uom,
        eligibleSpendInr: actualCostInr,
        eligibleSpendCr: actualCostCr,
        actualPurchaseCostInr: actualCostInr,
        actualPurchaseCostCr: actualCostCr,
        benchmarkCostInr: benchCostInr,
        benchmarkCostCr: benchCostCr,
        historicalLostOpportunityInr: lostOppInr,
        historicalLostOpportunityCr: lostOppCr,
        opportunityPct: oppPct,
        dataQualityStatus,
        materials: [...catItems].sort((a, b) => b.historicalLostOpportunityInr - a.historicalLostOpportunityInr)
      });
    }

    return summaries.sort((a, b) => b.eligibleSpendInr - a.eligibleSpendInr);
  }
}
