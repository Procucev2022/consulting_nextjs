/**
 * Module 2 — Item Pricing & Lever Computation Helpers
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { ItemSupplierPosition, PrimarySourcingLever } from '../types/module2ItemAnalysis';
import type { SourcingOpportunityStatus } from '../types/module2StrategicSourcing';

export class Module2ItemPricingHelper {
  public static calculateItemQuartiles(sortedPrices: number[]): { p25: number; median: number; p75: number } {
    if (sortedPrices.length === 0) return { p25: 0, median: 0, p75: 0 };
    const n = sortedPrices.length;
    const median = n % 2 !== 0 ? sortedPrices[Math.floor(n / 2)] : (sortedPrices[n / 2 - 1] + sortedPrices[n / 2]) / 2;
    const p25 = sortedPrices[Math.floor(n * 0.25)] ?? sortedPrices[0];
    const p75 = sortedPrices[Math.floor(n * 0.75)] ?? sortedPrices[n - 1];
    return { p25, median, p75 };
  }

  public static evaluateVolumeTier(txs: StrategicInputTransaction[]): { hasEvidence: boolean; slopePct?: number } {
    const validTxs = txs.filter(t => Number(t.quantity) > 0 && Number(t.unit_price) > 0);
    if (validTxs.length < 3) return { hasEvidence: false };
    const sortedByQty = [...validTxs].sort((a, b) => Number(a.quantity) - Number(b.quantity));
    const smallBatch = sortedByQty[0];
    const largeBatch = sortedByQty[sortedByQty.length - 1];
    if (Number(largeBatch.quantity) >= Number(smallBatch.quantity) * 2) {
      const priceDrop = Number(smallBatch.unit_price) - Number(largeBatch.unit_price);
      if (priceDrop > 0) {
        const slopePct = Math.round((priceDrop / Number(smallBatch.unit_price)) * 1000) / 10;
        return { hasEvidence: true, slopePct };
      }
    }
    return { hasEvidence: false };
  }

  public static calculateConsolidationBenefit(suppliers: ItemSupplierPosition[]): number {
    if (suppliers.length <= 1) return 0;
    const coreSupplier = suppliers[0];
    let benefit = 0;
    for (let i = 1; i < suppliers.length; i++) {
      const tail = suppliers[i];
      if (tail.weightedPrice > coreSupplier.weightedPrice) {
        benefit += Math.round((tail.weightedPrice - coreSupplier.weightedPrice) * tail.quantity);
      }
    }
    return benefit;
  }

  public static calculateSpecialistBenefit(suppliers: ItemSupplierPosition[]): number {
    const multiCatSuppliers = suppliers.filter(s => s.isMultiCategory);
    const specialistSuppliers = suppliers.filter(s => s.isSpecialist && s.weightedPrice > 0);
    if (multiCatSuppliers.length === 0 || specialistSuppliers.length === 0) return 0;

    const bestSpecPrice = Math.min(...specialistSuppliers.map(s => s.weightedPrice));
    let benefit = 0;
    for (const m of multiCatSuppliers) {
      if (m.weightedPrice > bestSpecPrice) {
        benefit += Math.round((m.weightedPrice - bestSpecPrice) * m.quantity);
      }
    }
    return benefit;
  }

  public static assignPrimaryLeverAndStatus(
    eauction: number,
    consol: number,
    specialist: number,
    volumeBundling: number,
    hasDispersion: boolean,
    supplierCount: number
  ): { primaryLever: PrimarySourcingLever; status: SourcingOpportunityStatus; netBenefit: number } {
    const maxBenefit = Math.max(eauction, consol, specialist, volumeBundling);
    if (maxBenefit > 0) {
      let primaryLever: PrimarySourcingLever = 'E_AUCTION';
      if (maxBenefit === specialist) primaryLever = 'CATEGORY_SPECIALIST_REALIGNMENT';
      else if (maxBenefit === consol) primaryLever = 'VENDOR_CONSOLIDATION';
      else if (maxBenefit === volumeBundling) primaryLever = 'VOLUME_BUNDLING';
      return { primaryLever, status: 'QUANTIFIABLE', netBenefit: maxBenefit };
    }
    if (supplierCount > 1 && !hasDispersion) {
      return {
        primaryLever: 'NO_QUANTIFIABLE_BENEFIT',
        status: 'IDENTIFIED_NOT_QUANTIFIABLE',
        netBenefit: 0
      };
    }
    return {
      primaryLever: supplierCount > 1 ? 'VENDOR_CONSOLIDATION' : 'NO_QUANTIFIABLE_BENEFIT',
      status: supplierCount > 1 ? 'IDENTIFIED_NOT_QUANTIFIABLE' : 'NOT_ELIGIBLE',
      netBenefit: 0
    };
  }

  private static determinePricePosition(
    sWtPrice: number,
    wtAvgPrice: number
  ): 'BELOW_AVERAGE' | 'AT_AVERAGE' | 'ABOVE_AVERAGE' {
    if (sWtPrice < wtAvgPrice * 0.98) return 'BELOW_AVERAGE';
    if (sWtPrice > wtAvgPrice * 1.02) return 'ABOVE_AVERAGE';
    return 'AT_AVERAGE';
  }

  private static aggregateSupplierMap(
    txs: StrategicInputTransaction[]
  ): Map<string, { spend: number; qty: number; id: string }> {
    const supplierMap = new Map<string, { spend: number; qty: number; id: string }>();
    for (const t of txs) {
      const sName = (t.vendor_name || 'Vendor').trim();
      const sId = (t.vendor_code || sName).trim();
      const sSpend = Number(t.total_spend_inr) || (Number(t.unit_price) * Number(t.quantity)) || 0;
      const sQty = Number(t.quantity) || 0;
      const cur = supplierMap.get(sName) || { spend: 0, qty: 0, id: sId };
      cur.spend += sSpend;
      cur.qty += sQty;
      supplierMap.set(sName, cur);
    }
    return supplierMap;
  }

  public static buildItemSupplierPositions(
    txs: StrategicInputTransaction[],
    itemSpend: number,
    wtAvgPrice: number,
    multiCatVendors: Set<string>
  ): ItemSupplierPosition[] {
    const supplierMap = this.aggregateSupplierMap(txs);
    const positions: ItemSupplierPosition[] = [];
    for (const [name, data] of supplierMap.entries()) {
      const sWtPrice = data.qty > 0 ? Math.round((data.spend / data.qty) * 100) / 100 : wtAvgPrice;
      const share = itemSpend > 0 ? Math.round((data.spend / itemSpend) * 1000) / 10 : 0;
      const isMulti = multiCatVendors.has(name);
      const pos = this.determinePricePosition(sWtPrice, wtAvgPrice);

      positions.push({
        supplierId: data.id,
        supplierName: name,
        spendInr: Math.round(data.spend),
        quantity: Math.round(data.qty),
        weightedPrice: sWtPrice,
        spendSharePct: share,
        isSpecialist: !isMulti,
        isMultiCategory: isMulti,
        historicalPricePosition: pos
      });
    }
    return positions.sort((a, b) => b.spendInr - a.spendInr);
  }
}
