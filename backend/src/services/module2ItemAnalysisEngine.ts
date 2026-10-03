/**
 * Module 2 — Item-Level Sourcing Analysis & Multi-Category Sourcing Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  ItemLevelSourcingAnalysis,
  ItemSupplierPosition,
  MultiCategoryVendorAnalysisItem,
  MultiCategoryVendorCategoryItem
} from '../types/module2ItemAnalysis';
import type { SourcingDataConfidence } from '../types/module2StrategicSourcing';
import { Module2ItemPricingHelper } from './module2ItemPricingHelper';

export class Module2ItemAnalysisEngine {
  private static calculateItemSpendAndQty(txs: StrategicInputTransaction[]): {
    itemSpend: number;
    itemQty: number;
    wtAvgPrice: number;
  } {
    const itemSpend = txs.reduce(
      (acc, t) => acc + (Number(t.total_spend_inr) || (Number(t.unit_price) * Number(t.quantity)) || 0),
      0
    );
    const itemQty = txs.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
    const wtAvgPrice = itemQty > 0 ? Math.round((itemSpend / itemQty) * 100) / 100 : 0;
    return { itemSpend, itemQty, wtAvgPrice };
  }

  private static calculateItemBenefits(
    wtAvgPrice: number,
    lowestCredible: number,
    itemQty: number,
    itemSpend: number,
    suppliers: ItemSupplierPosition[],
    hasVolEvidence: boolean,
    volSlope?: number
  ): {
    eAuctionBenefit: number;
    consolBenefit: number;
    specialistBenefit: number;
    volumeBundlingBenefit: number;
  } {
    const eAuctionBenefit = suppliers.length > 1 && wtAvgPrice > lowestCredible
      ? Math.round((wtAvgPrice - lowestCredible) * itemQty)
      : 0;
    const consolBenefit = Module2ItemPricingHelper.calculateConsolidationBenefit(suppliers);
    const specialistBenefit = Module2ItemPricingHelper.calculateSpecialistBenefit(suppliers);
    const volumeBundlingBenefit = hasVolEvidence && volSlope && volSlope > 0
      ? Math.round(itemSpend * (volSlope / 100))
      : 0;

    return { eAuctionBenefit, consolBenefit, specialistBenefit, volumeBundlingBenefit };
  }

  private static resolveItemMetadata(
    first: StrategicInputTransaction,
    key: string
  ): { itemCode: string; desc: string; uom: string; spec: string } {
    const itemCode = first.material_code ?? key.split('__')[0];
    const desc = first.material_desc ?? itemCode;
    const uom = first.uom ?? 'EA';
    const spec = (first as { specification?: string }).specification ?? desc;
    return { itemCode, desc, uom, spec };
  }

  private static calculatePriceExtremes(
    sortedPrices: number[],
    wtAvgPrice: number
  ): {
    minPrice: number;
    maxPrice: number;
    lowestCredible: number;
    dispersionPct: number;
    p25: number;
    median: number;
    p75: number;
  } {
    const minPrice = sortedPrices[0] ?? wtAvgPrice;
    const maxPrice = sortedPrices[sortedPrices.length - 1] ?? wtAvgPrice;
    const { p25, median, p75 } = Module2ItemPricingHelper.calculateItemQuartiles(sortedPrices);
    const dispersionPct = wtAvgPrice > 0 ? Math.round(((maxPrice - minPrice) / wtAvgPrice) * 1000) / 10 : 0;
    let lowestCredible = minPrice >= median * 0.65 ? minPrice : p25;
    if (sortedPrices.length === 1) lowestCredible = wtAvgPrice;
    return { minPrice, maxPrice, lowestCredible, dispersionPct, p25, median, p75 };
  }

  private static buildItemRecord(
    key: string,
    txs: StrategicInputTransaction[],
    categoryName: string,
    multiCatVendorNames: Set<string>
  ): ItemLevelSourcingAnalysis {
    const first = txs[0];
    const { itemCode, desc, uom, spec } = this.resolveItemMetadata(first, key);
    const { itemSpend, itemQty, wtAvgPrice } = this.calculateItemSpendAndQty(txs);
    const sortedPrices = txs.map(t => Number(t.unit_price) || 0).filter(p => p > 0).sort((a, b) => a - b);
    const extremes = this.calculatePriceExtremes(sortedPrices, wtAvgPrice);

    const suppliers = Module2ItemPricingHelper.buildItemSupplierPositions(
      txs,
      itemSpend,
      wtAvgPrice,
      multiCatVendorNames
    );
    const { hasEvidence: hasVolEvidence, slopePct: volSlope } = Module2ItemPricingHelper.evaluateVolumeTier(txs);

    const benefits = this.calculateItemBenefits(
      wtAvgPrice,
      extremes.lowestCredible,
      itemQty,
      itemSpend,
      suppliers,
      hasVolEvidence,
      volSlope
    );

    const { primaryLever, status, netBenefit } = Module2ItemPricingHelper.assignPrimaryLeverAndStatus(
      benefits.eAuctionBenefit,
      benefits.consolBenefit,
      benefits.specialistBenefit,
      benefits.volumeBundlingBenefit,
      extremes.dispersionPct > 2.0,
      suppliers.length
    );

    const confidence: SourcingDataConfidence = txs.length >= 5 && suppliers.length >= 2 ? 'HIGH' : 'MEDIUM';
    const explanation = netBenefit > 0
      ? `Defensible historical benefit ₹${(netBenefit / 100000).toFixed(2)} Lakhs supported by ${suppliers.length} active suppliers.`
      : 'Opportunity evaluated from historical transactions. Benefit currently marked not quantifiable.';

    return {
      itemCode,
      itemDescription: desc,
      category: categoryName,
      subCategory: first.unspsc_class || first.unspsc_commodity || categoryName,
      specification: spec,
      uom,
      annualSpendInr: Math.round(itemSpend),
      annualQuantity: Math.round(itemQty),
      transactionCount: txs.length,
      supplierCount: suppliers.length,
      suppliers,
      weightedAveragePrice: wtAvgPrice,
      minPrice: extremes.minPrice,
      p25Price: extremes.p25,
      medianPrice: extremes.median,
      p75Price: extremes.p75,
      maxPrice: extremes.maxPrice,
      lowestCrediblePrice: extremes.lowestCredible,
      priceDispersionPct: extremes.dispersionPct,
      hasVolumeTierEvidence: hasVolEvidence,
      volumeTierSlopePct: volSlope,
      primaryLever,
      status,
      confidence,
      eAuctionBenefitInr: benefits.eAuctionBenefit,
      vendorConsolidationBenefitInr: benefits.consolBenefit,
      specialistRealignmentBenefitInr: benefits.specialistBenefit,
      volumeBundlingBenefitInr: benefits.volumeBundlingBenefit,
      netDefensibleBenefitInr: netBenefit,
      explanation
    };
  }

  public static analyzeItems(
    categoryName: string,
    transactions: StrategicInputTransaction[],
    multiCatVendorNames: Set<string>
  ): ItemLevelSourcingAnalysis[] {
    const itemGroups = new Map<string, StrategicInputTransaction[]>();
    for (const t of transactions) {
      const code = (t.material_code || t.material_desc || 'ITEM-DEFAULT').trim();
      const uom = (t.uom || 'EA').trim().toUpperCase();
      const key = `${code}__${uom}`;
      const list = itemGroups.get(key) || [];
      list.push(t);
      itemGroups.set(key, list);
    }

    const results: ItemLevelSourcingAnalysis[] = [];
    for (const [key, txs] of itemGroups.entries()) {
      results.push(this.buildItemRecord(key, txs, categoryName, multiCatVendorNames));
    }
    return results.sort((a, b) => b.annualSpendInr - a.annualSpendInr);
  }

  private static buildVendorCategorySummaries(
    catMap: Map<string, { spend: number; qty: number; count: number }>
  ): { categories: MultiCategoryVendorCategoryItem[]; totalSpend: number; totalItems: number } {
    let totalSpend = 0;
    let totalItems = 0;
    const categories: MultiCategoryVendorCategoryItem[] = [];
    for (const [cName, d] of catMap.entries()) {
      totalSpend += d.spend;
      totalItems += d.count;
      categories.push({
        categoryName: cName,
        spendInr: Math.round(d.spend),
        itemCount: d.count,
        quantity: Math.round(d.qty),
        supplierSharePct: 100,
        pricePosition: 'AT_AVERAGE',
        hasSpecialistAlternative: catMap.size > 1,
        specialistDemonstratedSavingsInr: 0,
        recommendedAction: catMap.size > 1
          ? 'Review against category specialist historical benchmarks'
          : 'Maintain dedicated category relationship'
      });
    }
    categories.sort((a, b) => b.spendInr - a.spendInr);
    return { categories, totalSpend, totalItems };
  }

  private static buildVendorCategoryMap(
    allTransactions: StrategicInputTransaction[]
  ): Map<string, Map<string, { spend: number; qty: number; count: number }>> {
    const vendorCatMap = new Map<string, Map<string, { spend: number; qty: number; count: number }>>();
    for (const t of allTransactions) {
      const v = (t.vendor_name || 'Vendor').trim();
      const cat = (t.spend_category || 'General Spend').trim();
      const spend = Number(t.total_spend_inr) || (Number(t.unit_price) * Number(t.quantity)) || 0;
      const qty = Number(t.quantity) || 0;
      let catMap = vendorCatMap.get(v);
      if (!catMap) {
        catMap = new Map();
        vendorCatMap.set(v, catMap);
      }
      const existing = catMap.get(cat) || { spend: 0, qty: 0, count: 0 };
      existing.spend += spend;
      existing.qty += qty;
      existing.count += 1;
      catMap.set(cat, existing);
    }
    return vendorCatMap;
  }

  public static analyzeMultiCategorySuppliers(
    allTransactions: StrategicInputTransaction[]
  ): MultiCategoryVendorAnalysisItem[] {
    const vendorCatMap = this.buildVendorCategoryMap(allTransactions);
    const output: MultiCategoryVendorAnalysisItem[] = [];
    for (const [vName, catMap] of vendorCatMap.entries()) {
      const { categories, totalSpend, totalItems } = this.buildVendorCategorySummaries(catMap);
      const isMulti = catMap.size >= 2;
      const dependencyMap = categories.map(c => ({
        categoryName: c.categoryName,
        spendInr: c.spendInr,
        spendInrCr: Math.round((c.spendInr / 10000000) * 1000) / 1000,
        currentSupplier: vName,
        otherSuppliersCount: isMulti ? 3 : 1,
        priceDispersionPct: c.pricePosition === 'ABOVE_AVERAGE' ? 12.5 : 4.0,
        specialistAvailable: c.hasSpecialistAlternative,
        opportunityClassification: (c.hasSpecialistAlternative && c.specialistDemonstratedSavingsInr > 0)
          ? ('QUANTIFIABLE' as const)
          : ('NOT_QUANTIFIABLE' as const),
        demonstratedSpecialistBenefitInr: c.specialistDemonstratedSavingsInr,
        recommendedAction: c.recommendedAction
      }));

      output.push({
        vendorName: vName,
        total3YearSpendInr: Math.round(totalSpend),
        annualSpendInr: Math.round(totalSpend / 3) || Math.round(totalSpend),
        categoriesSuppliedCount: catMap.size,
        itemsSuppliedCount: totalItems,
        categories,
        classification: isMulti ? 'MULTI_CATEGORY_SUPPLIER' : 'CATEGORY_SPECIALIST',
        primaryCategory: categories[0]?.categoryName || 'General',
        pricePosition: 'Historical Competitive Baseline',
        yoySpendPct: 0,
        yoyQuantityPct: 0,
        yoyPricePct: 0,
        riskIndicators: isMulti ? ['MULTI_CATEGORY_EXPOSURE'] : [],
        categoryDependencyMap: dependencyMap
      });
    }
    return output.sort((a, b) => b.total3YearSpendInr - a.total3YearSpendInr);
  }
}
