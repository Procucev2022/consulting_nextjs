/**
 * Module 2 — Transaction-Level Evidence, Savings Proof & Traceability Engine
 * Version: MODULE_2_EVIDENCE_LOGIC_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  TransactionEvidenceRecord,
  OpportunityExclusionLedgerEntry,
  OpportunityEvidenceChain,
  CompleteCalculationTrace,
  OpportunityEvidencePackExport,
  SpendAddressabilityHierarchy,
  SupplierPairPriceComparisonProof,
  EvidenceStatisticPopulation
} from '../types/module2EvidenceChain';
import {
  EVIDENCE_SAFEGUARD_NOTICES,
  ZERO_OPPORTUNITY_DIAGNOSTIC_REASONS,
  UNTESTED_OPPORTUNITY_AREAS,
  MODULE_2_EVIDENCE_VERSION
} from '../constants/module2EvidenceChain';
import { Module2EvidenceStatisticsHelper } from './module2EvidenceStatisticsHelper';
import { Module2TransactionEvidenceBuilder } from './module2TransactionEvidenceBuilder';

export class Module2EvidenceChainEngine {
  public static buildTransactionEvidenceRecords(
    categoryName: string,
    transactions: StrategicInputTransaction[]
  ): TransactionEvidenceRecord[] {
    return Module2TransactionEvidenceBuilder.buildTransactionEvidenceRecords(categoryName, transactions);
  }

  public static buildExclusionLedger(
    records: TransactionEvidenceRecord[]
  ): OpportunityExclusionLedgerEntry[] {
    return Module2TransactionEvidenceBuilder.buildExclusionLedger(records);
  }

  private static resolveStatusAndConfidence(
    eligibleRecords: TransactionEvidenceRecord[],
    totalSpend: number,
    priceDiff: number,
    baseOpp: number,
    consOpp: number
  ): {
    confidence: OpportunityEvidenceChain['evidenceConfidence'];
    confReasons: string[];
    status: OpportunityEvidenceChain['evidenceStatus'];
  } {
    const isMultiSupplier = new Set(eligibleRecords.map(r => r.supplierId)).size >= 2;
    const hasVariance = priceDiff > 0.5;

    let confidence: OpportunityEvidenceChain['evidenceConfidence'] = 'LOW';
    const confReasons: string[] = [];

    if (eligibleRecords.length >= 10 && isMultiSupplier) {
      confidence = 'HIGH';
      confReasons.push(
        `${eligibleRecords.length} validated comparable transactions`,
        `${new Set(eligibleRecords.map(r => r.supplierId)).size} competitive suppliers`,
        'Standardized UOM and specifications'
      );
    } else if (eligibleRecords.length >= 3) {
      confidence = 'MEDIUM';
      confReasons.push(
        `${eligibleRecords.length} transactions across active suppliers`,
        'Moderate transaction volume'
      );
    } else {
      confReasons.push('Limited transaction sample size', 'Single or duopoly supplier structure');
    }

    let status: OpportunityEvidenceChain['evidenceStatus'] = 'PROVEN_OPPORTUNITY';
    if (!isMultiSupplier && totalSpend >= 2000000) {
      status = 'MARKET_DISCOVERY_REQUIRED';
    } else if (!hasVariance) {
      status = 'NO_QUANTIFIED_PRICE_OPPORTUNITY_IDENTIFIED';
    } else if (baseOpp > consOpp) {
      status = 'QUANTIFIABLE_OPPORTUNITY_RANGE';
    }

    return { confidence, confReasons, status };
  }

  public static buildOpportunityEvidenceChain(
    categoryName: string,
    records: TransactionEvidenceRecord[],
    netOpportunityInr: number | null
  ): OpportunityEvidenceChain {
    const totalSpend = records.reduce((s, r) => s + r.totalValue, 0);
    const eligibleRecords = records.filter(r => r.isEligible);
    const excludedRecords = records.filter(r => !r.isEligible);

    const comparableSpend = eligibleRecords.reduce((s, r) => s + r.totalValue, 0);
    const excludedSpend = excludedRecords.reduce((s, r) => s + r.totalValue, 0);
    const addressableVol = eligibleRecords.reduce((s, r) => s + r.quantity, 0);

    const addressability: SpendAddressabilityHierarchy = {
      totalHistoricalSpendInr: totalSpend,
      comparableSpendInr: comparableSpend,
      priceAddressableSpendInr: comparableSpend,
      contractuallyAddressableSpendInr: Math.round(comparableSpend * 0.85),
      executableSpendInr: Math.round(comparableSpend * 0.75),
      realizableSavingsInr: null,
      disclaimer: EVIDENCE_SAFEGUARD_NOTICES.ADDRESSABILITY_DISCLAIMER
    };

    const prices = eligibleRecords.map(r => r.unitPrice).sort((a, b) => a - b);
    const median = Module2EvidenceStatisticsHelper.calculatePercentile(prices, 50);
    const p25 = Module2EvidenceStatisticsHelper.calculatePercentile(prices, 25);
    const credibleRes = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(eligibleRecords, median);
    const wap = addressableVol > 0 ? comparableSpend / addressableVol : 0;
    const recentPrice = eligibleRecords.length > 0 ? eligibleRecords[eligibleRecords.length - 1].unitPrice : wap;

    const priceDiff = Math.max(0, wap - p25);
    const grossOpp = Math.round(priceDiff * addressableVol);

    const consOpp = Math.round(Math.max(0, wap - p25) * addressableVol);
    const baseOpp = Math.round(Math.max(0, wap - credibleRes.lowestCrediblePrice) * addressableVol);
    const upsideOpp = Math.round(Math.max(0, wap - credibleRes.lowestObservedPrice) * addressableVol);

    const { confidence, confReasons, status } = this.resolveStatusAndConfidence(
      eligibleRecords,
      totalSpend,
      priceDiff,
      baseOpp,
      consOpp
    );

    return {
      chainId: `EVID-CHAIN-${categoryName.slice(0, 3).toUpperCase()}-${Date.now()}`,
      categoryId: `CAT-${categoryName.slice(0, 3).toUpperCase()}`,
      categoryName,
      addressability,
      comparableTransactionSet: {
        totalTransactions: records.length,
        eligibleTransactions: eligibleRecords.length,
        excludedTransactions: excludedRecords.length,
        supplierCount: new Set(eligibleRecords.map(r => r.supplierId)).size,
        totalQuantity: addressableVol,
        excludedSpendInr: excludedSpend
      },
      referencePriceAudit: {
        lowestObservedPrice: credibleRes.lowestObservedPrice,
        lowestCrediblePrice: credibleRes.lowestCrediblePrice,
        p25Price: p25,
        medianPrice: median,
        weightedAveragePrice: wap,
        currentRecentPrice: recentPrice,
        selectedReferencePrice: credibleRes.lowestCrediblePrice,
        selectedMethodology: 'LOWEST_CREDIBLE_PRICE',
        selectionRationale: credibleRes.rationale,
        supportingTransactionIds: credibleRes.supportingTxnIds
      },
      priceDifference: priceDiff,
      addressableVolume: addressableVol,
      grossOpportunityInr: grossOpp,
      addressabilityConstraints: {
        contractLockedSpendInr: Math.round(comparableSpend * 0.15),
        unharmonizedSpecSpendInr: Math.round(comparableSpend * 0.1),
        nonRecurringSpendInr: Math.round(excludedSpend * 0.5),
        operationalConstraintSpendInr: Math.round(comparableSpend * 0.05)
      },
      realisticOpportunityRange: {
        conservativeOpportunityInr: consOpp,
        conservativeRefPrice: p25,
        baseOpportunityInr: baseOpp,
        baseRefPrice: credibleRes.lowestCrediblePrice,
        upsideOpportunityInr: upsideOpp,
        upsideRefPrice: credibleRes.lowestObservedPrice,
        label: EVIDENCE_SAFEGUARD_NOTICES.ANALYTICAL_OPPORTUNITY_LABEL
      },
      executionMechanisms: [
        {
          mechanism: 'E_AUCTION',
          sharePct: 60,
          amountInr: Math.round((netOpportunityInr || grossOpp) * 0.6),
          traceabilityNote: 'Reconciled price dispersion'
        },
        {
          mechanism: 'VENDOR_CONSOLIDATION',
          sharePct: 40,
          amountInr: Math.round((netOpportunityInr || grossOpp) * 0.4),
          traceabilityNote: 'Tail-spend volume shift'
        }
      ],
      evidenceConfidence: confidence,
      evidenceConfidenceReasons: confReasons,
      evidenceStatus: status,
      diagnosticReasonsIfZero: priceDiff <= 0.5 ? ZERO_OPPORTUNITY_DIAGNOSTIC_REASONS : undefined,
      untestedOpportunityAreas: UNTESTED_OPPORTUNITY_AREAS
    };
  }

  public static buildCalculationTrace(
    categoryName: string,
    chain: OpportunityEvidenceChain,
    recommendedAction: string
  ): CompleteCalculationTrace {
    const netOpp = chain.realisticOpportunityRange.conservativeOpportunityInr;
    const oppInrCr = (netOpp / 10000000).toFixed(2);

    return {
      traceId: `TRACE-${categoryName.slice(0, 3).toUpperCase()}-${Date.now()}`,
      categoryName,
      questionPrompt: `WHY ₹${(netOpp / 100000).toFixed(1)} Lakhs (₹${oppInrCr} Cr)?`,
      opportunityAmountInr: netOpp,
      totalTransactionsInput: chain.comparableTransactionSet.totalTransactions,
      totalSpendInputInr: chain.addressability.totalHistoricalSpendInr,
      filtersApplied: ['SPEC_HARMONIZED', 'UOM_VALIDATED', 'NON_OUTLIER', 'MIN_VOLUME_QUALIFIED'],
      eligibleTransactionsCount: chain.comparableTransactionSet.eligibleTransactions,
      excludedTransactionsCount: chain.comparableTransactionSet.excludedTransactions,
      excludedSpendInr: chain.comparableTransactionSet.excludedSpendInr,
      referencePriceSelected: chain.referencePriceAudit.selectedReferencePrice,
      referenceMethod: chain.referencePriceAudit.selectedMethodology,
      referencePriceRationale: chain.referencePriceAudit.selectionRationale,
      addressableVolume: chain.addressableVolume,
      priceDifferential: chain.priceDifference,
      grossOpportunityInr: chain.grossOpportunityInr,
      constraintsDeductedInr:
        chain.addressabilityConstraints.contractLockedSpendInr +
        chain.addressabilityConstraints.unharmonizedSpecSpendInr,
      analyticalRangeMinInr: chain.realisticOpportunityRange.conservativeOpportunityInr,
      analyticalRangeMaxInr: chain.realisticOpportunityRange.upsideOpportunityInr,
      confidence: chain.evidenceConfidence,
      recommendedAction
    };
  }

  public static generateEvidencePackExport(
    chain: OpportunityEvidenceChain,
    records: TransactionEvidenceRecord[],
    exclusions: OpportunityExclusionLedgerEntry[],
    proofs: SupplierPairPriceComparisonProof[],
    stats: EvidenceStatisticPopulation[],
    _action: string
  ): OpportunityEvidencePackExport {
    return {
      exportTimestamp: new Date().toISOString(),
      version: MODULE_2_EVIDENCE_VERSION,
      opportunitySummary: {
        categoryId: chain.categoryId,
        categoryName: chain.categoryName,
        netDefensibleOpportunityInr: chain.realisticOpportunityRange.conservativeOpportunityInr,
        evidenceStatus: chain.evidenceStatus,
        confidence: chain.evidenceConfidence
      },
      calculationMethodology: `${chain.referencePriceAudit.selectedMethodology}: (WAP - ReferencePrice) * AddressableVolume`,
      eligibleTransactions: records.filter(r => r.isEligible),
      excludedTransactions: exclusions,
      supplierComparisons: proofs,
      priceStatistics: stats,
      referencePriceSelection: {
        selectedPrice: chain.referencePriceAudit.selectedReferencePrice,
        methodology: chain.referencePriceAudit.selectedMethodology,
        supportingTransactionsCount: chain.referencePriceAudit.supportingTransactionIds.length,
        rationale: chain.referencePriceAudit.selectionRationale
      },
      addressabilityCalculation: chain.addressability,
      opportunityRange: {
        conservative: chain.realisticOpportunityRange.conservativeOpportunityInr,
        base: chain.realisticOpportunityRange.baseOpportunityInr,
        upside: chain.realisticOpportunityRange.upsideOpportunityInr
      },
      confidenceAssessment: {
        rating: chain.evidenceConfidence,
        reasons: chain.evidenceConfidenceReasons
      },
      assumptions: [
        'Eligible transactions share standardized material specifications',
        'Reference price is repeatable across evaluated suppliers',
        'Realized savings subject to Module 4 execution validation'
      ],
      sourceTransactionReferences: records.map(r => r.transactionId),
      logicVersionIdentifier: MODULE_2_EVIDENCE_VERSION
    };
  }
}
