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
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';
import { Module2OpportunityCalculator } from './module2OpportunityCalculator';
import type {
  PriceDispersionMetrics,
  CrediblePriceReferenceResult,
  CategorySupplierStructureItem,
  SourcingDataConfidence,
  ResolvedOpportunitiesResult
} from '../types/module2StrategicSourcing';

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
    const raw = firstTx?.spend_category || categoryName;
    const classification = resolveHumanReadableCategory(raw, firstTx?.material_code);
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

  public static isUnquantifiableCategory(categoryName: string, firstTx?: StrategicInputTransaction): boolean {
    const norm = categoryName.trim().toUpperCase();
    const spendCat = firstTx?.spend_category?.trim().toUpperCase();
    return norm === '11300' || norm === 'CAT-11300' || spendCat === '11300';
  }

  public static resolveOpportunities(params: {
    categoryName: string;
    transactions: StrategicInputTransaction[];
    isRecurring: boolean;
    suppliers: CategorySupplierStructureItem[];
    addressableSpendInr: number;
    addressableQuantity: number;
    dispersion: PriceDispersionMetrics | null;
    credibleRef: CrediblePriceReferenceResult;
    totalTxCount: number;
    activeMonthsCount: number;
    compTxCount: number;
    dataConfidence: SourcingDataConfidence;
    volumeBundlingOpp: number;
    specialistOpp: number;
  }): ResolvedOpportunitiesResult {
    if (this.isUnquantifiableCategory(params.categoryName, params.transactions[0])) {
      return {
        eauctionCalc: {
          suitability: 'NOT_SUITABLE' as const,
          rationale: 'Unqualified discovery opportunity — excluded from qualified ledger pending validation',
          opportunityInr: 0,
          opportunityPct: 0
        },
        consolCalc: {
          suitability: 'NOT_SUITABLE' as const,
          rationale: 'Marked INVALID_SPEND_BOUNDING: heterogeneous packaging materials compared under single group',
          opportunityInr: 0,
          opportunityPct: 0,
          evidencePath: 'PATH_D' as const,
          operational: {
            suppliersPotentiallyAffected: 0,
            poCountAffected: 0,
            transactionsAffected: 0,
            activeMonthsAffected: 0,
            smallOrderCount: 0,
            estimatedTouchpointReductionCount: 0,
            explanation: 'Unquantifiable category — operational consolidation indicators zeroed.'
          }
        },
        netCalc: {
          overlappingInr: 0,
          netInr: 0,
          status: 'IDENTIFIED_NOT_QUANTIFIABLE' as const,
          statusLabel: 'Opportunity Identified — Benefit Not Yet Quantifiable',
          isQuantifiable: false,
          displayText: 'Opportunity Identified — Benefit Not Yet Quantifiable',
          primaryLever: 'NO_QUANTIFIABLE_BENEFIT' as const
        },
        effectiveVolBundling: 0,
        effectiveSpecialist: 0
      };
    }

    const eauctionCalc = Module2OpportunityCalculator.calculateEAuctionBenefit(
      params.isRecurring,
      params.suppliers.length,
      params.addressableSpendInr,
      params.addressableQuantity,
      params.dispersion,
      params.credibleRef
    );

    const consolCalc = Module2OpportunityCalculator.calculateConsolidationBenefit(
      params.isRecurring,
      params.suppliers,
      params.addressableQuantity,
      params.dispersion,
      params.totalTxCount,
      params.activeMonthsCount
    );

    const netCalc = Module2OpportunityCalculator.calculateNetOpportunity(
      eauctionCalc.opportunityInr,
      consolCalc.opportunityInr,
      params.dataConfidence !== 'INSUFFICIENT',
      params.compTxCount,
      params.volumeBundlingOpp,
      params.specialistOpp
    );

    return {
      eauctionCalc,
      consolCalc,
      netCalc,
      effectiveVolBundling: params.volumeBundlingOpp,
      effectiveSpecialist: params.specialistOpp
    };
  }
}
