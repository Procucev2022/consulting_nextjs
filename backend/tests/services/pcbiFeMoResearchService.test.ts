import { describe, it, expect, beforeEach } from 'vitest';
import { PCBIFeMoResearchService } from '../../src/services/pcbiFeMoResearchService';
import {
  FEMO_TARGET_SPECIFICATION,
  RAW_FEMO_RESEARCH_OBSERVATIONS,
  FEMO_SOURCE_COMPARISON_MATRIX,
  FEMO_METHODOLOGY_EVALUATIONS,
  FEMO_MISSING_PERIODS_AUDIT
} from '../../src/constants/pcbiFeMoResearch';

describe('PCBIFeMoResearchService (backend/src/services/pcbiFeMoResearchService.ts)', () => {
  let service: PCBIFeMoResearchService;

  beforeEach(() => {
    service = PCBIFeMoResearchService.getInstance();
  });

  it('should return singleton instance and valid research candidate package', () => {
    expect(service).toBeDefined();
    const pkg = service.getResearchCandidatePackage();
    expect(pkg.pcbiId).toBe('PCBI-FEMO-65-001');
    expect(pkg.commodityName).toBe('Ferro Molybdenum 65%');
    expect(pkg.lifecycleState).toBe('UNDER_REVIEW');
    expect(pkg.dataOperatingMode).toBe('CONTINUOUS_COMMODITY_EXPANSION');
    expect(pkg.developmentMode).toBe('DEFECT_DRIVEN_ONLY');
    expect(pkg.observations.length).toBe(20);
    expect(pkg.sourceComparisonMatrix.length).toBe(5);
    expect(pkg.methodologyEvaluations.length).toBe(3);
    expect(pkg.missingPeriodsAudit.length).toBe(4);
  });

  it('should cleanly separate evidence into the 4 mandatory governance categories', () => {
    const separation = service.getEvidenceSeparation();

    // 1. Specification-equivalent 65% (must be exactly 0 - no public series exists)
    expect(separation.SPECIFICATION_EQUIVALENT_65).toBeDefined();
    expect(separation.SPECIFICATION_EQUIVALENT_65.length).toBe(0);

    // 2. FeMo 60% Indian reference observations (18 observations from MMR & BigMint)
    expect(separation.FEMO_60_INDIAN_REFERENCE).toBeDefined();
    expect(separation.FEMO_60_INDIAN_REFERENCE.length).toBe(18);
    expect(separation.FEMO_60_INDIAN_REFERENCE.every((o) => o.sourceGrade === 'FeMo 60%')).toBe(true);
    expect(separation.FEMO_60_INDIAN_REFERENCE.every((o) => o.rawCurrency === 'INR')).toBe(true);

    // 3. FeMo 65-70% international reference observations (2 observations in USD/kg Mo)
    expect(separation.FEMO_65_70_INTERNATIONAL_REFERENCE).toBeDefined();
    expect(separation.FEMO_65_70_INTERNATIONAL_REFERENCE.length).toBe(2);
    expect(separation.FEMO_65_70_INTERNATIONAL_REFERENCE.every((o) => o.rawCurrency === 'USD')).toBe(true);

    // 4. Market context observations
    expect(separation.MARKET_CONTEXT).toBeDefined();
    expect(separation.MARKET_CONTEXT.length).toBe(0);

    // Total counts verification
    const totalCategorized =
      separation.SPECIFICATION_EQUIVALENT_65.length +
      separation.FEMO_60_INDIAN_REFERENCE.length +
      separation.FEMO_65_70_INTERNATIONAL_REFERENCE.length +
      separation.MARKET_CONTEXT.length;
    expect(totalCategorized).toBe(RAW_FEMO_RESEARCH_OBSERVATIONS.length);
  });

  it('should build and return the complete source comparison matrix across all surveyed publishers', () => {
    const matrix = service.getSourceComparisonMatrix();
    expect(matrix.length).toBe(5);

    const mmr = matrix.find((s) => s.sourceId === 'SRC-MMR-DOM');
    expect(mmr).toBeDefined();
    expect(mmr?.publisher).toContain('Minerals & Metals Review');
    expect(mmr?.grade).toContain('FeMo 60%');
    expect(mmr?.hierarchyRank).toBe(1);

    const bigMint = matrix.find((s) => s.sourceId === 'SRC-BIGMINT-DOM');
    expect(bigMint).toBeDefined();
    expect(bigMint?.publisher).toContain('BigMint');
    expect(bigMint?.hierarchyRank).toBe(2);

    const argus = matrix.find((s) => s.sourceId === 'SRC-ARGUS-INT');
    expect(argus).toBeDefined();
    expect(argus?.publisher).toContain('Argus Media');
    expect(argus?.hierarchyRank).toBe(3);

    const ibm = matrix.find((s) => s.sourceId === 'SRC-IBM-GOV');
    expect(ibm).toBeDefined();
    expect(ibm?.observationCount).toBe(0);
    expect(ibm?.limitations[0]).toContain('Does NOT publish Ferro Molybdenum prices');

    const psu = matrix.find((s) => s.sourceId === 'SRC-PSU-TENDERS');
    expect(psu).toBeDefined();
    expect(psu?.observationCount).toBe(0);
  });

  it('should determine that public evidence is insufficient to establish a defensible FeMo 65% trend index without treating FeMo60 as FeMo65', () => {
    const determination = service.evaluateMethodologyFeasibility();
    expect(determination.isDefensibleMethodologyEstablished).toBe(false);
    expect(determination.canPromoteToProduction).toBe(false);
    expect(determination.recommendation).toBe('RETAIN_UNDER_REVIEW_METHODOLOGY_PENDING');
    expect(determination.rationale).toContain('Insufficient public evidence exists');
    expect(determination.rationale).toContain('PARTIAL_HISTORY / METHODOLOGY_PENDING');
  });

  it('should audit and identify all critical missing periods', () => {
    const missing = service.getMissingPeriodsAudit();
    expect(missing.length).toBe(4);

    const gap2020 = missing.find((g) => g.gapId === 'GAP-FEMO-2020');
    expect(gap2020?.severity).toBe('CRITICAL_BLOCKER');

    const gap2022 = missing.find((g) => g.gapId === 'GAP-FEMO-2022');
    expect(gap2022?.severity).toBe('CRITICAL_BLOCKER');
    expect(gap2022?.finding).toContain('ZERO observations exist');

    const gapSpec = missing.find((g) => g.gapId === 'GAP-FEMO-SPEC-65');
    expect(gapSpec?.severity).toBe('SPECIFICATION_GAP');
  });

  it('should return Admin approval package protecting ₹1.25 Cr customer spend from unverified calculation', () => {
    const adminPkg = service.getAdminApprovalPackage();
    expect(adminPkg.actionRequired).toContain('DO NOT PROMOTE TO PRODUCTION');
    expect(adminPkg.commodityQueueStatus).toBe('UNDER_REVIEW');
    expect(adminPkg.module4Implication).toContain('OPPORTUNITY_BLOCKED_PCBI_GAP');
    expect(adminPkg.spendProtectedInr).toBe(12500000);
    expect(adminPkg.spendProtectedCr).toBe('₹1.25 Cr');
  });

  it('should reject linear chemical purity ratio (65/60) transformation as unverified synthetic pricing', () => {
    const pkg = service.getResearchCandidatePackage();
    const ratioMethod = pkg.methodologyEvaluations.find((m) => m.methodologyId === 'METH-FEMO-RATIO-01');
    expect(ratioMethod).toBeDefined();
    expect(ratioMethod?.isDefensible).toBe(false);
    expect(ratioMethod?.status).toBe('REJECTED');
    expect(ratioMethod?.governanceCompliance).toBe('REJECTED_SYNTHETIC');
    expect(ratioMethod?.blockingReasons[0]).toContain('Zero synthetic or assumed prices permitted');
  });

  it('should return APPROVE_FOR_PRODUCTION when sufficient continuous observations are provided', () => {
    const originalMethod = service.getEvidenceSeparation;
    // Mock sufficient data
    service.getEvidenceSeparation = () => ({
      SPECIFICATION_EQUIVALENT_65: [{
        observationId: 'MOCK-65',
        sourceDate: '2026-06-01',
        sourceName: 'Producer Direct',
        publisher: 'Alloy Mill',
        sourceGrade: 'FeMo 65%',
        rawValue: 3200,
        rawUnit: 'INR/kg',
        rawCurrency: 'INR',
        geography: 'India',
        frequency: 'Weekly',
        evidenceCategory: 'SPECIFICATION_EQUIVALENT_65',
        evidenceStatus: 'VERIFIED',
        inrPerMtDirectEquivalent: 3200000,
        provenanceHash: 'mockhash'
      }],
      FEMO_60_INDIAN_REFERENCE: [],
      FEMO_65_70_INTERNATIONAL_REFERENCE: [],
      MARKET_CONTEXT: []
    });

    const res = service.evaluateMethodologyFeasibility();
    expect(res.isDefensibleMethodologyEstablished).toBe(true);
    expect(res.canPromoteToProduction).toBe(true);
    expect(res.recommendation).toBe('APPROVE_FOR_PRODUCTION');

    // Restore
    service.getEvidenceSeparation = originalMethod;
  });

  it('should audit all 6 targeted data recovery tracks with zero commercial subscriptions', () => {
    const tracks = service.getTargetedRecoveryTracks();
    expect(tracks.length).toBe(6);

    const mmrTrack = tracks.find((t) => t.trackId === 'TRK-01-MMR');
    expect(mmrTrack?.recoveredContinuousSeries).toBe(false);
    expect(mmrTrack?.status).toBe('DISCRETE_OBSERVATIONS_ONLY');

    const bigMintTrack = tracks.find((t) => t.trackId === 'TRK-02-BIGMINT');
    expect(bigMintTrack?.status).toBe('COMMERCIAL_PAYWALL');

    const aifaaTrack = tracks.find((t) => t.trackId === 'TRK-03-AIFAA-PRODUCERS');
    expect(aifaaTrack?.recoveredContinuousSeries).toBe(false);

    const psuTrack = tracks.find((t) => t.trackId === 'TRK-04-PSU-PROCUREMENT');
    expect(psuTrack?.findings).toContain('fixed-price annual rate contracts');

    const intlTrack = tracks.find((t) => t.trackId === 'TRK-05-INTL-REFERENCES');
    expect(intlTrack?.status).toBe('COMMERCIAL_PAYWALL');

    const empiricalTrack = tracks.find((t) => t.trackId === 'TRK-06-EMPIRICAL-RELATIONSHIP');
    expect(empiricalTrack?.findings).toContain('No authoritative source or publisher establishes an empirical mathematical conversion factor');
  });

  it('should compile final targeted data recovery report enforcing Decision Logic B', () => {
    const report = service.getTargetedDataRecoveryReport();
    expect(report.pcbiId).toBe('PCBI-FEMO-65-001');
    expect(report.lifecycleState).toBe('UNDER_REVIEW');
    expect(report.assignedStatus).toBe('PARTIAL_HISTORY');
    expect(report.decisionLogicOutcome).toBe('DECISION_B_RETAIN_PARTIAL_HISTORY_METHODOLOGY_PENDING');
    expect(report.syntheticDataPermitted).toBe(false);
    expect(report.interpolationPermitted).toBe(false);
    expect(report.commercialSubscriptionsCount).toBe(0);
    expect(report.remainingGapsCount).toBe(4);
    expect(report.customerSpendProtectedInr).toBe(12500000);
    expect(report.customerSpendProtectedCr).toBe('₹1.25 Cr');
    expect(report.tracks.length).toBe(6);
  });
});

