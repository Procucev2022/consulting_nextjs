/**
 * Module 2 Lever 9 — Final Control Validation Test Suite
 * Prompt 465: Comprehensive validation of controls, baselines, isolation, persistence & Excel
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2ProcurementComplianceEngine } from '../../src/services/module2ProcurementComplianceEngine';
import { Module2ProcurementComplianceExcelBuilder } from '../../src/services/module2ProcurementComplianceExcelBuilder';
import { ComplianceAuditStore } from '../../src/services/complianceAuditStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { ComplianceReviewRecord } from '../../src/types/module2ProcurementCompliance';

describe('Prompt 465 — Lever 9 Final Control Validation', () => {
  const devDir = getDevelopmentDataDir();

  beforeAll(async () => {
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    ComplianceAuditStore.getInstance().setCustomDataDir(devDir);
    Module2CanonicalService.clearCache();
    // Warm up canonical cache
    await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
    await Module2CanonicalService.getCanonicalTransactions('AIC-2026-0003');
  }, 180000);

  describe('1. Financial Classification & Safeguard Invariants', () => {
    it('verifies ABC Textile financial classifications, labels, and zero confirmed loss', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');

      // Canonical metrics
      expect(res.summary.totalTransactionsReviewedCount).toBe(23570);
      expect(res.summary.uniqueExpenditureUnderReviewCr).toBe(149.05);

      // Defensible and verified losses must remain strictly zero
      expect(res.summary.quantifiedDefensibleExposureCr).toBe(0);
      expect(res.summary.verifiedFinancialImpactCr).toBe(0);

      // Verify labels across exceptions
      const samePoExs = res.exceptions.filter((e) => e.financialExposureStatus === 'POTENTIAL_PO_SCHEDULE_DUPLICATE');
      expect(samePoExs.length).toBeGreaterThan(0);
      for (const ex of samePoExs.slice(0, 10)) {
        expect(ex.financialExposureStatusLabel).toBe('POTENTIAL_PO_SCHEDULE_DUPLICATE — AP VERIFICATION REQUIRED');
        expect(ex.methodologyDescription).toContain('NOT confirmed duplicate payments');
      }

      const crossPoExs = res.exceptions.filter((e) => e.financialExposureStatus === 'POTENTIAL_DUPLICATE_TRANSACTION');
      expect(crossPoExs.length).toBeGreaterThan(0);
      for (const ex of crossPoExs.slice(0, 10)) {
        expect(ex.financialExposureStatusLabel).toBe('POTENTIAL_DUPLICATE_TRANSACTION — AP VERIFICATION REQUIRED');
      }

      const priceExs = res.exceptions.filter((e) => e.financialExposureStatus === 'PRICE_VARIANCE_INVESTIGATION_SIGNAL');
      expect(priceExs.length).toBeGreaterThan(0);
      for (const ex of priceExs.slice(0, 10)) {
        expect(ex.financialExposureStatusLabel).toBe('PRICE_VARIANCE_INVESTIGATION_SIGNAL');
        expect(ex.methodologyDescription).toContain('does not represent confirmed financial loss or savings');
      }
    });

    it('verifies PQR Cement financial classifications, credit handling, and zero confirmed loss', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');

      // Canonical metrics
      expect(res.summary.totalTransactionsReviewedCount).toBe(19670);
      expect(res.summary.uniqueExpenditureUnderReviewCr).toBe(172.18);
      expect(res.summary.quantifiedDefensibleExposureCr).toBe(0);
      expect(res.summary.verifiedFinancialImpactCr).toBe(0);

      // Verify HSD fuel is classified as investigation signal
      const hsdEx = res.exceptions.find((e) => e.materialCode === '7098801016');
      expect(hsdEx).toBeDefined();
      if (hsdEx) {
        expect(hsdEx.financialExposureStatus).toBe('PRICE_VARIANCE_INVESTIGATION_SIGNAL');
        expect(hsdEx.financialExposureStatusLabel).toBe('PRICE_VARIANCE_INVESTIGATION_SIGNAL');
      }
    });
  });

  describe('2. Assessment Isolation & Cross-Check Overlap Calculation', () => {
    it('ensures ABC Textile and PQR Cement metrics are completely segregated', async () => {
      const resAbc = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      const resPqr = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');

      expect(resAbc.assessmentId).toBe('AIC-2026-0002');
      expect(resAbc.summary.totalTransactionsReviewedCount).toBe(23570);
      expect(resAbc.summary.uniqueExpenditureUnderReviewCr).toBe(149.05);

      expect(resPqr.assessmentId).toBe('AIC-2026-0003');
      expect(resPqr.summary.totalTransactionsReviewedCount).toBe(19670);
      expect(resPqr.summary.uniqueExpenditureUnderReviewCr).toBe(172.18);

      // Overlap deduction verified separately
      expect(resAbc.summary.crossCheckOverlapAmountCr).toBe(31.06);
      expect(resPqr.summary.crossCheckOverlapAmountCr).toBe(0.58);
    });
  });

  describe('3. Review Workflow, Decision Persistence & Backend Restart Simulation', () => {
    it('saves a review decision, persists to disk, and survives store re-instantiation', async () => {
      const auditStore = ComplianceAuditStore.getInstance();
      auditStore.setCustomDataDir(devDir);

      const assessmentId = 'AIC-2026-0002';
      const candidateId = 'COMPL-PRC-0001';
      const reviewRecord: ComplianceReviewRecord = {
        reviewId: `REV-TEST-${Date.now()}`,
        exceptionId: candidateId,
        reviewerName: 'Lead Controller',
        reviewerRole: 'CONTROLLER',
        reviewDate: '2026-10-21',
        timestamp: new Date().toISOString(),
        previousStatus: 'AWAITING_REVIEW',
        status: 'VERIFIED_EXCEPTION',
        decision: 'VERIFY_EXCEPTION',
        technicalJustification: 'Validated pricing delta against regional rate index; requires negotiation remediation.',
        correctiveActionPlan: 'Initiate vendor rate renegotiation in Q1.'
      };

      auditStore.appendReview(assessmentId, { ...reviewRecord, candidateId });

      // Verify in-memory retrieval
      const activeReviews = auditStore.getReviewsForAssessment(assessmentId);
      expect(activeReviews[candidateId]).toBeDefined();

      // Simulate backend restart by resetting singleton and reloading from disk
      ComplianceAuditStore.resetInstance();
      const reloadedStore = ComplianceAuditStore.getInstance();
      reloadedStore.setCustomDataDir(devDir);
      const reloadedReviews = reloadedStore.getReviewsForAssessment(assessmentId);
      expect(reloadedReviews[candidateId]).toBeDefined();

      const lastReview = Array.isArray(reloadedReviews[candidateId])
        ? reloadedReviews[candidateId][reloadedReviews[candidateId].length - 1]
        : reloadedReviews[candidateId];
      expect(lastReview.status).toBe('VERIFIED_EXCEPTION');
      expect(lastReview.technicalJustification).toContain('regional rate index');

      // Verify that engine applies the persisted review
      const resWithReview = await Module2ProcurementComplianceEngine.calculateProcurementCompliance(assessmentId, {
        reviews: reloadedReviews
      });
      const reviewedEx = resWithReview.exceptions.find((e) => e.exceptionId === candidateId);
      expect(reviewedEx?.reviewStatus).toBe('VERIFIED_EXCEPTION');
      expect(resWithReview.summary.verifiedExceptionsCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Excel Export Generation & Structure Reconciliation', () => {
    it('generates multi-sheet Excel workbook for ABC Textile matching API metrics', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      const buffer = Module2ProcurementComplianceExcelBuilder.buildWorkbook(res);
      expect(buffer).toBeDefined();

      const wb = XLSX.read(buffer, { type: 'buffer' });
      expect(wb.SheetNames).toContain('Executive Summary');
      expect(wb.SheetNames).toContain('Exceptions Register');
      expect(wb.SheetNames).toContain('Control Checks Breakdown');
      expect(wb.SheetNames).toContain('Data Gaps & Coverage');
      expect(wb.SheetNames).toContain('Review Audit History');
      expect(wb.SheetNames).toContain('Methodology & Safeguards');

      const execSheet = wb.Sheets['Executive Summary'];
      const execRows = XLSX.utils.sheet_to_json(execSheet, { header: 1 }) as (string | number)[][];
      const execText = JSON.stringify(execRows);

      expect(execText).toContain('ABC Textile Ltd');
      expect(execText).toContain('AIC-2026-0002');
      expect(execText).toContain('149.05'); // Unique spend under review Cr
      expect(execText).toContain('Price-Variance Investigation Signals');
      expect(execText).toContain('Potential PO Schedule Duplicates');
      expect(execText).not.toContain('Confirmed Financial Loss');
    });

    it('generates multi-sheet Excel workbook for PQR Cement matching API metrics', async () => {
      const res = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');
      const buffer = Module2ProcurementComplianceExcelBuilder.buildWorkbook(res);
      expect(buffer).toBeDefined();

      const wb = XLSX.read(buffer, { type: 'buffer' });
      expect(wb.SheetNames.length).toBe(6);

      const execSheet = wb.Sheets['Executive Summary'];
      const execRows = XLSX.utils.sheet_to_json(execSheet, { header: 1 }) as (string | number)[][];
      const execText = JSON.stringify(execRows);

      expect(execText).toContain('PQR Cement Ltd');
      expect(execText).toContain('AIC-2026-0003');
      expect(execText).toContain('172.18'); // Unique spend under review Cr
    });
  });
});
