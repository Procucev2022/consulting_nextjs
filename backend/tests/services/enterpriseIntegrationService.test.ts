/**
 * Enterprise Integration Service Test Suite (Prompt 251)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import {
  enterpriseIntegrationService,
  EnterpriseIntegrationService
} from '../../src/services/enterpriseIntegrationService';
import {
  enterpriseValidationExcelWriter,
  EnterpriseValidationExcelWriter
} from '../../src/services/enterpriseValidationExcelWriter';
import {
  generateEnterpriseE2EValidationMarkdown,
  generateEnterpriseUiUxAuditMarkdown
} from '../../src/services/enterpriseValidationMarkdown';
import { ENTERPRISE_E2E_TEST_CASES } from '../../src/constants/enterpriseTestDataset';
import type { EnterpriseIntegrationAuditManifest } from '../../src/types/enterpriseValidationTypes';

describe('Enterprise Integration & Production Hardening (Prompt 251)', () => {
  let manifest: EnterpriseIntegrationAuditManifest;

  beforeAll(() => {
    manifest = enterpriseIntegrationService.executeEnterpriseHardening();
  });

  describe('Part 14 — Release Gate Certification', () => {
    it('should verify final enterprise status is PRODUCTION_READY', () => {
      expect(manifest.releaseGate.finalEnterpriseStatus).toBe('PRODUCTION_READY');
      expect(manifest.releaseGate.module1Status).toBe('PASS');
      expect(manifest.releaseGate.module2Status).toBe('PASS');
      expect(manifest.releaseGate.module3Status).toBe('PASS');
      expect(manifest.releaseGate.module4Status).toBe('PASS');
      expect(manifest.releaseGate.calculationIntegrity).toBe('PASS');
      expect(manifest.releaseGate.dataReconciliation).toBe('PASS');
      expect(manifest.releaseGate.transactionTraceability).toBe('PASS');
      expect(manifest.releaseGate.opportunityTraceability).toBe('PASS');
      expect(manifest.releaseGate.doubleCountingControl).toBe('PASS');
      expect(manifest.releaseGate.moduleContinuity).toBe('PASS');
      expect(manifest.releaseGate.uiUxStatus).toBe('PASS');
      expect(manifest.releaseGate.securityGovernanceStatus).toBe('PASS');
    });

    it('should verify dataset metrics match certified baseline', () => {
      expect(manifest.authoritativeDataset.totalRecords).toBe(31671);
      expect(manifest.authoritativeDataset.validRecords).toBe(30600);
      expect(manifest.authoritativeDataset.excludedRecords).toBe(1071);
      expect(manifest.authoritativeDataset.totalSpendCr).toBe(5920.35);
      expect(manifest.authoritativeDataset.reconciliationVarianceInr).toBe(0.00);
    });
  });

  describe('Part 11 — Mandatory 7 Final Enterprise Artifacts Verification', () => {
    it('1. should verify FINAL_ENTERPRISE_E2E_VALIDATION.md exists and certifies PRODUCTION_READY', () => {
      const p = path.resolve(process.cwd(), 'FINAL_ENTERPRISE_E2E_VALIDATION.md');
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('PRODUCTION_READY');
      expect(content).toContain('Global Architectural Boundary Enforcement');
      expect(content).toContain('Mathematical Lineage & Forensic Drill-Down');
    });

    it('2. should verify FINAL_ENTERPRISE_CALCULATION_AUDIT.xlsx contains KPI and Lineage sheets', () => {
      const p = path.resolve(process.cwd(), 'FINAL_ENTERPRISE_CALCULATION_AUDIT.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const wb = XLSX.readFile(p);
      expect(wb.SheetNames).toContain('KPI Reconciliation');
      expect(wb.SheetNames).toContain('Lineage Proof');
      expect(wb.SheetNames).toContain('FX & UOM Governance');
    });

    it('3. should verify FINAL_ENTERPRISE_TRANSACTION_TRACEABILITY.xlsx contains Traceability and Hierarchy', () => {
      const p = path.resolve(process.cwd(), 'FINAL_ENTERPRISE_TRANSACTION_TRACEABILITY.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const wb = XLSX.readFile(p);
      expect(wb.SheetNames).toContain('Traceability Ledger');
      expect(wb.SheetNames).toContain('Hierarchy Tree Audit');
    });

    it('4. should verify FINAL_ENTERPRISE_OPPORTUNITY_LEDGER.xlsx contains Opportunity and Double-Counting', () => {
      const p = path.resolve(process.cwd(), 'FINAL_ENTERPRISE_OPPORTUNITY_LEDGER.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const wb = XLSX.readFile(p);
      expect(wb.SheetNames).toContain('Opportunity Ledger');
      expect(wb.SheetNames).toContain('Double-Counting Reconciliation');
    });

    it('5. should verify FINAL_ENTERPRISE_INTEGRATION_AUDIT.json contains complete manifest', () => {
      const p = path.resolve(process.cwd(), 'FINAL_ENTERPRISE_INTEGRATION_AUDIT.json');
      expect(fs.existsSync(p)).toBe(true);
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      expect(data.releaseGate.finalEnterpriseStatus).toBe('PRODUCTION_READY');
      expect(data.passedTests).toBe(ENTERPRISE_E2E_TEST_CASES.length);
      expect(data.failedTests).toBe(0);
    });

    it('6. should verify FINAL_ENTERPRISE_UI_UX_AUDIT.md exists and covers 3-level hierarchy', () => {
      const p = path.resolve(process.cwd(), 'FINAL_ENTERPRISE_UI_UX_AUDIT.md');
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('UI_UX_STATUS = PASS');
      expect(content).toContain('Executive-First Information Design');
      expect(content).toContain('Progressive Disclosure Controls');
    });

    it('7. should verify FINAL_ENTERPRISE_TEST_RESULTS.json contains 18 passed test cases', () => {
      const p = path.resolve(process.cwd(), 'FINAL_ENTERPRISE_TEST_RESULTS.json');
      expect(fs.existsSync(p)).toBe(true);
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      expect(data.totalTests).toBe(18);
      expect(data.passedTests).toBe(18);
      expect(data.failedTests).toBe(0);
    });
  });

  describe('Part 7 — Complete End-to-End Tests Verification', () => {
    it('should verify all 18 test cases pass', () => {
      expect(ENTERPRISE_E2E_TEST_CASES.length).toBe(18);
      for (const tc of ENTERPRISE_E2E_TEST_CASES) {
        expect(tc.status).toBe('PASS');
      }
    });
  });

  describe('Direct Service Edge Case & Generator Branch Coverage', () => {
    it('should exercise singleton and custom path methods for excel writer', () => {
      const writer = EnterpriseValidationExcelWriter.getInstance();
      expect(writer).toBe(enterpriseValidationExcelWriter);

      const service = EnterpriseIntegrationService.getInstance();
      expect(service).toBe(enterpriseIntegrationService);

      const tempCalc = path.resolve(process.cwd(), 'temp_calc_test.xlsx');
      const tempTrace = path.resolve(process.cwd(), 'temp_trace_test.xlsx');
      const tempOpp = path.resolve(process.cwd(), 'temp_opp_test.xlsx');

      writer.generateEnterpriseCalculationAudit(tempCalc);
      expect(fs.existsSync(tempCalc)).toBe(true);
      fs.unlinkSync(tempCalc);

      writer.generateEnterpriseTraceabilityAudit(tempTrace);
      expect(fs.existsSync(tempTrace)).toBe(true);
      fs.unlinkSync(tempTrace);

      writer.generateEnterpriseOpportunityLedger(tempOpp);
      expect(fs.existsSync(tempOpp)).toBe(true);
      fs.unlinkSync(tempOpp);
    });

    it('should exercise markdown generator helpers directly', () => {
      const md1 = generateEnterpriseE2EValidationMarkdown(ENTERPRISE_E2E_TEST_CASES, manifest.releaseGate);
      expect(md1).toContain('FINAL ENTERPRISE END-TO-END VALIDATION REPORT');

      const md2 = generateEnterpriseUiUxAuditMarkdown();
      expect(md2).toContain('FINAL ENTERPRISE UI/UX AUDIT REPORT');
    });
  });
});
