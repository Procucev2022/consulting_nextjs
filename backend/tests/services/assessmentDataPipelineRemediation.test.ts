/**
 * Assessment Data Pipeline Remediation & Forensic Isolation Test Suite
 * Validates all 12 audit requirements from Prompt 579:
 * 1. Borosil cannot retrieve Varroc transactions
 * 2. Borosil cannot retrieve ABC Textile results
 * 3. An assessment cannot retrieve another assessment's Module 2 opportunities
 * 4. Module 3 cannot default to another assessment
 * 5. Module 4 requires an assessment ID
 * 6. Module 4 calculations use the selected assessment's Module 2 outputs
 * 7. Hardcoded waterfall values are eliminated
 * 8. Cache keys are assessment-specific
 * 9. Report generation uses the selected customer's data
 * 10. Legacy demo data cannot contaminate actual reports
 * 11. Missing benchmark observations do not produce synthetic savings
 * 12. Reprocessing one assessment cannot alter another assessment
 */

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { db } from '../../src/services/db';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module3PcbiMappingService } from '../../src/services/module3PcbiMappingService';
import { Module4SavingsForensicEngine } from '../../src/services/module4SavingsForensicEngine';
import { module3CanonicalController } from '../../src/controllers/module3Canonical.controller';
import { module4CanonicalController } from '../../src/controllers/module4Canonical.controller';
import { getExecutiveReport } from '../../src/controllers/report.controller';
import { resolveAuthoritativeAssessment } from '../../src/utils/assessmentContextResolver';
import { getAssessmentCacheKey, CACHE_KEYS } from '../../src/constants/db';

const BOROSIL_ASSESSMENT_ID = 'AIC-2026-0002';
const VARROC_ASSESSMENT_ID = 'AIC-2026-0001';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.download = vi.fn();
  return res;
};

describe('Assessment Data Pipeline Remediation Suite (Prompt 579)', () => {
  // 1. Borosil cannot retrieve Varroc transactions
  it('1. Borosil cannot retrieve Varroc transactions', () => {
    const borosilTxs = Module2CanonicalService.getCanonicalTransactions(BOROSIL_ASSESSMENT_ID);
    const varrocTxs = Module2CanonicalService.getCanonicalTransactions(VARROC_ASSESSMENT_ID);

    expect(borosilTxs.length).toBe(27777);
    expect(varrocTxs.length).toBe(20241);

    // Verify disjoint sets: no overlap in transaction records
    const borosilVendors = new Set(borosilTxs.map((t) => t.vendor_name?.toUpperCase() || ''));
    const hasGhcl = Array.from(borosilVendors).some((v) => v.includes('GHCL'));
    expect(hasGhcl).toBe(true);
    const hasTata = Array.from(borosilVendors).some((v) => v.includes('TATA CHEMICALS'));
    expect(hasTata).toBe(false);

    // Ensure Varroc transactions cannot bleed into Borosil
    const borosilPoNumbers = new Set(borosilTxs.map((t) => t.po_number));
    expect(varrocTxs.every((v) => !borosilPoNumbers.has(v.po_number))).toBe(true);
  }, 90000);

  // 2. Borosil cannot retrieve ABC Textile results
  it('2. Borosil cannot retrieve ABC Textile results', () => {
    const borosilAssessment = resolveAuthoritativeAssessment(BOROSIL_ASSESSMENT_ID);
    expect(borosilAssessment).toBeDefined();
    expect(borosilAssessment.customerId).toBe('CUST-2026-0002');
    expect(borosilAssessment.customerName).toBe('Borosil Ltd');
    expect(borosilAssessment.customerName).not.toContain('ABC Textile');
  });

  // 3. An assessment cannot retrieve another assessment's Module 2 opportunities
  it("3. An assessment cannot retrieve another assessment's Module 2 opportunities", () => {
    const borosilLedger = Module2CanonicalService.getOpportunityLedger(BOROSIL_ASSESSMENT_ID);
    const varrocLedger = Module2CanonicalService.getOpportunityLedger(VARROC_ASSESSMENT_ID);

    expect(borosilLedger.length).toBeGreaterThan(0);
    expect(varrocLedger.length).toBeGreaterThan(0);

    const borosilOppIds = new Set(borosilLedger.map((o) => o.opportunityId));
    const varrocOppIds = new Set(varrocLedger.map((o) => o.opportunityId));

    // Must be completely partitioned
    for (const id of borosilOppIds) {
      expect(varrocOppIds.has(id)).toBe(false);
    }
  });

  // 4. Module 3 cannot default to another assessment
  it('4. Module 3 cannot default to another assessment', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await module3CanonicalController.getAuditReport(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message.toLowerCase()).toContain('assessment id is required');
  });

  // 5. Module 4 requires an assessment ID
  it('5. Module 4 requires an assessment ID', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await module4CanonicalController.getAuditReport(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('Assessment ID is required');

    await module4CanonicalController.getOpportunityLedger(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);

    await module4CanonicalController.getFinancialBridge(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // 6. Module 4 calculations use the selected assessment's Module 2 outputs and guard unapproved activation
  it("6. Module 4 calculations use the selected assessment's Module 2 outputs and guard unapproved activation", async () => {
    // For unapproved assessment (e.g. AIC-2026-0003): Module 4 must return STAGED_NOT_ACTIVATED
    const req: any = { query: { assessmentId: 'AIC-2026-0003' } };
    const res = mockResponse();

    await module4CanonicalController.getAuditReport(req as Request, res as Response);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.status).toBe('STAGED_NOT_ACTIVATED');
    expect(body.report).toBeNull();

    // Calling engine directly for unapproved assessment must throw explicit staging error
    expect(() => Module4SavingsForensicEngine.getCanonicalOpportunityLedger('AIC-2026-0003')).toThrow(
      'Module 4 is staged and not yet activated for assessment AIC-2026-0003'
    );

    // For Borosil (AIC-2026-0002): Activated with certified Module 2 outputs
    const borosilOpps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger(BOROSIL_ASSESSMENT_ID);
    expect(borosilOpps.length).toBe(105);
    const borosilBridge = Module4SavingsForensicEngine.getFinancialBridge(BOROSIL_ASSESSMENT_ID);
    expect(borosilBridge.module4NetOpportunityCr).toBe(87.1);
    expect(borosilBridge.module2AddressableSourcingSpendCr).toBe(168.658);
  });

  // 7. Hardcoded waterfall values are eliminated
  it('7. Hardcoded waterfall values are eliminated', () => {
    const consolidated = db.getConsolidatedSavings(BOROSIL_ASSESSMENT_ID);
    const waterfall = consolidated.waterfallMetrics;

    // Hardcoded values that were forbidden:
    // 613.8805 Cr total spend, 110.764 Cr gross opportunity, 25.123 Cr overlap, 85.641 Cr net opportunity
    expect(waterfall.total_spend_inr_cr).not.toBe(613.8805);
    expect(waterfall.gross_potential_savings_inr_cr).not.toBe(110.764);
    expect(waterfall.deduplicated_overlap_inr_cr).not.toBe(25.123);
    expect(waterfall.net_potential_savings_inr_cr).not.toBe(85.641);

    // Dynamic derivation matches Module 2 sourcing summary
    const canonical = Module2CanonicalService.getCanonicalInput(BOROSIL_ASSESSMENT_ID);
    const sourcing = Module2CanonicalService.getSourcingAnalysis(BOROSIL_ASSESSMENT_ID);
    expect(waterfall.total_spend_inr_cr).toBeCloseTo(canonical.totalValidatedSpendCr, 2);
    expect(waterfall.gross_potential_savings_inr_cr).toBeCloseTo(sourcing.summary.grossQuantifiableBenefitInrCr || 0, 2);
    expect(waterfall.net_potential_savings_inr_cr).toBeCloseTo(sourcing.summary.netQuantifiableOpportunityInrCr || 0, 2);
  });

  // 8. Cache keys are assessment-specific
  it('8. Cache keys are assessment-specific', () => {
    const borosilKey = getAssessmentCacheKey(CACHE_KEYS.CATEGORIES_SUMMARY, BOROSIL_ASSESSMENT_ID);
    const varrocKey = getAssessmentCacheKey(CACHE_KEYS.CATEGORIES_SUMMARY, VARROC_ASSESSMENT_ID);

    expect(borosilKey).toBe('asmt:AIC-2026-0002:categories:summary');
    expect(varrocKey).toBe('asmt:AIC-2026-0001:categories:summary');
    expect(borosilKey).not.toBe(varrocKey);

    const borosilOppsKey = getAssessmentCacheKey(CACHE_KEYS.SAVINGS_OPPORTUNITIES, BOROSIL_ASSESSMENT_ID);
    expect(borosilOppsKey).toBe('asmt:AIC-2026-0002:savings:opportunities');

    // Test getCategories caching partition
    const borosilCats = db.getCategories(BOROSIL_ASSESSMENT_ID);
    const varrocCats = db.getCategories(VARROC_ASSESSMENT_ID);
    expect(borosilCats).toBeDefined();
    expect(varrocCats).toBeDefined();
  });

  // 9. Report generation uses the selected customer's data
  it("9. Report generation uses the selected customer's data", async () => {
    const req: any = { query: { assessmentId: BOROSIL_ASSESSMENT_ID } };
    const res = mockResponse();

    await getExecutiveReport(req as Request, res as Response);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);

    const rpt = body.data;
    expect(rpt.tenant.tenant_id).toBe('CUST-2026-0002');
    expect(rpt.tenant.enterprise_name).toBe('Borosil Ltd');
    expect(rpt.executiveSummary.totalSpendEvaluatedCr).toBeCloseTo(556.5346, 2);
    expect(rpt.executiveSummary.totalLineItemsAudited).toBe(27777);
  });

  // 10. Legacy demo data cannot contaminate actual reports
  it('10. Legacy demo data cannot contaminate actual reports', async () => {
    const req: any = { query: { assessmentId: BOROSIL_ASSESSMENT_ID } };
    const res = mockResponse();

    await getExecutiveReport(req as Request, res as Response);
    const rpt = res.json.mock.calls[0][0].data;

    // Must not contain mock tenant or mock categories from mockData.ts
    expect(rpt.tenant.tenant_id).not.toBe('mock-tenant');
    expect(rpt.tenant.enterprise_name).not.toBe('Acme Corp');
    expect(rpt.executiveSummary.totalSpendEvaluatedCr).not.toBe(428.5);
  });

  // 11. Missing benchmark observations do not produce synthetic savings
  it('11. Missing benchmark observations do not produce synthetic savings', () => {
    const coverage = Module3PcbiMappingService.getCoverageSummary(BOROSIL_ASSESSMENT_ID);
    expect(coverage.mappedApprovedSpendCr).toBe(0);
    expect(coverage.mappedApprovedSpendPct).toBe(0);

    const consolidated = db.getConsolidatedSavings(BOROSIL_ASSESSMENT_ID);
    // Realized / validated PCBI savings are zero because operational benchmark coverage is 0%
    expect(consolidated.waterfallMetrics.realized_savings_inr_cr).toBe(0);
    expect(consolidated.waterfallMetrics.approved_savings_inr_cr).toBe(0);
  });

  // 12. Reprocessing one assessment cannot alter another assessment
  it('12. Reprocessing one assessment cannot alter another assessment', () => {
    const varrocSourcingBefore = Module2CanonicalService.getSourcingAnalysis(VARROC_ASSESSMENT_ID);
    const varrocSpendBefore = varrocSourcingBefore.summary.totalAddressableSpendInrCr;

    // Reprocess / invalidate Borosil cache
    db.invalidateAssessmentCache(BOROSIL_ASSESSMENT_ID);

    // Verify Varroc results remain completely unaltered
    const varrocSourcingAfter = Module2CanonicalService.getSourcingAnalysis(VARROC_ASSESSMENT_ID);
    expect(varrocSourcingAfter.summary.totalAddressableSpendInrCr).toBe(varrocSpendBefore);
  }, 90000);
});
