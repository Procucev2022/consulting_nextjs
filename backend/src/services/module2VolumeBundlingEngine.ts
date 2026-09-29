/**
 * Module 2 — Volume Bundling & Demand Pooling Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Direction B: Fragmented Tail -> Sourcing Lots.
 * Aggregates fragmented demand across small suppliers and quantifies opportunity
 * only where historical volume-tier pricing demonstrates achievable discount.
 */

import type { ItemLevelSourcingAnalysis } from '../types/module2ItemAnalysis';

export interface VolumeBundlingEvaluation {
  fragmentedVolumeTotal: number;
  fragmentedSpendInr: number;
  fragmentedSpendInrCr: number;
  smallSuppliersCount: number;
  currentWeightedPrice: number;
  historicalVolumeReferencePrice: number;
  priceDifferential: number;
  quantifiableBenefitInr: number;
  quantifiableBenefitInrCr: number;
  isQuantifiable: boolean;
  status: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE';
  explanation: string;
}

export class Module2VolumeBundlingEngine {
  private static toCr(inr: number): number {
    return Math.round((inr / 10000000) * 1000) / 1000;
  }

  private static accumulateItemVolume(
    item: ItemLevelSourcingAnalysis,
    smallSupplierSet: Set<string>
  ): { spend: number; qty: number; benefit: number } {
    if (!item.hasVolumeTierEvidence || !item.volumeTierSlopePct || item.volumeTierSlopePct <= 0) {
      return { spend: 0, qty: 0, benefit: 0 };
    }

    for (const s of item.suppliers) {
      if (s.spendSharePct < 20) {
        smallSupplierSet.add(s.supplierName);
      }
    }

    return {
      spend: item.annualSpendInr,
      qty: item.annualQuantity,
      benefit: item.volumeBundlingBenefitInr || 0
    };
  }

  public static evaluateCategoryVolumeBundling(
    items: ItemLevelSourcingAnalysis[]
  ): VolumeBundlingEvaluation {
    let totalSpend = 0;
    let totalQty = 0;
    let totalBenefit = 0;
    const smallSupplierSet = new Set<string>();

    for (const item of items) {
      const { spend, qty, benefit } = this.accumulateItemVolume(item, smallSupplierSet);
      totalSpend += spend;
      totalQty += qty;
      totalBenefit += benefit;
    }

    const currentWeightedPrice = totalQty > 0 ? Math.round((totalSpend / totalQty) * 100) / 100 : 0;
    const isQuantifiable = totalBenefit > 0;
    const targetPrice = currentWeightedPrice > 0 && totalQty > 0
      ? Math.max(0, currentWeightedPrice - (totalBenefit / totalQty))
      : currentWeightedPrice;

    const diff = Math.max(0, currentWeightedPrice - targetPrice);

    return {
      fragmentedVolumeTotal: totalQty,
      fragmentedSpendInr: totalSpend,
      fragmentedSpendInrCr: this.toCr(totalSpend),
      smallSuppliersCount: smallSupplierSet.size,
      currentWeightedPrice,
      historicalVolumeReferencePrice: Math.round(targetPrice * 100) / 100,
      priceDifferential: Math.round(diff * 100) / 100,
      quantifiableBenefitInr: totalBenefit,
      quantifiableBenefitInrCr: this.toCr(totalBenefit),
      isQuantifiable,
      status: isQuantifiable ? 'QUANTIFIABLE' : 'NOT_QUANTIFIABLE',
      explanation: isQuantifiable
        ? `Historical batch transactions demonstrate ${smallSupplierSet.size} fragmented suppliers can be pooled into higher volume tier with ₹${(totalBenefit / 100000).toFixed(2)} Lakhs benefit.`
        : 'Volume pooling identified across fragmented supply base — historical batch pricing evidence currently pending.'
    };
  }
}
