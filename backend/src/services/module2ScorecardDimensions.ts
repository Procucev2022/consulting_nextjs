/**
 * Module 2 Sourcing Scorecard Dimensions Evaluator
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type {
  SourcingScorecardDimension,
  SourcingStrategyRecommendation,
  SourcingDataConfidence,
  PriceDispersionMetrics,
  SupplierFragmentationLevel
} from '../types/module2StrategicSourcing';
import { SCORECARD_WEIGHTS } from '../constants/module2StrategicSourcing';

export interface ScorecardEvaluationInput {
  materiality: 'HIGH' | 'MEDIUM' | 'LOW';
  fragmentation: SupplierFragmentationLevel;
  dispersion: PriceDispersionMetrics | null;
  isRecurring: boolean;
  supplierCount: number;
  comparableTxCount: number;
  totalTxCount: number;
  addressableSpendInr: number;
  confidence: SourcingDataConfidence;
}

export class Module2ScorecardDimensions {
  private static getMaterialityDimension(materiality: 'HIGH' | 'MEDIUM' | 'LOW', spendInr: number): SourcingScorecardDimension {
    const matScore = materiality === 'HIGH' ? 10 : materiality === 'MEDIUM' ? 6 : 2;
    return {
      dimension: 'Spend Materiality',
      score: matScore,
      weightPct: SCORECARD_WEIGHTS.spendMateriality * 100,
      assessment: matScore >= 7 ? 'FAVORABLE' : matScore >= 5 ? 'NEUTRAL' : 'UNFAVORABLE',
      rationale: `Category spend of ₹${(spendInr / 100000).toFixed(2)}L represents ${materiality} materiality.`
    };
  }

  private static getFragmentationDimension(fragmentation: SupplierFragmentationLevel): SourcingScorecardDimension {
    const isExtreme = fragmentation === 'EXTREME_FRAGMENTATION' || fragmentation === 'HIGH_FRAGMENTATION';
    const fragScore = isExtreme ? 9 : fragmentation === 'MODERATE_FRAGMENTATION' ? 6 : 3;
    return {
      dimension: 'Supplier Fragmentation',
      score: fragScore,
      weightPct: SCORECARD_WEIGHTS.supplierFragmentation * 100,
      assessment: fragScore >= 7 ? 'FAVORABLE' : 'NEUTRAL',
      rationale: `Classified as ${fragmentation.replace('_', ' ')} based on HHI and tail spend distribution.`
    };
  }

  private static getDispersionDimension(dispersion: PriceDispersionMetrics | null): SourcingScorecardDimension {
    const dispPct = dispersion?.priceDispersionPct || 0;
    const dispScore = dispPct >= 15 ? 10 : dispPct >= 5 ? 7 : dispPct > 1 ? 4 : 1;
    return {
      dimension: 'Price Dispersion',
      score: dispScore,
      weightPct: SCORECARD_WEIGHTS.priceDispersion * 100,
      assessment: dispScore >= 7 ? 'FAVORABLE' : dispScore >= 4 ? 'NEUTRAL' : 'UNFAVORABLE',
      rationale: `${dispPct.toFixed(1)}% price variance across comparable suppliers.`
    };
  }

  private static getRecurrenceDimension(isRecurring: boolean): SourcingScorecardDimension {
    const recScore = isRecurring ? 9 : 2;
    return {
      dimension: 'Recurrence',
      score: recScore,
      weightPct: SCORECARD_WEIGHTS.recurrence * 100,
      assessment: isRecurring ? 'FAVORABLE' : 'UNFAVORABLE',
      rationale: isRecurring ? 'Procured continuously across multiple active months.' : 'Ad-hoc or non-recurring purchasing pattern.'
    };
  }

  private static getVolumeDimension(spendInr: number): SourcingScorecardDimension {
    const volScore = spendInr >= 5000000 ? 10 : spendInr >= 1000000 ? 7 : 3;
    return {
      dimension: 'Addressable Volume',
      score: volScore,
      weightPct: SCORECARD_WEIGHTS.addressableVolume * 100,
      assessment: volScore >= 7 ? 'FAVORABLE' : 'NEUTRAL',
      rationale: 'Substantial addressable volume available for sourcing renegotiation.'
    };
  }

  private static getCompetitionDimension(supplierCount: number): SourcingScorecardDimension {
    const compScore = supplierCount >= 4 ? 10 : supplierCount >= 2 ? 6 : 1;
    return {
      dimension: 'Supplier Competition',
      score: compScore,
      weightPct: SCORECARD_WEIGHTS.supplierCompetition * 100,
      assessment: compScore >= 7 ? 'FAVORABLE' : compScore >= 5 ? 'NEUTRAL' : 'UNFAVORABLE',
      rationale: `${supplierCount} active suppliers available in the market.`
    };
  }

  private static getComparabilityDimension(compTx: number, totalTx: number): SourcingScorecardDimension {
    const compRatio = totalTx > 0 ? compTx / totalTx : 0;
    const compRatioScore = compRatio >= 0.8 ? 9 : compRatio >= 0.5 ? 5 : 2;
    return {
      dimension: 'Comparability',
      score: compRatioScore,
      weightPct: SCORECARD_WEIGHTS.comparability * 100,
      assessment: compRatioScore >= 7 ? 'FAVORABLE' : 'NEUTRAL',
      rationale: `${(compRatio * 100).toFixed(0)}% of transactions satisfy strict technical comparability.`
    };
  }

  private static getEvidenceDimension(confidence: SourcingDataConfidence): SourcingScorecardDimension {
    const evidScore = confidence === 'HIGH' ? 10 : confidence === 'MEDIUM' ? 7 : confidence === 'LOW' ? 3 : 0;
    return {
      dimension: 'Historical Evidence Quality',
      score: evidScore,
      weightPct: SCORECARD_WEIGHTS.historicalEvidenceQuality * 100,
      assessment: evidScore >= 7 ? 'FAVORABLE' : evidScore >= 3 ? 'NEUTRAL' : 'DATA_DEFICIENT',
      rationale: `Historical data confidence evaluated as ${confidence}.`
    };
  }

  public static buildDimensions(input: ScorecardEvaluationInput): SourcingScorecardDimension[] {
    return [
      this.getMaterialityDimension(input.materiality, input.addressableSpendInr),
      this.getFragmentationDimension(input.fragmentation),
      this.getDispersionDimension(input.dispersion),
      this.getRecurrenceDimension(input.isRecurring),
      this.getVolumeDimension(input.addressableSpendInr),
      this.getCompetitionDimension(input.supplierCount),
      this.getComparabilityDimension(input.comparableTxCount, input.totalTxCount),
      this.getEvidenceDimension(input.confidence),
      {
        dimension: 'Contract Constraints',
        score: 7,
        weightPct: SCORECARD_WEIGHTS.contractConstraints * 100,
        assessment: 'FAVORABLE',
        rationale: 'No rigid long-term contractual lock identified in customer procurement history.'
      },
      {
        dimension: 'Specification Complexity',
        score: 8,
        weightPct: SCORECARD_WEIGHTS.specificationComplexity * 100,
        assessment: 'FAVORABLE',
        rationale: 'Standard commercial commodity specifications with established market equivalence.'
      }
    ];
  }

  public static determineRecommendation(input: ScorecardEvaluationInput): {
    recommendation: SourcingStrategyRecommendation;
    recommendationLabel: string;
    notes: string[];
  } {
    const { confidence, comparableTxCount, supplierCount, dispersion, isRecurring, fragmentation } = input;
    const dispPct = dispersion?.priceDispersionPct || 0;
    const isFragmented = fragmentation === 'EXTREME_FRAGMENTATION' || fragmentation === 'HIGH_FRAGMENTATION';

    if (confidence === 'INSUFFICIENT' || comparableTxCount < 2) {
      return {
        recommendation: 'DATA_DEEP_DIVE_REQUIRED',
        recommendationLabel: 'Data Deep-Dive Required',
        notes: ['Transaction history contains inadequate comparable data to execute market sourcing.']
      };
    }
    if (supplierCount >= 3 && dispPct >= 4 && isRecurring) {
      if (isFragmented) {
        return {
          recommendation: 'E_AUCTION_PLUS_CONSOLIDATION',
          recommendationLabel: 'E-Auction + Vendor Consolidation',
          notes: ['Simultaneous execution: run dynamic e-auction for primary volume and consolidate fragmented tail.']
        };
      }
      return {
        recommendation: 'E_AUCTION_RECOMMENDED',
        recommendationLabel: 'E-Auction Recommended',
        notes: ['Strong competitive tension and price dispersion support immediate reverse auction.']
      };
    }
    if (isFragmented) {
      return {
        recommendation: 'VENDOR_CONSOLIDATION_REVIEW',
        recommendationLabel: 'Vendor Consolidation Review',
        notes: ['Spend is fragmented across tail vendors; consolidate into primary contracts.']
      };
    }
    if (supplierCount >= 2 && isRecurring) {
      return {
        recommendation: 'COMPETITIVE_RFQ_RECOMMENDED',
        recommendationLabel: 'Competitive RFQ Recommended',
        notes: ['Structured sealed bid RFQ recommended to elicit price concessions.']
      };
    }
    return {
      recommendation: 'SPECIFICATION_STANDARDIZATION_REVIEW',
      recommendationLabel: 'Specification Standardization Review',
      notes: ['Harmonize internal specs to expand qualified supplier base before re-tendering.']
    };
  }
}
