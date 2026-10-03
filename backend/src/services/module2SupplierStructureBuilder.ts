/**
 * Module 2 — Supplier Structure & Concentration Builder
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  CategorySupplierStructureItem,
  PriceDispersionMetrics
} from '../types/module2StrategicSourcing';
import { FRAGMENTATION_THRESHOLDS } from '../constants/module2StrategicSourcing';

export class Module2SupplierStructureBuilder {
  private static determineSupplierPricePosition(
    dispersion: PriceDispersionMetrics | null,
    weightedPrice: number
  ): 'BELOW_AVERAGE' | 'AT_AVERAGE' | 'ABOVE_AVERAGE' | 'NON_COMPARABLE' {
    if (!dispersion || weightedPrice <= 0) return 'NON_COMPARABLE';
    if (weightedPrice < dispersion.weightedAveragePrice * 0.98) return 'BELOW_AVERAGE';
    if (weightedPrice > dispersion.weightedAveragePrice * 1.02) return 'ABOVE_AVERAGE';
    return 'AT_AVERAGE';
  }

  private static aggregateSupplierSpend(
    transactions: StrategicInputTransaction[]
  ): Map<string, { spend: number; qty: number; count: number; prices: number[] }> {
    const suppMap = new Map<string, { spend: number; qty: number; count: number; prices: number[] }>();
    for (const tx of transactions) {
      const v = (tx.vendor_name || 'UNKNOWN').trim();
      const curr = suppMap.get(v) || { spend: 0, qty: 0, count: 0, prices: [] };
      const s = Number(tx.total_spend_inr) || (Number(tx.unit_price) * Number(tx.quantity));
      const q = Number(tx.quantity) || 0;
      curr.spend += s;
      curr.qty += q;
      curr.count += 1;
      if (Number(tx.unit_price) > 0) curr.prices.push(Number(tx.unit_price));
      suppMap.set(v, curr);
    }
    return suppMap;
  }

  public static buildSupplierStructure(
    transactions: StrategicInputTransaction[],
    totalSpendInr: number,
    totalTxCount: number,
    dispersion: PriceDispersionMetrics | null
  ): CategorySupplierStructureItem[] {
    const suppMap = this.aggregateSupplierSpend(transactions);
    const suppliers: CategorySupplierStructureItem[] = [];
    let rank = 1;
    const sortedVendors = Array.from(suppMap.entries()).sort((a, b) => b[1].spend - a[1].spend);
    for (const [vName, vData] of sortedVendors) {
      const spendShare = totalSpendInr > 0 ? (vData.spend / totalSpendInr) * 100 : 0;
      const weightedPrice = vData.qty > 0 ? vData.spend / vData.qty : 0;
      const minP = vData.prices.length > 0 ? Math.min(...vData.prices) : 0;
      const maxP = vData.prices.length > 0 ? Math.max(...vData.prices) : 0;
      const isTail = spendShare < FRAGMENTATION_THRESHOLDS.TAIL_SUPPLIER_THRESHOLD_SHARE * 100;
      const pricePos = this.determineSupplierPricePosition(dispersion, weightedPrice);

      suppliers.push({
        supplierId: `SUPP-${vName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)}`,
        supplierName: vName,
        totalSpendInr: Math.round(vData.spend),
        totalSpendInrCr: Math.round((vData.spend / 10000000) * 1000) / 1000,
        spendSharePct: Math.round(spendShare * 10) / 10,
        transactionCount: vData.count,
        transactionSharePct: Math.round((vData.count / totalTxCount) * 1000) / 10,
        totalQuantity: vData.qty,
        weightedAveragePrice: Math.round(weightedPrice * 100) / 100,
        minPrice: minP,
        maxPrice: maxP,
        rank,
        isTopSupplier: rank === 1,
        isTailSupplier: isTail,
        pricePositionVsComparable: pricePos,
        potentialConsolidationRelevance: isTail
          ? 'Tail supplier candidate for volume consolidation into core agreements.'
          : rank === 1
          ? 'Primary strategic supplier.'
          : 'Core qualified vendor.'
      });
      rank++;
    }
    return suppliers;
  }
}
