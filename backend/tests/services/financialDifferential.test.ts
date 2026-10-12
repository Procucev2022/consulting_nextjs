import { describe, it, expect } from 'vitest';
import { assessmentWorkflowService } from '../../src/services/assessmentWorkflowService';
import { assessmentStore } from '../../src/services/assessmentStore';
import { REVIEW_GATES, ASSESSMENT_ROLES } from '../../src/constants';

describe('Financial Differential Test (Zero Variance Guarantee)', () => {
  it('confirms zero variance against authoritative VGT figures (Prompt 335 requirement Q)', () => {
    let vgt = assessmentStore.getById('AIC-2026-0001');
    if (!vgt || typeof vgt.potentialSavingsCr !== 'number') {
      assessmentStore.seedAuthoritativeVgtAssessment();
      vgt = assessmentStore.getById('AIC-2026-0001');
    }
    expect(vgt).toBeDefined();

    // Authoritative Invariants
    const EXPECTED_TOTAL_SPEND_CR = 4073.8307;
    const EXPECTED_VALIDATED_SPEND_CR = 4073.8307;
    const EXPECTED_BASELINE_SPEND_CR = 3920.3277;
    const EXPECTED_FX_IMPACT_CR = 153.5029;
    const EXPECTED_POTENTIAL_SAVINGS_CR = 378.4;
    const EXPECTED_SAVINGS_PCT = 9.29;

    expect(vgt?.totalSpendCr).toBe(EXPECTED_TOTAL_SPEND_CR);
    expect(vgt?.validatedSpendCr).toBe(EXPECTED_VALIDATED_SPEND_CR);
    expect(vgt?.baselineSpendCr).toBe(EXPECTED_BASELINE_SPEND_CR);
    expect(vgt?.fxImpactCr).toBe(EXPECTED_FX_IMPACT_CR);
    expect(vgt?.potentialSavingsCr).toBe(EXPECTED_POTENTIAL_SAVINGS_CR);
    expect(vgt?.savingsPct).toBe(EXPECTED_SAVINGS_PCT);

    // Sum verification: baseline + FX impact approximates validated spend within 0.0002 rounding
    const sumSpend = (vgt?.baselineSpendCr || 0) + (vgt?.fxImpactCr || 0);
    expect(Math.abs(sumSpend - EXPECTED_VALIDATED_SPEND_CR)).toBeLessThanOrEqual(0.0002);

    // Differential variance MUST be exactly 0
    const varianceSpend = Math.abs((vgt?.validatedSpendCr || 0) - EXPECTED_VALIDATED_SPEND_CR);
    const varianceBaseline = Math.abs((vgt?.baselineSpendCr || 0) - EXPECTED_BASELINE_SPEND_CR);
    const varianceFx = Math.abs((vgt?.fxImpactCr || 0) - EXPECTED_FX_IMPACT_CR);

    expect(varianceSpend).toBe(0);
    expect(varianceBaseline).toBe(0);
    expect(varianceFx).toBe(0);
  });

  it('verifies analysis run outputs maintain canonical metrics', () => {
    const { analysisRun } = assessmentWorkflowService.runAnalysis(
      'AIC-2026-0001',
      'DV-001',
      'admin@procucev.com',
      ASSESSMENT_ROLES.INTERNAL_ADMIN
    );

    expect(analysisRun.totalSpendCr).toBe(4073.8307);
    expect(analysisRun.validatedSpendCr).toBe(4073.8307);
    expect(analysisRun.potentialSavingsCr).toBe(378.4);
    expect(analysisRun.savingsPct).toBe(9.29);

    // All 34 review gates (26 mandatory module gates + 8 summary gates) must evaluate to true
    expect(analysisRun.reviewGates).toHaveLength(34);
    const allPassed = analysisRun.reviewGates.every((g) => g.passed);
    expect(allPassed).toBe(true);

    const m1Gate = analysisRun.reviewGates.find((g) => g.gate === REVIEW_GATES.MODULE_1_RECONCILIATION);
    expect(m1Gate?.passed).toBe(true);
  }, 35000);
});
