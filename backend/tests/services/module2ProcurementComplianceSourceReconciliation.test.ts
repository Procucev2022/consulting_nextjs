/**
 * Module 2 Lever 9 — Source Data Integrity & Financial Reconciliation Test Suite
 * Prompt 464: Validating canonical source baselines for ABC Textile and PQR Cement
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2ProcurementComplianceEngine } from '../../src/services/module2ProcurementComplianceEngine';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Prompt 464 — Lever 9 Source Data Integrity & Canonical Baseline Audit', () => {
  beforeAll(async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
    // Warm up canonical cache
    await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
    await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0003');
  }, 180000);

  describe('1. ABC Textile (AIC-2026-0002) Canonical Reconciliation', () => {
    it('verifies exact source file, row count, and ₹613.8805 Cr expenditure baseline', async () => {
      const store = AssessmentStore.getInstance();
      const assessment = store.getAssessmentById('AIC-2026-0002');
      expect(assessment).toBeDefined();
      expect(assessment?.customerName).toBe('ABC Textile Ltd');

      const versions = store.getDataVersions('AIC-2026-0002');
      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].fileName).toBe('Textile1.xlsx');

      const txs: StrategicInputTransaction[] = await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
      expect(txs.length).toBe(23570);

      let grossSpendInr = 0;
      let creditCount = 0;
      for (const t of txs) {
        const spend = Number(t.total_spend_inr) || 0;
        grossSpendInr += spend;
        if (spend < 0) creditCount++;
      }

      // ABC Textile has zero credit notes; gross equals net
      expect(creditCount).toBe(0);
      const spendInCr = Number((grossSpendInr / 1e7).toFixed(4));
      expect(spendInCr).toBe(613.8805);

      // Verify Lever 9 calculation baseline
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      expect(res.summary.totalTransactionsReviewedCount).toBe(23570);
      expect(res.summary.uniqueExpenditureUnderReviewCr).toBe(149.05);

      // Defensible exposure and verified impact must remain strictly zero
      expect(res.summary.quantifiedDefensibleExposureCr).toBe(0);
      expect(res.summary.verifiedFinancialImpactCr).toBe(0);
    });
  });

  describe('2. PQR Cement (AIC-2026-0003) Canonical Reconciliation', () => {
    it('verifies exact source file, row count, credit note, and ₹262.6412 Cr net baseline', async () => {
      const store = AssessmentStore.getInstance();
      const assessment = store.getAssessmentById('AIC-2026-0003');
      expect(assessment).toBeDefined();
      expect(assessment?.customerName).toBe('PQR Cement Ltd');

      const versions = store.getDataVersions('AIC-2026-0003');
      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].fileName).toBe('Cement2.xlsx');

      const txs: StrategicInputTransaction[] = await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0003');
      expect(txs.length).toBe(19670);

      let grossSpendInr = 0;
      let creditSpendInr = 0;
      let creditCount = 0;
      for (const t of txs) {
        const spend = Number(t.total_spend_inr) || 0;
        if (spend < 0) {
          creditSpendInr += spend;
          creditCount++;
        } else {
          grossSpendInr += spend;
        }
      }

      // Exactly 1 credit note line of -₹24,570.00
      expect(creditCount).toBe(1);
      expect(creditSpendInr).toBe(-24570);

      const grossCr = Number((grossSpendInr / 1e7).toFixed(4));
      expect(grossCr).toBe(262.6436);

      const netSpendInr = grossSpendInr + creditSpendInr;
      const netCr = Number((netSpendInr / 1e7).toFixed(4));
      expect(netCr).toBe(262.6412);

      // Verify Lever 9 calculation baseline
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');
      expect(res.summary.totalTransactionsReviewedCount).toBe(19670);
      expect(res.summary.uniqueExpenditureUnderReviewCr).toBe(172.18);

      // Defensible exposure and verified impact must remain strictly zero
      expect(res.summary.quantifiedDefensibleExposureCr).toBe(0);
      expect(res.summary.verifiedFinancialImpactCr).toBe(0);
    });
  });

  describe('3. Multi-Tenant Assessment Isolation & ID Collision Prevention', () => {
    it('verifies separate assessment results without cross-contamination', async () => {
      const [resAbc, resPqr] = await Promise.all([
        Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002'),
        Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003')
      ]);

      expect(resAbc.assessmentId).toBe('AIC-2026-0002');
      expect(resAbc.customerName).toBe('ABC Textile Ltd');
      expect(resAbc.summary.uniqueExpenditureUnderReviewCr).toBe(149.05);

      expect(resPqr.assessmentId).toBe('AIC-2026-0003');
      expect(resPqr.customerName).toBe('PQR Cement Ltd');
      expect(resPqr.summary.uniqueExpenditureUnderReviewCr).toBe(172.18);

      // Assert that neither assessment's unique spend equals the other
      expect(resAbc.summary.uniqueExpenditureUnderReviewCr).not.toBe(resPqr.summary.uniqueExpenditureUnderReviewCr);
    });
  });
});
