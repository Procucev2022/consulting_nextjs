import { describe, it, expect, beforeAll, vi } from 'vitest';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { db } from '../../src/services/db';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';

describe('PROMPT 404: Module 2 Customer Data Isolation & Handoff Tests', () => {
  beforeAll(() => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
    // Pre-warm caches for all 3 datasets
    Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
    Module2CanonicalService.getCanonicalInput('AIC-2026-0003');
    Module2CanonicalService.getCanonicalInput('AIC-2026-0001');
  }, 180000);

  describe('1. ABC Textile Data Integrity (AIC-2026-0002)', () => {
    it('returns ABC Textile canonical input with exact financial metrics', () => {
      const input = Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
      expect(input).toBeDefined();
      expect(input.sourceRowCount).toBe(23570);
      expect(input.validRowCount).toBe(23570);
      expect(input.materialGroupsCount).toBe(262);
      expect(input.suppliersCount).toBe(1291);
      expect(input.plantsCount).toBe(12);
      expect(input.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);
      expect(input.transactions.length).toBe(23570);
    });

    it('returns ABC Textile sourcing analysis with 262 categories and ₹85.6407 Cr net opportunity', () => {
      const sourcing = Module2CanonicalService.getSourcingAnalysis('AIC-2026-0002');
      expect(sourcing.profiles.length).toBe(262);
      expect(sourcing.summary.categoriesAnalyzedCount).toBe(262);
      expect(sourcing.summary.totalSpendAnalyzedInrCr).toBeCloseTo(613.8805, 3);
      expect(sourcing.summary.totalAddressableSpendInrCr).toBeCloseTo(315.0215, 3);
      expect(sourcing.summary.netQuantifiableOpportunityInrCr).toBeCloseTo(85.6407, 3);
      expect(sourcing.handoffPackages.length).toBe(190);
    });

    it('preserves 962 suspected duplicate rows in raw transactions without automated deduction', () => {
      const input = Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
      expect(input.suspectedDuplicateRowCount).toBe(962);
      expect(input.validRowCount).toBe(23570);
      expect(input.sourceRowCount).toBe(23570);
    });
  });

  describe('2. PQR Cement Data Isolation (AIC-2026-0003)', () => {
    it('returns PQR Cement data when explicitly selected', () => {
      const input = Module2CanonicalService.getCanonicalInput('AIC-2026-0003');
      expect(input).toBeDefined();
      expect(input.sourceRowCount).toBe(19670);
      expect(input.materialGroupsCount).toBe(38);
      expect(input.totalValidatedSpendCr).toBeCloseTo(262.6412, 3);

      const sourcing = Module2CanonicalService.getSourcingAnalysis('AIC-2026-0003');
      expect(sourcing.profiles.length).toBe(38);
      expect(sourcing.summary.totalSpendAnalyzedInrCr).toBeCloseTo(262.6412, 3);
    });
  });

  describe('3. VGT Regression Dataset Isolation (AIC-2026-0001)', () => {
    it('returns VGT data only when VGT is explicitly selected', () => {
      const input = Module2CanonicalService.getCanonicalInput('AIC-2026-0001');
      expect(input).toBeDefined();
      expect(input.sourceRowCount).toBe(20505);
      expect(input.validRowCount).toBe(20241);
      expect(input.totalValidatedSpendCr).toBeCloseTo(4073.8307, 3);

      const sourcing = Module2CanonicalService.getSourcingAnalysis('AIC-2026-0001');
      expect(sourcing.profiles.length).toBe(57);
      expect(sourcing.summary.totalSpendAnalyzedInrCr).toBeCloseTo(4073.8307, 3);
    });
  });

  describe('4. Explicit Errors for Missing or Invalid Assessments', () => {
    it('throws explicit error for non-existent assessment ID', () => {
      expect(() => {
        Module2CanonicalService.getCanonicalInput('AIC-NON-EXISTENT');
      }).toThrow(/was not found in persistence store/);
    });

    it('throws explicit error when assessment has no completed Module 1 run', () => {
      const store = AssessmentStore.getInstance();
      const spy = vi.spyOn(store, 'getAssessmentById').mockReturnValueOnce({
        assessmentId: 'AIC-2026-9999',
        customerName: 'Incomplete Test Customer',
        status: 'DATA_PENDING'
      } as any);
      expect(() => {
        Module2CanonicalService.getCanonicalInput('AIC-2026-9999');
      }).toThrow(/does not have completed Module 1 canonical results/);
      spy.mockRestore();
    });

    it('never silently substitutes VGT data for an invalid assessment', () => {
      try {
        Module2CanonicalService.getCanonicalInput('INVALID-TENANT-ID');
        expect.unreachable('Should have thrown an error');
      } catch (err: any) {
        expect(err.message).not.toContain('4073.8307');
        expect(err.message).toContain('was not found in persistence store');
      }
    });
  });

  describe('5. Multi-Customer Context Switching & Cache Independence', () => {
    it('switching between assessment IDs returns distinct non-stale customer data', () => {
      const textileInput = Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
      expect(textileInput.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);
      expect(textileInput.sourceRowCount).toBe(23570);

      const cementInput = Module2CanonicalService.getCanonicalInput('AIC-2026-0003');
      expect(cementInput.totalValidatedSpendCr).toBeCloseTo(262.6412, 3);
      expect(cementInput.sourceRowCount).toBe(19670);

      const vgtInput = Module2CanonicalService.getCanonicalInput('AIC-2026-0001');
      expect(vgtInput.totalValidatedSpendCr).toBeCloseTo(4073.8307, 3);
      expect(vgtInput.sourceRowCount).toBe(20505);

      // Re-fetch textile and cement to ensure zero cache pollution
      const textileRecheck = Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
      expect(textileRecheck.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);
      expect(textileRecheck.sourceRowCount).toBe(23570);

      const cementRecheck = Module2CanonicalService.getCanonicalInput('AIC-2026-0003');
      expect(cementRecheck.totalValidatedSpendCr).toBeCloseTo(262.6412, 3);
      expect(cementRecheck.sourceRowCount).toBe(19670);
    });
  });

  describe('6. All Module 2 Endpoints Respect Selected Assessment Context', () => {
    it('all database service methods produce ABC Textile data for AIC-2026-0002', () => {
      const input = db.getModule2CanonicalInput('AIC-2026-0002');
      expect(input.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);

      const analysis = db.getModule2StrategicSourcingAnalysis('AIC-2026-0002');
      expect(analysis.profiles.length).toBe(262);

      const bridge = db.getModule2MathematicalBridge('AIC-2026-0002');
      expect(bridge.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);
      expect(bridge.addressableSpendCr).toBeCloseTo(315.0215, 3);

      const ledger = db.getModule2OpportunityLedger('AIC-2026-0002');
      expect(ledger.length).toBeGreaterThan(0);

      const top50 = db.getModule2Top50Vendors('AIC-2026-0002');
      expect(top50.length).toBe(50);
      expect(top50[0].totalSpendCr).toBeGreaterThan(0);

      const risk = db.getModule2SupplierRisk('AIC-2026-0002');
      expect(risk.length).toBe(262);

      const po = db.getModule2PoConsolidation('AIC-2026-0002');
      expect(Array.isArray(po)).toBe(true);

      const recurring = db.getModule2RecurringSpend('AIC-2026-0002');
      expect(recurring.length).toBe(262);

      const txs = db.getModule2StrategicTransactions('AIC-2026-0002');
      expect(txs.length).toBe(23570);

      const handoff = db.getModule2HandoffPackages('AIC-2026-0002');
      expect(handoff.length).toBe(190);

      const singleProfile = db.getModule2StrategicProfile(analysis.profiles[0].categoryId, 'AIC-2026-0002');
      expect(singleProfile).not.toBeNull();
      expect(singleProfile?.categoryName).toBe(analysis.profiles[0].categoryName);
    });

    it('returns forensic summary for ABC Textile with reconciled bridge and 262 profiles', () => {
      const summary = Module2CanonicalService.getForensicSummary('AIC-2026-0002');
      expect(summary.canonicalInput.sourceRowCount).toBe(23570);
      expect(summary.dashboardSummary.categoriesAnalyzedCount).toBe(262);
      expect(summary.bridge.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);
      expect(summary.profiles.length).toBe(262);
      expect(summary.top50Vendors.length).toBe(50);
      expect(summary.supplierRisk.length).toBe(262);
      expect(summary.recurringSpend.length).toBe(262);
    });
  });
});
