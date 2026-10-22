/**
 * Module 2 — Cross-Lever Savings Opportunity Collector
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 4, 8, 9: Max 300 lines, complexity <= 10
 */

import { CALCULATION_BASIS } from '../constants/module2SavingsDeduplication';
import type {
  Module2CanonicalSavingsOpportunity,
  SavingsDeduplicationOptions,
  EAuctionProfile,
  ConsolidationProfile
} from '../types/module2SavingsDeduplication';
import { buildCanonicalOpportunity, createZeroSavingsOpportunity } from './module2SavingsDeduplicationHelpers';
import { Module2CanonicalService } from './module2CanonicalService';
import { Module2DirectPriceImprovementEngine } from './module2DirectPriceImprovementEngine';
import { Module2CategorySpecialisationEngine } from './module2CategorySpecialisationEngine';
import { Module2PaymentTermsCalculators } from './module2PaymentTermsCalculators';

export class Module2SavingsOpportunityCollector {
  public static collectLever1(
    assessmentId: string,
    options?: SavingsDeduplicationOptions
  ): Module2CanonicalSavingsOpportunity[] {
    const l1Result = Module2DirectPriceImprovementEngine.calculateSync(assessmentId);
    const catMap = new Map<string, { spend: number; opp: number; txCount: number; name: string }>();

    for (const item of l1Result.items) {
      if (item.historicalLostOpportunityInr > 0) {
        const catKey = (item.spendCategory || 'General Procurement').trim();
        const existing = catMap.get(catKey) || { spend: 0, opp: 0, txCount: 0, name: catKey };
        existing.spend += item.actualPurchaseCostInr;
        existing.opp += item.historicalLostOpportunityInr;
        existing.txCount += item.transactionCount;
        catMap.set(catKey, existing);
      }
    }

    const opps: Module2CanonicalSavingsOpportunity[] = [];
    for (const [catKey, val] of catMap.entries()) {
      const isApproved = Boolean(options?.commercialApprovals?.[`LEV01-${catKey}`]);
      opps.push(
        buildCanonicalOpportunity({
          assessmentId,
          leverId: 1,
          leverCode: 'LEV-01',
          leverName: 'Direct Price Improvement',
          categoryOrMaterialId: catKey,
          categoryOrMaterialName: val.name,
          eligibleSpendInr: val.spend,
          transactionScopeCount: val.txCount,
          calculationBasis: CALCULATION_BASIS.PEER_PRICE_DISPERSION,
          estimatedGrossSavingsInr: val.opp,
          evidenceValidationStatus: isApproved ? 'VALIDATED_COMMERCIAL' : 'UNVERIFIED_ESTIMATE',
          approvalStatus: isApproved ? 'APPROVED' : 'PENDING_REVIEW',
          commerciallyValidatedSavingsInr: isApproved ? val.opp : 0,
          auditEvidenceSummary: `Historical peer price variance across identical items in ${catKey}.`
        })
      );
    }
    return opps;
  }

  private static buildEAuctionOpp(
    assessmentId: string,
    p: EAuctionProfile,
    isApproved: boolean,
    eOpp: number
  ): Module2CanonicalSavingsOpportunity {
    return buildCanonicalOpportunity({
      assessmentId,
      leverId: 2,
      leverCode: 'LEV-02',
      leverName: 'E-Auction / Dynamic Bidding',
      categoryOrMaterialId: p.categoryId,
      categoryOrMaterialName: p.categoryName,
      eligibleSpendInr: p.addressableSpendInr,
      transactionScopeCount: p.transactionCount,
      calculationBasis: CALCULATION_BASIS.REVERSE_AUCTION_COMPETITIVE_DISCOVERY,
      estimatedGrossSavingsInr: eOpp,
      isExploratoryPipeline: !isApproved,
      deduplicationStatus: isApproved ? 'INDEPENDENT' : 'EXPLORATORY_PIPELINE',
      evidenceValidationStatus: isApproved ? 'VALIDATED_COMMERCIAL' : 'PLANNING_ASSUMPTION',
      approvalStatus: isApproved ? 'APPROVED' : 'PENDING_REVIEW',
      commerciallyValidatedSavingsInr: isApproved ? eOpp : 0,
      validationEvidenceRequired: 'Binding dynamic e-auction event with >= 2 pre-qualified bidders.',
      auditEvidenceSummary: `E-Auction dynamic bidding candidate in ${p.categoryName} with >= 2 suppliers.`
    });
  }

  private static buildConsolidationOpp(
    assessmentId: string,
    p: ConsolidationProfile,
    isApproved: boolean,
    cOpp: number
  ): Module2CanonicalSavingsOpportunity {
    const tailSuppliers = (p.suppliers || []).filter((s) => s.isTailSupplier);
    const tailSpendInr = tailSuppliers.reduce((sum, s) => sum + s.totalSpendInr, 0);
    const tailTxCount = tailSuppliers.reduce((sum, s) => sum + s.transactionCount, 0);
    const eligibleSpendInr = tailSpendInr > 0 ? tailSpendInr : p.totalSpendInr;
    const cappedOppInr = Math.min(cOpp, eligibleSpendInr);
    return buildCanonicalOpportunity({
      assessmentId,
      leverId: 3,
      leverCode: 'LEV-03',
      leverName: 'Vendor Base Consolidation',
      categoryOrMaterialId: p.categoryId,
      categoryOrMaterialName: p.categoryName,
      eligibleSpendInr,
      transactionScopeCount: tailTxCount > 0 ? tailTxCount : p.transactionCount,
      calculationBasis: CALCULATION_BASIS.VENDOR_TAIL_CONSOLIDATION,
      estimatedGrossSavingsInr: cappedOppInr,
      isExploratoryPipeline: !isApproved,
      deduplicationStatus: isApproved ? 'INDEPENDENT' : 'EXPLORATORY_PIPELINE',
      evidenceValidationStatus: isApproved ? 'VALIDATED_COMMERCIAL' : 'PLANNING_ASSUMPTION',
      approvalStatus: isApproved ? 'APPROVED' : 'PENDING_REVIEW',
      commerciallyValidatedSavingsInr: isApproved ? cappedOppInr : 0,
      validationEvidenceRequired: 'Executed supplier contract amendment committing to volume consolidation rate.',
      auditEvidenceSummary: `Tail vendor consolidation across ${tailSuppliers.length} vendors in ${p.categoryName} (<= 30% shift).`
    });
  }

  private static buildAdminPoOpportunities(
    assessmentId: string,
    poItems: { category?: string; totalSpendInr: number; poCount: number }[]
  ): Module2CanonicalSavingsOpportunity[] {
    const catPoMap = new Map<string, { spend: number; poSavings: number; poCount: number; name: string }>();
    for (const item of poItems) {
      const catKey = (item.category || 'General Procurement').trim();
      const existing = catPoMap.get(catKey) || { spend: 0, poSavings: 0, poCount: 0, name: catKey };
      existing.spend += item.totalSpendInr;
      existing.poCount += item.poCount;
      existing.poSavings += Math.max(1, item.poCount - 4) * 1000;
      catPoMap.set(catKey, existing);
    }
    const opps: Module2CanonicalSavingsOpportunity[] = [];
    for (const [catKey, val] of catPoMap.entries()) {
      if (val.poSavings > 0) {
        opps.push(buildCanonicalOpportunity({
          assessmentId,
          leverId: 3,
          leverCode: 'LEV-03-ADMIN',
          leverName: 'PO Consolidation (Administrative)',
          categoryOrMaterialId: `ADMIN-PO-${catKey}`,
          categoryOrMaterialName: `PO Consolidation — ${val.name}`,
          eligibleSpendInr: val.spend,
          transactionScopeCount: val.poCount,
          calculationBasis: CALCULATION_BASIS.ADMINISTRATIVE_PO_REDUCTION,
          estimatedGrossSavingsInr: val.poSavings,
          deduplicationStatus: 'EXPLORATORY_PIPELINE',
          isExploratoryPipeline: true,
          evidenceValidationStatus: 'PLANNING_ASSUMPTION',
          approvalStatus: 'PENDING_REVIEW',
          isIncrementalBenefit: true,
          auditEvidenceSummary: `Administrative overhead reduction planning assumption from consolidating purchase orders in ${val.name} (standard INR 1,000/redundant PO).`
        }));
      }
    }
    return opps;
  }

  public static collectSourcingLevers(
    assessmentId: string,
    options?: SavingsDeduplicationOptions
  ): {
    eauctionOpps: Module2CanonicalSavingsOpportunity[];
    consolOpps: Module2CanonicalSavingsOpportunity[];
    adminPoOpps: Module2CanonicalSavingsOpportunity[];
  } {
    const sourcing = Module2CanonicalService.getSourcingAnalysis(assessmentId);
    const eauctionOpps: Module2CanonicalSavingsOpportunity[] = [];
    const consolOpps: Module2CanonicalSavingsOpportunity[] = [];

    for (const p of sourcing.profiles) {
      const eOpp = p.potentialEAuctionOpportunityInr || 0;
      if (eOpp > 0) {
        const isApproved = Boolean(options?.commercialApprovals?.[`LEV02-${p.categoryId}`]);
        eauctionOpps.push(this.buildEAuctionOpp(assessmentId, p, isApproved, eOpp));
      }
      const cOpp = p.potentialVendorConsolidationOpportunityInr || 0;
      if (cOpp > 0) {
        const isApproved = Boolean(options?.commercialApprovals?.[`LEV03-${p.categoryId}`]);
        consolOpps.push(this.buildConsolidationOpp(assessmentId, p, isApproved, cOpp));
      }
    }

    const poItems = Module2CanonicalService.getPoConsolidationAnalysis(assessmentId);
    const adminPoOpps = this.buildAdminPoOpportunities(assessmentId, poItems);
    return { eauctionOpps, consolOpps, adminPoOpps };
  }

  public static collectLever5PaymentTerms(
    assessmentId: string
  ): Module2CanonicalSavingsOpportunity[] {
    const txs = Module2CanonicalService.getCanonicalTransactions(assessmentId);
    let totalSpendInr = 0;
    for (const t of txs) totalSpendInr += t.total_spend_inr || 0;

    // Linear 1.5% per 30 days extension for 30 days scenario
    const annualFinancingInr = Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(totalSpendInr, 30);
    const wcReleasedInr = Module2PaymentTermsCalculators.calculateWorkingCapitalReleased(totalSpendInr, 30);

    return [
      buildCanonicalOpportunity({
        assessmentId,
        leverId: 5,
        leverCode: 'LEV-05',
        leverName: 'Payment Terms Optimisation',
        categoryOrMaterialId: 'PORTFOLIO-PAYMENT-TERMS',
        categoryOrMaterialName: 'Treasury Working Capital & Payment Terms',
        eligibleSpendInr: totalSpendInr,
        transactionScopeCount: txs.length,
        calculationBasis: CALCULATION_BASIS.PAYMENT_TERMS_FINANCING_BENEFIT,
        estimatedGrossSavingsInr: 0, // Segregated from purchase price!
        isFinancingBenefitOnly: true,
        workingCapitalReleasedInr: wcReleasedInr,
        deduplicationStatus: 'INDEPENDENT',
        evidenceValidationStatus: 'UNVERIFIED_ESTIMATE',
        auditEvidenceSummary: `Financing benefit of ₹${(annualFinancingInr / 100000).toFixed(2)}L and Working Capital of ₹${(wcReleasedInr / 100000).toFixed(2)}L (segregated from purchase price).`
      })
    ];
  }

  public static collectLever6Specialisation(
    assessmentId: string,
    options?: SavingsDeduplicationOptions
  ): Module2CanonicalSavingsOpportunity[] {
    const l6 = Module2CategorySpecialisationEngine.calculate(assessmentId);
    const opps: Module2CanonicalSavingsOpportunity[] = [];

    for (const cat of l6.categories) {
      const catId = cat.categoryName.replace(/\s+/g, '_').toUpperCase();
      for (const b of cat.opportunities) {
        if (b.baseEstimateInr > 0) {
          const isExploratoryHead = ['HEAD-B', 'HEAD-C', 'HEAD-D', 'HEAD-H'].includes(b.headCode);
          const isApproved = !isExploratoryHead && Boolean(options?.commercialApprovals?.[`LEV06-${catId}-${b.headCode}`]);
          opps.push(
            buildCanonicalOpportunity({
              assessmentId,
              leverId: 6,
              leverCode: 'LEV-06',
              leverName: 'Category Specialisation',
              categoryOrMaterialId: `${catId}-${b.headCode}`,
              categoryOrMaterialName: `${cat.categoryName} (${b.headTitle})`,
              eligibleSpendInr: b.eligibleAnnualSpendInr,
              transactionScopeCount: cat.transactionCount,
              calculationBasis: CALCULATION_BASIS.CATEGORY_CHARTER_STRATEGIC,
              estimatedGrossSavingsInr: b.baseEstimateInr,
              isExploratoryPipeline: !isApproved,
              deduplicationStatus: isApproved ? 'INDEPENDENT' : 'EXPLORATORY_PIPELINE',
              evidenceValidationStatus: isApproved ? 'VALIDATED_COMMERCIAL' : 'PLANNING_ASSUMPTION',
              approvalStatus: isApproved ? 'APPROVED' : 'PENDING_REVIEW',
              commerciallyValidatedSavingsInr: isApproved ? b.baseEstimateInr : 0,
              validationEvidenceRequired: `Category charter review, plant engineering sign-off, and supplier quotation for ${b.headCode}.`,
              auditEvidenceSummary: `Category Management ${b.headCode} planning assumption for ${cat.categoryName}.`
            })
          );
        }
      }
    }
    return opps;
  }

  public static collectDiscoveryLevers(assessmentId: string): Module2CanonicalSavingsOpportunity[] {
    return [
      createZeroSavingsOpportunity(assessmentId, 4, 'LEV-04', 'Volume Aggregation',
        CALCULATION_BASIS.VOLUME_AGGREGATION_TIER, 'Volume aggregation demand pooling evaluated across plants; financial savings require verified volume tier agreements.'),
      createZeroSavingsOpportunity(assessmentId, 7, 'LEV-07', 'Logistics & Packaging Specifications',
        'COMING_SOON', 'Logistics & packaging optimization deferred pending verified carrier contract rate sheets.'),
      createZeroSavingsOpportunity(assessmentId, 8, 'LEV-08', 'Specification Rationalisation',
        CALCULATION_BASIS.SPECIFICATION_HARMONIZATION_DISCOVERY, 'Phase 1 specification harmonization discovery only; commercial savings deferred until Phase 2 engineering sign-off.'),
      createZeroSavingsOpportunity(assessmentId, 9, 'LEV-09', 'Procurement Compliance & Control',
        CALCULATION_BASIS.COMPLIANCE_CONTROL_GAP_AUDIT, 'Compliance control gap exposure under review; 0 validated savings until controller verification.'),
      createZeroSavingsOpportunity(assessmentId, 10, 'LEV-10', 'New-Vendor Development & Alternate Sourcing',
        CALCULATION_BASIS.ALTERNATE_SOURCING_DISCOVERY, 'Alternate vendor repository discovery across 600,000+ national vendors; 0 commercial savings in discovery phase.')
    ];
  }
}
