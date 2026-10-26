/**
 * Module 2 — Stage 2: Opportunity Register Builder Helpers
 * Maps lever-specific analytical candidates into unified MaterialOpportunityItem models
 * Compliant with Repository Rules: max 300 lines, complexity <= 10, max line length 120 chars
 */

import type {
  MaterialOpportunityItem,
  OpportunityConfidenceLevel
} from '../types/module2OpportunityRegister';
import type { DirectPriceItemOpportunity } from '../types/module2DirectPriceImprovement';
import type { SameMaterialOpportunity } from '../types/module2VendorConsolidation';
import type { VolumeAggregationOpportunity } from '../types/module2VolumeAggregation';
import type { SpecificationCandidateItem } from '../types/module2SpecificationRationalisation';
import { RESPONSIBLE_VALIDATION_TEAMS } from '../constants/module2OpportunityRegister';

function resolveDpiConfidence(item: DirectPriceItemOpportunity): OpportunityConfidenceLevel {
  return item.transactionCount >= 10 && item.supplierCount >= 2 ? 'HIGH' : 'MEDIUM';
}

function resolveDpiVal(lostInr = 0): { inr: number | null; cr: number | null } {
  if (lostInr <= 0) return { inr: null, cr: null };
  return { inr: lostInr, cr: Number((lostInr / 1e7).toFixed(4)) };
}

function buildSingleDpiItem(
  item: DirectPriceItemOpportunity,
  idx: number,
  assessmentId: string
): MaterialOpportunityItem {
  const oppId = `OPP-${assessmentId}-DPI-${String(idx + 1).padStart(4, '0')}`;
  const spendInr = item.actualPurchaseCostInr || 0;
  const spendCr = item.actualPurchaseCostCr || Number((spendInr / 1e7).toFixed(4));
  const refPrice = item.lowestUnitPrice || 0;
  const wap = item.weightedAveragePrice || 0;
  const defVal = resolveDpiVal(item.historicalLostOpportunityInr);
  const confidence = resolveDpiConfidence(item);
  const reviewFlags = item.supplierCount === 1 ? ['SINGLE_SUPPLIER_DISPERSION'] : ['MULTI_SUPPLIER_DISPERSION'];

  return {
    opportunityId: oppId,
    opportunityType: 'DIRECT_PRICE_IMPROVEMENT',
    category: item.spendCategory || 'Direct Materials',
    materialCode: item.materialCode,
    materialDescription: item.materialDesc,
    uom: item.uom,
    supportingTransactionCount: item.transactionCount,
    supportingTransactionIds: (item.transactions || []).map((t) => t.id),
    historicalSpendInr: spendInr,
    historicalSpendCr: spendCr,
    suppliersInvolved: (item.suppliers || []).map((s) => s.supplierName),
    plantsInvolved: (item.plants || []).map((p) => p.plantCode),
    rationale: `Price dispersion of ${item.priceDispersionPct}% across ${item.supplierCount} supplier(s). WAP: ₹${wap.toFixed(2)} vs Ref: ₹${refPrice.toFixed(2)}.`,
    calculationMethodology: 'Volume x (Quantity-Weighted Average Price - Lowest Credible Benchmark Reference)',
    sourceFields: ['unitPrice', 'quantity', 'uom', 'totalSpendInr', 'currency'],
    dataQualityChecks: ['CURRENCY_NORMALIZED_INR', 'UOM_VALIDATED', 'OUTLIERS_REMOVED', 'EXCLUSION_AUDITED'],
    comparabilityChecks: ['SAME_MATERIAL_CODE', 'SAME_BASE_UOM', 'NON_ZERO_QUANTITY'],
    confidenceLevel: confidence,
    reviewFlags,
    requiredProcurementAction: 'Renegotiate purchase orders to align with lowest historical rate card.',
    responsibleValidationTeam: RESPONSIBLE_VALIDATION_TEAMS.DIRECT_PRICE_IMPROVEMENT,
    status: 'IDENTIFIED',
    defensibleOpportunityValueInr: defVal.inr,
    defensibleOpportunityValueCr: defVal.cr,
    unitPriceVariancePct: item.priceDispersionPct,
    referenceUnitPriceInr: refPrice,
    weightedAverageUnitPriceInr: wap,
    lowestCrediblePriceInr: refPrice,
    overlapGroupId: item.materialCode
  };
}

function checkIsReviewRequired(opp: SameMaterialOpportunity): boolean {
  if (opp.classificationReviewStatus === 'AWAITING_REVIEW') return true;
  return opp.materialCode.startsWith('DESC_MATCH_');
}

function resolveVcAction(isReviewRequired: boolean): string {
  if (isReviewRequired) {
    return 'Assign authoritative SAP material group & code before executing commercial consolidation.';
  }
  return 'Conduct supplier qualification audit and consolidate volume to top strategic partner.';
}

function resolveVcConfidence(isReviewRequired: boolean, supplierCount: number): OpportunityConfidenceLevel {
  if (isReviewRequired) return 'LOW';
  return supplierCount >= 3 ? 'HIGH' : 'MEDIUM';
}

function buildSingleVcItem(
  opp: SameMaterialOpportunity,
  idx: number,
  assessmentId: string
): MaterialOpportunityItem {
  const oppId = `OPP-${assessmentId}-SC-${String(idx + 1).padStart(4, '0')}`;
  const spendInr = opp.totalSpendInr || 0;
  const isReviewRequired = checkIsReviewRequired(opp);
  const confidence = resolveVcConfidence(isReviewRequired, opp.supplierCount);
  const plants = Array.from(new Set((opp.suppliers || []).flatMap((s) => s.plants || [])));
  const txIds = (opp.transactions || []).map((t) => t.id || '');
  const txCount = opp.transactions?.length || 1;
  const action = resolveVcAction(isReviewRequired);
  const reviewFlags = isReviewRequired ? ['AWAITING_MATERIAL_CODE_REVIEW'] : ['CONSOLIDATION_CANDIDATE'];

  return {
    opportunityId: oppId,
    opportunityType: 'SUPPLIER_CONSOLIDATION',
    category: opp.spendCategory || 'Direct Materials',
    materialCode: opp.materialCode,
    materialDescription: opp.materialDesc,
    uom: opp.uom || 'N/A',
    supportingTransactionCount: txCount,
    supportingTransactionIds: txIds,
    historicalSpendInr: spendInr,
    historicalSpendCr: opp.totalSpendCr || Number((spendInr / 1e7).toFixed(4)),
    suppliersInvolved: (opp.suppliers || []).map((s) => s.vendorName),
    plantsInvolved: plants,
    rationale: `Material multi-sourced across ${opp.supplierCount} suppliers. Fragmentation suggests consolidation potential.`,
    calculationMethodology: 'Volume Concentration & Share of Wallet Negotiation (Commercial Terms Required)',
    sourceFields: ['vendorCode', 'vendorName', 'totalSpendInr', 'materialCode', 'materialDesc'],
    dataQualityChecks: ['SUPPLIER_NORMALIZED', 'SERVICE_EXCLUDED', 'GENERIC_FILTERED'],
    comparabilityChecks: isReviewRequired
      ? ['DESCRIPTION_SIMILARITY_MATCH', 'MANUAL_CODE_VERIFICATION_REQUIRED']
      : ['IDENTICAL_MATERIAL_CODE', 'MULTI_SUPPLIER_VERIFIED'],
    confidenceLevel: confidence,
    reviewFlags,
    requiredProcurementAction: action,
    responsibleValidationTeam: RESPONSIBLE_VALIDATION_TEAMS.SUPPLIER_CONSOLIDATION,
    status: isReviewRequired ? 'UNDER_REVIEW' : 'IDENTIFIED',
    defensibleOpportunityValueInr: null,
    defensibleOpportunityValueCr: null,
    classificationReviewStatus: opp.classificationReviewStatus,
    overlapGroupId: opp.materialCode
  };
}

export class Module2OpportunityRegisterBuilder {
  public static mapDpiOpportunities(
    items: DirectPriceItemOpportunity[],
    assessmentId: string
  ): MaterialOpportunityItem[] {
    return items.map((item, idx) => buildSingleDpiItem(item, idx, assessmentId));
  }

  public static mapVendorConsolidationOpportunities(
    opportunities: SameMaterialOpportunity[],
    assessmentId: string
  ): MaterialOpportunityItem[] {
    return opportunities.map((opp, idx) => buildSingleVcItem(opp, idx, assessmentId));
  }

  public static mapVolumeAggregationOpportunities(
    opportunities: VolumeAggregationOpportunity[],
    assessmentId: string
  ): MaterialOpportunityItem[] {
    return opportunities
      .filter((opp) => opp.isGenuineOpportunity && opp.transactionCount >= 2)
      .map((opp, idx) => {
        const oppId = `OPP-${assessmentId}-VDC-${String(idx + 1).padStart(4, '0')}`;
        const spendInr = opp.potentiallyAggregatableSpendInr || opp.totalHistoricalSpendInr || 0;
        const confidence: OpportunityConfidenceLevel = opp.plantCount >= 2 ? 'HIGH' : 'MEDIUM';

        return {
          opportunityId: oppId,
          opportunityType: 'VOLUME_DEMAND_CONSOLIDATION',
          category: opp.category || 'Direct Materials',
          materialCode: opp.materialCode,
          materialDescription: opp.materialDesc,
          uom: opp.baseUom,
          supportingTransactionCount: opp.transactionCount,
          supportingTransactionIds: [],
          historicalSpendInr: spendInr,
          historicalSpendCr: Number((spendInr / 1e7).toFixed(4)),
          suppliersInvolved: opp.suppliers || [],
          plantsInvolved: opp.plants || [],
          rationale: `High-volume material (${opp.aggregatableQuantity?.toLocaleString()} ${opp.baseUom}) with verified demand recurrence across ${opp.plantCount} plant(s).`,
          calculationMethodology: 'Temporal and Inter-Plant Lot Aggregation Model',
          sourceFields: ['quantity', 'uom', 'totalSpendInr', 'plant', 'transactionDate'],
          dataQualityChecks: ['APPROVED_BASE_UOM_MAPPING', 'LOT_SIZE_VALIDATED', 'DIMENSION_CONVERTED'],
          comparabilityChecks: ['BASE_UOM_HARMONIZED', 'SAME_MATERIAL_CODE'],
          confidenceLevel: confidence,
          reviewFlags: ['ANNUAL_VOLUME_QUALIFIED', opp.eligibilityType],
          requiredProcurementAction: 'Aggregate annual demand across plants into master delivery contract with bulk pricing.',
          responsibleValidationTeam: RESPONSIBLE_VALIDATION_TEAMS.VOLUME_DEMAND_CONSOLIDATION,
          status: 'IDENTIFIED',
          defensibleOpportunityValueInr: null,
          defensibleOpportunityValueCr: null,
          overlapGroupId: opp.materialCode
        };
      });
  }

  public static mapSpecRationalisationOpportunities(
    candidates: SpecificationCandidateItem[],
    assessmentId: string
  ): MaterialOpportunityItem[] {
    return candidates.slice(0, 50).map((c, idx) => {
      const oppId = `OPP-${assessmentId}-SPR-${String(idx + 1).padStart(4, '0')}`;
      const spendInr = c.expenditureUnderReviewInr || 0;
      const plants = [c.primaryItem?.plant, c.comparisonItem?.plant].filter(Boolean) as string[];

      return {
        opportunityId: oppId,
        opportunityType: 'SPECIFICATION_PROCESS_REVIEW',
        category: c.spendCategory || 'Direct Materials',
        materialCode: `${c.primaryItem.code} / ${c.comparisonItem.code}`,
        materialDescription: `${c.primaryItem.description} <-> ${c.comparisonItem.description}`,
        uom: c.primaryItem.uom || 'VARIOUS',
        supportingTransactionCount: (c.primaryItem.transactionCount || 1) + (c.comparisonItem.transactionCount || 1),
        supportingTransactionIds: [],
        historicalSpendInr: spendInr,
        historicalSpendCr: c.expenditureUnderReviewCr || Number((spendInr / 1e7).toFixed(4)),
        suppliersInvolved: [],
        plantsInvolved: plants,
        rationale: `Specification variance identified between ${c.primaryItem.code} and ${c.comparisonItem.code}. Similarity: ${c.similarityScore}%.`,
        calculationMethodology: 'Technical Standardization Feasibility (Commercial Quantification Deferred)',
        sourceFields: ['itemDescription', 'itemCode', 'materialGroup', 'plant'],
        dataQualityChecks: ['FUZZY_STRING_SIMILARITY', 'TECHNICAL_ATTRIBUTES_INDEXED'],
        comparabilityChecks: ['PRELIMINARY_TEXT_SIMILARITY', 'TECHNICAL_AUDIT_MANDATORY'],
        confidenceLevel: 'LOW',
        reviewFlags: ['TECHNICAL_REVIEW_REQUIRED', 'SAFETY_TOLERANCE_VERIFICATION_PENDING'],
        requiredProcurementAction: 'Submit specification pair to Engineering / Plant Operations for technical tolerance evaluation.',
        responsibleValidationTeam: RESPONSIBLE_VALIDATION_TEAMS.SPECIFICATION_PROCESS_REVIEW,
        status: 'UNDER_REVIEW',
        defensibleOpportunityValueInr: null,
        defensibleOpportunityValueCr: null,
        overlapGroupId: c.primaryItem.code
      };
    });
  }
}
