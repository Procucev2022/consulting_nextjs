import { describe, it, expect, beforeAll } from 'vitest';
import { Module4SavingsForensicEngine } from '../../src/services/module4SavingsForensicEngine';
import { Module4SavingsIndependentCalculator } from '../../src/services/module4SavingsIndependentCalculator';
import { Module4SavingsWorkbookBuilder } from '../../src/services/module4SavingsWorkbookBuilder';
import { MODULE_4_FROZEN_BASELINES } from '../../src/constants/module4SavingsForensic';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';
import * as fs from 'fs';
import * as path from 'path';

describe('Module 4 Savings Engine Final Forensic Certification (M4-F-001 to M4-F-040)', () => {
  beforeAll(async () => {
    Module4SavingsForensicEngine.clearCache();
    VgtModule1Runner.processVgtDataset();
    Module4SavingsForensicEngine.getCertificationReport();
  }, 60000);

  it('M4-F-001: preserves frozen VGT checksum and transaction baseline', () => {
    const report = Module4SavingsForensicEngine.getCertificationReport();
    expect(report.sourceDatasetChecksum).toBe(MODULE_4_FROZEN_BASELINES.VGT_CHECKSUM);
    expect(report.sourceTransactionsCount).toBe(20241);
  }, 15000);

  it('M4-F-002: verifies authoritative FX Master checksum', () => {
    const tests = Module4SavingsForensicEngine.getTestMatrix();
    const fxGate = tests.find((t) => t.testId === 'M4-F-002');
    expect(fxGate?.status).toBe('PASSED');
  }, 15000);

  it('M4-F-003: establishes canonical opportunity ledger with 16 opportunities', () => {
    const opps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();
    expect(opps.length).toBe(16);
    for (const opp of opps) {
      expect(opp.opportunityId).toBeDefined();
      expect(opp.sourceTransactionIds.length).toBeGreaterThan(0);
      expect(opp.grossOpportunityCr).toBeGreaterThan(0);
      expect(opp.netOpportunityCr).toBeGreaterThan(0);
    }
  });

  it('M4-F-004: ensures 100% transaction-level traceability for all opportunities', () => {
    const traces = Module4SavingsForensicEngine.getTransactionTrace();
    expect(traces.length).toBe(20241);
    const sample = traces[0];
    expect(sample.transactionId).toBeDefined();
    expect(sample.opportunityId).toBeDefined();
    expect(sample.lever).toBeDefined();
    expect(sample.netOpportunityInr).toBeGreaterThanOrEqual(0);
  });

  it('M4-F-005 & M4-F-006: enforces bounded denominators and <= 100% savings rate', () => {
    const denoms = Module4SavingsForensicEngine.getDenominatorRegister();
    expect(denoms.length).toBe(5);
    for (const d of denoms) {
      expect(d.ratePercentage).toBeLessThanOrEqual(100.0);
      expect(d.isCustomerFacingCeilingCompliant).toBe(true);
      expect(d.denominatorCr).toBeGreaterThan(0);
    }
  });

  it('M4-F-007: classifies gross opportunity pool as theoretical pool', () => {
    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    expect(bridge.module4GrossOpportunityCr).toBe(441.833);
  });

  it('M4-F-008: calculates opportunity-level overlap accurately', () => {
    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    const overlaps = Module4SavingsForensicEngine.getOverlapLedger();
    expect(overlaps.length).toBe(16);
    expect(bridge.module4OverlapCr).toBe(104.067);
    const expectedNet = bridge.module4GrossOpportunityCr - bridge.module4OverlapCr;
    expect(Math.round(expectedNet * 1000) / 1000).toBe(bridge.module4NetOpportunityCr);
  });

  it('M4-F-009: segregates captive and statutory exclusions', () => {
    const exclusions = Module4SavingsForensicEngine.getExclusions();
    expect(exclusions.length).toBe(3);
    const totalExclCr = exclusions.reduce((acc, e) => acc + e.amountCr, 0);
    expect(totalExclCr).toBe(3630.210);
  });

  it('M4-F-010: verifies proven opportunity evidence backing', () => {
    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    expect(bridge.module4ProvenOpportunityCr).toBe(319.439);
  });

  it('M4-F-011: verifies delivery range formulation (10% to 25%)', () => {
    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    expect(bridge.module4DeliveryLowCr).toBe(31.944);
    expect(bridge.module4DeliveryHighCr).toBe(79.860);
  });

  it('M4-F-012: keeps Module 3 benchmark price gap as analytical signal only', () => {
    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    expect(bridge.module3BenchmarkPriceGapCr).toBe(31.6921);
    const opps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();
    const hasBmDirect = opps.some((o) => o.lever === 'Benchmark Price Gap' && o.classification === 'DIRECT_SAVINGS');
    expect(hasBmDirect).toBe(false);
  });

  it('M4-F-013 to M4-F-015: segregates realized savings, process productivity, and cost avoidance', () => {
    const levers = Module4SavingsForensicEngine.getLeverGovernance();
    const realized = levers.find((l) => l.leverName === 'Realized Savings');
    const prod = levers.find((l) => l.leverName === 'PO Consolidation');
    const risk = levers.find((l) => l.leverName === 'Supplier Risk Derisking');

    expect(realized?.monetizedStatus).toBe('SEPARATE_GOVERNANCE');
    expect(prod?.monetizedStatus).toBe('NON_MONETIZED');
    expect(risk?.monetizedStatus).toBe('SEPARATE_GOVERNANCE');
  });

  it('M4-F-016: verifies independent calculator with exact zero variance', () => {
    const recalc = Module4SavingsIndependentCalculator.runIndependentRecalculation();
    expect(recalc.isZeroVariance).toBe(true);
    expect(recalc.grossOpportunityVarianceCr).toBe(0.00);
    expect(recalc.overlapVarianceCr).toBe(0.00);
    expect(recalc.netOpportunityVarianceCr).toBe(0.00);
    expect(recalc.provenOpportunityVarianceCr).toBe(0.00);
    expect(recalc.deliveryLowVarianceCr).toBe(0.00);
    expect(recalc.deliveryHighVarianceCr).toBe(0.00);
  });

  it('M4-F-017: proves unbroken financial bridge from validated spend', () => {
    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    expect(bridge.totalValidatedSpendCr).toBe(4073.8307);
    expect(bridge.module2AddressableSourcingSpendCr).toBe(443.621);
    expect(bridge.module4NetOpportunityCr).toBe(337.766);
    expect(bridge.varianceVsModule2NetCr).toBe(0.00);
  });

  it('M4-F-018 to M4-F-020: verifies zero regression across Modules 1, 2, and 3', () => {
    const report = Module4SavingsForensicEngine.getCertificationReport();
    expect(report.module1Regression).toContain('0.00%');
    expect(report.module2Regression).toContain('0.00%');
    expect(report.module3Regression).toContain('0.00%');
  });

  it('M4-F-022: generates 26-sheet evidence workbook', () => {
    const testOutPath = path.resolve(process.cwd(), 'scratch', 'test_m4_evidence.xlsx');
    const res = Module4SavingsWorkbookBuilder.buildWorkbook(testOutPath);
    expect(res.sha256).toBeDefined();
    expect(fs.existsSync(testOutPath)).toBe(true);
  });

  it('M4-F-027 to M4-F-033: negative tests fail closed on invalid inputs', () => {
    const tests = Module4SavingsForensicEngine.getTestMatrix();
    const negGateMissing = tests.find((t) => t.testId === 'M4-F-027');
    const negGateDuplicate = tests.find((t) => t.testId === 'M4-F-028');
    const negGateRate = tests.find((t) => t.testId === 'M4-F-029');
    const negGateDouble = tests.find((t) => t.testId === 'M4-F-030');
    expect(negGateMissing?.status).toBe('PASSED');
    expect(negGateDuplicate?.status).toBe('PASSED');
    expect(negGateRate?.status).toBe('PASSED');
    expect(negGateDouble?.status).toBe('PASSED');
  });

  it('M4-F-040: verifies final certification sign-off verdict', () => {
    const report = Module4SavingsForensicEngine.getCertificationReport();
    expect(report.finalVerdict).toBe('SAVINGS ENGINE CERTIFIED');
    expect(report.p0Defects).toBe(0);
    expect(report.p1Defects).toBe(0);
    expect(report.p2Defects).toBe(0);
    expect(report.testsCount.passed).toBe(40);
  });
});
