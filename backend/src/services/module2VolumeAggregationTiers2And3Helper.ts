/**
 * Module 2 — Lever 4: Volume Aggregation Tiers 2 and 3 Helper
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import {
  VOLUME_AGGREGATION_OPPORTUNITY_TIERS,
  VOLUME_AGGREGATION_STATUSES
} from '../constants/module2VolumeAggregation';
import { Module2VolumeAggregationCalculators } from './module2VolumeAggregationCalculators';
import type { VolumeAggregationOpportunity } from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

export class Module2VolumeAggregationTiers2And3Helper {
  private static buildSingleTier2Opportunity(
    unspsc: string,
    txs: StrategicInputTransaction[]
  ): VolumeAggregationOpportunity | null {
    const distinctCodes = new Set<string>();
    let totalSpendInr = 0;
    let totalCandidateQty = 0;
    const baseUom = txs[0]?.uom || 'EA';
    const plantsSet = new Set<string>();
    const suppliersSet = new Set<string>();

    for (const t of txs) {
      totalSpendInr += t.total_spend_inr ?? 0;
      totalCandidateQty += t.quantity ?? 0;
      if (t.material_code) distinctCodes.add(t.material_code);
      if (t.plant) plantsSet.add(t.plant);
      if (t.vendor_name) suppliersSet.add(t.vendor_name);
    }

    if (distinctCodes.size < 2) return null;

    const spendCr = Number((totalSpendInr / 10000000).toFixed(4));
    const demandRes = Module2VolumeAggregationCalculators.classifyDemandRecurrence(txs);
    const catName = txs[0]?.spend_category || 'General Procurement';

    return {
      opportunityId: `L4-T2-${unspsc}`,
      tier: VOLUME_AGGREGATION_OPPORTUNITY_TIERS.TIER_2_COMPARABLE,
      tierLabel: 'Tier 2 — Technically Comparable Materials',
      materialCode: `UNSPSC-${unspsc}`,
      materialDesc: `${catName} (${distinctCodes.size} internal part codes)`,
      category: catName,
      unspscCode: unspsc,
      baseUom,
      totalHistoricalSpendInr: totalSpendInr,
      totalHistoricalSpendCr: spendCr,
      potentiallyAggregatableSpendInr: totalSpendInr,
      potentiallyAggregatableSpendCr: spendCr,
      aggregatableQuantity: 0,
      excludedQuantity: Number(totalCandidateQty.toFixed(2)),
      unmatchedAdjustmentsInr: 0,
      transactionCount: txs.length,
      plantCount: plantsSet.size,
      plants: Array.from(plantsSet),
      supplierCount: suppliersSet.size,
      primarySupplier: txs[0]?.vendor_name || 'N/A',
      suppliers: Array.from(suppliersSet),
      demandClassification: demandRes.classification,
      demandClassificationLabel: demandRes.classification.replace('_', ' '),
      demandClassificationEvidence: demandRes.evidence,
      sourceTransactionDates: demandRes.sourceTransactionDates,
      opportunityStatus: VOLUME_AGGREGATION_STATUSES.TECHNICAL_VALIDATION_REQUIRED,
      statusReason: `Shared UNSPSC ${unspsc} across ${distinctCodes.size} codes. Physical aggregation conditional.`,
      nextRecommendedAction:
        'Conduct engineering technical validation to confirm interchangeability and operating tolerances.',
      technicalValidationRequired: true,
      wavgUnitPriceInr: 0,
      eligibilityType: plantsSet.size >= 2 ? 'MULTI_FACILITY_POOLING' : 'MULTI_VENDOR_ALLOCATION',
      isGenuineOpportunity: true
    };
  }

  /**
   * Builds Tier 2: Technically Comparable Review Candidates.
   */
  public static buildTier2Opportunities(
    unspscGroups: Map<string, StrategicInputTransaction[]>
  ): VolumeAggregationOpportunity[] {
    const opportunities: VolumeAggregationOpportunity[] = [];

    for (const [unspsc, txs] of unspscGroups.entries()) {
      if (unspsc === '00000000' || txs.length === 0) continue;
      const opp = this.buildSingleTier2Opportunity(unspsc, txs);
      if (opp) opportunities.push(opp);
    }

    return opportunities.sort((a, b) => b.totalHistoricalSpendInr - a.totalHistoricalSpendInr);
  }

  /**
   * Builds Tier 3: Category-Level Sourcing Opportunities.
   */
  public static buildTier3Opportunities(
    categoryGroups: Map<string, StrategicInputTransaction[]>
  ): VolumeAggregationOpportunity[] {
    const opportunities: VolumeAggregationOpportunity[] = [];

    for (const [catName, txs] of categoryGroups.entries()) {
      if (txs.length === 0) continue;
      let totalSpendInr = 0;
      const plantsSet = new Set<string>();
      const suppliersSet = new Set<string>();

      for (const t of txs) {
        totalSpendInr += t.total_spend_inr ?? 0;
        if (t.plant) plantsSet.add(t.plant);
        if (t.vendor_name) suppliersSet.add(t.vendor_name);
      }

      const spendCr = Number((totalSpendInr / 10000000).toFixed(4));
      const demandRes = Module2VolumeAggregationCalculators.classifyDemandRecurrence(txs);

      opportunities.push({
        opportunityId: `L4-T3-${catName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        tier: VOLUME_AGGREGATION_OPPORTUNITY_TIERS.TIER_3_CATEGORY,
        tierLabel: 'Tier 3 — Category-Level Sourcing',
        materialCode: `CAT-${catName.substring(0, 12)}`,
        materialDesc: `Category Sourcing Umbrella: ${catName}`,
        category: catName,
        unspscCode: 'CATEGORY_VARIOUS',
        baseUom: 'N/A (Diverse Geometries)',
        totalHistoricalSpendInr: totalSpendInr,
        totalHistoricalSpendCr: spendCr,
        potentiallyAggregatableSpendInr: totalSpendInr,
        potentiallyAggregatableSpendCr: spendCr,
        aggregatableQuantity: 0,
        excludedQuantity: 0,
        unmatchedAdjustmentsInr: 0,
        transactionCount: txs.length,
        plantCount: plantsSet.size,
        plants: Array.from(plantsSet),
        supplierCount: suppliersSet.size,
        primarySupplier: txs[0]?.vendor_name || 'N/A',
        suppliers: Array.from(suppliersSet),
        demandClassification: demandRes.classification,
        demandClassificationLabel: demandRes.classification.replace('_', ' '),
        demandClassificationEvidence: demandRes.evidence,
        sourceTransactionDates: demandRes.sourceTransactionDates,
        opportunityStatus: VOLUME_AGGREGATION_STATUSES.READY_FOR_SOURCING_REVIEW,
        statusReason: `Category umbrella expenditure across ${suppliersSet.size} suppliers. No physical lot aggregation.`,
        nextRecommendedAction: 'Initiate coordinated corporate RFP for master commercial umbrella terms.',
        technicalValidationRequired: false,
        wavgUnitPriceInr: 0,
        eligibilityType: 'MULTI_FACILITY_POOLING',
        isGenuineOpportunity: true
      });
    }

    return opportunities.sort((a, b) => b.totalHistoricalSpendInr - a.totalHistoricalSpendInr);
  }
}
