/**
 * Module 2 Independent Financial Recalculation Engine
 * Pure independent mathematical implementation outside the primary UI calculation path.
 * Version: MODULE_2_FINANCIAL_SANITY_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { CategoryIndependentAuditResult } from '../types/module2FinancialSanity';
import { Module2ComparabilityEngine } from './module2ComparabilityEngine';
import { Module2PriceEngine } from './module2PriceEngine';
import { Module2SupplierStructureBuilder } from './module2SupplierStructureBuilder';
import { Module2RecurrenceEngine } from './module2RecurrenceEngine';
import { Module2ItemAnalysisEngine } from './module2ItemAnalysisEngine';
import { Module2OpportunityCalculator } from './module2OpportunityCalculator';

export class Module2FinancialIndependentCalculator {
  private static readonly TO_CR = 10000000;

  private static toCr(num: number): number {
    return Math.round((num / this.TO_CR) * 1000) / 1000;
  }

  public static calculateCategory(
    category: string,
    txs: StrategicInputTransaction[]
  ): CategoryIndependentAuditResult {
    const totalSpendInr = txs.reduce((acc, t) => acc + (Number(t.total_spend_inr) || 0), 0);
    const comp = Module2ComparabilityEngine.evaluateComparability(txs);
    const dispersion = Module2PriceEngine.calculatePriceDispersion(comp.comparableTransactions);
    const credibleRef = Module2PriceEngine.determineCredibleReferencePrice(comp.comparableTransactions, dispersion);
    const suppliers = Module2SupplierStructureBuilder.buildSupplierStructure(
      txs,
      totalSpendInr,
      txs.length,
      dispersion
    );
    const recurrence = Module2RecurrenceEngine.calculateRecurrence(txs, totalSpendInr);

    const items = Module2ItemAnalysisEngine.analyzeItems(category, txs, new Set());
    const volBundlingInr = items.reduce((s, it) => s + (it.volumeBundlingBenefitInr || 0), 0);
    const specialistInr = items.reduce((s, it) => s + (it.specialistRealignmentBenefitInr || 0), 0);

    const eauction = Module2OpportunityCalculator.calculateEAuctionBenefit(
      recurrence.isRecurring,
      suppliers.length,
      comp.comparableSpendInr,
      comp.comparableQuantity,
      dispersion,
      credibleRef
    );
    const consol = Module2OpportunityCalculator.calculateConsolidationBenefit(
      recurrence.isRecurring,
      suppliers,
      comp.comparableQuantity,
      dispersion,
      txs.length,
      recurrence.activeMonthsCount
    );

    const eauctionInr = eauction.opportunityInr || 0;
    const consolInr = consol.opportunityInr || 0;
    const grossOpportunityInr = eauctionInr + consolInr + volBundlingInr + specialistInr;
    const netOpportunityInr = Math.max(eauctionInr, consolInr, volBundlingInr, specialistInr);
    const overlapInr = Math.max(0, grossOpportunityInr - netOpportunityInr);

    const hasPriceDiff = (dispersion?.weightedAveragePrice || 0) > (credibleRef?.referencePrice || 0);
    const isProven = netOpportunityInr > 0 && hasPriceDiff && comp.comparableTransactions.length >= 2;
    const provenOpportunityInr = isProven ? netOpportunityInr : 0;

    const rangeMinInr = Math.round(provenOpportunityInr * 0.1);
    const rangeMaxInr = Math.round(provenOpportunityInr * 0.25);

    return {
      category,
      totalSpendInr: Math.round(totalSpendInr),
      totalSpendCr: this.toCr(totalSpendInr),
      eligibleSpendInr: Math.round(comp.comparableSpendInr),
      eligibleSpendCr: this.toCr(comp.comparableSpendInr),
      eauctionInr,
      consolidationInr: consolInr,
      volumeBundlingInr: volBundlingInr,
      specialistInr,
      grossOpportunityInr,
      grossOpportunityCr: this.toCr(grossOpportunityInr),
      overlapInr,
      overlapCr: this.toCr(overlapInr),
      netOpportunityInr,
      netOpportunityCr: this.toCr(netOpportunityInr),
      provenOpportunityInr,
      provenOpportunityCr: this.toCr(provenOpportunityInr),
      rangeMinInr,
      rangeMinCr: this.toCr(rangeMinInr),
      rangeMaxInr,
      rangeMaxCr: this.toCr(rangeMaxInr),
      evidenceState: isProven ? 'PROVEN_OPPORTUNITY' : 'LOW_EVIDENCED_OPPORTUNITY'
    };
  }

  public static runIndependentRecalculation(
    transactions: StrategicInputTransaction[]
  ): CategoryIndependentAuditResult[] {
    const groups = new Map<string, StrategicInputTransaction[]>();
    for (const t of transactions) {
      const cat = (t.spend_category || t.unspsc_commodity || t.material_desc || 'Uncategorized').trim();
      const arr = groups.get(cat) || [];
      arr.push(t);
      groups.set(cat, arr);
    }

    const results: CategoryIndependentAuditResult[] = [];
    for (const [cat, txs] of groups.entries()) {
      results.push(this.calculateCategory(cat, txs));
    }

    return results;
  }
}
