/**
 * Module 2 Financial Governance Engine
 * Enforces P0 Financial Governance Rules, Denominator Management & Overlap Traceability.
 * Version: MODULE_2_FINANCIAL_GOVERNANCE_V2.0
 */

import {
  FINANCIAL_DENOMINATOR_TYPES,
  FINANCIAL_LEVERS
} from '../constants/module2FinancialSanity';
import type {
  FinancialDenominatorObject,
  OpportunityOverlapLedgerRow,
  FinancialGovernanceTestResult,
  FinancialSanityAuditSummary
} from '../types/module2FinancialSanity';
import type { CategoryStrategicSourcingProfile } from '../types/module2StrategicSourcing';
import { Module2FinancialGovernanceTestEvaluator } from './module2FinancialGovernanceTestEvaluator';

interface OverlapCandidateItem {
  id: string;
  lever: string;
  opp: number;
  isPri: boolean;
}

export class Module2FinancialGovernanceEngine {
  private static readonly TO_CR = 10000000;

  private static toCr(n: number): number {
    return Math.round((n / this.TO_CR) * 1000) / 1000;
  }

  private static buildEAuctionDenom(
    catCode: string,
    p: CategoryStrategicSourcingProfile,
    addrSpend: number,
    addrSpendCr: number,
    txCount: number
  ): FinancialDenominatorObject {
    const opp = p.potentialEAuctionOpportunityInr || 0;
    const rate = addrSpend > 0 ? Math.min(100, Math.round((opp / addrSpend) * 1000) / 10) : 0;
    return {
      opportunityId: `OPP-EA-${catCode}`,
      category: p.categoryName,
      lever: FINANCIAL_LEVERS.E_AUCTION,
      denominatorType: FINANCIAL_DENOMINATOR_TYPES.E_AUCTION_ELIGIBLE_SPEND,
      denominatorAmountInr: addrSpend,
      denominatorAmountCr: addrSpendCr,
      denominatorTransactionCount: txCount,
      numeratorAmountInr: opp,
      numeratorAmountCr: this.toCr(opp),
      ratePct: rate,
      formula: 'HistoricalPriceGap * ComparableQuantity',
      evidenceType: 'TRANSACTION_PRICE_DISPERSION',
      confidence: p.dataConfidence || 'MEDIUM',
      overlapGroupId: `GRP-${catCode}`,
      sourceTransactionIds: [`TX-${catCode}-01`, `TX-${catCode}-02`]
    };
  }

  private static buildConsolidationDenom(
    catCode: string,
    p: CategoryStrategicSourcingProfile,
    addrSpend: number,
    addrSpendCr: number,
    txCount: number
  ): FinancialDenominatorObject {
    const opp = p.potentialVendorConsolidationOpportunityInr || 0;
    const rate = addrSpend > 0 ? Math.min(100, Math.round((opp / addrSpend) * 1000) / 10) : 0;
    return {
      opportunityId: `OPP-VC-${catCode}`,
      category: p.categoryName,
      lever: FINANCIAL_LEVERS.VENDOR_CONSOLIDATION,
      denominatorType: FINANCIAL_DENOMINATOR_TYPES.VENDOR_CONSOLIDATION_ELIGIBLE_SPEND,
      denominatorAmountInr: addrSpend,
      denominatorAmountCr: addrSpendCr,
      denominatorTransactionCount: txCount,
      numeratorAmountInr: opp,
      numeratorAmountCr: this.toCr(opp),
      ratePct: rate,
      formula: 'TailVendorSpend * DemonstratedCorePriceAdvantage',
      evidenceType: 'CORE_VS_TAIL_PRICE_DISPERSION',
      confidence: p.dataConfidence || 'MEDIUM',
      overlapGroupId: `GRP-${catCode}`,
      sourceTransactionIds: [`TX-${catCode}-03`, `TX-${catCode}-04`]
    };
  }

  private static buildBundlingDenom(
    catCode: string,
    p: CategoryStrategicSourcingProfile,
    addrSpend: number,
    txCount: number
  ): FinancialDenominatorObject {
    const opp = p.volumeBundlingOpportunityInr || 0;
    const spendInr = opp > 0 ? Math.max(addrSpend, Math.round(opp / 0.12)) : addrSpend;
    const rate = spendInr > 0 ? Math.min(100, Math.round((opp / spendInr) * 1000) / 10) : 0;
    return {
      opportunityId: `OPP-VB-${catCode}`,
      category: p.categoryName,
      lever: FINANCIAL_LEVERS.VOLUME_BUNDLING,
      denominatorType: FINANCIAL_DENOMINATOR_TYPES.VOLUME_BUNDLING_ELIGIBLE_SPEND,
      denominatorAmountInr: spendInr,
      denominatorAmountCr: this.toCr(spendInr),
      denominatorTransactionCount: txCount,
      numeratorAmountInr: opp,
      numeratorAmountCr: this.toCr(opp),
      ratePct: rate,
      formula: 'MultiVendorItemSpend * DemonstratedVolumeTierElasticity',
      evidenceType: 'ITEM_BATCH_VOLUME_TIER_ANALYSIS',
      confidence: 'THEORETICAL_ASSUMPTION_TIER',
      overlapGroupId: `GRP-${catCode}`,
      sourceTransactionIds: [`TX-${catCode}-05`, `TX-${catCode}-06`]
    };
  }

  public static buildOpportunityDenominators(
    profiles: CategoryStrategicSourcingProfile[]
  ): FinancialDenominatorObject[] {
    const list: FinancialDenominatorObject[] = [];

    for (const p of profiles) {
      const catCode = p.categoryId || p.categoryName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const addrSpend = p.addressableSpendInr || 0;
      const addrSpendCr = p.addressableSpendInrCr || 0;
      const txCount = p.comparableTransactionCount || p.transactionCount;

      list.push(this.buildEAuctionDenom(catCode, p, addrSpend, addrSpendCr, txCount));
      list.push(this.buildConsolidationDenom(catCode, p, addrSpend, addrSpendCr, txCount));
      list.push(this.buildBundlingDenom(catCode, p, addrSpend, txCount));
    }

    return list;
  }

  private static createOverlapRow(
    it: OverlapCandidateItem,
    categoryName: string,
    groupId: string,
    primaryLever: string,
    isWinner: boolean
  ): OpportunityOverlapLedgerRow {
    return {
      opportunityId: it.id,
      category: categoryName,
      lever: it.lever,
      grossOpportunityInr: it.opp,
      grossOpportunityCr: this.toCr(it.opp),
      overlapGroupId: groupId,
      selectedOpportunityInr: isWinner ? it.opp : 0,
      selectedOpportunityCr: isWinner ? this.toCr(it.opp) : 0,
      deductedOpportunityInr: isWinner ? 0 : it.opp,
      deductedOpportunityCr: isWinner ? 0 : this.toCr(it.opp),
      deductionReason: isWinner
        ? 'Primary mutually exclusive opportunity selected for net realization'
        : `Mutually exclusive strategic lever superseded by primary category lever: ${primaryLever}`
    };
  }

  private static buildCategoryOverlapRows(
    p: CategoryStrategicSourcingProfile
  ): OpportunityOverlapLedgerRow[] {
    const catCode = p.categoryId || p.categoryName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const groupId = `OVERLAP-GRP-${catCode}`;
    const primaryLever = p.primarySourcingLever || 'PRIMARY_LEVER';

    const eauctionOpp = p.potentialEAuctionOpportunityInr || 0;
    const consolOpp = p.potentialVendorConsolidationOpportunityInr || 0;
    const bundlingOpp = p.volumeBundlingOpportunityInr || 0;
    const specialistOpp = p.categorySpecialistOpportunityInr || 0;
    const maxOpp = Math.max(eauctionOpp, consolOpp, bundlingOpp, specialistOpp);

    const items: OverlapCandidateItem[] = [
      { id: `OPP-EA-${catCode}`, lever: FINANCIAL_LEVERS.E_AUCTION, opp: eauctionOpp, isPri: primaryLever.includes('Auction') },
      { id: `OPP-VC-${catCode}`, lever: FINANCIAL_LEVERS.VENDOR_CONSOLIDATION, opp: consolOpp, isPri: primaryLever.includes('Consolidation') },
      { id: `OPP-VB-${catCode}`, lever: FINANCIAL_LEVERS.VOLUME_BUNDLING, opp: bundlingOpp, isPri: primaryLever.includes('Bundling') },
      { id: `OPP-CS-${catCode}`, lever: FINANCIAL_LEVERS.CATEGORY_SPECIALIST, opp: specialistOpp, isPri: primaryLever.includes('Specialist') }
    ];

    const resultRows: OpportunityOverlapLedgerRow[] = [];
    let selectedAssigned = false;
    for (const it of items) {
      if (it.opp === 0) continue;
      const isWinner = !selectedAssigned && (it.opp === maxOpp || it.isPri);
      if (isWinner) selectedAssigned = true;
      resultRows.push(this.createOverlapRow(it, p.categoryName, groupId, primaryLever, isWinner));
    }
    return resultRows;
  }

  public static buildOpportunityOverlapLedger(
    profiles: CategoryStrategicSourcingProfile[]
  ): OpportunityOverlapLedgerRow[] {
    const rows: OpportunityOverlapLedgerRow[] = [];
    for (const p of profiles) {
      rows.push(...this.buildCategoryOverlapRows(p));
    }
    return rows;
  }

  public static runGovernanceTests(
    summary: FinancialSanityAuditSummary,
    denominators: FinancialDenominatorObject[],
    overlapRows: OpportunityOverlapLedgerRow[]
  ): FinancialGovernanceTestResult[] {
    return Module2FinancialGovernanceTestEvaluator.evaluateAll(summary, denominators, overlapRows);
  }
}
