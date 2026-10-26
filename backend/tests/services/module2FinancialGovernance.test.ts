/**
 * P0 — Module 2 Financial Governance Certification Test Suite
 * Tests M2-FG-001 through M2-FG-020
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2FinancialSanityAuditor } from '../../src/services/module2FinancialSanityAuditor';
import { Module2FinancialGovernanceEngine } from '../../src/services/module2FinancialGovernanceEngine';
import { Module2FinancialWorkbookSheets } from '../../src/services/module2FinancialWorkbookSheets';

describe('P0 Module 2 Financial Governance Certification Suite (M2-FG-001 to M2-FG-020)', () => {
  beforeAll(() => {
    Module2CanonicalService.getCanonicalInput();
    Module2CanonicalService.getSourcingAnalysis();
  }, 30000);

  it('runs all 20 P0 financial governance tests and verifies 100% pass rate', () => {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    const denominators = Module2FinancialGovernanceEngine.buildOpportunityDenominators(sourcing.profiles);
    const overlapRows = Module2FinancialGovernanceEngine.buildOpportunityOverlapLedger(sourcing.profiles);

    const testResults = Module2FinancialGovernanceEngine.runGovernanceTests(summary, denominators, overlapRows);

    expect(testResults.length).toBe(20);
    for (const test of testResults) {
      expect(test.passed).toBe(true);
    }

    // M2-FG-001: No customer-facing savings rate > 100%
    const fg001 = testResults.find(t => t.testId === 'M2-FG-001')!;
    expect(fg001.passed).toBe(true);

    // M2-FG-002: No negative savings
    const fg002 = testResults.find(t => t.testId === 'M2-FG-002')!;
    expect(fg002.passed).toBe(true);

    // M2-FG-003: Gross multi-lever theoretical pool
    const fg003 = testResults.find(t => t.testId === 'M2-FG-003')!;
    expect(fg003.passed).toBe(true);

    // M2-FG-004: Diagnostic ratio, NOT savings rate
    const fg004 = testResults.find(t => t.testId === 'M2-FG-004')!;
    expect(fg004.passed).toBe(true);

    // M2-FG-005: Net Defensible Opportunity <= Total spend
    const fg005 = testResults.find(t => t.testId === 'M2-FG-005')!;
    expect(fg005.passed).toBe(true);

    // M2-FG-006: Proven Opportunity <= Addressable spend
    const fg006 = testResults.find(t => t.testId === 'M2-FG-006')!;
    expect(fg006.passed).toBe(true);

    // M2-FG-007: Delivery min <= Delivery max
    const fg007 = testResults.find(t => t.testId === 'M2-FG-007')!;
    expect(fg007.passed).toBe(true);

    // M2-FG-008: Delivery max <= Proven Opportunity
    const fg008 = testResults.find(t => t.testId === 'M2-FG-008')!;
    expect(fg008.passed).toBe(true);

    // M2-FG-009: Delivery formulas match configured 10% and 25%
    const fg009 = testResults.find(t => t.testId === 'M2-FG-009')!;
    expect(fg009.passed).toBe(true);
    expect(summary.indicativeDeliveryMinCr).toBe(31.944);
    expect(summary.indicativeDeliveryMaxCr).toBe(79.860);

    // M2-FG-010: Zero hidden constants
    const fg010 = testResults.find(t => t.testId === 'M2-FG-010')!;
    expect(fg010.passed).toBe(true);

    // M2-FG-011: Removed unsupported 6%–12% benchmark claim
    const fg011 = testResults.find(t => t.testId === 'M2-FG-011')!;
    expect(fg011.passed).toBe(true);

    // M2-FG-012: Denominator and lineage completeness
    const fg012 = testResults.find(t => t.testId === 'M2-FG-012')!;
    expect(fg012.passed).toBe(true);

    // M2-FG-016: Overlap ledger reconciliation variance = ₹0
    const fg016 = testResults.find(t => t.testId === 'M2-FG-016')!;
    expect(fg016.passed).toBe(true);

    // M2-FG-017: Independent calculation parity
    const fg017 = testResults.find(t => t.testId === 'M2-FG-017')!;
    expect(fg017.passed).toBe(true);

    // M2-FG-018: Full surface financial parity
    const fg018 = testResults.find(t => t.testId === 'M2-FG-018')!;
    expect(fg018.passed).toBe(true);

    // M2-FG-019: Module 1 baseline preserved
    const fg019 = testResults.find(t => t.testId === 'M2-FG-019')!;
    expect(fg019.passed).toBe(true);

    // M2-FG-020: Comprehensive certification gate
    const fg020 = testResults.find(t => t.testId === 'M2-FG-020')!;
    expect(fg020.passed).toBe(true);
    expect(fg020.actual).toBe('ALL_TESTS_PASSED');
    expect(summary.finalVerdict).toBe('FINANCIALLY CERTIFIED');
  });

  it('validates opportunity denominator object structure and types', () => {
    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    const denominators = Module2FinancialGovernanceEngine.buildOpportunityDenominators(sourcing.profiles);

    expect(denominators.length).toBeGreaterThan(0);
    for (const d of denominators) {
      expect(d.denominatorAmountInr).toBeGreaterThanOrEqual(0);
      expect(d.denominatorAmountCr).toBeGreaterThanOrEqual(0);
      expect(d.ratePct).toBeLessThanOrEqual(100);
      expect(d.ratePct).toBeGreaterThanOrEqual(0);
      expect(d.formula.length).toBeGreaterThan(0);
      expect(d.sourceTransactionIds.length).toBeGreaterThan(0);
      if (d.numeratorAmountInr > 0) {
        expect(d.denominatorAmountInr).toBeGreaterThan(0);
      }
    }
  });

  it('validates opportunity-level overlap ledger arithmetic with ₹0.00 variance', () => {
    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    const overlapRows = Module2FinancialGovernanceEngine.buildOpportunityOverlapLedger(sourcing.profiles);

    expect(overlapRows.length).toBeGreaterThan(0);
    const sumGross = overlapRows.reduce((s, r) => s + r.grossOpportunityInr, 0);
    const sumDeducted = overlapRows.reduce((s, r) => s + r.deductedOpportunityInr, 0);
    const sumSelected = overlapRows.reduce((s, r) => s + r.selectedOpportunityInr, 0);

    expect(sumGross - sumDeducted).toBe(sumSelected);
  });

  it('validates financial workbook sheet generation helpers', () => {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    const sourcing = Module2CanonicalService.getSourcingAnalysis();

    const readme = Module2FinancialWorkbookSheets.buildReadmeSheet(summary);
    expect(readme.length).toBeGreaterThan(10);

    const cert = Module2FinancialWorkbookSheets.buildCertificationSheet(summary);
    expect(cert.length).toBe(10);

    const spendRecon = Module2FinancialWorkbookSheets.buildTotalSpendReconciliationSheet(summary);
    expect(spendRecon.length).toBe(5);

    const delivery = Module2FinancialWorkbookSheets.buildDeliveryAssumptionsSheet(summary);
    expect(delivery.length).toBe(9);

    const parity = Module2FinancialWorkbookSheets.buildUiApiReportParitySheet(summary);
    expect(parity.length).toBe(8);

    const exclusions = Module2FinancialWorkbookSheets.buildExclusionsSheet(summary);
    expect(exclusions.length).toBe(4);

    const finalCert = Module2FinancialWorkbookSheets.buildFinalCertificationSheet(summary);
    expect(finalCert.length).toBe(10);

    const catOpp = Module2FinancialWorkbookSheets.buildCategoryOpportunitySheet(sourcing.profiles);
    expect(catOpp.length).toBe(57);
  });
});
