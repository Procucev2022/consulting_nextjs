/**
 * Module 3 PCBI Phase 3 / 3A — Observation Provenance & Forensic Validation Gate Service
 * Enforces strict provenance gates, rejects unverified synthetic prices, and quarantines unverified sources.
 */

import {
  BOROSIL_RECONCILED_COVERAGE_REGISTER,
  BOROSIL_ACQUIRED_BENCHMARK_OBSERVATIONS,
  BOROSIL_QUARANTINED_OBSERVATIONS,
  BOROSIL_CROSS_PHASE_COVERAGE_RECONCILIATION
} from '../constants/module3PcbiObservationProvenance';
import type {
  ObservationProvenanceRecord,
  ObservationValidationStatus,
  ReconciledCoverageRegister,
  Phase3CrossReconciliationRegister
} from '../types/module3PcbiObservationProvenance';
import logger from '../utils/logger';

export class Module3PcbiObservationService {
  private static observationsStore = new Map<string, ObservationProvenanceRecord>();
  private static quarantinedStore = new Map<string, ObservationProvenanceRecord>();
  private static allCandidateStore = new Map<string, ObservationProvenanceRecord>();

  static {
    this.resetStores();
  }

  public static getReconciledCoverage(assessmentId: string): ReconciledCoverageRegister {
    logger.info('Retrieving Borosil reconciled benchmark coverage register', { assessmentId });
    if (assessmentId !== 'AIC-2026-0002') {
      throw new Error(`Assessment '${assessmentId}' was not found in persistence store.`);
    }
    return JSON.parse(JSON.stringify(BOROSIL_RECONCILED_COVERAGE_REGISTER));
  }

  public static getCrossPhaseReconciliation(assessmentId: string): Phase3CrossReconciliationRegister {
    logger.info('Retrieving Borosil cross-phase coverage reconciliation', { assessmentId });
    if (assessmentId !== 'AIC-2026-0002') {
      throw new Error(`Assessment '${assessmentId}' was not found in persistence store.`);
    }
    return JSON.parse(JSON.stringify(BOROSIL_CROSS_PHASE_COVERAGE_RECONCILIATION));
  }

  public static getAcquiredObservations(benchmarkSeriesId?: string): ObservationProvenanceRecord[] {
    logger.info('Fetching validated acquired benchmark observations', { benchmarkSeriesId });
    const list = Array.from(this.observationsStore.values());
    if (!benchmarkSeriesId) {
      return list.map((o) => JSON.parse(JSON.stringify(o)));
    }
    return list
      .filter((o) => o.benchmarkSeriesId === benchmarkSeriesId)
      .map((o) => JSON.parse(JSON.stringify(o)));
  }

  public static getAllCandidateObservations(benchmarkSeriesId?: string): ObservationProvenanceRecord[] {
    logger.info('Fetching all candidate benchmark observations', { benchmarkSeriesId });
    const list = Array.from(this.allCandidateStore.values());
    if (!benchmarkSeriesId) {
      return list.map((o) => JSON.parse(JSON.stringify(o)));
    }
    return list
      .filter((o) => o.benchmarkSeriesId === benchmarkSeriesId)
      .map((o) => JSON.parse(JSON.stringify(o)));
  }

  public static getQuarantinedObservations(): ObservationProvenanceRecord[] {
    logger.info('Fetching quarantined benchmark observations');
    return Array.from(this.quarantinedStore.values()).map((o) => JSON.parse(JSON.stringify(o)));
  }

  private static checkProvenanceAndDates(
    candidate: Partial<ObservationProvenanceRecord>
  ): { isValid: boolean; status?: ObservationValidationStatus; reason?: string } {
    if (!candidate.publisherSource || !candidate.sourceDocumentRef || candidate.sourceDocumentRef.trim() === '') {
      return {
        isValid: false,
        status: 'QUARANTINED_UNPROVENANCED',
        reason: 'Missing official publisher or verified source document reference.'
      };
    }

    if (!candidate.observationDate || isNaN(new Date(candidate.observationDate).getTime())) {
      return {
        isValid: false,
        status: 'REJECTED_UNTRACEABLE',
        reason: 'Invalid or missing observation date.'
      };
    }

    const obsTime = new Date(candidate.observationDate).getTime();
    const nowTime = new Date('2026-10-28T00:00:00Z').getTime();
    const diffDays = Math.abs(nowTime - obsTime) / (1000 * 60 * 60 * 24);

    if (diffDays > 365) {
      return {
        isValid: false,
        status: 'QUARANTINED_STALE',
        reason: `Observation date (${candidate.observationDate}) exceeds freshness window (>365 days).`
      };
    }

    return { isValid: true };
  }

  private static checkUnitsAndValues(
    candidate: Partial<ObservationProvenanceRecord>
  ): { isValid: boolean; status?: ObservationValidationStatus; reason?: string } {
    if ((candidate as Record<string, unknown>)?.priceMismatch === true) {
      return {
        isValid: false,
        status: 'REJECTED_UNTRACEABLE',
        reason: 'Price mismatch: Published price in source document does not match recorded observation price.'
      };
    }

    const hasUnits = candidate.originalUnit && candidate.convertedUnit;
    const hasPositiveVal = candidate.originalValue !== undefined && candidate.originalValue > 0;

    if (!hasUnits || !hasPositiveVal) {
      return {
        isValid: false,
        status: 'REJECTED_UNTRACEABLE',
        reason: 'Invalid unit specification or non-positive price value.'
      };
    }

    return { isValid: true };
  }

  private static checkGradeAndLicense(
    candidate: Partial<ObservationProvenanceRecord>
  ): { isValid: boolean; status?: ObservationValidationStatus; reason?: string } {
    if (candidate.benchmarkSeriesId === 'PCBI-IND-MIN-SLS-001' && (candidate.originalValue ?? 0) < 5000) {
      return {
        isValid: false,
        status: 'QUARANTINED_GRADE_INCOMPATIBLE',
        reason: 'Grade mismatch: Raw quarry sand cannot be equated with optical solar glass sand.'
      };
    }

    const unverified =
      candidate.licenseAccessRestrictions === 'UNAUTHORIZED_SCRAPE' ||
      candidate.licenseAccessRestrictions === 'UNVERIFIED';

    if (unverified) {
      return {
        isValid: false,
        status: 'QUARANTINED_UNAUTHORIZED_SOURCE',
        reason: 'Source does not authorize commercial extraction or licensing terms are unverified.'
      };
    }

    if (candidate.sourceArtifactAvailable === false) {
      return {
        isValid: false,
        status: 'UNVERIFIED_SOURCE',
        reason: 'Forensic verification gate: Original source document or circular PDF is missing on disk.'
      };
    }

    if (candidate.hashVerified === false) {
      return {
        isValid: false,
        status: 'UNVERIFIED_SOURCE',
        reason: 'Forensic verification gate: SHA-256 hash does not match verified source artifact.'
      };
    }

    return { isValid: true };
  }

  public static validateObservation(
    candidate: Partial<ObservationProvenanceRecord>
  ): { isValid: boolean; status: ObservationValidationStatus; reason?: string } {
    const provCheck = this.checkProvenanceAndDates(candidate);
    if (!provCheck.isValid && provCheck.status) {
      return { isValid: false, status: provCheck.status, reason: provCheck.reason };
    }

    const unitCheck = this.checkUnitsAndValues(candidate);
    if (!unitCheck.isValid && unitCheck.status) {
      return { isValid: false, status: unitCheck.status, reason: unitCheck.reason };
    }

    const gradeCheck = this.checkGradeAndLicense(candidate);
    if (!gradeCheck.isValid && gradeCheck.status) {
      return { isValid: false, status: gradeCheck.status, reason: gradeCheck.reason };
    }

    return { isValid: true, status: 'VALIDATED' };
  }

  public static ingestObservation(
    candidate: ObservationProvenanceRecord
  ): { success: boolean; record?: ObservationProvenanceRecord; issues?: string[] } {
    const validation = this.validateObservation(candidate);

    if (!validation.isValid) {
      const quarantinedRecord: ObservationProvenanceRecord = {
        ...candidate,
        validationStatus: validation.status,
        quarantineReason: validation.reason
      };
      this.quarantinedStore.set(quarantinedRecord.id, quarantinedRecord);
      logger.warn('Candidate benchmark observation quarantined by validation gate', {
        id: candidate.id,
        status: validation.status,
        reason: validation.reason
      });
      return {
        success: false,
        record: JSON.parse(JSON.stringify(quarantinedRecord)),
        issues: [validation.reason || 'Validation failure']
      };
    }

    const existing = Array.from(this.observationsStore.values()).find(
      (o) => o.benchmarkSeriesId === candidate.benchmarkSeriesId && o.observationDate === candidate.observationDate
    );

    if (existing && existing.id !== candidate.id) {
      logger.warn('Duplicate observation date detected for series', {
        benchmarkSeriesId: candidate.benchmarkSeriesId,
        observationDate: candidate.observationDate
      });
      return {
        success: false,
        issues: [`Duplicate observation already exists for series '${candidate.benchmarkSeriesId}' on '${candidate.observationDate}'.`]
      };
    }

    const verifiedRecord: ObservationProvenanceRecord = {
      ...candidate,
      validationStatus: 'VALIDATED',
      isFresh: true
    };

    this.observationsStore.set(verifiedRecord.id, verifiedRecord);
    this.allCandidateStore.set(verifiedRecord.id, verifiedRecord);
    logger.info('Successfully ingested validated benchmark observation', {
      id: verifiedRecord.id,
      benchmarkSeriesId: verifiedRecord.benchmarkSeriesId,
      date: verifiedRecord.observationDate
    });

    return {
      success: true,
      record: JSON.parse(JSON.stringify(verifiedRecord))
    };
  }

  public static resetStores(): void {
    this.observationsStore.clear();
    this.quarantinedStore.clear();
    this.allCandidateStore.clear();

    for (const obs of BOROSIL_ACQUIRED_BENCHMARK_OBSERVATIONS) {
      this.allCandidateStore.set(obs.id, { ...obs });
      if (obs.validationStatus === 'VALIDATED') {
        this.observationsStore.set(obs.id, { ...obs });
      } else {
        this.quarantinedStore.set(obs.id, { ...obs });
      }
    }

    for (const q of BOROSIL_QUARANTINED_OBSERVATIONS) {
      this.allCandidateStore.set(q.id, { ...q });
      this.quarantinedStore.set(q.id, { ...q });
    }
  }
}
