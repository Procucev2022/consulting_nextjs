/**
 * Module 2 — Cross-Lever Savings Opportunity Collector
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 4, 8, 9: Max 300 lines, complexity <= 10
 */

import { CALCULATION_BASIS } from '../constants/module2SavingsDeduplication';
import type { Module2CanonicalSavingsOpportunity, SavingsDeduplicationOptions } from '../types/module2SavingsDeduplication';
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
    const l1Result = Module2DirectPriceImprovementEngine.calculate(assessmentId);
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

  public static collectSourcingLevers(
    assessmentId: string
  ): {
    eauctionOpps: Module2CanonicalSavingsOpportunity[];
    consolOpps: Module2CanonicalSavingsOpportunity[];
    adminPoOpps: Module2CanonicalSavingsOpportunity[];
  } {
    const sourcing = Module2CanonicalService.getSourcingAnalysis(assessmentId);
    const eauctionOpps: Module2CanonicalSavingsOpportunity[] = [];
    const consolOpps: Module2CanonicalSavingsOpportunity[] = [];
    const adminPoOpps: Module2CanonicalSavingsOpportunity[] = [];

    for (const p of sourcing.profiles) {
      const eOpp = p.potentialEAuctionOpportunityInr || 0;
      if (eOpp > 0) {
        eauctionOpps.push(
          buildCanonicalOpportunity({
            assessmentId,
            leverId: 2,
            leverCode: 'LEV-02',
            leverName: 'E-Auction / Dynamic Bidding',
            categoryOrMaterialId: p.categoryId,
            categoryOrMaterialName: p.categoryName,
            eligibleSpendInr: p.addressableSpendInr,
            transactionScopeCount: p.activeTransactionsCount,
            calculationBasis: CALCULATION_BASIS.REVERSE_AUCTION_COMPETITIVE_DISCOVERY,
            estimatedGrossSavingsInr: eOpp,
            auditEvidenceSummary: `E-Auction dynamic bidding candidate in ${p.categoryName} with >= 2 suppliers.`
          })
        );
      }

      const cOpp = p.potentialVendorConsolidationOpportunityInr || 0;
      if (cOpp > 0) {
        consolOpps.push(
          buildCanonicalOpportunity({
            assessmentId,
            leverId: 3,
            leverCode: 'LEV-03',
            leverName: 'Vendor Base Consolidation',
            categoryOrMaterialId: p.categoryId,
            categoryOrMaterialName: p.categoryName,
            eligibleSpendInr: p.addressableSpendInr,
            transactionScopeCount: p.activeTransactionsCount,
            calculationBasis: CALCULATION_BASIS.VENDOR_TAIL_CONSOLIDATION,
            estimatedGrossSavingsInr: cOpp,
            auditEvidenceSummary: `Tail vendor consolidation in ${p.categoryName} (<= 30% reallocation limit).`
          })
        );
      }

      const poOpp = p.potentialPOConsolidationOpportunityInr || 0;
      if (poOpp > 0) {
        adminPoOpps.push(
          buildCanonicalOpportunity({
            assessmentId,
            leverId: 3,
            leverCode: 'LEV-03-ADMIN',
            leverName: 'PO Consolidation (Administrative)',
            categoryOrMaterialId: p.categoryId,
            categoryOrMaterialName: p.categoryName,
            eligibleSpendInr: p.addressableSpendInr,
            transactionScopeCount: p.activeTransactionsCount,
            calculationBasis: CALCULATION_BASIS.ADMINISTRATIVE_PO_REDUCTION,
            estimatedGrossSavingsInr: poOpp,
            deduplicationStatus: 'INCREMENTAL_VALIDATED',
            isIncrementalBenefit: true,
            auditEvidenceSummary: `Administrative overhead reduction from consolidating purchase orders in ${p.categoryName}.`
          })
        );
      }
    }

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
    assessmentId: string
  ): Module2CanonicalSavingsOpportunity[] {
    const l6 = Module2CategorySpecialisationEngine.calculate(assessmentId);
    const opps: Module2CanonicalSavingsOpportunity[] = [];

    for (const cat of l6.categories) {
      for (const b of cat.opportunities) {
        if (b.tentativeGrossOpportunityInr > 0) {
          const isHeadF = b.headCode === 'HEAD_F';
          opps.push(
            buildCanonicalOpportunity({
              assessmentId,
              leverId: 6,
              leverCode: 'LEV-06',
              leverName: 'Category Specialisation',
              categoryOrMaterialId: `${cat.categoryId}-${b.headCode}`,
              categoryOrMaterialName: `${cat.categoryName} (${b.headName})`,
              eligibleSpendInr: b.addressableSpendInr,
              transactionScopeCount: cat.transactionCount,
              calculationBasis: CALCULATION_BASIS.CATEGORY_CHARTER_STRATEGIC,
              estimatedGrossSavingsInr: b.tentativeGrossOpportunityInr,
              deduplicationStatus: isHeadF ? 'DEDUPLICATED_OVERLAP' : 'INDEPENDENT',
              evidenceValidationStatus: 'PLANNING_ASSUMPTION',
              auditEvidenceSummary: `Category Management ${b.headCode} planning assumption for ${cat.categoryName}.`
            })
          );
        }
      }
    }
    return opps;
  }

  public static collectDiscoveryLevers(
    assessmentId: string
  ): Module2CanonicalSavingsOpportunity[] {
    return [
      createZeroSavingsOpportunity(
        assessmentId,
        4,
        'LEV-04',
        'Volume Aggregation',
        CALCULATION_BASIS.VOLUME_AGGREGATION_TIER,
        'Volume aggregation demand pooling evaluated across plants; financial savings require verified volume tier agreements.'
      ),
      createZeroSavingsOpportunity(
        assessmentId,
        7,
        'LEV-07',
        'Logistics & Packaging Specifications',
        'COMING_SOON',
        'Logistics & packaging optimization deferred pending verified carrier contract rate sheets.'
      ),
      createZeroSavingsOpportunity(
        assessmentId,
        8,
        'LEV-08',
        'Specification Rationalisation',
        CALCULATION_BASIS.SPECIFICATION_HARMONIZATION_DISCOVERY,
        'Phase 1 specification harmonization discovery only; commercial savings deferred until Phase 2 engineering sign-off.'
      ),
      createZeroSavingsOpportunity(
        assessmentId,
        9,
        'LEV-09',
        'Procurement Compliance & Control',
        CALCULATION_BASIS.COMPLIANCE_CONTROL_GAP_AUDIT,
        'Compliance control gap exposure under review; 0 validated savings until controller verification.'
      ),
      createZeroSavingsOpportunity(
        assessmentId,
        10,
        'LEV-10',
        'New-Vendor Development & Alternate Sourcing',
        CALCULATION_BASIS.ALTERNATE_SOURCING_DISCOVERY,
        'Alternate vendor repository discovery across 600,000+ national vendors; 0 commercial savings in discovery phase.'
      )
    ];
  }
}
