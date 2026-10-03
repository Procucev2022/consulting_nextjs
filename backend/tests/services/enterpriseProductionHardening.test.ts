import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { enterpriseHardeningService } from '../../src/services/enterpriseHardeningService';
import { enterpriseHardeningExcelWriter } from '../../src/services/enterpriseHardeningExcelWriter';
import { generateFinalSystemE2EValidationMarkdown } from '../../src/services/enterpriseHardeningMarkdown';
import {
  generateFinalUiUxValidationMarkdown,
  generateFinalProductionReadinessReportMarkdown
} from '../../src/services/enterpriseUiUxMarkdown';
import type { EnterpriseAuditManifest } from '../../src/types/enterpriseHardeningTypes';

describe('Enterprise Production Hardening (Prompt 250 — Modules 1 -> 4)', () => {
  let manifest: EnterpriseAuditManifest;

  beforeAll(() => {
    manifest = enterpriseHardeningService.executeEnterpriseHardening();
  });

  describe('Part Y — Mandatory 10 Final Artifacts Verification', () => {
    it('1. should verify FINAL_SYSTEM_E2E_VALIDATION.md exists and certifies PRODUCTION_READY', () => {
      const p = path.resolve(process.cwd(), 'FINAL_SYSTEM_E2E_VALIDATION.md');
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('FINAL_SYSTEM_STATUS = PRODUCTION_READY');
      expect(content).toContain('Part A — Architectural Freeze Certification');
      expect(content).toContain('Part W — 40 Adversarial Scenarios Audit');
      expect(content).toContain('Part X — Numerical Invariants Matrix');
    });

    it('2. should verify MODULE_1_FINAL_CALCULATION_AUDIT.xlsx exists and has valid size', () => {
      const p = path.resolve(process.cwd(), 'MODULE_1_FINAL_CALCULATION_AUDIT.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const stats = fs.statSync(p);
      expect(stats.size).toBeGreaterThan(100000);
    });

    it('3. should verify MODULE_2_FINAL_OPPORTUNITY_AUDIT.xlsx exists and has Opportunity Summary and Overlap Waterfall', () => {
      const p = path.resolve(process.cwd(), 'MODULE_2_FINAL_OPPORTUNITY_AUDIT.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const wb = xlsx.readFile(p);
      expect(wb.SheetNames).toContain('Opportunity Summary');
      expect(wb.SheetNames).toContain('Overlap Waterfall');
    });

    it('4. should verify MODULE_3_FINAL_PCBI_INTEGRITY_AUDIT.xlsx exists and contains PCBI Catalog and Price Isolation Audit', () => {
      const p = path.resolve(process.cwd(), 'MODULE_3_FINAL_PCBI_INTEGRITY_AUDIT.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const wb = xlsx.readFile(p);
      expect(wb.SheetNames).toContain('PCBI Catalog');
      expect(wb.SheetNames).toContain('Price Isolation Audit');
    });

    it('5. should verify MODULE_4_FINAL_HANDOFF_AUDIT.xlsx exists and has Approved Packages and Governance', () => {
      const p = path.resolve(process.cwd(), 'MODULE_4_FINAL_HANDOFF_AUDIT.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const wb = xlsx.readFile(p);
      expect(wb.SheetNames).toContain('Approved Packages');
      expect(wb.SheetNames).toContain('Governance & Sign-Off');
    });

    it('6. should verify FINAL_MODULE_1_TO_4_RECONCILIATION.xlsx exists and has Pipeline Waterfall and Invariants Matrix', () => {
      const p = path.resolve(process.cwd(), 'FINAL_MODULE_1_TO_4_RECONCILIATION.xlsx');
      expect(fs.existsSync(p)).toBe(true);
      const wb = xlsx.readFile(p);
      expect(wb.SheetNames).toContain('Pipeline Waterfall');
      expect(wb.SheetNames).toContain('Invariants Matrix');
    });

    it('7. should verify FINAL_SYSTEM_E2E_AUDIT.json contains complete manifest and PRODUCTION_READY', () => {
      const p = path.resolve(process.cwd(), 'FINAL_SYSTEM_E2E_AUDIT.json');
      expect(fs.existsSync(p)).toBe(true);
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      expect(data.certification.finalSystemStatus).toBe('PRODUCTION_READY');
      expect(data.certification.module1Status).toBe('PASS');
      expect(data.certification.module2Status).toBe('PASS');
      expect(data.certification.module3Status).toBe('PASS');
      expect(data.certification.module4Status).toBe('PASS');
      expect(data.certification.doubleCountingControl).toBe('PASS');
      expect(data.datasetScope.totalSpendCr).toBe(5920.35);
    });

    it('8. should verify FINAL_SYSTEM_E2E_TEST_RESULTS.json contains all 40 adversarial scenarios passing', () => {
      const p = path.resolve(process.cwd(), 'FINAL_SYSTEM_E2E_TEST_RESULTS.json');
      expect(fs.existsSync(p)).toBe(true);
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      expect(data.status).toBe('PASS');
      expect(data.totalScenarios).toBe(40);
      expect(data.passedScenarios).toBe(40);
      expect(data.failedScenarios).toBe(0);
      for (let i = 1; i <= 40; i++) {
        const scenario = data.scenarios.find((s: { scenarioNumber: number }) => s.scenarioNumber === i);
        expect(scenario).toBeDefined();
        expect(scenario.status).toBe('PASS');
      }
    });

    it('9. should verify FINAL_UI_UX_VALIDATION.md exists and covers 3-level hierarchy and expanders', () => {
      const p = path.resolve(process.cwd(), 'FINAL_UI_UX_VALIDATION.md');
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('UI_UX_VALIDATION = PASS');
      expect(content).toContain('Executive-First Information Design');
      expect(content).toContain('Progressive Disclosure & Expanders');
      expect(content).toContain('Display-Level Safety & Error Prevention');
    });

    it('10. should verify FINAL_PRODUCTION_READINESS_REPORT.md exists and certifies PRODUCTION_READY', () => {
      const p = path.resolve(process.cwd(), 'FINAL_PRODUCTION_READINESS_REPORT.md');
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('PRODUCTION_READY');
      expect(content).toContain('FINAL SYSTEM STATUS');
      expect(content).toContain('Final Production Gate Matrix');
    });
  });

  describe('Part X — Numerical Invariants Verification', () => {
    it('should verify all 7 numerical invariants balance with 0 variance', () => {
      const invariants = enterpriseHardeningService.evaluateNumericalInvariants();
      expect(invariants.length).toBe(7);
      for (const inv of invariants) {
        expect(inv.variance).toBe(0.00);
        expect(inv.status).toBe('PASS');
      }
    });
  });

  describe('Direct Service Edge Case & Generator Branch Coverage', () => {
    it('should exercise enterpriseHardeningExcelWriter methods with custom output path', () => {
      const tempMod2 = path.resolve(process.cwd(), 'temp_mod2_test.xlsx');
      const tempMod3 = path.resolve(process.cwd(), 'temp_mod3_test.xlsx');
      const tempMod4 = path.resolve(process.cwd(), 'temp_mod4_test.xlsx');
      const tempRecon = path.resolve(process.cwd(), 'temp_recon_test.xlsx');

      enterpriseHardeningExcelWriter.generateModule2OpportunityWorkbook(tempMod2);
      expect(fs.existsSync(tempMod2)).toBe(true);
      fs.unlinkSync(tempMod2);

      enterpriseHardeningExcelWriter.generateModule3PcbiWorkbook(tempMod3);
      expect(fs.existsSync(tempMod3)).toBe(true);
      fs.unlinkSync(tempMod3);

      enterpriseHardeningExcelWriter.generateModule4HandoffWorkbook(tempMod4);
      expect(fs.existsSync(tempMod4)).toBe(true);
      fs.unlinkSync(tempMod4);

      enterpriseHardeningExcelWriter.generateModule1To4ReconciliationWorkbook(tempRecon);
      expect(fs.existsSync(tempRecon)).toBe(true);
      fs.unlinkSync(tempRecon);
    });

    it('should exercise markdown generation helpers directly', () => {
      const md1 = generateFinalSystemE2EValidationMarkdown(
        manifest.waterfall,
        manifest.invariants,
        manifest.invariants.map((_, i) => ({
          scenarioNumber: i + 1,
          scenarioName: `Scenario ${i + 1}`,
          description: 'Desc',
          targetModule: 'MODULE_1' as const,
          expectedBehavior: 'Exp',
          actualBehavior: 'Act',
          quarantineOrAuditStatus: 'VERIFIED',
          status: 'PASS' as const
        }))
      );
      expect(md1).toContain('FINAL SYSTEM END-TO-END VALIDATION REPORT');

      const md2 = generateFinalUiUxValidationMarkdown();
      expect(md2).toContain('FINAL ENTERPRISE UI/UX VALIDATION REPORT');

      const md3 = generateFinalProductionReadinessReportMarkdown(manifest.certification);
      expect(md3).toContain('FINAL PRODUCTION READINESS REPORT');
    });
  });
});
