/**
 * Module 2 — Master Strategic Sourcing Benefit Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Orchestrates:
 * 1. E-Auction Benefit Engine
 * 2. Vendor Consolidation Benefit Engine
 * 3. Category Specialization Engine
 * 4. Volume Bundling Engine
 * 5. Opportunity Overlap Engine
 * 6. Confidence Engine
 * 7. Benefit Traceability Engine
 */

import type {
  PriceDispersionMetrics,
  CrediblePriceReferenceResult,
  CategorySupplierStructureItem
} from '../types/module2StrategicSourcing';
import type { ItemLevelSourcingAnalysis } from '../types/module2ItemAnalysis';
import { Module2EAuctionBenefitEngine, type EAuctionBenefitEvaluation } from './module2EAuctionBenefitEngine';
import { Module2VendorConsolidationEngine, type VendorConsolidationBenefitEvaluation } from './module2VendorConsolidationEngine';
import { Module2VolumeBundlingEngine, type VolumeBundlingEvaluation } from './module2VolumeBundlingEngine';
import { Module2OpportunityOverlapEngine, type OverlapDeduplicationResult } from './module2OpportunityOverlapEngine';
import { Module2ConfidenceEngine, type ConfidenceEvaluation } from './module2ConfidenceEngine';
import { Module2BenefitTraceabilityEngine, type SourcingOpportunityAuditRecord } from './module2BenefitTraceabilityEngine';

export interface ComprehensiveCategoryBenefitResult {
  eauction: EAuctionBenefitEvaluation;
  consolidation: VendorConsolidationBenefitEvaluation;
  volumeBundling: VolumeBundlingEvaluation;
  overlap: OverlapDeduplicationResult;
  confidence: ConfidenceEvaluation;
  auditTrail: SourcingOpportunityAuditRecord;
}

export class Module2BenefitEngine {
  public static evaluateCategoryBenefits(params: {
    categoryId: string;
    categoryName: string;
    isRecurring: boolean;
    suppliers: CategorySupplierStructureItem[];
    addressableSpendInr: number;
    addressableQuantity: number;
    dispersion: PriceDispersionMetrics | null;
    credibleRef: CrediblePriceReferenceResult;
    activeMonthsCount: number;
    totalTxCount: number;
    comparableTxCount: number;
    items: ItemLevelSourcingAnalysis[];
    customerCostPerPoInr?: number | null;
  }): ComprehensiveCategoryBenefitResult {
    const {
      categoryId,
      categoryName,
      isRecurring,
      suppliers,
      addressableSpendInr,
      addressableQuantity,
      dispersion,
      credibleRef,
      activeMonthsCount,
      totalTxCount,
      comparableTxCount,
      items,
      customerCostPerPoInr = null
    } = params;

    // 1. E-Auction Engine
    const eauction = Module2EAuctionBenefitEngine.evaluate(
      isRecurring,
      suppliers.length,
      addressableSpendInr,
      addressableQuantity,
      dispersion,
      credibleRef
    );

    // 2. Vendor Consolidation Engine
    const consolidation = Module2VendorConsolidationEngine.evaluate(
      isRecurring,
      suppliers,
      addressableQuantity,
      dispersion,
      activeMonthsCount,
      customerCostPerPoInr
    );

    // 3. Volume Bundling Engine
    const volumeBundling = Module2VolumeBundlingEngine.evaluateCategoryVolumeBundling(items);

    // 4. Specialist Realignment from items
    const specialistBenefitInr = items.reduce((acc, it) => acc + (it.specialistRealignmentBenefitInr || 0), 0);

    // 5. Confidence Engine
    const confidence = Module2ConfidenceEngine.evaluateConfidence({
      comparableTxCount,
      totalTxCount,
      supplierCount: suppliers.length,
      activeMonthsCount,
      priceDispersionPct: dispersion?.priceDispersionPct || 0,
      hasOutliers: false
    });

    // 6. Overlap Deduplication Engine
    const overlap = Module2OpportunityOverlapEngine.deduplicateCategoryOpportunities(
      eauction.opportunityInr,
      consolidation.commercialPriceOpportunityInr,
      specialistBenefitInr,
      volumeBundling.quantifiableBenefitInr,
      consolidation.administrativeOpportunityInr || 0,
      confidence.confidence !== 'INSUFFICIENT',
      comparableTxCount
    );

    // 7. Traceability Audit Record
    const auditTrail = Module2BenefitTraceabilityEngine.createAuditRecord({
      opportunityId: `OPP-${categoryId}`,
      categoryId,
      categoryName,
      itemIds: items.map(i => i.itemCode),
      supplierIds: suppliers.map(s => s.supplierId),
      opportunityType: overlap.primaryLever === 'VENDOR_CONSOLIDATION'
        ? 'VENDOR_CONSOLIDATION'
        : overlap.primaryLever === 'CATEGORY_SPECIALIST_REALIGNMENT'
        ? 'CATEGORY_SPECIALIST'
        : overlap.primaryLever === 'VOLUME_BUNDLING'
        ? 'VOLUME_BUNDLING'
        : 'E_AUCTION',
      currentSpendInr: addressableSpendInr,
      eligibleSpendInr: addressableSpendInr,
      quantity: addressableQuantity,
      currentWeightedPrice: dispersion?.weightedAveragePrice || 0,
      referencePrice: credibleRef.referencePrice || 0,
      referenceSupplierIds: suppliers.filter(s => !s.isTailSupplier).map(s => s.supplierId),
      referenceTransactionIds: [],
      referenceVolumeSharePct: eauction.referenceVolumeSharePct,
      grossOpportunityInr: overlap.grossOpportunityInr,
      overlapAmountInr: overlap.overlappingOpportunityInr,
      netOpportunityInr: overlap.netQuantifiableOpportunityInr || 0,
      confidence: confidence.confidence,
      qualificationRules: [
        'Historical transaction comparability verified',
        'Quantity-weighted reference price established',
        'Mutually exclusive overlap control enforced'
      ]
    });

    return {
      eauction,
      consolidation,
      volumeBundling,
      overlap,
      confidence,
      auditTrail
    };
  }
}
