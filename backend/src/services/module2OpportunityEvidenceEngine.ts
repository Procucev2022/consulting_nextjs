/**
 * Module 2 — Opportunity Evidence State & 2D Assessment Engine
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type {
  OpportunityEvidenceState,
  TwoDimensionalOpportunityAssessment
} from '../types/module2OpportunityIntelligence';
import type {
  CategorySupplierStructureItem,
  PriceDispersionMetrics,
  SourcingDataConfidence
} from '../types/module2StrategicSourcing';
import { PROCUREMENT_SAFEGUARD_MESSAGES } from '../constants/module2OpportunityIntelligence';

export interface EvidenceResolutionInput {
  provenPriceOppInr: number | null;
  volumeBundlingOppInr: number | null;
  eauctionOppInr: number | null;
  consolidationOppInr: number | null;
  specialistOppInr: number | null;
  netOppInr: number | null;
  isMarketDiscoveryRequired: boolean;
  suppliers: CategorySupplierStructureItem[];
  dispersion: PriceDispersionMetrics | null;
  confidence: SourcingDataConfidence;
  comparableTxCount: number;
}

export class Module2OpportunityEvidenceEngine {
  private static hasQuantifiableRange(disp: PriceDispersionMetrics | null): boolean {
    if (!disp) return false;
    return disp.p25Price < disp.p75Price && disp.weightedAveragePrice > disp.p25Price;
  }

  private static hasStructuralMechanisms(input: EvidenceResolutionInput): boolean {
    const hasVol = (input.volumeBundlingOppInr ?? 0) > 0;
    const hasSpec = (input.specialistOppInr ?? 0) > 0;
    return hasVol || hasSpec || input.suppliers.length > 3;
  }

  public static resolveEvidenceState(input: EvidenceResolutionInput): OpportunityEvidenceState {
    if (input.confidence === 'INSUFFICIENT' || input.comparableTxCount === 0) {
      return 'INSUFFICIENT_DATA';
    }

    const hasProvenPrice = (input.provenPriceOppInr ?? 0) > 0;
    const hasProvenNet = (input.netOppInr ?? 0) > 0;
    if (hasProvenNet && hasProvenPrice) {
      return 'PROVEN_OPPORTUNITY';
    }

    if (this.hasQuantifiableRange(input.dispersion)) {
      return 'QUANTIFIABLE_OPPORTUNITY_RANGE';
    }

    if (input.isMarketDiscoveryRequired) {
      return 'MARKET_DISCOVERY_OPPORTUNITY';
    }

    if (this.hasStructuralMechanisms(input)) {
      return 'IDENTIFIED_NOT_QUANTIFIABLE';
    }

    return 'LOW_EVIDENCED_OPPORTUNITY';
  }

  private static buildPriceAssessment(
    input: EvidenceResolutionInput
  ): TwoDimensionalOpportunityAssessment {
    const hasPrice = (input.provenPriceOppInr ?? 0) > 0;
    return {
      dimensionKey: 'PRICE_OPPORTUNITY',
      dimensionLabel: 'Historical Price Opportunity',
      potentialValue: hasPrice ? 'PROVEN' : input.isMarketDiscoveryRequired ? 'MARKET_DISCOVERY' : 'LOW_EVIDENCED',
      evidenceConfidence: input.confidence,
      valueDisplay: hasPrice
        ? `₹${((input.provenPriceOppInr ?? 0) / 100000).toFixed(2)} L`
        : input.isMarketDiscoveryRequired ? 'MARKET DISCOVERY REQUIRED' : 'LOW EVIDENCED',
      monetaryValueInr: input.provenPriceOppInr,
      rangeMinInr: null,
      rangeMaxInr: null,
      confidenceRationale: hasPrice
        ? 'Directly proven by historical unit price differentials across comparable transactions.'
        : PROCUREMENT_SAFEGUARD_MESSAGES.NO_MATERIAL_EVIDENCE,
      diagnosticExplanation: hasPrice
        ? 'Verified price dispersion exists between baseline weighted average price and credible lowest price.'
        : 'Internal price variance is minimal; external price discovery is required to validate market competitiveness.'
    };
  }

  private static buildVolumeAssessment(
    input: EvidenceResolutionInput
  ): TwoDimensionalOpportunityAssessment {
    const hasVol = (input.volumeBundlingOppInr ?? 0) > 0;
    return {
      dimensionKey: 'VOLUME_OPPORTUNITY',
      dimensionLabel: 'Volume Leverage Opportunity',
      potentialValue: hasVol ? 'PROVEN' : input.suppliers.length > 3 ? 'RANGE' : 'NOT_QUANTIFIABLE',
      evidenceConfidence: input.confidence === 'HIGH' ? 'MEDIUM' : input.confidence,
      valueDisplay: hasVol
        ? `₹${((input.volumeBundlingOppInr ?? 0) / 100000).toFixed(2)} L`
        : 'MARKET VALIDATION REQUIRED',
      monetaryValueInr: input.volumeBundlingOppInr,
      rangeMinInr: null,
      rangeMaxInr: null,
      confidenceRationale: hasVol
        ? 'Historical batch volume demonstrates volume-tier elasticity.'
        : 'Volume discount potential requires supplier quotation verification during tender.',
      diagnosticExplanation: 'Volume pooling potential across fragmented order lines.'
    };
  }

  private static buildAuctionAssessment(
    input: EvidenceResolutionInput
  ): TwoDimensionalOpportunityAssessment {
    const hasAuction = (input.eauctionOppInr ?? 0) > 0;
    return {
      dimensionKey: 'E_AUCTION_OPPORTUNITY',
      dimensionLabel: 'E-Auction Opportunity',
      potentialValue: hasAuction ? 'PROVEN' : input.suppliers.length >= 3 ? 'MARKET_DISCOVERY' : 'NOT_QUANTIFIABLE',
      evidenceConfidence: input.confidence,
      valueDisplay: hasAuction
        ? `₹${((input.eauctionOppInr ?? 0) / 100000).toFixed(2)} L`
        : 'MARKET DISCOVERY REQUIRED',
      monetaryValueInr: input.eauctionOppInr,
      rangeMinInr: null,
      rangeMaxInr: null,
      confidenceRationale: hasAuction
        ? 'Auction target price derived from historical demonstrated P25/lowest credible pricing.'
        : 'Multi-supplier category suitable for dynamic reverse e-auction price discovery.',
      diagnosticExplanation: 'Real-time competitive bidding tension across qualified supplier pool.'
    };
  }

  private static buildConsolidationAssessment(
    input: EvidenceResolutionInput
  ): TwoDimensionalOpportunityAssessment {
    const hasConsol = (input.consolidationOppInr ?? 0) > 0;
    return {
      dimensionKey: 'SUPPLIER_CONSOLIDATION',
      dimensionLabel: 'Same-Category Supplier Consolidation',
      potentialValue: hasConsol ? 'PROVEN' : input.suppliers.length > 2 ? 'RANGE' : 'NOT_QUANTIFIABLE',
      evidenceConfidence: input.confidence,
      valueDisplay: hasConsol
        ? `₹${((input.consolidationOppInr ?? 0) / 100000).toFixed(2)} L`
        : 'NOT YET QUANTIFIABLE',
      monetaryValueInr: input.consolidationOppInr,
      rangeMinInr: null,
      rangeMaxInr: null,
      confidenceRationale: hasConsol
        ? 'Monetary price differential verified from tail suppliers to core qualified suppliers.'
        : PROCUREMENT_SAFEGUARD_MESSAGES.SPECIFICATION_HARMONIZATION_REQUIRED,
      diagnosticExplanation: 'Spend reallocation from non-competitive tail vendors to high-performing core suppliers.'
    };
  }

  private static buildSpecialistAssessment(
    input: EvidenceResolutionInput
  ): TwoDimensionalOpportunityAssessment {
    const hasSpec = (input.specialistOppInr ?? 0) > 0;
    return {
      dimensionKey: 'CATEGORY_SPECIALIZATION',
      dimensionLabel: 'Category Specialization Opportunity',
      potentialValue: hasSpec ? 'PROVEN' : 'NOT_QUANTIFIABLE',
      evidenceConfidence: input.confidence,
      valueDisplay: hasSpec
        ? `₹${((input.specialistOppInr ?? 0) / 100000).toFixed(2)} L`
        : 'IDENTIFIED — NOT QUANTIFIABLE',
      monetaryValueInr: input.specialistOppInr,
      rangeMinInr: null,
      rangeMaxInr: null,
      confidenceRationale: hasSpec
        ? 'Historical unit price difference between multi-category generalist and specialist vendors.'
        : 'Specialist vendor unbundling identified; commercial pricing requires RFQ discovery.',
      diagnosticExplanation: 'Realigning multi-category generalist spend to dedicated category specialists.'
    };
  }

  private static buildCommercialAssessment(
    input: EvidenceResolutionInput
  ): TwoDimensionalOpportunityAssessment {
    return {
      dimensionKey: 'COMMERCIAL_EXCELLENCE',
      dimensionLabel: 'Procurement Maturity & Commercial Terms',
      potentialValue: 'NOT_QUANTIFIABLE',
      evidenceConfidence: input.confidence,
      valueDisplay: 'IDENTIFIED — STRUCTURAL',
      monetaryValueInr: null,
      rangeMinInr: null,
      rangeMaxInr: null,
      confidenceRationale: 'Commercial terms provide contractual and operational benefits, not synthetic price savings.',
      diagnosticExplanation: 'Harmonization of payment terms, Incoterms, warranties, and volume rebates.'
    };
  }

  public static buildTwoDimensionalAssessments(
    input: EvidenceResolutionInput,
    _evidenceState: OpportunityEvidenceState
  ): TwoDimensionalOpportunityAssessment[] {
    return [
      this.buildPriceAssessment(input),
      this.buildVolumeAssessment(input),
      this.buildAuctionAssessment(input),
      this.buildConsolidationAssessment(input),
      this.buildSpecialistAssessment(input),
      this.buildCommercialAssessment(input)
    ];
  }

  public static calculateOpportunityRange(
    addressableQty: number,
    dispersion: PriceDispersionMetrics | null
  ): { rangeMinInr: number | null; rangeMaxInr: number | null; rangeMethodology: string } {
    if (!dispersion || addressableQty <= 0) {
      return { rangeMinInr: null, rangeMaxInr: null, rangeMethodology: 'INSUFFICIENT_DISPERSION_DATA' };
    }

    const wap = dispersion.weightedAveragePrice;
    const p75 = dispersion.p75Price;
    const median = dispersion.medianPrice;
    const p25 = dispersion.p25Price;

    let lowDelta = 0;
    if (wap > p75) lowDelta = wap - p75;
    else if (wap > median) lowDelta = (wap - median) * 0.5;

    let highDelta = 0;
    if (wap > p25) highDelta = wap - p25;

    if (highDelta <= 0) {
      return { rangeMinInr: null, rangeMaxInr: null, rangeMethodology: 'NO_MATERIAL_PRICE_VARIANCE' };
    }

    const rangeMinInr = Math.round(lowDelta * addressableQty);
    const rangeMaxInr = Math.round(highDelta * addressableQty);

    return {
      rangeMinInr: rangeMinInr > 0 ? rangeMinInr : Math.round(rangeMaxInr * 0.5),
      rangeMaxInr,
      rangeMethodology: 'NON_PARAMETRIC_QUARTILE_DISPERSION (Conservative P75/Median to Stretch P25)'
    };
  }
}
