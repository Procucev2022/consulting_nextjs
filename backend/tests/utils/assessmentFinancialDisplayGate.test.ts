import { describe, it, expect } from 'vitest';
import {
  isAssessmentFinancialDisplayEligible,
  sanitizeAssessmentForFinancialDisplay,
  type AssessmentFinancialContext,
  type AnalysisRunGateContext
} from '../../src/utils/assessmentFinancialDisplayGate';

describe('Prompt 373: Final Assessment Financial Display Gate (Backend)', () => {
  const baseAssessment: AssessmentFinancialContext = {
    status: 'DRAFT',
    activeDataVersionId: 'DV-001',
    activeAnalysisRunId: 'RUN-001',
    totalSpendCr: 605.84,
    validatedSpendCr: 605.84,
    baselineSpendCr: 569.49,
    fxImpactCr: 36.35,
    addressableSpendCr: 109.05,
    grossOpportunityCr: 87.24,
    overlapDeductionsCr: 13.09,
    netDefensibleOpportunityCr: 74.16,
    provenOpportunityCr: 68.22,
    deliveryRangeMinCr: 8.90,
    deliveryRangeMaxCr: 20.76,
    pcbiAnalyticalSignalCr: 9.09,
    potentialSavingsCr: 74.16,
    savingsPct: 12.24
  };

  const completedRun: AnalysisRunGateContext = {
    analysisRunId: 'RUN-001',
    dataVersionId: 'DV-001',
    status: 'COMPLETED',
    allGatesPassed: true
  };

  it('1. returns false for null, undefined, or empty assessment', () => {
    expect(isAssessmentFinancialDisplayEligible(null)).toBe(false);
    expect(isAssessmentFinancialDisplayEligible(undefined)).toBe(false);
    expect(isAssessmentFinancialDisplayEligible({})).toBe(false);
  });

  it('2. returns false for a Draft assessment with populated financial fields', () => {
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'DRAFT' }, [completedRun])).toBe(false);
  });

  it('3. returns false for DATA_PENDING, UPLOADED, and VALIDATED assessments', () => {
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'DATA_PENDING' }, [completedRun])).toBe(false);
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'UPLOADED' }, [completedRun])).toBe(false);
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'VALIDATED' }, [completedRun])).toBe(false);
  });

  it('4. returns false for Module 1 completion alone (MODULE_1_READY)', () => {
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'MODULE_1_READY' }, [completedRun])).toBe(false);
  });

  it('5. returns false for PCBI_REVIEW, ANALYSIS_RUNNING, and ANALYST_REVIEW', () => {
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'ANALYSIS_RUNNING' }, [completedRun])).toBe(false);
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'PCBI_REVIEW' }, [completedRun])).toBe(false);
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'ANALYST_REVIEW' }, [completedRun])).toBe(false);
  });

  it('6. returns false for Module 4 completion / APPROVED without formal acceptance', () => {
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'APPROVED' }, [completedRun])).toBe(false);
  });

  it('7. returns false for report delivery without acceptance (DELIVERED)', () => {
    expect(isAssessmentFinancialDisplayEligible({ ...baseAssessment, status: 'DELIVERED' }, [completedRun])).toBe(false);
  });

  it('8. returns false if activeDataVersionId or activeAnalysisRunId is missing even if status is ACCEPTED', () => {
    expect(
      isAssessmentFinancialDisplayEligible({
        ...baseAssessment,
        status: 'ACCEPTED',
        activeDataVersionId: undefined
      }, [completedRun])
    ).toBe(false);

    expect(
      isAssessmentFinancialDisplayEligible({
        ...baseAssessment,
        status: 'ACCEPTED',
        activeAnalysisRunId: undefined
      }, [completedRun])
    ).toBe(false);
  });

  it('9. returns false if consolidated savings figures are missing or zero', () => {
    expect(
      isAssessmentFinancialDisplayEligible({
        ...baseAssessment,
        status: 'ACCEPTED',
        netDefensibleOpportunityCr: 0,
        potentialSavingsCr: 0
      }, [completedRun])
    ).toBe(false);
  });

  it('10. returns false if the analysis run is not COMPLETED or does not match', () => {
    const failedRun: AnalysisRunGateContext = {
      ...completedRun,
      status: 'FAILED'
    };
    expect(
      isAssessmentFinancialDisplayEligible({
        ...baseAssessment,
        status: 'ACCEPTED'
      }, [failedRun])
    ).toBe(false);

    const mismatchedRun: AnalysisRunGateContext = {
      ...completedRun,
      analysisRunId: 'RUN-999'
    };
    expect(
      isAssessmentFinancialDisplayEligible({
        ...baseAssessment,
        status: 'ACCEPTED'
      }, [mismatchedRun])
    ).toBe(false);
  });

  it('11. returns true for a fully completed and formally ACCEPTED assessment', () => {
    const acceptedAssessment: AssessmentFinancialContext = {
      ...baseAssessment,
      status: 'ACCEPTED',
      isReportAccepted: true,
      acceptedAt: '2026-10-12T00:00:00.000Z'
    };
    expect(isAssessmentFinancialDisplayEligible(acceptedAssessment, [completedRun])).toBe(true);
  });

  it('12. sanitizeAssessmentForFinancialDisplay strips all financial figures for ineligible assessment', () => {
    const sanitized = sanitizeAssessmentForFinancialDisplay({
      ...baseAssessment,
      status: 'ANALYST_REVIEW'
    }, [completedRun]);

    expect(sanitized.totalSpendCr).toBeUndefined();
    expect(sanitized.validatedSpendCr).toBeUndefined();
    expect(sanitized.baselineSpendCr).toBeUndefined();
    expect(sanitized.fxImpactCr).toBeUndefined();
    expect(sanitized.addressableSpendCr).toBeUndefined();
    expect(sanitized.grossOpportunityCr).toBeUndefined();
    expect(sanitized.overlapDeductionsCr).toBeUndefined();
    expect(sanitized.netDefensibleOpportunityCr).toBeUndefined();
    expect(sanitized.provenOpportunityCr).toBeUndefined();
    expect(sanitized.deliveryRangeMinCr).toBeUndefined();
    expect(sanitized.deliveryRangeMaxCr).toBeUndefined();
    expect(sanitized.pcbiAnalyticalSignalCr).toBeUndefined();
    expect(sanitized.potentialSavingsCr).toBeUndefined();
    expect(sanitized.savingsPct).toBeUndefined();
    expect(sanitized.status).toBe('ANALYST_REVIEW');
    expect(sanitized.activeDataVersionId).toBe('DV-001');
  });

  it('13. sanitizeAssessmentForFinancialDisplay preserves financial figures for ACCEPTED assessment', () => {
    const acceptedAssessment: AssessmentFinancialContext = {
      ...baseAssessment,
      status: 'ACCEPTED',
      isReportAccepted: true
    };
    const sanitized = sanitizeAssessmentForFinancialDisplay(acceptedAssessment, [completedRun]);

    expect(sanitized.totalSpendCr).toBe(605.84);
    expect(sanitized.validatedSpendCr).toBe(605.84);
    expect(sanitized.netDefensibleOpportunityCr).toBe(74.16);
    expect(sanitized.savingsPct).toBe(12.24);
  });
});
