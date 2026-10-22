/**
 * Module 2 — Lever 1: Direct Price Improvement Calculation Engine
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import { buildTransactionSignature, buildComparabilityKey } from './module2AttributionHelpers';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  DirectPriceImprovementResult,
  DirectPriceItemOpportunity,
  DirectPriceFySummary,
  DirectPriceQueryOptions
} from '../types/module2DirectPriceImprovement';
import { DIRECT_PRICE_CONFIG } from '../constants/module2DirectPriceImprovement';
import {
  parseIndianFinancialYear,
  classifyItemQualification,
  buildSupplierComparisons,
  buildPlantComparisons,
  computeGroupTotals,
  mapDirectPriceTransactionRecords
} from './module2DirectPriceImprovementHelpers';
import { Module2CategoryAggregationHelper } from './module2CategoryAggregationHelper';

interface InternalGroup {
  fy: string;
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  uom: string;
  currency: string;
  txs: StrategicInputTransaction[];
}

function isTxInvalid(t: StrategicInputTransaction, isDuplicate: boolean): boolean {
  const spend = t.total_spend_inr || 0;
  const qty = t.quantity || 0;
  const price = t.unit_price || 0;
  const mat = (t.material_code || '').trim();
  return isDuplicate || qty <= 0 || spend <= 0 || price <= 0 || !mat || mat === 'UNKNOWN_MAT';
}

function filterEligibleTransactions(
  transactions: StrategicInputTransaction[]
): { eligible: StrategicInputTransaction[]; ineligibleCount: number; ineligibleSpend: number } {
  const seenSignatures = new Set<string>();
  const eligible: StrategicInputTransaction[] = [];
  let ineligibleCount = 0;
  let ineligibleSpend = 0;

  for (const t of transactions) {
    const sig = buildTransactionSignature(t);
    const isDuplicate = seenSignatures.has(sig);
    seenSignatures.add(sig);

    const spend = t.total_spend_inr || 0;
    if (isTxInvalid(t, isDuplicate)) {
      ineligibleCount++;
      ineligibleSpend += spend;
    } else {
      eligible.push(t);
    }
  }
  return { eligible, ineligibleCount, ineligibleSpend };
}

function groupTransactionsByFyAndItem(
  transactions: StrategicInputTransaction[]
): Map<string, InternalGroup> {
  const map = new Map<string, InternalGroup>();

  for (const t of transactions) {
    const fy = parseIndianFinancialYear(t.po_date);
    const compKey = buildComparabilityKey(t.material_code, t.uom, t.currency);
    const groupKey = `${fy}::${compKey}`;

    let g = map.get(groupKey);
    if (!g) {
      g = {
        fy,
        materialCode: (t.material_code || '').trim(),
        materialDesc: (t.material_desc || '').trim(),
        spendCategory: (t.spend_category || 'General').trim(),
        uom: (t.uom || 'UNKNOWN').trim().toUpperCase(),
        currency: (t.currency || 'INR').trim().toUpperCase(),
        txs: []
      };
      map.set(groupKey, g);
    }
    g.txs.push(t);
  }

  return map;
}

function buildItemOpportunity(groupKey: string, g: InternalGroup): DirectPriceItemOpportunity {
  const prices = g.txs.map((t) => t.unit_price || 0);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const distinctPrices = new Set(prices).size;

  const { suppliersSet, plantsSet, totalQty, actualCost } = computeGroupTotals(g.txs);
  const benchmarkCost = totalQty * lowestPrice;
  const lostOpportunity = Math.max(0, actualCost - benchmarkCost);
  const weightedPrice = totalQty > 0 ? actualCost / totalQty : lowestPrice;
  const dispersionPct = lowestPrice > 0 ? ((highestPrice - lowestPrice) / lowestPrice) * 100 : 0;
  const benchmarkTx = g.txs.find((t) => (t.unit_price || 0) === lowestPrice) || g.txs[0];
  const qualification = classifyItemQualification(
    g.materialDesc, g.spendCategory, g.uom, lowestPrice, highestPrice, suppliersSet.size, distinctPrices
  );
  const txRecords = mapDirectPriceTransactionRecords(g.txs, g.fy, lowestPrice, qualification);

  return {
    itemKey: groupKey,
    materialCode: g.materialCode,
    materialDesc: g.materialDesc,
    spendCategory: g.spendCategory,
    uom: g.uom,
    currency: g.currency,
    financialYear: g.fy,
    transactionCount: g.txs.length,
    totalEligibleQuantity: Math.round(totalQty * 1000) / 1000,
    lowestUnitPrice: Math.round(lowestPrice * 100) / 100,
    weightedAveragePrice: Math.round(weightedPrice * 100) / 100,
    highestUnitPrice: Math.round(highestPrice * 100) / 100,
    actualPurchaseCostInr: Math.round(actualCost * 100) / 100,
    actualPurchaseCostCr: Number((actualCost / 10000000).toFixed(4)),
    benchmarkCostInr: Math.round(benchmarkCost * 100) / 100,
    benchmarkCostCr: Number((benchmarkCost / 10000000).toFixed(4)),
    historicalLostOpportunityInr: Math.round(lostOpportunity * 100) / 100,
    historicalLostOpportunityCr: Number((lostOpportunity / 10000000).toFixed(4)),
    priceDispersionPct: Math.round(dispersionPct * 10) / 10,
    benchmarkSupplierName: benchmarkTx.vendor_name || 'N/A',
    benchmarkSupplierCode: benchmarkTx.vendor_code || 'N/A',
    benchmarkPoNumber: benchmarkTx.po_number || 'N/A',
    benchmarkPoDate: benchmarkTx.po_date || 'N/A',
    benchmarkPlantCode: benchmarkTx.plant || 'N/A',
    supplierCount: suppliersSet.size,
    plantCount: plantsSet.size,
    qualificationStatus: qualification.status,
    warnings: qualification.warnings,
    suppliers: buildSupplierComparisons(g.txs, lowestPrice),
    plants: buildPlantComparisons(g.txs, lowestPrice),
    transactions: txRecords
  };
}

export class Module2DirectPriceImprovementEngine {
  public static calculateSync(
    assessmentId: string,
    options?: DirectPriceQueryOptions
  ): DirectPriceImprovementResult {
    const canonical = Module2CanonicalService.getCanonicalInput(assessmentId);
    const { eligible, ineligibleCount, ineligibleSpend } = filterEligibleTransactions(canonical.transactions);
    const groupsMap = groupTransactionsByFyAndItem(eligible);

    const allItems: DirectPriceItemOpportunity[] = [];
    const fyMap = new Map<string, {
      count: number;
      qty: number;
      actual: number;
      bench: number;
      opp: number;
      itemsCount: number;
      itemsWithOpp: number;
    }>();

    for (const [key, g] of groupsMap.entries()) {
      const item = buildItemOpportunity(key, g);
      allItems.push(item);

      let fyEntry = fyMap.get(g.fy);
      if (!fyEntry) {
        fyEntry = { count: 0, qty: 0, actual: 0, bench: 0, opp: 0, itemsCount: 0, itemsWithOpp: 0 };
        fyMap.set(g.fy, fyEntry);
      }
      fyEntry.count += item.transactionCount;
      fyEntry.qty += item.totalEligibleQuantity;
      fyEntry.actual += item.actualPurchaseCostInr;
      fyEntry.bench += item.benchmarkCostInr;
      fyEntry.opp += item.historicalLostOpportunityInr;
      fyEntry.itemsCount++;
      if (item.historicalLostOpportunityInr > 0.01) fyEntry.itemsWithOpp++;
    }

    const availableFys = Array.from(fyMap.keys()).sort();
    const selectedFy = options?.financialYear || DIRECT_PRICE_CONFIG.ALL_FINANCIAL_YEARS;

    const filteredItems = allItems.filter((item) => {
      if (selectedFy !== DIRECT_PRICE_CONFIG.ALL_FINANCIAL_YEARS && item.financialYear !== selectedFy) {
        return false;
      }
      if (options?.materialCode && !item.materialCode.toLowerCase().includes(options.materialCode.toLowerCase())) {
        return false;
      }
      if (options?.category && !item.spendCategory.toLowerCase().includes(options.category.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => b.historicalLostOpportunityInr - a.historicalLostOpportunityInr);

    const fySummaries: DirectPriceFySummary[] = Array.from(fyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fy, e]) => ({
        financialYear: fy,
        transactionCount: e.count,
        totalQuantity: Math.round(e.qty * 1000) / 1000,
        actualSpendInr: Math.round(e.actual * 100) / 100,
        actualSpendCr: Number((e.actual / 10000000).toFixed(4)),
        benchmarkCostInr: Math.round(e.bench * 100) / 100,
        benchmarkCostCr: Number((e.bench / 10000000).toFixed(4)),
        historicalLostOpportunityInr: Math.round(e.opp * 100) / 100,
        historicalLostOpportunityCr: Number((e.opp / 10000000).toFixed(4)),
        itemsEvaluatedCount: e.itemsCount,
        itemsWithOpportunityCount: e.itemsWithOpp
      }));
    const totalEligibleSpend = eligible.reduce((sum, t) => sum + (t.total_spend_inr || 0), 0);
    const summaryActual = filteredItems.reduce((sum, i) => sum + i.actualPurchaseCostInr, 0);
    const summaryBench = filteredItems.reduce((sum, i) => sum + i.benchmarkCostInr, 0);
    const summaryLostOpp = filteredItems.reduce((sum, i) => sum + i.historicalLostOpportunityInr, 0);
    const itemsWithOpp = filteredItems.filter((i) => i.historicalLostOpportunityInr > 0.01).length;
    const disqualified = filteredItems.filter((i) => i.qualificationStatus !== 'QUALIFIED').length;
    const categorySummaries = Module2CategoryAggregationHelper.buildCategorySummaries(filteredItems);
    const categoriesRequiringReview = categorySummaries.filter(
      (c) => c.dataQualityStatus !== 'Qualified'
    ).length;
    logger.info('Module2DirectPriceImprovementEngine completed calculation', {
      assessmentId,
      selectedFy,
      itemCount: filteredItems.length,
      categoryCount: categorySummaries.length,
      historicalLostOppCr: Number((summaryLostOpp / 10000000).toFixed(4))
    });
    return {
      assessmentId,
      customerName: assessmentId === 'AIC-2026-0002' ? 'ABC Textile Ltd' : 'PQR Cement Ltd',
      availableFinancialYears: [DIRECT_PRICE_CONFIG.ALL_FINANCIAL_YEARS, ...availableFys],
      selectedFinancialYear: selectedFy,
      totalEligibleTransactions: eligible.length,
      totalIneligibleTransactions: ineligibleCount,
      totalEligibleSpendInr: Math.round(totalEligibleSpend * 100) / 100,
      totalEligibleSpendCr: Number((totalEligibleSpend / 10000000).toFixed(4)),
      totalIneligibleSpendInr: Math.round(ineligibleSpend * 100) / 100,
      totalIneligibleSpendCr: Number((ineligibleSpend / 10000000).toFixed(4)),
      actualSpendInr: Math.round(summaryActual * 100) / 100,
      actualSpendCr: Number((summaryActual / 10000000).toFixed(4)),
      benchmarkCostInr: Math.round(summaryBench * 100) / 100,
      benchmarkCostCr: Number((summaryBench / 10000000).toFixed(4)),
      historicalLostOpportunityInr: Math.round(summaryLostOpp * 100) / 100,
      historicalLostOpportunityCr: Number((summaryLostOpp / 10000000).toFixed(4)),
      commerciallyValidatedSavingsInr: 0,
      commerciallyValidatedSavingsCr: 0,
      itemsEvaluatedCount: filteredItems.length,
      itemsWithOpportunityCount: itemsWithOpp,
      disqualifiedItemsCount: disqualified,
      categoriesAnalysedCount: categorySummaries.length,
      categoriesRequiringReviewCount: categoriesRequiringReview,
      certificationNotice: DIRECT_PRICE_CONFIG.CERTIFICATION_NOTICE,
      fySummaries,
      categorySummaries,
      items: filteredItems
    };
  }

  public static async calculate(
    assessmentId: string,
    options?: DirectPriceQueryOptions
  ): Promise<DirectPriceImprovementResult> {
    return this.calculateSync(assessmentId, options);
  }
}
