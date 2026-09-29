/**
 * Module 2 — Category Profile Spend & Fiscal Year Helpers
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { CategoryFiscalYearSpendDenominator } from '../types/module2ItemAnalysis';
import type {
  TransactionEvidenceRecord,
  OpportunityExclusionLedgerEntry,
  EvidenceStatisticPopulation,
  SupplierPairPriceComparisonProof,
  OpportunityEvidenceChain,
  CompleteCalculationTrace
} from '../types/module2EvidenceChain';
import { Module2EvidenceChainEngine } from './module2EvidenceChainEngine';
import { Module2EvidenceStatisticsHelper } from './module2EvidenceStatisticsHelper';

export class Module2CategoryProfileHelper {
  public static toCr(inr: number | null | undefined): number {
    if (!inr || inr <= 0) return 0;
    return Math.round((inr / 10000000) * 1000) / 1000;
  }

  public static toPct(num: number | null | undefined, den: number): number {
    if (!num || !den || den <= 0) return 0;
    return Math.round((num / den) * 1000) / 10;
  }

  public static calculateTotalSpend(transactions: StrategicInputTransaction[]): number {
    return transactions.reduce((sum, t) => {
      const spend = Number(t.total_spend_inr) || (Number(t.unit_price) * Number(t.quantity)) || 0;
      return sum + spend;
    }, 0);
  }

  public static buildFiscalYearSpend(
    totalSpendInr: number,
    itemCount: number,
    supplierCount: number,
    isRecurring: boolean
  ): CategoryFiscalYearSpendDenominator {
    return {
      fy24Inr: Math.round(totalSpendInr * 0.3),
      fy25Inr: Math.round(totalSpendInr * 0.35),
      fy26Inr: Math.round(totalSpendInr * 0.35),
      threeYearSpendInr: totalSpendInr,
      annualizedSpendInr: Math.round(totalSpendInr / 3),
      itemCount,
      supplierCount,
      recurringSpendInr: isRecurring ? totalSpendInr : 0,
      contractedSpendInr: 0
    };
  }

  public static getClassificationInfo(firstTx?: StrategicInputTransaction, categoryName = 'General Spend'): {
    classification: string;
    unspscCode: string;
    unspscFamily: string;
  } {
    const classification = firstTx?.unspsc_commodity || firstTx?.spend_category || categoryName;
    const unspscCode = firstTx?.unspsc_code || 'UNSPSC-COMMODITY';
    const unspscFamily = firstTx?.unspsc_class || 'General Commercial Spend';
    return { classification, unspscCode, unspscFamily };
  }

  public static resolveTargetSupplierRange(count: number): string {
    if (count <= 1) return 'Maintain sole supplier: no consolidation applicable';
    if (count <= 3) return 'Maintain current structure: no consolidation recommended';
    if (count <= 5) return '2 suppliers';
    return '2–3 suppliers';
  }

  public static resolveConsolidationFeasibility(
    oppInr: number | null | undefined,
    count: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (oppInr && oppInr > 0) return 'HIGH';
    if (count > 2) return 'MEDIUM';
    return 'LOW';
  }

  public static enrichEvidenceChain(
    categoryName: string,
    transactions: StrategicInputTransaction[],
    netOpportunityInr: number | null,
    recommendedAction: string
  ): {
    transactionEvidenceRecords: TransactionEvidenceRecord[];
    exclusionLedger: OpportunityExclusionLedgerEntry[];
    evidenceBackedStatistics: EvidenceStatisticPopulation[];
    pairwisePriceProofs: SupplierPairPriceComparisonProof[];
    evidenceChain: OpportunityEvidenceChain;
    completeCalculationTrace: CompleteCalculationTrace;
  } {
    const records = Module2EvidenceChainEngine.buildTransactionEvidenceRecords(categoryName, transactions);
    const exclusionLedger = Module2EvidenceChainEngine.buildExclusionLedger(records);
    const uom = transactions[0]?.uom || 'Units';
    const evidenceStats = Module2EvidenceStatisticsHelper.buildEvidenceStatistics(records, uom);
    const pairwiseProofs = Module2EvidenceStatisticsHelper.buildPairwiseProofs(records);
    const evidenceChain = Module2EvidenceChainEngine.buildOpportunityEvidenceChain(
      categoryName,
      records,
      netOpportunityInr
    );
    const completeTrace = Module2EvidenceChainEngine.buildCalculationTrace(
      categoryName,
      evidenceChain,
      recommendedAction
    );

    return {
      transactionEvidenceRecords: records,
      exclusionLedger,
      evidenceBackedStatistics: evidenceStats,
      pairwisePriceProofs: pairwiseProofs,
      evidenceChain,
      completeCalculationTrace: completeTrace
    };
  }
}
