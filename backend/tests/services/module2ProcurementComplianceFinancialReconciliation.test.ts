import { describe, it, expect, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import { Module2ProcurementComplianceEngine } from '../../src/services/module2ProcurementComplianceEngine';
import { Module2ProcurementComplianceExcelBuilder } from '../../src/services/module2ProcurementComplianceExcelBuilder';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { ComplianceAuditStore } from '../../src/services/complianceAuditStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Prompt 463 — Lever 9 Financial Classification and Acceptance', () => {
  beforeAll(async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    ComplianceAuditStore.getInstance().setCustomDataDir(devDir);
    Module2CanonicalService.clearCache();
    await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
    await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0003');
  }, 180000);

  describe('1. ABC Textile (AIC-2026-0002) Financial Classification & Reconciliation', () => {
    it('reconciles source data, expenditure under review, and separated financial metrics', async () => {
      const txs: StrategicInputTransaction[] = await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
      expect(txs.length).toBe(23570);

      const totalSourceSpend = txs.reduce((sum, t) => sum + (Number(t.total_spend_inr) || 0), 0);
      expect(Number((totalSourceSpend / 1e7).toFixed(2))).toBe(613.88);

      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      expect(res.customerName).toBe('ABC Textile Ltd');
      expect(res.summary.totalTransactionsReviewedCount).toBe(23570);
      expect(res.summary.totalExceptionsIdentifiedCount).toBe(1670);

      // Reconciles unique expenditure under review
      expect(res.summary.uniqueExpenditureUnderReviewCr).toBe(149.05);

      // Separated Prompt 463 financial metrics
      expect(res.summary.priceVarianceInvestigationCr).toBe(30.15);
      expect(res.summary.samePoScheduleDuplicateCr).toBe(109.92);
      expect(res.summary.crossPoDuplicateCr).toBe(0.44);
      expect(res.summary.totalAwaitingApVerificationCr).toBe(110.36);

      // Defensible and verified losses must remain ₹0.00
      expect(res.summary.quantifiedDefensibleExposureCr).toBe(0);
      expect(res.summary.verifiedFinancialImpactCr).toBe(0);
      expect(res.summary.verifiedExceptionsCount).toBe(0);

      // Overlap kept outside consolidated figures
      expect(res.summary.crossCheckOverlapAmountCr).toBeGreaterThan(0);
    });

    it('classifies price variance exceptions as PRICE_VARIANCE_INVESTIGATION_SIGNAL', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      const priceExs = res.exceptions.filter((e) => e.checkType === 'PRICE_INCONSISTENCY');
      expect(priceExs.length).toBe(284);

      for (const ex of priceExs.slice(0, 25)) {
        expect(ex.financialExposureStatus).toBe('PRICE_VARIANCE_INVESTIGATION_SIGNAL');
        expect(ex.financialExposureStatusLabel).toBe('PRICE_VARIANCE_INVESTIGATION_SIGNAL');
        expect(ex.methodologyDescription).toContain(
          'Historical minimum price is not treated as an achievable commercial baseline'
        );
        expect(ex.methodologyDescription).toContain('does not represent confirmed financial loss or savings');
      }
    });

    it('classifies same-PO duplicates as POTENTIAL_PO_SCHEDULE_DUPLICATE without claiming loss', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      const dupExs = res.exceptions.filter(
        (e) => e.checkType === 'PO_TRANSACTION_EXCEPTION' && e.ruleIdentifier?.includes('DUP') !== false
      );

      const samePoExs = dupExs.filter((e) => e.financialExposureStatus === 'POTENTIAL_PO_SCHEDULE_DUPLICATE');
      const crossPoExs = dupExs.filter((e) => e.financialExposureStatus === 'POTENTIAL_DUPLICATE_TRANSACTION');

      expect(samePoExs.length).toBe(1277);
      expect(crossPoExs.length).toBe(104);

      for (const ex of samePoExs.slice(0, 10)) {
        expect(ex.checkTitle).toContain('Potential PO Schedule Duplicate (AP Verification Required)');
        expect(ex.methodologyDescription).toContain(
          'These represent scheduled delivery batches under a single PO and are NOT confirmed duplicate payments'
        );
        expect(ex.evidenceDetails.some((d) => d.includes('zero confirmed loss claimed'))).toBe(true);
      }

      for (const ex of crossPoExs.slice(0, 10)) {
        expect(ex.checkTitle).toContain('Potential Cross-PO Duplicate Transaction (AP Verification Required)');
        expect(ex.methodologyDescription).toContain(
          'Classified as POTENTIAL_DUPLICATE_TRANSACTION — AP VERIFICATION REQUIRED'
        );
      }
    });

    it('verifies missing invoice and payment references in source data', async () => {
      const txs: StrategicInputTransaction[] = await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
      const txsWithInvoice = txs.filter((t) => {
        const rec = t as unknown as Record<string, unknown>;
        return Boolean(rec.invoice_number || rec.invoice_no);
      });
      const txsWithPayment = txs.filter((t) => {
        const rec = t as unknown as Record<string, unknown>;
        return Boolean(rec.payment_doc || rec.clearing_doc);
      });

      expect(txsWithInvoice.length).toBe(0);
      expect(txsWithPayment.length).toBe(0);
    });

    it('identifies and quantifies cross-check overlaps', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      expect(res.summary.crossCheckOverlapAmountCr).toBeGreaterThan(0);
    });
  });

  describe('2. PQR Cement (AIC-2026-0003) Financial Classification & Reconciliation', () => {
    it('reconciles source data, expenditure under review, and separated metrics', async () => {
      const txs: StrategicInputTransaction[] = await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0003');
      expect(txs.length).toBe(19670);

      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');
      expect(res.customerName).toBe('PQR Cement Ltd');
      expect(res.summary.uniqueExpenditureUnderReviewCr).toBe(172.18);
      expect(res.summary.priceVarianceInvestigationCr).toBe(22.24);
      expect(res.summary.samePoScheduleDuplicateCr).toBe(2.28);
      expect(res.summary.crossPoDuplicateCr).toBe(0.11);
      expect(res.summary.quantifiedDefensibleExposureCr).toBe(0);
      expect(res.summary.verifiedFinancialImpactCr).toBe(0);
    });

    it('validates HSD price variance without applying assumed commodity adjustments', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');
      const hsdEx = res.exceptions.find((e) => e.materialCode === '7098801016');
      expect(hsdEx).toBeDefined();
      if (hsdEx) {
        expect(hsdEx.financialExposureStatus).toBe('PRICE_VARIANCE_INVESTIGATION_SIGNAL');
        expect(hsdEx.potentialFinancialExposureCr).toBeGreaterThan(7.0);
        expect(hsdEx.methodologyDescription).toContain('PRICE_VARIANCE_INVESTIGATION_SIGNAL');
      }
    });

    it('handles negative credit note reversal without positive exposure', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');
      const reversalEx = res.exceptions.find((e) => e.exceptionId === 'COMPL-CR-0001');
      expect(reversalEx).toBeDefined();
      if (reversalEx) {
        expect(reversalEx.potentialFinancialExposureInr).toBe(0);
      }
    });
  });

  describe('3. Excel Export Reconciliation', () => {
    it('generates multi-sheet Excel workbook reconciling dashboard metrics against source data', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      const buffer = Module2ProcurementComplianceExcelBuilder.buildWorkbook(res);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(50000);

      const wb = XLSX.read(buffer, { type: 'buffer' });
      expect(wb.SheetNames.length).toBe(6);
      expect(wb.SheetNames).toContain('Executive Summary');
      expect(wb.SheetNames).toContain('Exceptions Register');
      expect(wb.SheetNames).toContain('Methodology & Safeguards');

      const execSheet = wb.Sheets['Executive Summary'];
      const execText = JSON.stringify(XLSX.utils.sheet_to_json(execSheet));
      expect(execText).toContain('Unique Expenditure Under Review');
      expect(execText).toContain('Price-Variance Investigation Signals');
      expect(execText).toContain('Potential PO Schedule Duplicates');
      expect(execText).toContain('Verified Financial Impact');
    });
  });
});
