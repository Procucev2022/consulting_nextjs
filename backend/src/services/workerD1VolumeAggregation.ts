import { MODULE2_D1_VOLUME } from '../constants/module2D1Scoped';
import type {
  VolumeAggregationMaterialGroup, VolumeAggregationOpportunity, VolumeAggregationOpportunityEligibility,
  VolumeAggregationRecommendationCopy, VolumeAggregationResult
} from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import {
  activeVolumeMonths, buildVolumeMaterialProfiles, buildVolumePlantProfiles, classifyVolumeDemand,
  cleanVolumeValue, groupVolumeTransactions, roundVolumeSpendInCrores, totalVolumeQuantity, totalVolumeSpend,
  volumePlants, volumeSuppliers
} from './workerD1VolumeAggregationProfiles';

const getOpportunityEligibility = (
  group: VolumeAggregationMaterialGroup,
  plantCount: number
): VolumeAggregationOpportunityEligibility => {
  const hasExactIdentity = Boolean(group.code && group.unit);
  const singlePurchase = group.transactions.length <= MODULE2_D1_VOLUME.SINGLE_TRANSACTION_COUNT;
  return { hasExactIdentity, singlePurchase, eligible: hasExactIdentity && plantCount > 1 && !singlePurchase };
};

const getRecommendationCopy = (
  eligible: boolean,
  hasExactIdentity: boolean
): VolumeAggregationRecommendationCopy => {
  if (eligible) return {
    reason: 'Exact material code and UOM are purchased at multiple plants; commercial benefit is not established.',
    nextAction: 'Validate specification, delivery constraints, and plant demand before sourcing review.'
  };
  if (hasExactIdentity) return {
    reason: 'Purchases do not show a multi-plant aggregation pattern.',
    nextAction: 'Complete material and unit-of-measure data before evaluating aggregation.'
  };
  return {
    reason: 'Exact material code or UOM is missing; comparability cannot be established.',
    nextAction: 'Complete material and unit-of-measure data before evaluating aggregation.'
  };
};

const getOpportunityStatus = (
  eligible: boolean,
  hasExactIdentity: boolean
): VolumeAggregationOpportunity['opportunityStatus'] => {
  if (eligible) return MODULE2_D1_VOLUME.STATUS_REQUIRES_TECHNICAL_REVIEW;
  return hasExactIdentity ? MODULE2_D1_VOLUME.STATUS_NOT_SUITABLE : MODULE2_D1_VOLUME.STATUS_INSUFFICIENT_DATA;
};

const getEligibilityType = (
  eligible: boolean,
  singlePurchase: boolean,
  hasUnit: boolean
): VolumeAggregationOpportunity['eligibilityType'] => {
  if (eligible) return 'MULTI_FACILITY_POOLING';
  if (singlePurchase) return 'SINGLE_PURCHASE_NON_AGGREGATABLE';
  return hasUnit ? 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN' : 'INCOMPATIBLE_UOM';
};

const getOpportunityAmounts = (
  eligible: boolean,
  spend: number,
  quantity: number
): Pick<VolumeAggregationOpportunity,
  'potentiallyAggregatableSpendInr' | 'potentiallyAggregatableSpendCr' | 'aggregatableQuantity' | 'excludedQuantity'> => ({
  potentiallyAggregatableSpendInr: eligible ? spend : 0,
  potentiallyAggregatableSpendCr: eligible ? roundVolumeSpendInCrores(spend) : 0,
  aggregatableQuantity: eligible ? quantity : 0,
  excludedQuantity: eligible ? 0 : quantity
});

const buildOpportunityId = (group: VolumeAggregationMaterialGroup): string => {
  const materialCode = group.code || 'UNMAPPED';
  const unit = group.unit || 'UOM-UNKNOWN';
  return `VOL-${materialCode}-${unit}`;
};

const findUnspscCode = (transactions: StrategicInputTransaction[]): string =>
  transactions.find((transaction) => transaction.unspsc_code)?.unspsc_code || '';

const weightedAveragePrice = (spend: number, quantity: number): number =>
  quantity > 0 ? spend / quantity : 0;

const buildOpportunity = (group: VolumeAggregationMaterialGroup): VolumeAggregationOpportunity => {
  const transactions = group.transactions;
  const spend = totalVolumeSpend(transactions);
  const quantity = totalVolumeQuantity(transactions);
  const plants = volumePlants(transactions);
  const suppliers = volumeSuppliers(transactions);
  const demand = classifyVolumeDemand(transactions);
  const eligibility = getOpportunityEligibility(group, plants.length);
  const status = getOpportunityStatus(eligibility.eligible, eligibility.hasExactIdentity);
  const recommendationCopy = getRecommendationCopy(eligibility.eligible, eligibility.hasExactIdentity);
  const amounts = getOpportunityAmounts(eligibility.eligible, spend, quantity);
  return {
    opportunityId: buildOpportunityId(group),
    tier: MODULE2_D1_VOLUME.EXACT_MATCH_TIER,
    tierLabel: 'Exact material code and UOM match',
    materialCode: group.code,
    materialDesc: group.description,
    category: group.category,
    unspscCode: findUnspscCode(transactions),
    baseUom: group.unit,
    totalHistoricalSpendInr: spend,
    totalHistoricalSpendCr: roundVolumeSpendInCrores(spend),
    ...amounts,
    unmatchedAdjustmentsInr: 0,
    transactionCount: transactions.length,
    plantCount: plants.length,
    plants,
    supplierCount: suppliers.length,
    primarySupplier: suppliers[0] || '',
    suppliers,
    demandClassification: demand,
    demandClassificationLabel: demand.replaceAll('_', ' ').toLocaleLowerCase('en-US'),
    demandClassificationEvidence: `${activeVolumeMonths(transactions).size} distinct calendar month(s) observed.`,
    sourceTransactionDates: transactions.map((transaction) => cleanVolumeValue(transaction.po_date)).filter(Boolean),
    opportunityStatus: status,
    statusReason: recommendationCopy.reason,
    nextRecommendedAction: recommendationCopy.nextAction,
    technicalValidationRequired: eligibility.eligible,
    wavgUnitPriceInr: weightedAveragePrice(spend, quantity),
    eligibilityType: getEligibilityType(eligibility.eligible, eligibility.singlePurchase, Boolean(group.unit)),
    isGenuineOpportunity: eligibility.eligible
  };
};

export const buildVolumeAggregationResult = (
  assessmentId: string,
  transactions: StrategicInputTransaction[]
): VolumeAggregationResult => {
  const groups = groupVolumeTransactions(transactions);
  const profiles = buildVolumeMaterialProfiles(groups);
  const opportunities = groups.map(buildOpportunity);
  const tier1Opportunities = opportunities.filter((opportunity) => opportunity.isGenuineOpportunity);
  const totalIncurredSpendInr = totalVolumeSpend(transactions);
  const potentiallyAggregatableSpendInr = tier1Opportunities.reduce(
    (total, opportunity) => total + opportunity.potentiallyAggregatableSpendInr, 0
  );
  const singlePurchase = opportunities.filter(
    (opportunity) => opportunity.transactionCount <= MODULE2_D1_VOLUME.SINGLE_TRANSACTION_COUNT
  );
  const incompatible = opportunities.filter((opportunity) => !opportunity.baseUom);
  const singlePurchaseSpend = singlePurchase.reduce((total, item) => total + item.totalHistoricalSpendInr, 0);
  const incompatibleSpend = incompatible.reduce((total, item) => total + item.totalHistoricalSpendInr, 0);
  const compatibleSpend = totalIncurredSpendInr - incompatibleSpend;
  const limitedHistorySpend = totalIncurredSpendInr - potentiallyAggregatableSpendInr;
  const tier1SpendCr = roundVolumeSpendInCrores(potentiallyAggregatableSpendInr);
  return {
    assessmentId,
    coverageSummary: {
      assessmentId,
      totalTransactionsCount: transactions.length,
      totalMaterialRecordsCount: groups.length,
      genuineTier1OpportunitiesCount: tier1Opportunities.length,
      singleIsolatedPurchaseCount: singlePurchase.length,
      singleIsolatedPurchaseSpendCr: roundVolumeSpendInCrores(singlePurchaseSpend),
      limitedHistoryCount: groups.filter(
        (group) => activeVolumeMonths(group.transactions).size < MODULE2_D1_VOLUME.RECURRING_MONTH_COUNT
      ).length,
      uomIncompatibleCount: incompatible.length,
      uomIncompatibleSpendCr: roundVolumeSpendInCrores(incompatibleSpend),
      excludedUnresolvedUomCount: incompatible.length,
      genuineOpportunitiesCount: tier1Opportunities.length,
      grossMaterialSpendInr: totalIncurredSpendInr,
      grossMaterialSpendCr: roundVolumeSpendInCrores(totalIncurredSpendInr),
      netIncurredSpendInr: totalIncurredSpendInr,
      netIncurredSpendCr: roundVolumeSpendInCrores(totalIncurredSpendInr),
      uomCompatibleSpendInr: compatibleSpend,
      uomCompatibleSpendCr: roundVolumeSpendInCrores(compatibleSpend),
      genuineOpportunitySpendInr: potentiallyAggregatableSpendInr,
      genuineOpportunitySpendCr: tier1SpendCr,
      limitedHistorySpendInr: limitedHistorySpend,
      limitedHistorySpendCr: roundVolumeSpendInCrores(limitedHistorySpend),
      eligiblePhysicalAggregationSpendInr: potentiallyAggregatableSpendInr,
      eligiblePhysicalAggregationSpendCr: tier1SpendCr,
      excludedPhysicalAggregationSpendInr: totalIncurredSpendInr - potentiallyAggregatableSpendInr,
      excludedPhysicalAggregationSpendCr: roundVolumeSpendInCrores(
        totalIncurredSpendInr - potentiallyAggregatableSpendInr
      ),
      totalIncurredSpendInr,
      totalIncurredSpendCr: roundVolumeSpendInCrores(totalIncurredSpendInr),
      potentiallyAggregatableSpendInr,
      potentiallyAggregatableSpendCr: tier1SpendCr,
      tier1IdenticalCount: tier1Opportunities.length,
      tier1SpendCr,
      tier2ComparableCount: 0,
      tier2SpendCr: 0,
      tier3CategoryCount: 0,
      tier3SpendCr: 0,
      unmatchedAdjustmentsCount: 0,
      unmatchedAdjustmentsSpendInr: 0,
      reconciliationDeltaInr: 0
    },
    tier1Opportunities,
    tier2Opportunities: [],
    tier3Opportunities: [],
    plantProfiles: buildVolumePlantProfiles(transactions),
    materialProfiles: profiles,
    unmatchedAdjustments: [],
    methodologyDisclosures: [MODULE2_D1_VOLUME.DISCLOSURE],
    transactions
  };
};

