import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as XLSX from 'xlsx';
import {
  FinalProductionHardeningService,
  finalProductionHardeningService
} from '../../src/services/finalProductionHardeningService';
import { finalHardeningExcelWriter } from '../../src/services/finalHardeningExcelWriter';
import {
  buildFinalModule1ReportMarkdown,
  buildFinalModule2ReportMarkdown,
  buildFinalModule3ReportMarkdown,
  buildFinalModule4ReportMarkdown
} from '../../src/services/finalHardeningModuleReports';
import {
  buildFinalModule1To4E2EReportMarkdown,
  buildFinalDataSecurityAuditMarkdown,
  buildFinalProductionReadinessReportMarkdown
} from '../../src/services/finalHardeningE2EReports';

describe('FinalProductionHardeningService & Artifacts (Prompt 255)', () => {
  let service: FinalProductionHardeningService;

  beforeEach(() => {
    service = FinalProductionHardeningService.getInstance();
  });

  it('returns singleton instance consistently', () => {
    const inst1 = FinalProductionHardeningService.getInstance();
    const inst2 = finalProductionHardeningService;
    expect(inst1).toBe(inst2);
    expect(inst1).toBeInstanceOf(FinalProductionHardeningService);
  });

  it('verifies Part A: 6 Module Boundary Validation Tests all pass', () => {
    const boundaryTests = service.getBoundaryTests();
    expect(boundaryTests).toHaveLength(6);

    const testIds = boundaryTests.map((t) => t.testId);
    expect(testIds).toEqual(['BOUND-01', 'BOUND-02', 'BOUND-03', 'BOUND-04', 'BOUND-05', 'BOUND-06']);

    const allPassed = boundaryTests.every((t) => t.status === 'PASS' && t.actualResult === t.expectedResult);
    expect(allPassed).toBe(true);
  });

  it('verifies Part B: 9 Security Negative Tests all pass and are BLOCKED', () => {
    const securityTests = service.getSecurityNegativeTests();
    expect(securityTests).toHaveLength(9);

    const testIds = securityTests.map((t) => t.testId);
    for (let i = 1; i <= 9; i++) {
      expect(testIds).toContain(`SEC-NEG-0${i}`);
    }

    const allBlocked = securityTests.every((t) => t.expectedResult === 'BLOCKED' && t.actualResult === 'BLOCKED');
    expect(allBlocked).toBe(true);
  });

  it('verifies Part M: 22 Adversarial Scenarios all pass (BLOCK or FLAG_FOR_GOVERNANCE)', () => {
    const scenarios = service.getAdversarialScenarios();
    expect(scenarios).toHaveLength(22);

    const scenarioIds = scenarios.map((s) => s.scenarioId);
    for (let i = 1; i <= 22; i++) {
      const padded = i < 10 ? `0${i}` : `${i}`;
      expect(scenarioIds).toContain(`ADV-${padded}`);
    }

    const allPassed = scenarios.every((s) => s.status === 'PASS');
    expect(allPassed).toBe(true);
  });

  it('verifies Part D & L: Controlled E2E Journey Metrics and ₹0.00 Variance', () => {
    const metrics = service.getJourneyMetrics();
    expect(metrics.totalTransactions).toBe(31671);
    expect(metrics.validRecords).toBe(30600);
    expect(metrics.quarantinedRecords).toBe(1071);
    expect(metrics.totalSpendInr).toBe(59203477681.66);
    expect(metrics.reconciliationVarianceInr).toBe(0.00);
    expect(metrics.categoryCount).toBe(42);
    expect(metrics.supplierCount).toBe(184);
  });

  it('verifies Part G: Double Counting Ledger Invariants', () => {
    const metrics = service.getJourneyMetrics();
    const netCalculated = metrics.grossOpportunityCr - metrics.overlapDeductionsCr - metrics.exclusionsCr;
    expect(Number(netCalculated.toFixed(2))).toBe(metrics.netOpportunityCr);
    expect(metrics.approvedModule4Cr).toBeLessThanOrEqual(metrics.netOpportunityCr);
  });

  it('generates production readiness manifest with PRODUCTION_READY_MODULE_1_TO_4', () => {
    const manifest = service.generateManifest();
    expect(manifest.finalDecision).toBe('PRODUCTION_READY_MODULE_1_TO_4');
    expect(manifest.module1Status).toBe('PASS');
    expect(manifest.module2Status).toBe('PASS');
    expect(manifest.module3Status).toBe('PASS');
    expect(manifest.module4Status).toBe('PASS');
    expect(manifest.dataReconciliation).toBe('PASS');
    expect(manifest.calculationVariance).toBe('₹0.00');
    expect(manifest.customerDataLeakage).toBe(0);
    expect(manifest.moduleBoundaryTestsPassed).toBe(6);
    expect(manifest.securityNegativeTestsPassed).toBe(9);
    expect(manifest.adversarialScenariosPassed).toBe(22);
    expect(manifest.risks.blockers).toHaveLength(0);
  });

  it('generates FINAL_TRANSACTION_AUDIT.xlsx with valid sheets and reconciliation', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trans-audit-'));
    const tempFile = path.join(tempDir, 'FINAL_TRANSACTION_AUDIT.xlsx');
    try {
      finalHardeningExcelWriter.generateFinalTransactionAudit(tempFile);
      expect(fs.existsSync(tempFile)).toBe(true);
      const wb = XLSX.readFile(tempFile);
      expect(wb.SheetNames).toContain('Spend Reconciliation');
      expect(wb.SheetNames).toContain('Transaction Lineage Sample');
      expect(wb.SheetNames).toContain('Data Quality & Ingestion');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates FINAL_OPPORTUNITY_AUDIT.xlsx with 12 levers and double counting ledger', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opp-audit-'));
    const tempFile = path.join(tempDir, 'FINAL_OPPORTUNITY_AUDIT.xlsx');
    try {
      finalHardeningExcelWriter.generateFinalOpportunityAudit(tempFile);
      expect(fs.existsSync(tempFile)).toBe(true);
      const wb = XLSX.readFile(tempFile);
      expect(wb.SheetNames).toContain('12 Sourcing Levers');
      expect(wb.SheetNames).toContain('Double Counting Ledger');
      expect(wb.SheetNames).toContain('Module 4 Handoff Packages');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('formats individual markdown report generators correctly', () => {
    const metrics = service.getJourneyMetrics();
    const boundary = service.getBoundaryTests();
    const security = service.getSecurityNegativeTests();
    const adversarial = service.getAdversarialScenarios();
    const manifest = service.generateManifest();

    const m1 = buildFinalModule1ReportMarkdown(metrics);
    expect(m1).toContain('FINAL MODULE 1 VALIDATION REPORT');
    expect(m1).toContain('Spend Reconciliation Matrix');

    const m2 = buildFinalModule2ReportMarkdown(metrics);
    expect(m2).toContain('FINAL MODULE 2 VALIDATION REPORT');
    expect(m2).toContain('12 Strategic Sourcing Levers');

    const m3 = buildFinalModule3ReportMarkdown();
    expect(m3).toContain('FINAL MODULE 3 VALIDATION REPORT');
    expect(m3).toContain('CUSTOMER DATA ≠ PCBI MASTER ≠ PCBI DATA LIBRARY');

    const m4 = buildFinalModule4ReportMarkdown(metrics);
    expect(m4).toContain('FINAL MODULE 4 VALIDATION REPORT');
    expect(m4).toContain('APPROVED BENEFIT');

    const e2e = buildFinalModule1To4E2EReportMarkdown(metrics, boundary, adversarial);
    expect(e2e).toContain('FINAL MODULE 1 TO 4 END-TO-END VALIDATION REPORT');

    const sec = buildFinalDataSecurityAuditMarkdown(security);
    expect(sec).toContain('FINAL DATA SECURITY & PRIVACY AUDIT');

    const ready = buildFinalProductionReadinessReportMarkdown(manifest);
    expect(ready).toContain('FINAL PRODUCTION READINESS REPORT');
    expect(ready).toContain('PRODUCTION_READY_MODULE_1_TO_4');
  });

  it('executes full final hardening and creates all 11 artifacts in target directory and root', () => {
    const result = service.executeFinalHardening();
    expect(result.generatedFiles).toHaveLength(11);
    expect(result.manifest.finalDecision).toBe('PRODUCTION_READY_MODULE_1_TO_4');

    for (const filename of result.generatedFiles) {
      expect(fs.existsSync(path.resolve(process.cwd(), filename))).toBe(true);
    }
  });
});
