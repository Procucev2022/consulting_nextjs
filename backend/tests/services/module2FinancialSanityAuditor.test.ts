/**
 * Module 2 Financial Formula & Savings Sanity Certification Test Matrix
 * Verifies all 17 parts specified in P0 Prompt 344.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2FinancialSanityAuditor } from '../../src/services/module2FinancialSanityAuditor';
import { Module2FinancialIndependentCalculator } from '../../src/services/module2FinancialIndependentCalculator';
import { Module2FinancialSanityWorkbookBuilder } from '../../src/services/module2FinancialSanityWorkbookBuilder';
import { Module2FinancialSanityHelper } from '../../src/services/module2FinancialSanityHelper';

describe('Module 2 Financial Formula & Savings Sanity Certification Matrix', () => {
  beforeAll(() => {
    // Warm up canonical dataset cache
    Module2CanonicalService.getCanonicalInput();
    Module2CanonicalService.getSourcingAnalysis();
  }, 30000);

  // ==========================================
  // PART 1: ADDRESSABLE SPEND RECONCILIATION
  // ==========================================
  it('PART 1: Reconstructs Addressable Spend (₹443.621 Cr) from source transactions with ₹0 variance', () => {
    const rows = Module2FinancialSanityAuditor.auditAddressableSpend();
    expect(rows.length).toBe(57);

    const sumEligibleInr = rows.reduce((s, r) => s + r.eligibleSpendInr, 0);
    const sumEligibleCr = Math.round((sumEligibleInr / 10000000) * 1000) / 1000;
    expect(sumEligibleCr).toBe(443.621);

    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    const sumCr = Math.round((summary.totalAddressableSpendCr + summary.nonAddressableSpendCr) * 1000) / 1000;
    expect(Math.abs(summary.totalValidatedSpendCr - sumCr)).toBeLessThan(0.002);
    expect(summary.totalValidatedSpendCr).toBe(4073.8307);
  });

  // ==========================================
  // PART 2: GROSS OPPORTUNITY RECONSTRUCTION
  // ==========================================
  it('PART 2: Reconstructs Gross Opportunity (₹441.833 Cr) with ₹0 variance', () => {
    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    expect(sourcing.summary.grossQuantifiableBenefitInrCr).toBe(441.833);

    const rows = Module2FinancialSanityAuditor.auditOpportunityLedger();
    expect(rows.length).toBeGreaterThan(0);
    const sumGrossInr = rows.reduce((s, r) => s + r.grossOpportunityInr, 0);
    expect(Math.round((sumGrossInr / 10000000) * 1000) / 1000).toBe(441.833);
  });

  // ==========================================
  // PART 3: SAVINGS RATE SANITY CHECK
  // ==========================================
  it('PART 3: Performs Savings Rate Sanity Check and verifies zero categories >100%', () => {
    const rates = Module2FinancialSanityAuditor.auditSavingsRates();
    expect(rates.length).toBe(57);

    const over100 = rates.filter((r) => r.flagLevel === 'OVER_100');
    const over50 = rates.filter((r) => r.flagLevel === 'OVER_50');

    expect(over100.length).toBe(0);
    expect(over50.length).toBe(5);
    expect(rates.every((r) => r.impliedSavingsRateOnAddressablePct <= 100)).toBe(true);
    expect(rates.every((r) => r.impliedSavingsRateOnAddressablePct >= 0)).toBe(true);

    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    expect(summary.maxCustomerFacingSavingsRatePct).toBeLessThanOrEqual(100);
    expect(summary.zeroSavingsRateOver100Pct).toBe(true);
  });

  // ==========================================
  // PART 4: CRITICAL CHECK
  // ==========================================
  it('PART 4: Critical Check — proves why Gross Opportunity / Addressable Spend equals ~99.6%', () => {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    const ratio = (summary.grossQuantifiableBenefitInr / summary.totalAddressableSpendInr) * 100;
    expect(Math.round(ratio * 10) / 10).toBe(99.6);

    const bridge = Module2FinancialSanityAuditor.auditLeverBridge();
    const eauction = bridge.find((b) => b.leverName.includes('E-Auction'))!;
    const consol = bridge.find((b) => b.leverName.includes('Consolidation'))!;
    const bundling = bridge.find((b) => b.leverName.includes('Bundling'))!;

    expect(eauction.grossSavingsCr).toBe(77.366);
    expect(consol.grossSavingsCr).toBe(168.245);
    expect(bundling.grossSavingsCr).toBe(196.222);

    expect(summary.totalOverlappingOpportunityCr).toBe(104.067);
    expect(summary.netQuantifiableOpportunityCr).toBe(337.766);
  });

  // ==========================================
  // PART 5: LEVER-LEVEL BRIDGE
  // ==========================================
  it('PART 5: Reconstructs Lever-Level Bridge totaling ₹441.833 Cr gross and ₹337.766 Cr net', () => {
    const bridge = Module2FinancialSanityAuditor.auditLeverBridge();
    const totalGross = bridge.reduce((s, b) => s + b.grossSavingsCr, 0);
    expect(Math.round(totalGross * 1000) / 1000).toBe(441.833);

    const totalOverlapInr = bridge.reduce((s, b) => s + b.overlapInr, 0);
    expect(Math.round((totalOverlapInr / 10000000) * 1000) / 1000).toBe(104.067);

    const totalNetInr = bridge.reduce((s, b) => s + b.netSavingsInr, 0);
    expect(Math.round((totalNetInr / 10000000) * 1000) / 1000).toBe(337.766);
  });

  // ==========================================
  // PART 6: DOUBLE-COUNTING TEST
  // ==========================================
  it('PART 6: Validates Transaction-level Overlap and confirms zero double counting', () => {
    const txRows = Module2FinancialSanityAuditor.auditTransactionOverlap();
    expect(txRows.length).toBe(100);
    for (const row of txRows) {
      expect(row.doubleCountingPrevented).toBe(true);
      expect(row.netOpportunityInr).toBeLessThanOrEqual(row.grossOpportunityInr);
    }
  });

  // ==========================================
  // PART 7: OVERLAP RECONCILIATION
  // ==========================================
  it('PART 7: Reconciles Gross ₹441.833 Cr - Overlap ₹104.067 Cr = Net ₹337.766 Cr', () => {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    const netCalculated = Math.round((summary.grossQuantifiableBenefitCr - summary.totalOverlappingOpportunityCr) * 1000) / 1000;
    expect(netCalculated).toBe(337.766);
    expect(summary.netQuantifiableOpportunityCr).toBe(337.766);
  });

  // ==========================================
  // PART 8: PROVEN OPPORTUNITY
  // ==========================================
  it('PART 8: Reconstructs Proven Opportunity (₹319.439 Cr) with high confidence criteria', () => {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    expect(summary.provenOpportunityCr).toBe(319.439);

    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    const provenCategories = sourcing.profiles.filter((p) => p.evidenceState === 'PROVEN_OPPORTUNITY');
    expect(provenCategories.length).toBeGreaterThan(0);
    for (const p of provenCategories) {
      expect(p.activeSuppliersCount).toBeGreaterThanOrEqual(2);
      expect(p.comparableTransactionCount).toBeGreaterThanOrEqual(2);
    }
  });

  // ==========================================
  // PART 9: CONSERVATIVE DELIVERY RANGE
  // ==========================================
  it('PART 9: Reconstructs Indicative Delivery Range (₹31.944 – ₹79.860 Cr)', () => {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    expect(summary.indicativeDeliveryMinCr).toBe(31.944);
    expect(summary.indicativeDeliveryMaxCr).toBe(79.860);
    expect(summary.quantifiableRangeMinCr).toBe(31.944);
    expect(summary.quantifiableRangeMaxCr).toBe(79.860);
    expect(summary.quantifiableRangeMinCr).toBeLessThan(summary.quantifiableRangeMaxCr);
  });

  // ==========================================
  // PART 10: ECONOMIC SANITY RULES
  // ==========================================
  it('PART 10: Enforces all Economic Sanity Rules', () => {
    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    for (const p of sourcing.profiles) {
      // 1. Savings >= 0
      expect(p.netQuantifiableOpportunityInr || 0).toBeGreaterThanOrEqual(0);
      // 2. Net Opportunity <= Total Category Spend
      expect((p.netQuantifiableOpportunityInr || 0)).toBeLessThanOrEqual(p.totalSpendInr);
    }

    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    // 3. Net Opportunity <= Total Validated Spend
    expect(summary.netQuantifiableOpportunityCr).toBeLessThan(summary.totalValidatedSpendCr);
    // 4. Proven Opportunity <= Net Opportunity
    expect(summary.provenOpportunityCr).toBeLessThanOrEqual(summary.netQuantifiableOpportunityCr);
    // 5. Conservative Max <= Proven Opportunity
    expect(summary.quantifiableRangeMaxCr).toBeLessThan(summary.provenOpportunityCr);
  });

  // ==========================================
  // PART 11 - 14: LEVER-SPECIFIC CHECKS
  // ==========================================
  it('PART 11-14: Lever Specific Separations (E-Auction, Consolidation, Recurring, PO)', () => {
    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    // E-Auction: eligible spend separated from savings
    expect(sourcing.summary.eauctionAddressableSpendInrCr).toBe(443.621);
    expect(sourcing.summary.totalPotentialEAuctionOpportunityInrCr).toBe(77.366);

    // Vendor Consolidation: tail suppliers analyzed
    expect(sourcing.summary.totalPotentialConsolidationOpportunityInrCr).toBe(168.245);

    // PO Consolidation: operational metrics exist
    const poList = Module2CanonicalService.getPoConsolidationAnalysis();
    expect(poList.length).toBeGreaterThan(0);
  });

  // ==========================================
  // PART 15: CATEGORY-LEVEL INDEPENDENT RECOMPUTATION
  // ==========================================
  it('PART 15: Independent Recalculation matches production with ₹0.00 variance', () => {
    const txs = Module2CanonicalService.getCanonicalTransactions();
    const indResults = Module2FinancialIndependentCalculator.runIndependentRecalculation(txs);
    expect(indResults.length).toBe(57);

    const indSpendInr = indResults.reduce((s, r) => s + r.eligibleSpendInr, 0);
    const indSpendCr = Math.round((indSpendInr / 10000000) * 1000) / 1000;
    expect(indSpendCr).toBe(443.621);

    const indGrossInr = indResults.reduce((s, r) => s + r.grossOpportunityInr, 0);
    const indGrossCr = Math.round((indGrossInr / 10000000) * 1000) / 1000;
    expect(indGrossCr).toBe(441.833);

    const indNetInr = indResults.reduce((s, r) => s + r.netOpportunityInr, 0);
    const indNetCr = Math.round((indNetInr / 10000000) * 1000) / 1000;
    expect(indNetCr).toBe(337.766);
  });

  // ==========================================
  // PART 16: EVIDENCE WORKBOOK
  // ==========================================
  it('PART 16: Generates MODULE_2_FINANCIAL_SANITY_EVIDENCE.xlsx with all 20 sheets', () => {
    const result = Module2FinancialSanityWorkbookBuilder.buildWorkbook();
    expect(result.sheetsCount).toBe(20);
    expect(fs.existsSync(result.workbookPath)).toBe(true);
    expect(result.workbookSha256.length).toBe(64);
  });

  // ==========================================
  // PART 17: FINAL ACCEPTANCE CRITERIA
  // ==========================================
  it('PART 17: Validates Final Acceptance Criteria and outputs FINANCIALLY CERTIFIED verdict', () => {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    expect(summary.finalVerdict).toBe('FINANCIALLY CERTIFIED');
    expect(summary.independentRecalculationVarianceCr).toBe(0.0);
    expect(summary.uiApiVarianceCr).toBe(0.0);
    expect(summary.evidenceVarianceCr).toBe(0.0);
  });

  // ==========================================
  // EDGE CASE & BRANCH TESTS
  // ==========================================
  it('exercises edge cases for independent calculation and rate auditing', () => {
    // 1. Independent calculation on single or empty transactions
    const emptyResult = Module2FinancialIndependentCalculator.calculateCategory('Empty Category', []);
    expect(emptyResult.totalSpendInr).toBe(0);
    expect(emptyResult.grossOpportunityInr).toBe(0);
    expect(emptyResult.evidenceState).toBe('LOW_EVIDENCED_OPPORTUNITY');

    const singleTxResult = Module2FinancialIndependentCalculator.calculateCategory('Single Tx', [
      {
        vendor_name: 'Solo Vendor',
        material_desc: 'Solo Material',
        quantity: 10,
        unit_price: 100,
        total_spend_inr: 1000,
        currency: 'INR',
        uom: 'EA'
      }
    ]);
    expect(singleTxResult.totalSpendInr).toBe(1000);
    expect(singleTxResult.grossOpportunityInr).toBe(0);

    // 2. Audit addressable spend has both eligible and excluded transactions
    const rows = Module2FinancialSanityAuditor.auditAddressableSpend();
    const hasZeroExcluded = rows.some((r) => r.excludedSpendInr === 0);
    const hasExcluded = rows.some((r) => r.excludedSpendInr > 0);
    expect(hasZeroExcluded).toBe(true);
    expect(hasExcluded).toBe(true);
  });

  it('exercises custom profiles and edge cases in auditor', () => {
    // 3. Addressable spend with zero addressable category
    const zeroAddrRow = Module2FinancialSanityAuditor.auditAddressableSpend([
      {
        categoryName: 'Zero Addressable Category',
        transactionCount: 5,
        comparableTransactionCount: 0,
        totalSpendInr: 500000,
        totalSpendInrCr: 0.05,
        addressableSpendInr: 0,
        addressableSpendInrCr: 0,
        vendorCount: 1,
        hhiIndex: 10000,
        eAuctionSuitability: 'UNSUITABLE',
        consolidationSuitability: 'SINGLE_SOURCED',
        dominantUom: 'EA',
        uomHomogeneityScore: 1,
        readyForSourcingExecution: false
      } as any
    ]);
    expect(zeroAddrRow[0].eligibilityRule).toContain('Zero comparable');

    // 4. auditSavingsRates with injected profiles
    const customRates = Module2FinancialSanityAuditor.auditSavingsRates([
      {
        categoryName: 'Normal Cat',
        transactionCount: 10,
        comparableTransactionCount: 10,
        totalSpendInr: 10000000,
        totalSpendInrCr: 1,
        addressableSpendInr: 10000000,
        addressableSpendInrCr: 1,
        vendorCount: 3,
        hhiIndex: 3000,
        eAuctionSuitability: 'HIGH',
        consolidationSuitability: 'SUITABLE',
        dominantUom: 'EA',
        uomHomogeneityScore: 1,
        readyForSourcingExecution: true,
        potentialEAuctionOpportunityInr: 500000,
        netQuantifiableOpportunityInr: 500000,
        netQuantifiableOpportunityInrCr: 0.05
      } as any
    ]);
    expect(customRates[0].flagLevel).toBe('NORMAL');
  });

  it('exercises Module2FinancialSanityHelper methods and edge cases', () => {
    // 1. Category extraction fallbacks
    expect(Module2FinancialSanityHelper.extractCategoryName({ spend_category: 'Direct IT' })).toBe('Direct IT');
    expect(Module2FinancialSanityHelper.extractCategoryName({ unspsc_commodity: 'Cloud Services' })).toBe('Cloud Services');
    expect(Module2FinancialSanityHelper.extractCategoryName({ material_desc: 'Servers' })).toBe('Servers');
    expect(Module2FinancialSanityHelper.extractCategoryName({})).toBe('General');

    // 2. Transaction mapping for ineligible transaction
    const ineligTx = Module2FinancialSanityHelper.mapTransactionOverlap({
      currency: 'EUR',
      unit_price: 0,
      total_spend_inr: 50000
    });
    expect(ineligTx.leversAttachedCount).toBe(0);
    expect(ineligTx.grossOpportunityInr).toBe(0);

    // 3. Transaction mapping for eligible transaction with missing po_number
    const eligTx = Module2FinancialSanityHelper.mapTransactionOverlap({
      currency: 'INR',
      unit_price: 150,
      total_spend_inr: 100000
    });
    expect(eligTx.poNumber).toBe('UNKNOWN_PO');
    expect(eligTx.leversAttachedCount).toBe(3);
    expect(eligTx.grossOpportunityInr).toBe(10000);

    // 4. Rate flag evaluations
    const mockCat: any = {
      addressableSpendInrCr: 10,
      totalSpendInrCr: 100,
      totalSpendInr: 1000000000,
      netQuantifiableOpportunityInrCr: 5,
      netQuantifiableOpportunityInr: 50000000,
      volumeBundlingOpportunityInr: 100000000
    };
    expect(Module2FinancialSanityHelper.evaluateSavingsRateFlag(105, 10.5, mockCat).flagLevel).toBe('OVER_100');
    expect(Module2FinancialSanityHelper.evaluateSavingsRateFlag(60, 6.0, mockCat).flagLevel).toBe('OVER_50');
    expect(Module2FinancialSanityHelper.evaluateSavingsRateFlag(30, 3.0, mockCat).flagLevel).toBe('OVER_25');
    expect(Module2FinancialSanityHelper.evaluateSavingsRateFlag(15, 1.5, mockCat).flagLevel).toBe('NORMAL');

    // 5. Zero spend category
    const zeroSpendCat: any = {
      addressableSpendInrCr: 0,
      totalSpendInrCr: 0,
      totalSpendInr: 0,
      netQuantifiableOpportunityInrCr: 0,
      volumeBundlingOpportunityInr: 0
    };
    expect(Module2FinancialSanityHelper.evaluateSavingsRateFlag(55, 0, zeroSpendCat).flagLevel).toBe('OVER_50');
  });
});

