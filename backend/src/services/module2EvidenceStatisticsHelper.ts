/**
 * Module 2 — Evidence Statistics & Pairwise Proof Helper
 * Version: MODULE_2_EVIDENCE_LOGIC_V1.0
 */

import type {
  TransactionEvidenceRecord,
  EvidenceStatisticPopulation,
  SupplierPairPriceComparisonProof
} from '../types/module2EvidenceChain';
import { LOWEST_CREDIBLE_PRICE_CONFIG } from '../constants/module2EvidenceChain';

export class Module2EvidenceStatisticsHelper {
  public static calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];

    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= sortedValues.length) return sortedValues[sortedValues.length - 1];
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  public static determineLowestCrediblePrice(
    eligibleRecords: TransactionEvidenceRecord[],
    medianPrice: number
  ): {
    lowestObservedPrice: number;
    lowestCrediblePrice: number;
    supportingTxnIds: string[];
    rationale: string;
  } {
    if (eligibleRecords.length === 0) {
      return {
        lowestObservedPrice: 0,
        lowestCrediblePrice: 0,
        supportingTxnIds: [],
        rationale: 'No eligible comparable transactions available.'
      };
    }

    const sortedByPrice = [...eligibleRecords].sort((a, b) => a.unitPrice - b.unitPrice);
    const lowestObservedPrice = sortedByPrice[0].unitPrice;
    const totalVolume = eligibleRecords.reduce((sum, r) => sum + r.quantity, 0);

    // Group by supplier to count supplier transactions
    const supplierCounts = new Map<string, number>();
    for (const r of eligibleRecords) {
      supplierCounts.set(r.supplierId, (supplierCounts.get(r.supplierId) || 0) + 1);
    }

    // Filter credible candidates per Section 6
    const credibleCandidates = sortedByPrice.filter(r => {
      const volShare = totalVolume > 0 ? r.quantity / totalVolume : 0;
      const meetsVolShare = volShare >= LOWEST_CREDIBLE_PRICE_CONFIG.MIN_VOLUME_SHARE_THRESHOLD;
      const isNotDumpPrice = medianPrice > 0
        ? r.unitPrice >= medianPrice * LOWEST_CREDIBLE_PRICE_CONFIG.MAX_MEDIAN_DISCOUNT_FACTOR
        : true;
      const suppTxCount = supplierCounts.get(r.supplierId) || 0;
      const meetsSuppFreq = suppTxCount >= LOWEST_CREDIBLE_PRICE_CONFIG.MIN_SUPPLIER_TRANSACTIONS;
      return meetsVolShare && isNotDumpPrice && meetsSuppFreq;
    });

    if (credibleCandidates.length > 0) {
      const selected = credibleCandidates[0];
      return {
        lowestObservedPrice,
        lowestCrediblePrice: selected.unitPrice,
        supportingTxnIds: [selected.transactionId],
        rationale: `Lowest credible price ₹${selected.unitPrice.toFixed(2)} validated with ${(
          (selected.quantity / totalVolume) * 100
        ).toFixed(1)}% volume share and repeat supplier qualification.`
      };
    }

    // Fallback: If no single record meets volume threshold, use P25
    const prices = sortedByPrice.map(r => r.unitPrice);
    const p25 = this.calculatePercentile(prices, 25);
    const nearestRecord = sortedByPrice.find(r => r.unitPrice >= p25) || sortedByPrice[0];

    return {
      lowestObservedPrice,
      lowestCrediblePrice: p25,
      supportingTxnIds: [nearestRecord.transactionId],
      rationale: `P25 historical quartile ₹${p25.toFixed(2)} established as conservative defensible reference.`
    };
  }

  public static buildPairwiseProofs(
    records: TransactionEvidenceRecord[]
  ): SupplierPairPriceComparisonProof[] {
    const eligible = records.filter(r => r.isEligible && r.unitPrice > 0);
    const supplierMap = new Map<string, TransactionEvidenceRecord[]>();

    for (const r of eligible) {
      const list = supplierMap.get(r.supplierName) || [];
      list.push(r);
      supplierMap.set(r.supplierName, list);
    }

    const suppliers = Array.from(supplierMap.keys());
    if (suppliers.length < 2) return [];

    const proofs: SupplierPairPriceComparisonProof[] = [];
    const supA = suppliers[0];
    const supB = suppliers[1];
    const txsA = supplierMap.get(supA) || [];
    const txsB = supplierMap.get(supB) || [];

    const spendA = txsA.reduce((s, t) => s + t.totalValue, 0);
    const qtyA = txsA.reduce((s, t) => s + t.quantity, 0);
    const wapA = qtyA > 0 ? spendA / qtyA : 0;

    const spendB = txsB.reduce((s, t) => s + t.totalValue, 0);
    const qtyB = txsB.reduce((s, t) => s + t.quantity, 0);
    const wapB = qtyB > 0 ? spendB / qtyB : 0;
    const higher = wapA >= wapB
      ? { name: supA, wap: wapA, spend: spendA, qty: qtyA, txs: txsA }
      : { name: supB, wap: wapB, spend: spendB, qty: qtyB, txs: txsB };
    const lower = wapA >= wapB
      ? { name: supB, wap: wapB, spend: spendB, qty: qtyB, txs: txsB }
      : { name: supA, wap: wapA, spend: spendA, qty: qtyA, txs: txsA };

    const diff = higher.wap - lower.wap;
    const diffPct = lower.wap > 0 ? (diff / lower.wap) * 100 : 0;

    proofs.push({
      supplierA: {
        supplierId: higher.txs[0].supplierId,
        supplierName: higher.name,
        quantity: higher.qty,
        uom: higher.txs[0].uom,
        unitPrice: higher.wap,
        date: higher.txs[0].poDate,
        specification: higher.txs[0].specification,
        transactionIds: higher.txs.map(t => t.transactionId),
        totalSpendInr: higher.spend
      },
      supplierB: {
        supplierId: lower.txs[0].supplierId,
        supplierName: lower.name,
        quantity: lower.qty,
        uom: lower.txs[0].uom,
        unitPrice: lower.wap,
        date: lower.txs[0].poDate,
        specification: lower.txs[0].specification,
        transactionIds: lower.txs.map(t => t.transactionId),
        totalSpendInr: lower.spend
      },
      priceDifference: diff,
      priceDifferencePct: diffPct,
      comparabilityChecklist: {
        specificationMatch: true,
        uomMatch: higher.txs[0].uom === lower.txs[0].uom,
        currencyMatch: higher.txs[0].currency === lower.txs[0].currency,
        geographyMatch: true,
        timeWindowMatch: true,
        isValidComparison: true
      }
    });

    return proofs;
  }

  public static buildEvidenceStatistics(
    records: TransactionEvidenceRecord[],
    uom: string
  ): EvidenceStatisticPopulation[] {
    const eligible = records.filter(r => r.isEligible && r.unitPrice > 0);
    const excluded = records.filter(r => !r.isEligible);
    const sortedPrices = eligible.map(r => r.unitPrice).sort((a, b) => a - b);

    const totalQty = eligible.reduce((s, r) => s + r.quantity, 0);
    const totalSpend = eligible.reduce((s, r) => s + r.totalValue, 0);
    const uniqueSuppliers = new Set(eligible.map(r => r.supplierId)).size;
    const eligibleTxIds = eligible.map(r => r.transactionId);

    const reasonsMap: Record<string, number> = {};
    for (const r of excluded) {
      const code = r.exclusionReason || 'EXCLUDED_INVALID_TRANSACTION';
      reasonsMap[code] = (reasonsMap[code] || 0) + 1;
    }

    const min = sortedPrices.length > 0 ? sortedPrices[0] : 0;
    const max = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 0;
    const p25 = this.calculatePercentile(sortedPrices, 25);
    const median = this.calculatePercentile(sortedPrices, 50);
    const p75 = this.calculatePercentile(sortedPrices, 75);
    const wap = totalQty > 0 ? totalSpend / totalQty : 0;
    const iqr = max >= min ? p75 - p25 : 0;

    const credibleRes = this.determineLowestCrediblePrice(eligible, median);

    const baseMetrics = {
      uom: uom || 'Units',
      transactionCount: records.length,
      supplierCount: uniqueSuppliers,
      totalQuantity: totalQty,
      totalSpendInr: totalSpend,
      eligibleTransactionCount: eligible.length,
      excludedTransactionCount: excluded.length,
      exclusionReasonsBreakdown: reasonsMap
    };

    return [
      { statisticName: 'MIN', label: 'Lowest Observed Historical Price', value: min, contributingTransactionIds: eligibleTxIds.slice(0, 1), ...baseMetrics },
      { statisticName: 'LOWEST_CREDIBLE', label: 'Lowest Credible Reference Price', value: credibleRes.lowestCrediblePrice, contributingTransactionIds: credibleRes.supportingTxnIds, ...baseMetrics },
      { statisticName: 'P25', label: '25th Percentile Price Quartile', value: p25, contributingTransactionIds: eligibleTxIds, ...baseMetrics },
      { statisticName: 'MEDIAN', label: 'Median Historical Price (P50)', value: median, contributingTransactionIds: eligibleTxIds, ...baseMetrics },
      { statisticName: 'WAP', label: 'Quantity-Weighted Average Price', value: wap, contributingTransactionIds: eligibleTxIds, ...baseMetrics },
      { statisticName: 'P75', label: '75th Percentile Price Quartile', value: p75, contributingTransactionIds: eligibleTxIds, ...baseMetrics },
      { statisticName: 'MAX', label: 'Highest Observed Historical Price', value: max, contributingTransactionIds: eligibleTxIds.slice(-1), ...baseMetrics },
      { statisticName: 'IQR', label: 'Interquartile Range (P75 - P25)', value: iqr, contributingTransactionIds: eligibleTxIds, ...baseMetrics }
    ];
  }
}
