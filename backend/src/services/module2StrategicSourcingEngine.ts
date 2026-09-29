/**
 * Module 2 — Strategic Sourcing Intelligence, E-Auction & Vendor Consolidation Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  CategorySupplierStructureItem,
  SupplierFragmentationLevel,
  Module2ToModule4HandoffPackage,
  SourcingDataConfidence
} from '../types/module2StrategicSourcing';
import { MODULE_2_SOURCING_VERSION } from '../constants/module2StrategicSourcing';
import { Module2CategoryProfileBuilder } from './module2CategoryProfileBuilder';
import { Module2FragmentationHelper } from './module2FragmentationHelper';
import { logger } from '../utils/logger';

interface CategoryAnalysisTotals {
  addressableSpend: number;
  eauctionOpp: number;
  consolOpp: number;
  overlapOpp: number;
  netOpp: number;
  spendAnalyzed: number;
  readyCount: number;
  eauctionCount: number;
  consolCount: number;
  notQuantifiableCount: number;
  volBundlingOpp: number;
  specialistOpp: number;
}

export class Module2StrategicSourcingEngine {
  public static groupTransactionsByCategory(
    transactions: StrategicInputTransaction[]
  ): Map<string, StrategicInputTransaction[]> {
    const map = new Map<string, StrategicInputTransaction[]>();
    for (const tx of transactions) {
      const cat = (tx.spend_category || tx.unspsc_commodity || tx.material_desc || 'Uncategorized').trim();
      const list = map.get(cat) || [];
      list.push(tx);
      map.set(cat, list);
    }
    return map;
  }

  public static calculateHHIAndFragmentation(
    suppliers: CategorySupplierStructureItem[],
    totalSpend: number
  ): {
    hhiScore: number;
    hhiInterpretation: string;
    fragmentationLevel: SupplierFragmentationLevel;
    fragmentationRationale: string;
  } {
    return Module2FragmentationHelper.calculateHHIAndFragmentation(suppliers, totalSpend);
  }

  public static buildCategoryProfile(
    categoryName: string,
    transactions: StrategicInputTransaction[]
  ): CategoryStrategicSourcingProfile {
    return Module2CategoryProfileBuilder.buildProfile(categoryName, transactions);
  }

  public static createHandoffPackage(
    profile: CategoryStrategicSourcingProfile
  ): Module2ToModule4HandoffPackage {
    const handoffId = `HANDOFF-${profile.categoryId}-${Date.now()}`;
    const auditSignature = `M2-${profile.categoryId}-${profile.calculationVersion}-${Math.round(
      profile.netQuantifiableOpportunityInr || 0
    )}`;

    let oppType: 'E_AUCTION' | 'VENDOR_CONSOLIDATION' | 'COMBINED_STRATEGIC' = 'COMBINED_STRATEGIC';
    const eauctionInr = profile.potentialEAuctionOpportunityInr || 0;
    const consolInr = profile.potentialVendorConsolidationOpportunityInr || 0;

    if (eauctionInr > 0 && consolInr === 0) oppType = 'E_AUCTION';
    else if (consolInr > 0 && eauctionInr === 0) oppType = 'VENDOR_CONSOLIDATION';

    return {
      handoffId,
      opportunityId: `OPP-${profile.categoryId}`,
      categoryId: profile.categoryId,
      categoryName: profile.categoryName,
      opportunityType: oppType,
      addressableSpendInr: profile.addressableSpendInr,
      addressableQuantity: profile.addressableQuantity,
      baselineWeightedPrice: profile.priceDispersion?.weightedAveragePrice || 0,
      referencePrice: profile.credibleReference.referencePrice || 0,
      potentialOpportunityInr: (eauctionInr + consolInr),
      overlapAmountInr: profile.overlappingOpportunityInr,
      netOpportunityInr: profile.netQuantifiableOpportunityInr || 0,
      supplierCount: profile.activeSuppliersCount,
      recommendedLever: profile.scorecard.recommendation === 'E_AUCTION_RECOMMENDED' ? 'E_AUCTION' : 'VENDOR_CONSOLIDATION',
      confidence: profile.dataConfidence,
      evidenceTransactionIds: profile.evidenceTransactionIds,
      calculationVersion: MODULE_2_SOURCING_VERSION,
      timestamp: new Date().toISOString(),
      auditSignature
    };
  }

  private static createDashboardSummary(
    profiles: CategoryStrategicSourcingProfile[],
    totals: CategoryAnalysisTotals
  ): Module2StrategicSourcingDashboardSummary {
    let overallConf: SourcingDataConfidence = 'LOW';
    if (profiles.some(p => p.dataConfidence === 'HIGH')) overallConf = 'HIGH';
    else if (profiles.some(p => p.dataConfidence === 'MEDIUM')) overallConf = 'MEDIUM';

    const toCr = (n: number): number => Math.round((n / 10000000) * 1000) / 1000;
    const grossOpp = totals.eauctionOpp + totals.consolOpp + totals.volBundlingOpp + totals.specialistOpp;

    let provenOpp = 0;
    let rangeMin = 0;
    let rangeMax = 0;
    let marketDiscoveryCount = 0;
    let lowEvidencedCount = 0;
    let insufficientCount = 0;

    for (const p of profiles) {
      if (p.evidenceState === 'PROVEN_OPPORTUNITY') {
        provenOpp += p.netQuantifiableOpportunityInr || 0;
      }
      if (p.opportunityRangeMinInr) rangeMin += p.opportunityRangeMinInr;
      if (p.opportunityRangeMaxInr) rangeMax += p.opportunityRangeMaxInr;
      if (p.marketDiscovery?.isMarketDiscoveryRequired) marketDiscoveryCount++;
      if (p.evidenceState === 'LOW_EVIDENCED_OPPORTUNITY') lowEvidencedCount++;
      if (p.evidenceState === 'INSUFFICIENT_DATA') insufficientCount++;
    }

    return {
      totalAddressableSpendInr: Math.round(totals.addressableSpend),
      totalAddressableSpendInrCr: toCr(totals.addressableSpend),
      eauctionAddressableSpendInr: Math.round(totals.addressableSpend),
      eauctionAddressableSpendInrCr: toCr(totals.addressableSpend),
      totalPotentialEAuctionOpportunityInr: Math.round(totals.eauctionOpp),
      totalPotentialEAuctionOpportunityInrCr: toCr(totals.eauctionOpp),
      vendorConsolidationAddressableSpendInr: Math.round(totals.addressableSpend),
      vendorConsolidationAddressableSpendInrCr: toCr(totals.addressableSpend),
      totalPotentialConsolidationOpportunityInr: Math.round(totals.consolOpp),
      totalPotentialConsolidationOpportunityInrCr: toCr(totals.consolOpp),
      volumeBundlingAddressableSpendInr: Math.round(totals.addressableSpend),
      volumeBundlingAddressableSpendInrCr: toCr(totals.addressableSpend),
      volumeBundlingQuantifiableBenefitInr: Math.round(totals.volBundlingOpp),
      volumeBundlingQuantifiableBenefitInrCr: toCr(totals.volBundlingOpp),
      categorySpecialistOpportunityInr: Math.round(totals.specialistOpp),
      categorySpecialistOpportunityInrCr: toCr(totals.specialistOpp),
      grossQuantifiableBenefitInr: Math.round(grossOpp),
      grossQuantifiableBenefitInrCr: toCr(grossOpp),
      totalOverlappingOpportunityInr: Math.round(totals.overlapOpp),
      totalOverlappingOpportunityInrCr: toCr(totals.overlapOpp),
      netQuantifiableOpportunityInr: Math.round(totals.netOpp),
      netQuantifiableOpportunityInrCr: toCr(totals.netOpp),
      benefitNotYetQuantifiableInr: 0,
      benefitNotYetQuantifiableInrCr: 0,

      // Opportunity Intelligence V2.0 Summary Metrics
      provenOpportunityInr: Math.round(provenOpp),
      provenOpportunityInrCr: toCr(provenOpp),
      quantifiableRangeMinInr: Math.round(rangeMin),
      quantifiableRangeMinInrCr: toCr(rangeMin),
      quantifiableRangeMaxInr: Math.round(rangeMax),
      quantifiableRangeMaxInrCr: toCr(rangeMax),
      marketDiscoveryCandidatesCount: marketDiscoveryCount,
      identifiedNotQuantifiableCount: totals.notQuantifiableCount,
      lowEvidencedCount,
      insufficientDataCount: insufficientCount,
      overallNetDefensibleOpportunityMinInr: Math.round(provenOpp + rangeMin),
      overallNetDefensibleOpportunityMinInrCr: toCr(provenOpp + rangeMin),
      overallNetDefensibleOpportunityMaxInr: Math.round(provenOpp + rangeMax),
      overallNetDefensibleOpportunityMaxInrCr: toCr(provenOpp + rangeMax),

      categoriesReadyForSourcingCount: totals.readyCount,
      eauctionCandidatesCount: totals.eauctionCount,
      consolidationCandidatesCount: totals.consolCount,
      opportunitiesNotYetQuantifiableCount: totals.notQuantifiableCount,
      overallDataConfidence: overallConf,
      categoriesAnalyzedCount: profiles.length,
      totalSpendAnalyzedInr: Math.round(totals.spendAnalyzed),
      totalSpendAnalyzedInrCr: toCr(totals.spendAnalyzed),
      calculationTimestamp: new Date().toISOString()
    };
  }

  private static updateCategoryCounts(
    totals: CategoryAnalysisTotals,
    profile: CategoryStrategicSourcingProfile
  ): void {
    if (profile.scorecard.overallScore >= 60 && profile.isQuantifiable) totals.readyCount++;
    if ((profile.potentialEAuctionOpportunityInr ?? 0) > 0) totals.eauctionCount++;
    if ((profile.potentialVendorConsolidationOpportunityInr ?? 0) > 0) totals.consolCount++;
    if (!profile.isQuantifiable) totals.notQuantifiableCount++;
  }

  private static accumulateCategoryTotals(
    totals: CategoryAnalysisTotals,
    profile: CategoryStrategicSourcingProfile
  ): void {
    totals.spendAnalyzed += profile.totalSpendInr;
    totals.addressableSpend += profile.addressableSpendInr;
    totals.eauctionOpp += profile.potentialEAuctionOpportunityInr ?? 0;
    totals.consolOpp += profile.potentialVendorConsolidationOpportunityInr ?? 0;
    totals.volBundlingOpp += profile.volumeBundlingOpportunityInr ?? 0;
    totals.specialistOpp += profile.categorySpecialistOpportunityInr ?? 0;
    totals.overlapOpp += profile.overlappingOpportunityInr;
    totals.netOpp += profile.netQuantifiableOpportunityInr ?? 0;
    this.updateCategoryCounts(totals, profile);
  }

  public static analyze(transactions: StrategicInputTransaction[] = []): {
    profiles: CategoryStrategicSourcingProfile[];
    summary: Module2StrategicSourcingDashboardSummary;
    handoffPackages: Module2ToModule4HandoffPackage[];
  } {
    logger.info('Module2StrategicSourcingEngine: Starting analysis', {
      transactionCount: transactions.length
    });

    const catMap = this.groupTransactionsByCategory(transactions);
    const profiles: CategoryStrategicSourcingProfile[] = [];
    const handoffPackages: Module2ToModule4HandoffPackage[] = [];

    const totals: CategoryAnalysisTotals = {
      addressableSpend: 0,
      eauctionOpp: 0,
      consolOpp: 0,
      overlapOpp: 0,
      netOpp: 0,
      spendAnalyzed: 0,
      readyCount: 0,
      eauctionCount: 0,
      consolCount: 0,
      notQuantifiableCount: 0,
      volBundlingOpp: 0,
      specialistOpp: 0
    };

    for (const [categoryName, txList] of catMap.entries()) {
      const profile = this.buildCategoryProfile(categoryName, txList);
      profiles.push(profile);
      this.accumulateCategoryTotals(totals, profile);

      if (profile.isQuantifiable && (profile.netQuantifiableOpportunityInr || 0) > 0) {
        handoffPackages.push(this.createHandoffPackage(profile));
      }
    }

    const summary = this.createDashboardSummary(profiles, totals);

    logger.info('Module2StrategicSourcingEngine: Completed analysis', {
      categoriesCount: profiles.length,
      netOpportunityInr: totals.netOpp,
      handoffPackagesCount: handoffPackages.length
    });

    return { profiles, summary, handoffPackages };
  }
}
