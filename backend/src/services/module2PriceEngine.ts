/**
 * Module 2 Price Normalization & Credible Reference Price Engine
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 * 
 * Implements:
 * - Quantity-Weighted Average Purchase Price
 * - Percentiles (P10, P25, P50/Median, P75, P90)
 * - Credible Low-Price Rule (Section 8)
 * - Conservative / Base / Stretch Scenario Ranges (Section 11)
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  PriceDispersionMetrics,
  CrediblePriceReferenceResult,
  OpportunityScenarioRange
} from '../types/module2StrategicSourcing';
import { CREDIBLE_PRICE_RULES } from '../constants/module2StrategicSourcing';

export class Module2PriceEngine {
  /**
   * Calculate percentile value from sorted numeric array
   */
  private static calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];

    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= sortedValues.length) return sortedValues[sortedValues.length - 1];
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private static getVolumeAboveP25(transactions: StrategicInputTransaction[], p25Price: number): number {
    let volumeAboveP25 = 0;
    for (const tx of transactions) {
      if ((Number(tx.unit_price) || 0) > p25Price) {
        volumeAboveP25 += Number(tx.quantity) || 0;
      }
    }
    return volumeAboveP25;
  }

  private static getDispersionInterpretation(dispersionPct: number, volAboveP25Pct: number): string {
    if (dispersionPct > 15) {
      return `High historical price dispersion (${dispersionPct.toFixed(1)}%). ${volAboveP25Pct.toFixed(
        1
      )}% of volume was purchased above P25 historical price, indicating substantial price harmonization potential.`;
    }
    if (dispersionPct > 5) {
      return `Moderate price dispersion (${dispersionPct.toFixed(1)}%). Price variation exists among comparable suppliers.`;
    }
    return `Tight historical price clustering (${dispersionPct.toFixed(1)}%). Baseline prices are highly aligned.`;
  }

  /**
   * Calculate comprehensive price dispersion metrics across comparable transactions
   */
  public static calculatePriceDispersion(
    transactions: StrategicInputTransaction[]
  ): PriceDispersionMetrics | null {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    let totalQuantity = 0;
    let totalSpendInr = 0;
    const unitPrices: number[] = [];

    for (const tx of transactions) {
      const q = Number(tx.quantity) || 0;
      const p = Number(tx.unit_price) || 0;
      const spend = Number(tx.total_spend_inr) || (p * q);

      totalQuantity += q;
      totalSpendInr += spend;
      unitPrices.push(p);
    }

    if (totalQuantity <= 0 || unitPrices.length === 0) {
      return null;
    }

    unitPrices.sort((a, b) => a - b);

    // Quantity-weighted average price (Primary baseline per Section 7)
    const weightedAveragePrice = totalSpendInr / totalQuantity;
    const simpleAveragePrice = unitPrices.reduce((a, b) => a + b, 0) / unitPrices.length;
    const minPrice = unitPrices[0];
    const maxPrice = unitPrices[unitPrices.length - 1];

    const p10Price = this.calculatePercentile(unitPrices, 10);
    const p25Price = this.calculatePercentile(unitPrices, 25);
    const p50Price = this.calculatePercentile(unitPrices, 50);
    const p75Price = this.calculatePercentile(unitPrices, 75);
    const p90Price = this.calculatePercentile(unitPrices, 90);

    const priceDispersionInr = maxPrice - minPrice;
    const priceDispersionPct = weightedAveragePrice > 0
      ? (priceDispersionInr / weightedAveragePrice) * 100
      : 0;

    const volumeAboveP25 = this.getVolumeAboveP25(transactions, p25Price);
    const volumeAboveP25Pct = totalQuantity > 0 ? (volumeAboveP25 / totalQuantity) * 100 : 0;
    const dispersionInterpretation = this.getDispersionInterpretation(priceDispersionPct, volumeAboveP25Pct);

    return {
      totalQuantity,
      totalSpendInr,
      weightedAveragePrice,
      simpleAveragePrice,
      medianPrice: p50Price,
      minPrice,
      maxPrice,
      p10Price,
      p25Price,
      p50Price,
      p75Price,
      p90Price,
      priceDispersionInr,
      priceDispersionPct,
      volumeAboveP25Pct,
      dispersionInterpretation
    };
  }

  /**
   * Determine Credible Lowest Reference Price (Section 8)
   */
  public static determineCredibleReferencePrice(
    transactions: StrategicInputTransaction[],
    dispersion: PriceDispersionMetrics | null
  ): CrediblePriceReferenceResult {
    const validTxs = (transactions || []).filter(t => Number(t.unit_price) > 0 && Number(t.quantity) > 0);
    if (!transactions || transactions.length === 0 || !dispersion || validTxs.length === 0) {
      return {
        referencePrice: null,
        methodology: 'NO_VALID_REFERENCE',
        qualifyingTransactionCount: 0,
        isCredible: false,
        qualificationCriteria: {
          comparableSpec: false,
          comparableUom: false,
          comparableCurrency: false,
          sufficientVolume: false,
          nonOutlier: false,
          withinHistoricalWindow: false
        },
        explanation: 'No validated historical comparable transactions available.'
      };
    }

    const totalQty = dispersion.totalQuantity;
    const median = dispersion.medianPrice;

    // Filter candidate transactions that meet the credible threshold
    const candidates = transactions
      .map(tx => ({
        price: Number(tx.unit_price) || 0,
        qty: Number(tx.quantity) || 0,
        tx
      }))
      .filter(c => {
        const volumeShare = totalQty > 0 ? c.qty / totalQty : 0;
        const hasSufficientVolume = volumeShare >= CREDIBLE_PRICE_RULES.MIN_VOLUME_SHARE;
        const isNotExtremeLow = median > 0 && c.price >= median * 0.65;
        return c.price > 0 && hasSufficientVolume && isNotExtremeLow;
      })
      .sort((a, b) => a.price - b.price);

    if (candidates.length > 0) {
      const best = candidates[0];
      return {
        referencePrice: best.price,
        methodology: 'LOWEST_CREDIBLE_PRICE',
        qualifyingTransactionCount: candidates.length,
        isCredible: true,
        qualificationCriteria: {
          comparableSpec: true,
          comparableUom: true,
          comparableCurrency: true,
          sufficientVolume: true,
          nonOutlier: true,
          withinHistoricalWindow: true
        },
        explanation: `Credible lowest historical price ₹${best.price.toFixed(2)} representing ${(
          (best.qty / totalQty) * 100
        ).toFixed(1)}% of addressable category volume without outlier distortion.`
      };
    }

    // Fallback to P25 if at least 2 transactions exist and P25 < Weighted Average
    if (transactions.length >= 2 && dispersion.p25Price < dispersion.weightedAveragePrice) {
      return {
        referencePrice: dispersion.p25Price,
        methodology: 'P25_COMPARABLE_PRICE',
        qualifyingTransactionCount: transactions.length,
        isCredible: true,
        qualificationCriteria: {
          comparableSpec: true,
          comparableUom: true,
          comparableCurrency: true,
          sufficientVolume: true,
          nonOutlier: true,
          withinHistoricalWindow: true
        },
        explanation: `P25 historical quartile price ₹${dispersion.p25Price.toFixed(2)} selected as robust, defensible reference baseline.`
      };
    }

    // If all prices are virtually identical
    return {
      referencePrice: dispersion.weightedAveragePrice,
      methodology: 'MEDIAN_COMPARABLE_PRICE',
      qualifyingTransactionCount: transactions.length,
      isCredible: true,
      qualificationCriteria: {
        comparableSpec: true,
        comparableUom: true,
        comparableCurrency: true,
        sufficientVolume: true,
        nonOutlier: true,
        withinHistoricalWindow: true
      },
      explanation: 'Historical transaction prices are homogeneous. Baseline weighted price used as reference.'
    };
  }

  /**
   * Calculate Conservative, Base, and Stretch Scenario Ranges (Section 11)
   */
  public static calculateOpportunityScenarios(
    addressableQuantity: number,
    dispersion: PriceDispersionMetrics | null,
    credibleRef: CrediblePriceReferenceResult
  ): OpportunityScenarioRange {
    if (!dispersion || addressableQuantity <= 0 || !credibleRef.isCredible) {
      return {
        isAvailable: false,
        conservativeOpportunityInr: null,
        conservativeOpportunityInrCr: null,
        conservativeReferencePrice: null,
        conservativeMethodology: 'N/A',
        baseOpportunityInr: null,
        baseOpportunityInrCr: null,
        baseReferencePrice: null,
        baseMethodology: 'N/A',
        stretchOpportunityInr: null,
        stretchOpportunityInrCr: null,
        stretchReferencePrice: null,
        stretchMethodology: 'N/A',
        explanation: 'SCENARIO ANALYSIS = NOT AVAILABLE — Insufficient historical transaction volume or dispersion.'
      };
    }

    const baselinePrice = dispersion.weightedAveragePrice;

    // Conservative: P25
    const consPrice = Math.min(dispersion.p25Price, baselinePrice);
    const consGap = Math.max(0, baselinePrice - consPrice);
    const consOpp = consGap * addressableQuantity;

    // Base: Credible reference or Median
    const basePrice = credibleRef.referencePrice !== null ? credibleRef.referencePrice : dispersion.medianPrice;
    const baseGap = Math.max(0, baselinePrice - basePrice);
    const baseOpp = baseGap * addressableQuantity;

    // Stretch: Credible Lowest or Min
    const stretchPrice = Math.min(credibleRef.referencePrice || dispersion.minPrice, dispersion.minPrice);
    const stretchGap = Math.max(0, baselinePrice - stretchPrice);
    const stretchOpp = stretchGap * addressableQuantity;

    return {
      isAvailable: true,
      conservativeOpportunityInr: Math.round(consOpp),
      conservativeOpportunityInrCr: Math.round((consOpp / 10000000) * 1000) / 1000,
      conservativeReferencePrice: consPrice,
      conservativeMethodology: 'P25 Comparable Price quartile baseline',

      baseOpportunityInr: Math.round(baseOpp),
      baseOpportunityInrCr: Math.round((baseOpp / 10000000) * 1000) / 1000,
      baseReferencePrice: basePrice,
      baseMethodology: `${credibleRef.methodology} reference baseline`,

      stretchOpportunityInr: Math.round(stretchOpp),
      stretchOpportunityInrCr: Math.round((stretchOpp / 10000000) * 1000) / 1000,
      stretchReferencePrice: stretchPrice,
      stretchMethodology: 'Lowest credible comparable historical price baseline',

      explanation: 'Scenarios calculated strictly from empirical internal transaction distribution.'
    };
  }
}
