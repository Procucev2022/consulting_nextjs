/**
 * Module 2 — Cross-Lever Savings Deduplication & Consolidation Engine
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 4, 8, 9: Max 300 lines, complexity <= 10
 */

import logger from '../utils/logger';
import {
  CONSOLIDATED_SAVINGS_NOTICES,
  DEDUPLICATION_DISCLOSURES,
  LEVER_SAFEGUARD_RULES
} from '../constants/module2SavingsDeduplication';
import type {
  Module2CanonicalSavingsOpportunity,
  Module2ConsolidatedSavingsSummary,
  Module2LeverSavingsSummaryItem,
  SavingsDeduplicationOptions
} from '../types/module2SavingsDeduplication';
import { round2, toCrores } from './module2SavingsDeduplicationHelpers';
import { Module2SavingsOpportunityCollector } from './module2SavingsOpportunityCollector';

interface DeduplicationGroupItem {
  opp: Module2CanonicalSavingsOpportunity;
  isUnresolved?: boolean;
}

export class Module2SavingsDeduplicationEngine {
  private static groupCommercialAlternatives(
    opportunities: Module2CanonicalSavingsOpportunity[]
  ): Map<string, DeduplicationGroupItem[]> {
    const groups = new Map<string, DeduplicationGroupItem[]>();

    for (const opp of opportunities) {
      if (opp.isIncrementalBenefit || opp.isFinancingBenefitOnly) {
        continue;
      }
      const key = opp.categoryOrMaterialId.toUpperCase().trim();
      const list = groups.get(key) || [];
      list.push({ opp });
      groups.set(key, list);
    }
    return groups;
  }

  private static deduplicateGroup(group: DeduplicationGroupItem[]): void {
    if (group.length <= 1) {
      return;
    }

    // Sort descending by gross savings: highest defensible comparable estimate takes priority
    group.sort((a, b) => b.opp.estimatedGrossSavingsInr - a.opp.estimatedGrossSavingsInr);
    const primary = group[0].opp;
    const allIds = group.map((g) => g.opp.opportunityId);

    primary.overlappingOpportunityRefs = allIds.filter((id) => id !== primary.opportunityId);
    primary.deduplicationStatus = 'MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED';
    primary.netEstimatedSavingsInr = primary.estimatedGrossSavingsInr;
    primary.netEstimatedSavingsCr = toCrores(primary.estimatedGrossSavingsInr);
    primary.overlapAmountInr = 0;
    primary.overlapAmountCr = 0;

    for (let i = 1; i < group.length; i++) {
      const secondary = group[i].opp;
      secondary.overlappingOpportunityRefs = allIds.filter((id) => id !== secondary.opportunityId);

      if (group[i].isUnresolved) {
        secondary.deduplicationStatus = 'UNRESOLVED_EXCLUDED';
        secondary.approvalStatus = 'EXCLUDED_FROM_NET';
        secondary.unresolvedExclusionReason =
          'Scope overlap could not be reliably determined; excluded from consolidated net estimate pending review.';
        secondary.netEstimatedSavingsInr = 0;
        secondary.netEstimatedSavingsCr = 0;
        secondary.overlapAmountInr = secondary.estimatedGrossSavingsInr;
        secondary.overlapAmountCr = toCrores(secondary.estimatedGrossSavingsInr);
      } else {
        secondary.deduplicationStatus = 'DEDUPLICATED_OVERLAP';
        secondary.netEstimatedSavingsInr = 0;
        secondary.netEstimatedSavingsCr = 0;
        secondary.overlapAmountInr = secondary.estimatedGrossSavingsInr;
        secondary.overlapAmountCr = toCrores(secondary.estimatedGrossSavingsInr);
      }
    }
  }

  private static buildLeverSummaries(
    opportunities: Module2CanonicalSavingsOpportunity[]
  ): Module2LeverSavingsSummaryItem[] {
    const leverMeta: Array<{ id: number; code: string; name: string; status: string; rule: string; basis: string; isPp: boolean }> = [
      { id: 1, code: 'LEV-01', name: 'Direct Price Improvement', status: 'IMPLEMENTED', rule: LEVER_SAFEGUARD_RULES.LEVER_01, basis: 'Lowest Historical Peer Rate', isPp: true },
      { id: 2, code: 'LEV-02', name: 'E-Auction / Dynamic Bidding', status: 'IMPLEMENTED', rule: LEVER_SAFEGUARD_RULES.LEVER_02, basis: 'Reverse Auction Competitive Discovery', isPp: true },
      { id: 3, code: 'LEV-03', name: 'Vendor Base Consolidation', status: 'IMPLEMENTED', rule: LEVER_SAFEGUARD_RULES.LEVER_03, basis: 'Tail Vendor Consolidation & Admin PO', isPp: true },
      { id: 4, code: 'LEV-04', name: 'Volume Aggregation', status: 'IMPLEMENTED', rule: LEVER_SAFEGUARD_RULES.LEVER_04, basis: 'Multi-Facility Demand Pooling', isPp: true },
      { id: 5, code: 'LEV-05', name: 'Payment Terms Optimisation', status: 'IMPLEMENTED', rule: LEVER_SAFEGUARD_RULES.LEVER_05, basis: 'Financing Benefit & Working Capital Released', isPp: false },
      { id: 6, code: 'LEV-06', name: 'Category Specialisation', status: 'IMPLEMENTED', rule: LEVER_SAFEGUARD_RULES.LEVER_06, basis: 'Category Governance Charters & Overlap Control', isPp: true },
      { id: 7, code: 'LEV-07', name: 'Logistics & Packaging Specifications', status: 'COMING_SOON', rule: LEVER_SAFEGUARD_RULES.LEVER_07, basis: 'Carrier Rate & Freight Consolidation', isPp: true },
      { id: 8, code: 'LEV-08', name: 'Specification Rationalisation', status: 'IMPLEMENTED (PHASE 1)', rule: LEVER_SAFEGUARD_RULES.LEVER_08, basis: 'Phase 1 Technical Review Discovery', isPp: true },
      { id: 9, code: 'LEV-09', name: 'Procurement Compliance & Control', status: 'IMPLEMENTED (AUDIT)', rule: LEVER_SAFEGUARD_RULES.LEVER_09, basis: 'Transaction Control Gap Exposure', isPp: true },
      { id: 10, code: 'LEV-10', name: 'New-Vendor Development & Alternate Sourcing', status: 'IMPLEMENTED (DISCOVERY)', rule: LEVER_SAFEGUARD_RULES.LEVER_10, basis: '600,000+ National Vendor Discovery', isPp: true }
    ];

    return leverMeta.map((m) => {
      const leverOpps = opportunities.filter((o) => o.leverId === m.id);
      let grossInr = 0;
      let netInr = 0;
      let valInr = 0;
      let overlapInr = 0;
      let unresInr = 0;

      for (const o of leverOpps) {
        if (!o.isFinancingBenefitOnly) {
          grossInr += o.estimatedGrossSavingsInr;
          netInr += o.netEstimatedSavingsInr;
          valInr += o.commerciallyValidatedSavingsInr;
          overlapInr += o.overlapAmountInr;
          if (o.deduplicationStatus === 'UNRESOLVED_EXCLUDED') {
            unresInr += o.estimatedGrossSavingsInr;
          }
        }
      }

      return {
        leverId: m.id,
        leverCode: m.code,
        leverName: m.name,
        implementationStatus: m.status,
        statusLabel: m.status,
        grossSavingsInr: round2(grossInr),
        grossSavingsCr: toCrores(grossInr),
        netSavingsInr: round2(netInr),
        netSavingsCr: toCrores(netInr),
        commerciallyValidatedSavingsInr: round2(valInr),
        commerciallyValidatedSavingsCr: toCrores(valInr),
        overlapDeductionsInr: round2(overlapInr),
        overlapDeductionsCr: toCrores(overlapInr),
        unresolvedExcludedInr: round2(unresInr),
        unresolvedExcludedCr: toCrores(unresInr),
        opportunitiesCount: leverOpps.length,
        methodologyBasis: m.basis,
        safeguardRule: m.rule,
        isPurchasePriceSavings: m.isPp
      };
    });
  }

  public static calculateConsolidatedSavings(
    assessmentId: string,
    options?: SavingsDeduplicationOptions
  ): Module2ConsolidatedSavingsSummary {
    const startTime = Date.now();
    logger.info('Starting Module 2 Consolidated Savings Deduplication calculation', { assessmentId });

    // 1. Collect candidate opportunities across Levers 1 to 10
    const l1Opps = Module2SavingsOpportunityCollector.collectLever1(assessmentId, options);
    const { eauctionOpps, consolOpps, adminPoOpps } =
      Module2SavingsOpportunityCollector.collectSourcingLevers(assessmentId);
    const l5Opps = Module2SavingsOpportunityCollector.collectLever5PaymentTerms(assessmentId);
    const l6Opps = Module2SavingsOpportunityCollector.collectLever6Specialisation(assessmentId);
    const discoveryOpps = Module2SavingsOpportunityCollector.collectDiscoveryLevers(assessmentId);

    const allOpportunities: Module2CanonicalSavingsOpportunity[] = [
      ...l1Opps,
      ...eauctionOpps,
      ...consolOpps,
      ...adminPoOpps,
      ...l5Opps,
      ...l6Opps,
      ...discoveryOpps
    ];

    // 2. Cross-lever deduplication grouping for commercial alternatives
    const groups = this.groupCommercialAlternatives(allOpportunities);
    for (const group of groups.values()) {
      this.deduplicateGroup(group);
    }

    // 3. Aggregate totals
    let grossTotalInr = 0;
    let netTotalInr = 0;
    let validatedTotalInr = 0;
    let overlapDeductionsTotalInr = 0;
    let unresolvedExcludedTotalInr = 0;
    let unquantifiedCount = 0;
    let quantifiedCount = 0;

    for (const opp of allOpportunities) {
      if (opp.isFinancingBenefitOnly) {
        continue; // Segregated from purchase price!
      }
      grossTotalInr += opp.estimatedGrossSavingsInr;
      netTotalInr += opp.netEstimatedSavingsInr;
      validatedTotalInr += opp.commerciallyValidatedSavingsInr;
      overlapDeductionsTotalInr += opp.overlapAmountInr;

      if (opp.deduplicationStatus === 'UNRESOLVED_EXCLUDED') {
        unresolvedExcludedTotalInr += opp.estimatedGrossSavingsInr;
      }
      if (opp.estimatedGrossSavingsInr <= 0) {
        unquantifiedCount++;
      } else {
        quantifiedCount++;
      }
    }

    // Lever 5 segregation
    const l5Opp = allOpportunities.find((o) => o.leverId === 5);
    const annualFinancingInr = l5Opp?.eligibleSpendInr ? round2(l5Opp.eligibleSpendInr * 0.015) : 0;
    const wcReleasedInr = l5Opp?.workingCapitalReleasedInr || 0;

    const grossInr = round2(grossTotalInr);
    const netInr = round2(netTotalInr);
    const valInr = round2(validatedTotalInr);
    const overlapInr = round2(overlapDeductionsTotalInr);
    const unresInr = round2(unresolvedExcludedTotalInr);

    const balanceInr = round2(grossInr - overlapInr - unresInr - netInr);
    const isBalanced = Math.abs(balanceInr) < 0.01;

    const leverSummaries = this.buildLeverSummaries(allOpportunities);
    const l5Summary = leverSummaries.find((s) => s.leverId === 5);
    if (l5Summary) {
      l5Summary.annualFinancingBenefitInr = annualFinancingInr;
      l5Summary.annualFinancingBenefitCr = toCrores(annualFinancingInr);
      l5Summary.workingCapitalReleasedInr = wcReleasedInr;
      l5Summary.workingCapitalReleasedCr = toCrores(wcReleasedInr);
    }

    const customerName = assessmentId === 'AIC-2026-0002' ? 'ABC Textile Ltd' :
      assessmentId === 'AIC-2026-0003' ? 'PQR Cement Ltd' : `Enterprise Client (${assessmentId})`;

    logger.info('Module 2 Consolidated Savings Deduplication completed', {
      assessmentId,
      grossCr: toCrores(grossInr),
      netCr: toCrores(netInr),
      validatedCr: toCrores(valInr),
      overlapCr: toCrores(overlapInr),
      durationMs: Date.now() - startTime
    });

    return {
      assessmentId,
      customerName,
      calculatedAt: new Date().toISOString(),
      grossEstimatedSavingsInr: grossInr,
      grossEstimatedSavingsCr: toCrores(grossInr),
      netEstimatedSavingsInr: netInr,
      netEstimatedSavingsCr: toCrores(netInr),
      commerciallyValidatedSavingsInr: valInr,
      commerciallyValidatedSavingsCr: toCrores(valInr),
      totalOverlappingDeductionsInr: overlapInr,
      totalOverlappingDeductionsCr: toCrores(overlapInr),
      unresolvedOverlapsExcludedInr: unresInr,
      unresolvedOverlapsExcludedCr: toCrores(unresInr),
      unquantifiedOpportunitiesCount: unquantifiedCount,
      quantifiedOpportunitiesCount: quantifiedCount,
      totalEvaluatedOpportunitiesCount: allOpportunities.length,
      lever5AnnualFinancingBenefitInr: annualFinancingInr,
      lever5AnnualFinancingBenefitCr: toCrores(annualFinancingInr),
      lever5WorkingCapitalReleasedInr: wcReleasedInr,
      lever5WorkingCapitalReleasedCr: toCrores(wcReleasedInr),
      reconciliationBalanceInr: balanceInr,
      isArithmeticallyBalanced: isBalanced,
      leverSummaries,
      opportunities: allOpportunities,
      certificationNotice: CONSOLIDATED_SAVINGS_NOTICES.CERTIFICATION_NOTICE,
      disclosures: [...DEDUPLICATION_DISCLOSURES]
    };
  }
}
