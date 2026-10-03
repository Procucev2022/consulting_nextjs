/**
 * PCBI Ferro Molybdenum 65% Research Candidate Types & Interfaces
 * Commodity: Ferro Molybdenum 65% (PCBI-FEMO-65-001)
 * Status: UNDER_REVIEW / PARTIAL_HISTORY / METHODOLOGY_PENDING
 */

export type FeMoResearchStatus =
  | 'UNDER_REVIEW'
  | 'PARTIAL_HISTORY'
  | 'METHODOLOGY_PENDING'
  | 'PRODUCTION_READY';

export type FeMoEvidenceCategory =
  | 'SPECIFICATION_EQUIVALENT_65'
  | 'FEMO_60_INDIAN_REFERENCE'
  | 'FEMO_65_70_INTERNATIONAL_REFERENCE'
  | 'MARKET_CONTEXT';

export interface FeMoObservationRecord {
  observationId: string;
  sourceDate: string;
  sourceName: string;
  publisher: string;
  sourceGrade: string;
  rawValue: number;
  rawUnit: string;
  rawCurrency: string;
  geography: string;
  frequency: string;
  evidenceCategory: FeMoEvidenceCategory;
  evidenceStatus: string;
  inrPerMtDirectEquivalent: number | null;
  provenanceHash: string;
  sourceUrl?: string;
  notes?: string;
}

export interface FeMoSourceComparisonItem {
  sourceId: string;
  publisher: string;
  grade: string;
  geography: string;
  frequency: string;
  availableCoverage: string;
  observationCount: number;
  sourceStatus: 'PUBLIC_CANDIDATE' | 'REFERENCE_ONLY' | 'GOVERNMENT_CONTEXT' | 'PRODUCER_CONTEXT';
  strengths: string[];
  limitations: string[];
  hierarchyRank: number;
}

export interface FeMoMethodologyEvaluation {
  methodologyId: string;
  title: string;
  targetSpecification: string;
  proposedTransformation: string;
  isDefensible: boolean;
  scientificEvaluation: string;
  governanceCompliance: 'COMPLIANT' | 'REJECTED_SYNTHETIC' | 'PENDING_EMPIRICAL_VALIDATION';
  status: 'REJECTED' | 'METHODOLOGY_PENDING' | 'APPROVED_CANDIDATE';
  blockingReasons: string[];
}

export interface FeMoMissingPeriodAudit {
  gapId: string;
  periodOrTopic: string;
  missingObservationCountEst: number;
  severity: 'CRITICAL_BLOCKER' | 'MAJOR_GAP' | 'SPECIFICATION_GAP';
  finding: string;
  remedyRequired: string;
}

export interface FeMoResearchCandidatePackage {
  pcbiId: string;
  commodityName: string;
  targetSpecification: {
    grade: string;
    moContentMinPct: number;
    targetUnit: string;
    targetCurrency: string;
    targetFrequency: string;
    targetGeography: string;
    governingStandard: string;
    unspsc: string;
    requiredStartDate: string;
    requiredEndDate: string;
  };
  lifecycleState: FeMoResearchStatus;
  dataOperatingMode: 'CONTINUOUS_COMMODITY_EXPANSION';
  developmentMode: 'DEFECT_DRIVEN_ONLY';
  categoryCounts: {
    specificationEquivalent65Count: number;
    femo60IndianReferenceCount: number;
    femo6570InternationalReferenceCount: number;
    marketContextCount: number;
    totalObservations: number;
  };
  observations: FeMoObservationRecord[];
  sourceComparisonMatrix: FeMoSourceComparisonItem[];
  methodologyEvaluations: FeMoMethodologyEvaluation[];
  missingPeriodsAudit: FeMoMissingPeriodAudit[];
  feasibilityDetermination: {
    isDefensibleMethodologyEstablished: boolean;
    canPromoteToProduction: boolean;
    recommendation: 'RETAIN_UNDER_REVIEW_METHODOLOGY_PENDING' | 'APPROVE_FOR_PRODUCTION';
    rationale: string;
  };
  adminApprovalPackage: {
    submissionDate: string;
    reviewedBy: string;
    actionRequired: string;
    commodityQueueStatus: string;
    module4Implication: string;
    spendProtectedInr: number;
    spendProtectedCr: string;
  };
}

export interface FeMoTargetedRecoveryTrack {
  trackId: string;
  trackName: string;
  sourcesInvestigated: string[];
  findings: string;
  recoveredObservationsCount: number;
  recoveredContinuousSeries: boolean;
  status: 'NO_CONTINUOUS_PUBLIC_DATA' | 'DISCRETE_OBSERVATIONS_ONLY' | 'COMMERCIAL_PAYWALL' | 'EXCLUDED_NON_PRICE_SOURCE';
  limitations: string[];
}

export interface FeMoTargetedRecoveryReport {
  passTimestamp: string;
  pcbiId: string;
  lifecycleState: 'UNDER_REVIEW';
  assignedStatus: 'PARTIAL_HISTORY' | 'METHODOLOGY_PENDING';
  tracks: FeMoTargetedRecoveryTrack[];
  decisionLogicOutcome: 'DECISION_B_RETAIN_PARTIAL_HISTORY_METHODOLOGY_PENDING';
  syntheticDataPermitted: false;
  interpolationPermitted: false;
  commercialSubscriptionsCount: 0;
  remainingGapsCount: number;
  customerSpendProtectedInr: number;
  customerSpendProtectedCr: string;
}
