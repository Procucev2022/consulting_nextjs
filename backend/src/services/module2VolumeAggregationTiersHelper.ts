/**
 * Module 2 — Lever 4: Volume Aggregation Tiers Helper
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import {
  VOLUME_AGGREGATION_OPPORTUNITY_TIERS,
  VOLUME_AGGREGATION_STATUSES
} from '../constants/module2VolumeAggregation';
import { Module2VolumeAggregationCalculators } from './module2VolumeAggregationCalculators';
import { Module2VolumeAggregationTiers2And3Helper } from './module2VolumeAggregationTiers2And3Helper';
import type {
  VolumeAggregationOpportunity,
  VolumeAggregationOpportunityStatus,
  VerifiedDensityConversionRecord,
  Tier1AccumulatedTx,
  UomConversionAuditRecord,
  VolumeAggregationEligibilityType
} from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

export class Module2VolumeAggregationTiersHelper {
  private static accumulateTier1Tx(
    t: StrategicInputTransaction,
    plantsSet: Set<string>,
    suppliersSet: Set<string>
  ): Tier1AccumulatedTx {
    const spend = t.total_spend_inr ?? 0;
    const qty = t.quantity ?? 0;
    if (t.plant) plantsSet.add(t.plant);
    if (t.vendor_name) suppliersSet.add(t.vendor_name);

    const conv = Module2VolumeAggregationCalculators.convertUom(
      qty,
      t.uom || 'EA',
      t.material_desc || '',
      t.spend_category
    );
    return {
      spend,
      rawQty: qty,
      convertedQty: conv.convertedQuantity,
      isCompat: conv.isCompatible,
      baseUom: conv.baseUom,
      densityRecord: conv.densityRecord,
      auditRecord: conv.auditRecord
    };
  }

  private static determineTier1Eligibility(
    excludedQty: number,
    plantCount: number,
    supplierCount: number,
    txCount: number
  ): {
    status: VolumeAggregationOpportunityStatus;
    reason: string;
    nextAction: string;
    eligibilityType: VolumeAggregationEligibilityType;
    isGenuineOpportunity: boolean;
  } {
    if (excludedQty > 0) {
      return {
        status: VOLUME_AGGREGATION_STATUSES.FURTHER_DATA_REQUIRED,
        reason: `Contains ${excludedQty} units with incompatible or unverified units of measure.`,
        nextAction: 'Harmonize purchase UOM or provide verified packaging/conversion factors before consolidation.',
        eligibilityType: 'INCOMPATIBLE_UOM',
        isGenuineOpportunity: false
      };
    }
    if (plantCount >= 2) {
      return {
        status: VOLUME_AGGREGATION_STATUSES.CANDIDATE_IDENTIFIED,
        reason: `Multi-facility demand pooled across ${plantCount} plants (${supplierCount} suppliers).`,
        nextAction: 'Harmonize purchase orders into institutional corporate volume tender.',
        eligibilityType: 'MULTI_FACILITY_POOLING',
        isGenuineOpportunity: true
      };
    }
    if (supplierCount >= 2) {
      return {
        status: VOLUME_AGGREGATION_STATUSES.CANDIDATE_IDENTIFIED,
        reason: `Multi-vendor procurement across ${supplierCount} suppliers at single facility.`,
        nextAction: 'Consolidate supplier share to explore institutional volume pricing in Phase 3.',
        eligibilityType: 'MULTI_VENDOR_ALLOCATION',
        isGenuineOpportunity: true
      };
    }
    if (txCount >= 2) {
      return {
        status: VOLUME_AGGREGATION_STATUSES.READY_FOR_SOURCING_REVIEW,
        reason: `Temporal repeat procurement (${txCount} orders) from single supplier at single facility.`,
        nextAction: 'Consolidate fragmented spot orders into periodic bulk delivery schedule.',
        eligibilityType: 'TEMPORAL_LOT_CONSOLIDATION',
        isGenuineOpportunity: true
      };
    }
    return {
      status: VOLUME_AGGREGATION_STATUSES.COMMERCIAL_EVALUATION_REQUIRED,
      reason:
        'No historical aggregation pattern identified (1 transaction, 1 plant, 1 supplier). Limited transaction history does not establish recurrence or preclude future joint sourcing.',
      nextAction:
        'Review forward demand requirements to assess future joint sourcing feasibility, or evaluate under Tier 3 Category Umbrella.',
      eligibilityType: 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN',
      isGenuineOpportunity: false
    };
  }

  private static extractMaterialMetadata(
    first: StrategicInputTransaction,
    matKey: string
  ): { matCode: string; matDesc: string; category: string; unspsc: string } {
    return {
      matCode: first.material_code || matKey,
      matDesc: first.material_desc || matKey,
      category: first.spend_category || 'General Procurement',
      unspsc: first.unspsc_code || '00000000'
    };
  }

  private static aggregateTransactions(
    txs: StrategicInputTransaction[],
    primaryBaseUom: string
  ): {
    totalSpendInr: number;
    aggregatableQty: number;
    excludedQty: number;
    primaryDensityRecord?: VerifiedDensityConversionRecord;
    plantsSet: Set<string>;
    suppliersSet: Set<string>;
    auditTrail: UomConversionAuditRecord[];
  } {
    let totalSpendInr = 0;
    let aggregatableQty = 0;
    let excludedQty = 0;
    let primaryDensityRecord: VerifiedDensityConversionRecord | undefined;
    const plantsSet = new Set<string>();
    const suppliersSet = new Set<string>();
    const auditTrail: UomConversionAuditRecord[] = [];

    for (const t of txs) {
      const acc = this.accumulateTier1Tx(t, plantsSet, suppliersSet);
      totalSpendInr += acc.spend;
      if (acc.densityRecord) primaryDensityRecord = acc.densityRecord;
      if (acc.auditRecord) auditTrail.push(acc.auditRecord);

      const isMatch = acc.isCompat && acc.baseUom === primaryBaseUom;
      aggregatableQty += isMatch ? acc.convertedQty : 0;
      excludedQty += isMatch ? 0 : acc.rawQty;
    }

    return {
      totalSpendInr,
      aggregatableQty,
      excludedQty,
      primaryDensityRecord,
      plantsSet,
      suppliersSet,
      auditTrail
    };
  }

  private static buildSingleTier1Opportunity(
    matKey: string,
    txs: StrategicInputTransaction[]
  ): VolumeAggregationOpportunity {
    const first = txs[0];
    const meta = this.extractMaterialMetadata(first, matKey);
    const firstConv = Module2VolumeAggregationCalculators.convertUom(
      first.quantity ?? 0,
      first.uom || 'EA',
      meta.matDesc,
      meta.category
    );
    const primaryBaseUom = firstConv.baseUom;

    const agg = this.aggregateTransactions(txs, primaryBaseUom);
    const demandRes = Module2VolumeAggregationCalculators.classifyDemandRecurrence(txs);
    const eligibility = this.determineTier1Eligibility(
      agg.excludedQty,
      agg.plantsSet.size,
      agg.suppliersSet.size,
      txs.length
    );

    const wavgPrice = agg.aggregatableQty > 0 ? agg.totalSpendInr / agg.aggregatableQty : 0;
    const spendCr = Number((agg.totalSpendInr / 10000000).toFixed(4));
    const potSpendInr = eligibility.isGenuineOpportunity ? agg.totalSpendInr : 0;
    const potSpendCr = Number((potSpendInr / 10000000).toFixed(4));

    return {
      opportunityId: `L4-T1-${meta.matCode.replace(/[^a-zA-Z0-9]/g, '_')}`,
      tier: VOLUME_AGGREGATION_OPPORTUNITY_TIERS.TIER_1_IDENTICAL,
      tierLabel: 'Tier 1 — Identical Materials',
      materialCode: meta.matCode,
      materialDesc: meta.matDesc,
      category: meta.category,
      unspscCode: meta.unspsc,
      baseUom: primaryBaseUom,
      totalHistoricalSpendInr: agg.totalSpendInr,
      totalHistoricalSpendCr: spendCr,
      potentiallyAggregatableSpendInr: potSpendInr,
      potentiallyAggregatableSpendCr: potSpendCr,
      aggregatableQuantity: Number(agg.aggregatableQty.toFixed(2)),
      excludedQuantity: Number(agg.excludedQty.toFixed(2)),
      unmatchedAdjustmentsInr: 0,
      transactionCount: txs.length,
      plantCount: agg.plantsSet.size,
      plants: Array.from(agg.plantsSet),
      supplierCount: agg.suppliersSet.size,
      primarySupplier: txs[0]?.vendor_name || 'N/A',
      suppliers: Array.from(agg.suppliersSet),
      demandClassification: demandRes.classification,
      demandClassificationLabel: demandRes.classification.replace('_', ' '),
      demandClassificationEvidence: demandRes.evidence,
      sourceTransactionDates: demandRes.sourceTransactionDates,
      opportunityStatus: eligibility.status,
      statusReason: eligibility.reason,
      nextRecommendedAction: eligibility.nextAction,
      technicalValidationRequired: false,
      densityConversion: agg.primaryDensityRecord,
      conversionAuditTrail: agg.auditTrail,
      wavgUnitPriceInr: Number(wavgPrice.toFixed(2)),
      eligibilityType: eligibility.eligibilityType,
      isGenuineOpportunity: eligibility.isGenuineOpportunity
    };
  }

  /**
   * Builds Tier 1: Identical Materials Opportunities.
   */
  public static buildTier1Opportunities(
    materialGroups: Map<string, StrategicInputTransaction[]>
  ): VolumeAggregationOpportunity[] {
    const opportunities: VolumeAggregationOpportunity[] = [];

    for (const [matKey, txs] of materialGroups.entries()) {
      if (txs.length === 0) continue;
      opportunities.push(this.buildSingleTier1Opportunity(matKey, txs));
    }

    return opportunities.sort((a, b) => b.totalHistoricalSpendInr - a.totalHistoricalSpendInr);
  }

  /**
   * Builds Tier 2: Technically Comparable Review Candidates.
   */
  public static buildTier2Opportunities(
    unspscGroups: Map<string, StrategicInputTransaction[]>
  ): VolumeAggregationOpportunity[] {
    return Module2VolumeAggregationTiers2And3Helper.buildTier2Opportunities(unspscGroups);
  }

  /**
   * Builds Tier 3: Category-Level Sourcing Opportunities.
   */
  public static buildTier3Opportunities(
    categoryGroups: Map<string, StrategicInputTransaction[]>
  ): VolumeAggregationOpportunity[] {
    return Module2VolumeAggregationTiers2And3Helper.buildTier3Opportunities(categoryGroups);
  }
}
