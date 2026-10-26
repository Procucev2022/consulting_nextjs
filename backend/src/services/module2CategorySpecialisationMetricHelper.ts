import type { StrategicInputTransaction } from '../types/strategicSourcing';
import {
  type CategoryMetrics,
  computeHerfindahlIndex,
  roundToTwoDecimals
} from './module2CategorySpecialisationCalculators';

interface RawCategoryAggregation {
  totalSpendInr: number;
  suppliersMap: Map<string, number>;
  materialsSet: Set<string>;
  plantsSet: Set<string>;
}

export class Module2CategorySpecialisationMetricHelper {
  public static calculatePriceVariation(txs: StrategicInputTransaction[]): number {
    const materialPrices = new Map<string, number[]>();
    for (const t of txs) {
      const mat = (t.material_desc || t.material_code || 'Unknown').trim();
      const price = t.unit_price;
      if (price > 0) {
        const list = materialPrices.get(mat) || [];
        list.push(price);
        materialPrices.set(mat, list);
      }
    }

    let totalWeight = 0;
    let weightedDispersion = 0;

    for (const [, prices] of materialPrices.entries()) {
      if (prices.length > 1) {
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        if (minP > 0 && maxP > minP) {
          const dispersion = (maxP - minP) / minP;
          weightedDispersion += dispersion * prices.length;
          totalWeight += prices.length;
        }
      }
    }

    if (totalWeight === 0) return 0;
    return roundToTwoDecimals(weightedDispersion / totalWeight);
  }

  private static aggregateTransactions(txs: StrategicInputTransaction[]): RawCategoryAggregation {
    let totalSpendInr = 0;
    const suppliersMap = new Map<string, number>();
    const materialsSet = new Set<string>();
    const plantsSet = new Set<string>();

    for (const t of txs) {
      const spend = t.total_spend_inr ?? 0;
      totalSpendInr += spend;

      const vendor = (t.vendor_name || t.vendor_code || 'UNKNOWN').trim();
      suppliersMap.set(vendor, (suppliersMap.get(vendor) || 0) + spend);

      const mat = (t.material_desc || t.material_code || '').trim();
      if (mat) {
        materialsSet.add(mat);
      }
      if (t.plant) {
        plantsSet.add(t.plant.trim());
      }
    }

    return { totalSpendInr, suppliersMap, materialsSet, plantsSet };
  }

  private static computeSupplierConcentration(
    suppliersMap: Map<string, number>,
    totalSpendInr: number
  ): { topSupplierSpendInr: number; topSupplierSharePct: number; herfindahlIndex: number } {
    let topSupplierSpendInr = 0;
    const spends: number[] = [];

    for (const sSpend of suppliersMap.values()) {
      spends.push(sSpend);
      if (sSpend > topSupplierSpendInr) {
        topSupplierSpendInr = sSpend;
      }
    }

    const topSupplierSharePct = totalSpendInr > 0
      ? roundToTwoDecimals((topSupplierSpendInr / totalSpendInr) * 100)
      : 0;

    const herfindahlIndex = computeHerfindahlIndex(spends, totalSpendInr);

    return {
      topSupplierSpendInr: roundToTwoDecimals(topSupplierSpendInr),
      topSupplierSharePct,
      herfindahlIndex
    };
  }

  public static buildMetricsForCategory(
    categoryName: string,
    txs: StrategicInputTransaction[]
  ): CategoryMetrics {
    const agg = this.aggregateTransactions(txs);
    const conc = this.computeSupplierConcentration(agg.suppliersMap, agg.totalSpendInr);
    const priceVariationCoefficient = this.calculatePriceVariation(txs);

    return {
      categoryName,
      totalSpendInr: roundToTwoDecimals(agg.totalSpendInr),
      transactionCount: txs.length,
      distinctSuppliersCount: agg.suppliersMap.size,
      distinctMaterialsCount: agg.materialsSet.size,
      distinctPlantsCount: Math.max(1, agg.plantsSet.size),
      topSupplierSpendInr: conc.topSupplierSpendInr,
      topSupplierSharePct: conc.topSupplierSharePct,
      herfindahlIndex: conc.herfindahlIndex,
      priceVariationCoefficient,
      contractCoveragePct: 0
    };
  }
}
