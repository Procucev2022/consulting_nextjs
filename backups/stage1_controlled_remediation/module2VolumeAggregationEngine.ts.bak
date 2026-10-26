/**
 * Module 2 — Lever 4: Volume Aggregation Engine
 * Compliant with Rule 4, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import { getStrategicTransactionMaterialId } from './module2MaterialMappingRegister';
import { VOLUME_AGGREGATION_METHODOLOGY_DISCLOSURES } from '../constants/module2VolumeAggregation';
import { Module2VolumeAggregationCalculators } from './module2VolumeAggregationCalculators';
import { Module2VolumeAggregationTiersHelper } from './module2VolumeAggregationTiersHelper';
import { Module2VolumeAggregationPlantHelper } from './module2VolumeAggregationPlantHelper';
import type {
  VolumeAggregationResult,
  VolumeAggregationCoverageSummary
} from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

export class Module2VolumeAggregationEngine {
  private static groupTransactions(transactions: StrategicInputTransaction[]): {
    materialGroups: Map<string, StrategicInputTransaction[]>;
    unspscGroups: Map<string, StrategicInputTransaction[]>;
    categoryGroups: Map<string, StrategicInputTransaction[]>;
    totalGrossSpendInr: number;
  } {
    const materialGroups = new Map<string, StrategicInputTransaction[]>();
    const unspscGroups = new Map<string, StrategicInputTransaction[]>();
    const categoryGroups = new Map<string, StrategicInputTransaction[]>();
    let totalGrossSpendInr = 0;

    for (const t of transactions) {
      totalGrossSpendInr += t.total_spend_inr ?? 0;

      const matKey = getStrategicTransactionMaterialId(t);
      let matList = materialGroups.get(matKey);
      if (!matList) {
        matList = [];
        materialGroups.set(matKey, matList);
      }
      matList.push(t);

      const unspsc = (t.unspsc_code || '00000000').trim();
      let unspscList = unspscGroups.get(unspsc);
      if (!unspscList) {
        unspscList = [];
        unspscGroups.set(unspsc, unspscList);
      }
      unspscList.push(t);

      const category = (t.spend_category || 'General Procurement').trim();
      let catList = categoryGroups.get(category);
      if (!catList) {
        catList = [];
        categoryGroups.set(category, catList);
      }
      catList.push(t);
    }

    return { materialGroups, unspscGroups, categoryGroups, totalGrossSpendInr };
  }

  /**
   * Primary calculation routine executing Lever 4 Volume Aggregation analysis.
   */
  public static calculate(assessmentId: string): VolumeAggregationResult {
    const startTime = Date.now();
    logger.info('Starting Lever 4 Volume Aggregation calculation', { assessmentId });

    const bundle = Module2CanonicalService.getCanonicalInput(assessmentId);
    const transactions = bundle.transactions || [];

    // 1. Process Adjustments and Unmatched Credit Notes
    const { regularTransactions, unmatchedAdjustments, netAdjustmentSpendInr } =
      Module2VolumeAggregationCalculators.processAdjustmentsAndCreditNotes(transactions);

    // 2. Group Transactions for Analysis
    const { materialGroups, unspscGroups, categoryGroups, totalGrossSpendInr } =
      this.groupTransactions(regularTransactions);

    // 3. Build Opportunity Tiers
    const tier1Opportunities = Module2VolumeAggregationTiersHelper.buildTier1Opportunities(materialGroups);
    const tier2Opportunities = Module2VolumeAggregationTiersHelper.buildTier2Opportunities(unspscGroups);
    const tier3Opportunities = Module2VolumeAggregationTiersHelper.buildTier3Opportunities(categoryGroups);

    // 4. Build Plant and Material Profiles
    const plantProfiles = Module2VolumeAggregationPlantHelper.buildPlantProfiles(
      regularTransactions,
      totalGrossSpendInr
    );
    const materialProfiles = Module2VolumeAggregationPlantHelper.buildMaterialProfiles(materialGroups);

    // 5. Aggregate Coverage Summary with Full Precision
    let potAggSpendInr = 0;
    let tier1SpendInr = 0;
    let genuineTier1Count = 0;
    let singleIsolatedCount = 0;
    let singleIsolatedSpendInr = 0;
    let uomIncompatCount = 0;
    let uomIncompatSpendInr = 0;

    for (const opp of tier1Opportunities) {
      potAggSpendInr += opp.potentiallyAggregatableSpendInr;
      tier1SpendInr += opp.totalHistoricalSpendInr;
      if (opp.isGenuineOpportunity) {
        genuineTier1Count++;
      } else if (
        opp.eligibilityType === 'SINGLE_PURCHASE_NON_AGGREGATABLE' ||
        opp.eligibilityType === 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN'
      ) {
        singleIsolatedCount++;
        singleIsolatedSpendInr += opp.totalHistoricalSpendInr;
      } else if (opp.eligibilityType === 'INCOMPATIBLE_UOM') {
        uomIncompatCount++;
        uomIncompatSpendInr += opp.totalHistoricalSpendInr;
      }
    }

    let tier2SpendInr = 0;
    for (const opp of tier2Opportunities) tier2SpendInr += opp.totalHistoricalSpendInr;

    let tier3SpendInr = 0;
    for (const opp of tier3Opportunities) tier3SpendInr += opp.totalHistoricalSpendInr;

    const totalNetSpendInr = totalGrossSpendInr + netAdjustmentSpendInr;
    const totalIncurredSpendCr = Number((totalNetSpendInr / 10000000).toFixed(4));
    const potAggSpendCr = Number((potAggSpendInr / 10000000).toFixed(4));
    const tier1SpendCr = Number((tier1SpendInr / 10000000).toFixed(4));
    const tier2SpendCr = Number((tier2SpendInr / 10000000).toFixed(4));
    const tier3SpendCr = Number((tier3SpendInr / 10000000).toFixed(4));
    const singleIsolatedSpendCr = Number((singleIsolatedSpendInr / 10000000).toFixed(4));
    const uomIncompatSpendCr = Number((uomIncompatSpendInr / 10000000).toFixed(4));

    const uomCompatibleSpendInr = potAggSpendInr + singleIsolatedSpendInr;
    const uomCompatibleSpendCr = Number((uomCompatibleSpendInr / 10000000).toFixed(4));
    const eligibleSpendInr = uomCompatibleSpendInr;
    const eligibleSpendCr = uomCompatibleSpendCr;
    const grossMaterialSpendInr = totalGrossSpendInr;
    const grossMaterialSpendCr = Number((grossMaterialSpendInr / 10000000).toFixed(4));

    const rawDelta = Number((totalNetSpendInr - (tier1SpendInr + netAdjustmentSpendInr)).toFixed(2));
    const reconciliationDeltaInr = Math.abs(rawDelta) < 0.005 ? 0.0 : rawDelta;

    const coverageSummary: VolumeAggregationCoverageSummary = {
      assessmentId,
      totalTransactionsCount: transactions.length,
      totalMaterialRecordsCount: tier1Opportunities.length,
      genuineTier1OpportunitiesCount: genuineTier1Count,
      genuineOpportunitiesCount: genuineTier1Count,
      singleIsolatedPurchaseCount: singleIsolatedCount,
      singleIsolatedPurchaseSpendCr: singleIsolatedSpendCr,
      limitedHistoryCount: singleIsolatedCount,
      limitedHistorySpendCr: singleIsolatedSpendCr,
      uomIncompatibleCount: uomIncompatCount,
      uomIncompatibleSpendCr: uomIncompatSpendCr,
      excludedUnresolvedUomCount: uomIncompatCount,
      grossMaterialSpendInr,
      grossMaterialSpendCr,
      netIncurredSpendInr: totalNetSpendInr,
      netIncurredSpendCr: totalIncurredSpendCr,
      uomCompatibleSpendInr,
      uomCompatibleSpendCr,
      genuineOpportunitySpendInr: potAggSpendInr,
      genuineOpportunitySpendCr: potAggSpendCr,
      limitedHistorySpendInr: singleIsolatedSpendInr,
      eligiblePhysicalAggregationSpendInr: eligibleSpendInr,
      eligiblePhysicalAggregationSpendCr: eligibleSpendCr,
      excludedPhysicalAggregationSpendInr: uomIncompatSpendInr,
      excludedPhysicalAggregationSpendCr: uomIncompatSpendCr,
      totalIncurredSpendInr: totalNetSpendInr,
      totalIncurredSpendCr,
      potentiallyAggregatableSpendInr: potAggSpendInr,
      potentiallyAggregatableSpendCr: potAggSpendCr,
      tier1IdenticalCount: tier1Opportunities.length,
      tier1SpendCr,
      tier2ComparableCount: tier2Opportunities.length,
      tier2SpendCr,
      tier3CategoryCount: tier3Opportunities.length,
      tier3SpendCr,
      unmatchedAdjustmentsCount: unmatchedAdjustments.length,
      unmatchedAdjustmentsSpendInr: netAdjustmentSpendInr,
      reconciliationDeltaInr
    };

    const durationMs = Date.now() - startTime;
    logger.info('Lever 4 Volume Aggregation calculation completed', {
      assessmentId,
      durationMs,
      totalTransactions: transactions.length,
      tier1Count: tier1Opportunities.length,
      tier2Count: tier2Opportunities.length,
      tier3Count: tier3Opportunities.length
    });

    return {
      assessmentId,
      coverageSummary,
      tier1Opportunities,
      tier2Opportunities,
      tier3Opportunities,
      plantProfiles,
      materialProfiles,
      unmatchedAdjustments,
      methodologyDisclosures: VOLUME_AGGREGATION_METHODOLOGY_DISCLOSURES,
      transactions
    };
  }
}
