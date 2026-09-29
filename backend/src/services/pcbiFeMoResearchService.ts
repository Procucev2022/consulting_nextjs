/**
 * PCBI Ferro Molybdenum 65% Research Service
 * Handles ingestion, evidence separation, source comparison, and governance evaluation
 * for PCBI-FEMO-65-001 under UNDER_REVIEW.
 */

import logger from '../utils/logger';
import {
  FEMO_TARGET_SPECIFICATION,
  RAW_FEMO_RESEARCH_OBSERVATIONS,
  FEMO_SOURCE_COMPARISON_MATRIX,
  FEMO_METHODOLOGY_EVALUATIONS,
  FEMO_MISSING_PERIODS_AUDIT,
  FEMO_TARGETED_RECOVERY_TRACKS,
  FEMO_TARGETED_RECOVERY_REPORT
} from '../constants/pcbiFeMoResearch';
import type {
  FeMoResearchCandidatePackage,
  FeMoObservationRecord,
  FeMoEvidenceCategory,
  FeMoSourceComparisonItem,
  FeMoMissingPeriodAudit,
  FeMoTargetedRecoveryReport
} from '../types/pcbiFeMoResearch';

export class PCBIFeMoResearchService {
  private static instance: PCBIFeMoResearchService;

  public static getInstance(): PCBIFeMoResearchService {
    if (!PCBIFeMoResearchService.instance) {
      PCBIFeMoResearchService.instance = new PCBIFeMoResearchService();
    }
    return PCBIFeMoResearchService.instance;
  }

  /**
   * Retrieves the comprehensive research candidate package for PCBI-FEMO-65-001
   */
  public getResearchCandidatePackage(): FeMoResearchCandidatePackage {
    logger.info('Retrieving PCBI Ferro Molybdenum 65% Research Candidate Package', {
      pcbiId: FEMO_TARGET_SPECIFICATION.pcbiId,
      status: 'UNDER_REVIEW'
    });

    const categoryObservations = this.getEvidenceSeparation();

    return {
      pcbiId: FEMO_TARGET_SPECIFICATION.pcbiId,
      commodityName: FEMO_TARGET_SPECIFICATION.commodityName,
      targetSpecification: FEMO_TARGET_SPECIFICATION,
      lifecycleState: 'UNDER_REVIEW',
      dataOperatingMode: 'CONTINUOUS_COMMODITY_EXPANSION',
      developmentMode: 'DEFECT_DRIVEN_ONLY',
      categoryCounts: {
        specificationEquivalent65Count: categoryObservations.SPECIFICATION_EQUIVALENT_65.length,
        femo60IndianReferenceCount: categoryObservations.FEMO_60_INDIAN_REFERENCE.length,
        femo6570InternationalReferenceCount: categoryObservations.FEMO_65_70_INTERNATIONAL_REFERENCE.length,
        marketContextCount: categoryObservations.MARKET_CONTEXT.length,
        totalObservations: RAW_FEMO_RESEARCH_OBSERVATIONS.length
      },
      observations: [...RAW_FEMO_RESEARCH_OBSERVATIONS],
      sourceComparisonMatrix: [...FEMO_SOURCE_COMPARISON_MATRIX],
      methodologyEvaluations: [...FEMO_METHODOLOGY_EVALUATIONS],
      missingPeriodsAudit: [...FEMO_MISSING_PERIODS_AUDIT],
      feasibilityDetermination: this.evaluateMethodologyFeasibility(),
      adminApprovalPackage: this.getAdminApprovalPackage()
    };
  }

  /**
   * Separates research evidence into the 4 required categories
   */
  public getEvidenceSeparation(): Record<FeMoEvidenceCategory, FeMoObservationRecord[]> {
    logger.info('Separating PCBI FeMo evidence into 4 distinct governance categories');

    const result: Record<FeMoEvidenceCategory, FeMoObservationRecord[]> = {
      SPECIFICATION_EQUIVALENT_65: [],
      FEMO_60_INDIAN_REFERENCE: [],
      FEMO_65_70_INTERNATIONAL_REFERENCE: [],
      MARKET_CONTEXT: []
    };

    for (const obs of RAW_FEMO_RESEARCH_OBSERVATIONS) {
      if (obs.evidenceCategory in result) {
        result[obs.evidenceCategory].push(obs);
      }
    }

    return result;
  }

  /**
   * Retrieves the source comparison matrix across all surveyed publishers
   */
  public getSourceComparisonMatrix(): FeMoSourceComparisonItem[] {
    logger.info('Fetching PCBI FeMo Source Comparison Matrix');
    return [...FEMO_SOURCE_COMPARISON_MATRIX];
  }

  /**
   * Evaluates whether a defensible methodology can be established to derive
   * a PCBI FeMo 65% trend index without treating FeMo60 as the FeMo65 price
   */
  public evaluateMethodologyFeasibility(): {
    isDefensibleMethodologyEstablished: boolean;
    canPromoteToProduction: boolean;
    recommendation: 'RETAIN_UNDER_REVIEW_METHODOLOGY_PENDING' | 'APPROVE_FOR_PRODUCTION';
    rationale: string;
  } {
    logger.info('Evaluating PCBI FeMo 65% methodology defensibility');

    // 1. Check specification-equivalent 65% data
    const categorySeparation = this.getEvidenceSeparation();
    const hasDirect65Observations = categorySeparation.SPECIFICATION_EQUIVALENT_65.length > 0;

    // 2. Check FeMo 60 continuous time series (need minimum unbroken weekly series)
    const indian60Count = categorySeparation.FEMO_60_INDIAN_REFERENCE.length;
    const isIndian60Continuous = indian60Count >= 300; // Expected ~339 weeks between 2020 and 2026

    // 3. Evaluate defensibility
    if (!hasDirect65Observations && !isIndian60Continuous) {
      return {
        isDefensibleMethodologyEstablished: false,
        canPromoteToProduction: false,
        recommendation: 'RETAIN_UNDER_REVIEW_METHODOLOGY_PENDING',
        rationale:
          'Insufficient public evidence exists to construct a certified PCBI FeMo 65% trend index. Zero direct FeMo 65% Indian domestic observations exist, and the FeMo 60% series in the public pack is highly fragmented (18 scattered observations over 6 years with complete year 2022 missing). Treating FeMo 60% directly as FeMo 65% price or applying a static 65/60 linear purity ratio is scientifically invalid and violates core governance rules prohibiting synthetic pricing. The commodity must be retained as PARTIAL_HISTORY / METHODOLOGY_PENDING under UNDER_REVIEW.'
      };
    }

    return {
      isDefensibleMethodologyEstablished: true,
      canPromoteToProduction: true,
      recommendation: 'APPROVE_FOR_PRODUCTION',
      rationale: 'Sufficient continuous evidence verified.'
    };
  }

  /**
   * Returns the exact missing periods and required evidence
   */
  public getMissingPeriodsAudit(): FeMoMissingPeriodAudit[] {
    logger.info('Auditing PCBI FeMo missing periods');
    return [...FEMO_MISSING_PERIODS_AUDIT];
  }

  /**
   * Generates the Admin approval package retaining the commodity under review
   */
  public getAdminApprovalPackage(): {
    submissionDate: string;
    reviewedBy: string;
    actionRequired: string;
    commodityQueueStatus: string;
    module4Implication: string;
    spendProtectedInr: number;
    spendProtectedCr: string;
  } {
    logger.info('Generating PCBI FeMo Admin Approval Package');
    return {
      submissionDate: '2026-09-28T22:30:00.000Z',
      reviewedBy: 'PCBI Lead Research & Governance Auditor',
      actionRequired:
        'DO NOT PROMOTE TO PRODUCTION. Retain commodity series PCBI-FEMO-65-001 in Admin Research Queue under UNDER_REVIEW with status PARTIAL_HISTORY / METHODOLOGY_PENDING. Solicit continuous 2020-2026 weekly Indian FeMo 60% data from commercial data providers or source empirical simultaneous 60/65 transaction logs from domestic alloy steel mills.',
      commodityQueueStatus: 'UNDER_REVIEW',
      module4Implication:
        'Module 4 status gate strictly active: all customer transactions matching UNSPSC 30102700 / Ferro Molybdenum 65% remain categorized as OPPORTUNITY_BLOCKED_PCBI_GAP. Zero synthetic savings permitted.',
      spendProtectedInr: FEMO_TARGET_SPECIFICATION.customerSpendInr,
      spendProtectedCr: FEMO_TARGET_SPECIFICATION.customerSpendCr
    };
  }

  /**
   * Retrieves the targeted recovery tracks audited during the final recovery pass
   */
  public getTargetedRecoveryTracks(): typeof FEMO_TARGETED_RECOVERY_TRACKS {
    logger.info('Fetching PCBI FeMo Targeted Recovery Tracks');
    return [...FEMO_TARGETED_RECOVERY_TRACKS];
  }

  /**
   * Retrieves the final targeted recovery report enforcing Decision Logic B
   */
  public getTargetedDataRecoveryReport(): FeMoTargetedRecoveryReport {
    logger.info('Compiling PCBI FeMo Final Targeted Data Recovery Report');
    return {
      ...FEMO_TARGETED_RECOVERY_REPORT,
      tracks: [...FEMO_TARGETED_RECOVERY_TRACKS]
    };
  }
}

export const pcbiFeMoResearchService = PCBIFeMoResearchService.getInstance();

