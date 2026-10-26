/**
 * P0 — Module 2 Final Transaction-Level Financial Traceability Test Suite
 * Tests M2-TL-001 through M2-TL-020.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2FinancialTraceabilityEngine } from '../../src/services/module2FinancialTraceabilityEngine';
import { Module2FinancialTraceabilityTestEvaluator } from '../../src/services/module2FinancialTraceabilityTestEvaluator';
import { Module2FinancialTraceabilityWorkbookBuilder } from '../../src/services/module2FinancialTraceabilityWorkbookBuilder';
import {
  TRACEABILITY_WORKBOOK_FILENAME,
  TRACEABILITY_WORKBOOK_SHEETS
} from '../../src/constants/module2FinancialTraceability';

describe('P0 Module 2 Financial Traceability Certification (M2-TL-001 to M2-TL-020)', () => {
  beforeAll(() => {
    Module2CanonicalService.getCanonicalInput();
    Module2CanonicalService.getSourcingAnalysis();
  }, 30000);

  it('runs all 20 P0 traceability tests and confirms 100% pass rate', () => {
    const txs = Module2CanonicalService.getCanonicalTransactions();
    const summary = Module2FinancialTraceabilityEngine.getAuditSummary();
    const oppLineage = Module2FinancialTraceabilityEngine.buildOpportunityLineage(txs);
    const denoms = Module2FinancialTraceabilityEngine.buildDenominatorReconciliation();
    const cats = Module2FinancialTraceabilityEngine.buildCategoryReconciliation();
    const overlaps = Module2FinancialTraceabilityEngine.buildOverlapTrace(txs);
    const provens = Module2FinancialTraceabilityEngine.buildProvenOpportunityTrace(txs);

    const testResults = Module2FinancialTraceabilityTestEvaluator.evaluateAll(
      oppLineage,
      denoms,
      provens,
      overlaps,
      cats,
      summary
    );

    expect(testResults.length).toBe(20);
    const failed = testResults.filter((t) => !t.passed);
    if (failed.length > 0) {
      console.log('FAILED TESTS:', JSON.stringify(failed, null, 2));
    }
    for (const test of testResults) {
      expect(test.passed).toBe(true);
    }

    // M2-TL-001: Every monetary opportunity has source transaction IDs
    const tl001 = testResults.find((t) => t.testId === 'M2-TL-001')!;
    expect(tl001.passed).toBe(true);

    // M2-TL-002: Explicit denominators
    const tl002 = testResults.find((t) => t.testId === 'M2-TL-002')!;
    expect(tl002.passed).toBe(true);

    // M2-TL-003: Explicit formulas
    const tl003 = testResults.find((t) => t.testId === 'M2-TL-003')!;
    expect(tl003.passed).toBe(true);

    // M2-TL-004: Proven Opportunity historical evidence
    const tl004 = testResults.find((t) => t.testId === 'M2-TL-004')!;
    expect(tl004.passed).toBe(true);

    // M2-TL-005: Proven Opportunity does not exceed spend
    const tl005 = testResults.find((t) => t.testId === 'M2-TL-005')!;
    expect(tl005.passed).toBe(true);

    // M2-TL-006: Denominators reconcile to transaction spend
    const tl006 = testResults.find((t) => t.testId === 'M2-TL-006')!;
    expect(tl006.passed).toBe(true);

    // M2-TL-007: Overlap deduction transaction evidence
    const tl007 = testResults.find((t) => t.testId === 'M2-TL-007')!;
    expect(tl007.passed).toBe(true);

    // M2-TL-008: Gross - Overlap = Net
    const tl008 = testResults.find((t) => t.testId === 'M2-TL-008')!;
    expect(tl008.passed).toBe(true);

    // M2-TL-009: No theoretical pool in Proven Opportunity
    const tl009 = testResults.find((t) => t.testId === 'M2-TL-009')!;
    expect(tl009.passed).toBe(true);

    // M2-TL-010: No unsupported assumption in Proven Opportunity
    const tl010 = testResults.find((t) => t.testId === 'M2-TL-010')!;
    expect(tl010.passed).toBe(true);

    // M2-TL-011: 16 vs 19 category reconciliation
    const tl011 = testResults.find((t) => t.testId === 'M2-TL-011')!;
    expect(tl011.passed).toBe(true);

    // M2-TL-012: Production vs independent variance = ₹0
    const tl012 = testResults.find((t) => t.testId === 'M2-TL-012')!;
    expect(tl012.passed).toBe(true);

    // M2-TL-013: Delivery formulas reconcile to 10%–25%
    const tl013 = testResults.find((t) => t.testId === 'M2-TL-013')!;
    expect(tl013.passed).toBe(true);

    // M2-TL-014: UI/API/Report financial parity = ₹0
    const tl014 = testResults.find((t) => t.testId === 'M2-TL-014')!;
    expect(tl014.passed).toBe(true);

    // M2-TL-015: Module 1 baseline unchanged
    const tl015 = testResults.find((t) => t.testId === 'M2-TL-015')!;
    expect(tl015.passed).toBe(true);

    // M2-TL-016: VGT SHA unchanged
    const tl016 = testResults.find((t) => t.testId === 'M2-TL-016')!;
    expect(tl016.passed).toBe(true);

    // M2-TL-017: FX Master SHA unchanged
    const tl017 = testResults.find((t) => t.testId === 'M2-TL-017')!;
    expect(tl017.passed).toBe(true);

    // M2-TL-018: No customer-facing savings rate > 100%
    const tl018 = testResults.find((t) => t.testId === 'M2-TL-018')!;
    expect(tl018.passed).toBe(true);

    // M2-TL-019: No unsupported external benchmark claim
    const tl019 = testResults.find((t) => t.testId === 'M2-TL-019')!;
    expect(tl019.passed).toBe(true);

    // M2-TL-020: No guaranteed savings claim
    const tl020 = testResults.find((t) => t.testId === 'M2-TL-020')!;
    expect(tl020.passed).toBe(true);
  });

  it('builds and validates MODULE_2_FINAL_TRACEABILITY_EVIDENCE.xlsx with all 20 sheets', () => {
    const res = Module2FinancialTraceabilityWorkbookBuilder.buildWorkbook();
    expect(res.sheetsCount).toBe(20);
    expect(fs.existsSync(res.workbookPath)).toBe(true);

    const wb = XLSX.readFile(res.workbookPath);
    expect(wb.SheetNames.length).toBe(20);
    expect(wb.SheetNames).toEqual(TRACEABILITY_WORKBOOK_SHEETS);

    for (const sheetName of TRACEABILITY_WORKBOOK_SHEETS) {
      const sheet = wb.Sheets[sheetName];
      expect(sheet).toBeDefined();
      const rows = XLSX.utils.sheet_to_json(sheet);
      expect(rows.length).toBeGreaterThan(0);
    }

    const fileBuf = fs.readFileSync(res.workbookPath);
    const hash = crypto.createHash('sha256').update(fileBuf).digest('hex');
    expect(hash).toBe(res.workbookSha256);
  });
});
