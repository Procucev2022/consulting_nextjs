/**
 * Module 2 — Sourcing Data Confidence Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Evaluates empirical evidence strength: HIGH | MEDIUM | LOW | INSUFFICIENT
 */

import type { SourcingDataConfidence } from '../types/module2StrategicSourcing';

export interface ConfidenceEvaluation {
  confidence: SourcingDataConfidence;
  confidenceScore: number; // 0 to 100
  rationale: string;
  contributingFactors: {
    transactionDepthScore: number;
    supplierDiversityScore: number;
    comparabilityScore: number;
    priceDispersionScore: number;
  };
}

export class Module2ConfidenceEngine {
  private static calculateTxScore(comparableTxCount: number, activeMonthsCount: number): number {
    let txScore = Math.min(30, comparableTxCount * 3);
    if (activeMonthsCount >= 6) txScore = Math.min(30, txScore + 5);
    return txScore;
  }

  private static calculateSupplierScore(supplierCount: number): number {
    if (supplierCount >= 5) return 30;
    if (supplierCount >= 3) return 22;
    if (supplierCount === 2) return 15;
    return 5;
  }

  private static calculateDispersionScore(priceDispersionPct: number): number {
    if (priceDispersionPct >= 3.0 && priceDispersionPct <= 40.0) return 15;
    if (priceDispersionPct > 0.5) return 10;
    return 5;
  }

  private static determineConfidenceTier(
    totalScore: number,
    supplierCount: number,
    comparableTxCount: number,
    priceDispersionPct: number
  ): { confidence: SourcingDataConfidence; rationale: string } {
    if (comparableTxCount < 2 || supplierCount <= 1) {
      return {
        confidence: 'INSUFFICIENT',
        rationale: 'Insufficient comparable transaction history or single-source dependency precludes defensible statistical qualification.'
      };
    }
    if (totalScore >= 75 && comparableTxCount >= 5) {
      return {
        confidence: 'HIGH',
        rationale: `Strong empirical baseline: ${comparableTxCount} comparable transactions across ${supplierCount} active suppliers with ${priceDispersionPct.toFixed(1)}% price dispersion.`
      };
    }
    if (totalScore >= 50 && comparableTxCount >= 3) {
      return {
        confidence: 'MEDIUM',
        rationale: `Moderate empirical baseline: ${comparableTxCount} comparable transactions with reasonable price distribution.`
      };
    }
    return {
      confidence: 'LOW',
      rationale: 'Limited transaction depth or supplier diversity.'
    };
  }

  public static evaluateConfidence(params: {
    comparableTxCount: number;
    totalTxCount: number;
    supplierCount: number;
    activeMonthsCount: number;
    priceDispersionPct: number;
    hasOutliers: boolean;
  }): ConfidenceEvaluation {
    const { comparableTxCount, totalTxCount, supplierCount, activeMonthsCount, priceDispersionPct } = params;

    const txScore = this.calculateTxScore(comparableTxCount, activeMonthsCount);
    const supScore = this.calculateSupplierScore(supplierCount);
    const compRatio = totalTxCount > 0 ? comparableTxCount / totalTxCount : 0;
    const compScore = Math.round(compRatio * 25);
    const dispScore = this.calculateDispersionScore(priceDispersionPct);

    const totalScore = txScore + supScore + compScore + dispScore;
    const { confidence, rationale } = this.determineConfidenceTier(
      totalScore,
      supplierCount,
      comparableTxCount,
      priceDispersionPct
    );

    return {
      confidence,
      confidenceScore: totalScore,
      rationale,
      contributingFactors: {
        transactionDepthScore: txScore,
        supplierDiversityScore: supScore,
        comparabilityScore: compScore,
        priceDispersionScore: dispScore
      }
    };
  }
}
