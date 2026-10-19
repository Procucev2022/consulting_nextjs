/**
 * Module 2 — Lever 6: Category Specialisation Engine
 * Compliant with Rule 4, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import {
  LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS,
  LEVER6_BENEFIT_DISCLAIMER,
  LEVER6_METHODOLOGY_DISCLOSURES,
  LEVER6_APPROACHES,
  LEVER6_PRIORITIES
} from '../constants/module2CategorySpecialisation';
import type {
  CategorySpecialisationResult,
  CategorySpecialisationProfile,
  CategoryOpportunityBenefit,
  CrossLeverOverlapItem,
  CategorySpecialisationCalculationOptions
} from '../types/module2CategorySpecialisation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import {
  roundToTwoDecimals,
  isKnownCustomerAssessment
} from './module2CategorySpecialisationCalculators';
import {
  classifyCategory,
  buildCategoryProfile
} from './module2CategorySpecialisationPrioritiser';
import { Module2CategorySpecialisationMetricHelper } from './module2CategorySpecialisationMetricHelper';
import { Module2CategorySpecialisationOpportunityHelper } from './module2CategorySpecialisationOpportunityHelper';
import {
  evaluateCrossLeverOverlap,
  aggregateSpecialisationSummary
} from './module2CategorySpecialisationOverlapHelper';

export class Module2CategorySpecialisationEngine {
  private static groupTransactionsByCategory(
    transactions: StrategicInputTransaction[]
  ): Map<string, StrategicInputTransaction[]> {
    const categoryMap = new Map<string, StrategicInputTransaction[]>();
    for (const t of transactions) {
      const cat = (t.spend_category || 'General Procurement').trim();
      const list = categoryMap.get(cat) || [];
      list.push(t);
      categoryMap.set(cat, list);
    }
    return categoryMap;
  }

  private static processCategory(
    categoryName: string,
    txs: StrategicInputTransaction[],
    totalSpendInr: number,
    options?: CategorySpecialisationCalculationOptions
  ): {
    profile: CategorySpecialisationProfile;
    benefits: CategoryOpportunityBenefit[];
  } {
    const metrics = Module2CategorySpecialisationMetricHelper.buildMetricsForCategory(categoryName, txs);
    const classification = classifyCategory(metrics, totalSpendInr, options?.customThresholds);
    const profile = buildCategoryProfile(metrics, totalSpendInr, classification);
    const benefits = Module2CategorySpecialisationOpportunityHelper.evaluateOpportunitiesForCategory(
      metrics,
      classification.priority
    );
    profile.opportunities = benefits;

    return { profile, benefits };
  }

  public static calculate(
    assessmentId: string,
    options?: CategorySpecialisationCalculationOptions
  ): CategorySpecialisationResult {
    const startTime = Date.now();
    logger.info('Starting Lever 6 Category Specialisation calculation', { assessmentId });

    const transactions = Module2CanonicalService.getCanonicalTransactions(assessmentId);
    let totalSpendInr = 0;
    for (const t of transactions) {
      totalSpendInr += t.total_spend_inr ?? 0;
    }
    totalSpendInr = roundToTwoDecimals(totalSpendInr);

    const categoryGroups = this.groupTransactionsByCategory(transactions);
    const categories: CategorySpecialisationProfile[] = [];
    const allBenefits: CategoryOpportunityBenefit[] = [];

    let priorityACount = 0;
    let priorityBCount = 0;
    let priorityCCount = 0;
    let dedicatedCount = 0;
    let sharedCount = 0;
    let centralisedCount = 0;
    let automatedCount = 0;

    for (const [catName, txs] of categoryGroups.entries()) {
      const { profile, benefits } = this.processCategory(catName, txs, totalSpendInr, options);
      categories.push(profile);
      allBenefits.push(...benefits);

      if (profile.priority === LEVER6_PRIORITIES.PRIORITY_A) priorityACount++;
      else if (profile.priority === LEVER6_PRIORITIES.PRIORITY_B) priorityBCount++;
      else priorityCCount++;

      if (profile.recommendedApproach === LEVER6_APPROACHES.DEDICATED_CATEGORY_MANAGER) dedicatedCount++;
      else if (profile.recommendedApproach === LEVER6_APPROACHES.SHARED_CATEGORY_MANAGER) sharedCount++;
      else if (profile.recommendedApproach === LEVER6_APPROACHES.CENTRALISED_CATEGORY_MGMT) centralisedCount++;
      else automatedCount++;
    }

    // Sort categories by annual spend descending
    categories.sort((a, b) => b.annualSpendInr - a.annualSpendInr);

    // Cross-lever overlap evaluation
    // (Head F defaults to exclusion unless opportunity-level record proves distinct scope)
    const overlapItems: CrossLeverOverlapItem[] = allBenefits.map((b) =>
      evaluateCrossLeverOverlap(b)
    );

    const summary = aggregateSpecialisationSummary(
      assessmentId,
      totalSpendInr,
      allBenefits,
      overlapItems,
      categories.length,
      priorityACount,
      priorityBCount,
      priorityCCount,
      dedicatedCount,
      sharedCount,
      centralisedCount,
      automatedCount
    );

    const customerName = isKnownCustomerAssessment(assessmentId)
      ? assessmentId === 'AIC-2026-0002' ? 'ABC Textile Ltd' : 'PQR Cement Ltd'
      : `Assessment ${assessmentId}`;

    logger.info('Completed Lever 6 Category Specialisation calculation', {
      assessmentId,
      categoriesCount: categories.length,
      grossTentativeBaseCr: summary.grossTentativeOpportunityBaseCr,
      netIndicativeBaseCr: summary.netIndicativeOpportunityBaseCr,
      durationMs: Date.now() - startTime
    });

    return {
      assessmentId,
      customerName,
      calculatedAt: new Date().toISOString(),
      summary,
      categories,
      overlapItems,
      opportunityHeadAssumptions: Object.values(LEVER6_OPPORTUNITY_HEAD_ASSUMPTIONS),
      methodologyDisclosures: LEVER6_METHODOLOGY_DISCLOSURES,
      generalDisclaimer: LEVER6_BENEFIT_DISCLAIMER
    };
  }
}
