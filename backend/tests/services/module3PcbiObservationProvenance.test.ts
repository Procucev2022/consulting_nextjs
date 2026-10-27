/**
 * Module 3 PCBI Phase 3 — Observation Provenance & Validation Gate Test Suite
 * Customer: Borosil Ltd (AIC-2026-0002)
 *
 * Verifies all 8 Phase 3 requirements:
 * 1. Observation provenance metadata & validation gates
 * 2. Missing and stale observations
 * 3. Unit and currency conversion traceability
 * 4. Incompatible grades and delivery terms (quarantine verification)
 * 5. Duplicate observation prevention
 * 6. Coverage reconciliation and prevention of double counting
 * 7. Baseline preservation (₹556.5346426 Cr across 27,777 transactions)
 * 8. Zero certified and realized savings & Module 4 isolation
 * 9. HTTP controller endpoint validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { Module3PcbiObservationService } from '../../src/services/module3PcbiObservationService';
import {
  BOROSIL_RECONCILED_COVERAGE_REGISTER,
  BOROSIL_ACQUIRED_BENCHMARK_OBSERVATIONS,
  BOROSIL_QUARANTINED_OBSERVATIONS
} from '../../src/constants/module3PcbiObservationProvenance';
import { module3CanonicalController } from '../../src/controllers/module3Canonical.controller';
import { Module3PcbiForensicEngine } from '../../src/services/module3PcbiForensicEngine';
import type { ObservationProvenanceRecord } from '../../src/types/module3PcbiObservationProvenance';

function createMockResponse(): { res: Response; jsonSpy: ReturnType<typeof vi.fn>; statusSpy: ReturnType<typeof vi.fn> } {
  const jsonSpy = vi.fn();
  const statusSpy = vi.fn().mockReturnThis();
  const res = {
    json: jsonSpy,
    status: statusSpy
  } as unknown as Response;
  return { res, jsonSpy, statusSpy };
}

describe('Module 3 PCBI Phase 3 — Benchmark Data Acquisition & Validation', () => {
  beforeEach(() => {
    Module3PcbiObservationService.resetStores();
    vi.restoreAllMocks();
  });

  describe('1. Observation Provenance Metadata & Validated Acquisitions', () => {
    it('contains genuine, traceable observations for prioritized industrial fuel benchmarks', () => {
      const observations = Module3PcbiObservationService.getAcquiredObservations();
      expect(observations.length).toBeGreaterThanOrEqual(14);

      for (const obs of observations) {
        expect(obs.id).toBeDefined();
        expect(obs.benchmarkSeriesId).toMatch(/^PCBI-IND-PET-/);
        expect(obs.observationDate).toMatch(/^2026-(04|05|06|07|08|09|10)-01$/);
        expect(obs.originalValue).toBeGreaterThan(0);
        expect(obs.originalUnit).toBeDefined();
        expect(obs.convertedValue).toBeGreaterThan(0);
        expect(obs.convertedUnit).toBeDefined();
        expect(obs.originalCurrency).toBe('INR');
        expect(obs.convertedCurrency).toBe('INR');
        expect(obs.publisherSource).toBe('Indian Oil Corporation Limited');
        expect(obs.sourceDocumentRef).toBeDefined();
        expect(obs.acquisitionTimestamp).toMatch(/^2026-10-27/);
        expect(obs.traceabilityHash).toMatch(/^[a-f0-9]{64}$/);
        expect(obs.validationStatus).toBe('VALIDATED');
        expect(obs.licenseAccessRestrictions).toBe('PUBLIC_OFFICIAL_CIRCULAR');
      }
    });

    it('filters acquired observations by benchmarkSeriesId', () => {
      const lshs = Module3PcbiObservationService.getAcquiredObservations('PCBI-IND-PET-LSHS-001');
      expect(lshs.length).toBe(7);
      expect(lshs.every((o) => o.benchmarkSeriesId === 'PCBI-IND-PET-LSHS-001')).toBe(true);

      const hsd = Module3PcbiObservationService.getAcquiredObservations('PCBI-IND-PET-HSD-001');
      expect(hsd.length).toBe(7);
      expect(hsd.every((o) => o.benchmarkSeriesId === 'PCBI-IND-PET-HSD-001')).toBe(true);

      const nonExistent = Module3PcbiObservationService.getAcquiredObservations('NON-EXISTENT-SERIES');
      expect(nonExistent.length).toBe(0);
    });
  });

  describe('2. Validation Gates & Quarantine Decisions', () => {
    it('quarantines raw quarry sand observations claiming optical glass sand series due to grade incompatibility', () => {
      const result = Module3PcbiObservationService.validateObservation({
        benchmarkSeriesId: 'PCBI-IND-MIN-SLS-001',
        publisherSource: 'Indian Bureau of Mines',
        sourceDocumentRef: 'IBM-MCDR-2026',
        observationDate: '2026-08-01',
        originalValue: 850,
        originalUnit: 'INR/MT',
        convertedValue: 850,
        convertedUnit: 'INR/MT',
        licenseAccessRestrictions: 'PUBLIC_GOVERNMENT_RECORD'
      });

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('QUARANTINED_GRADE_INCOMPATIBLE');
      expect(result.reason).toContain('Grade mismatch');
    });

    it('quarantines stale observations (>365 days outside observation window)', () => {
      const result = Module3PcbiObservationService.validateObservation({
        benchmarkSeriesId: 'PCBI-IND-PKG-KFT-001',
        publisherSource: 'Office of Economic Adviser',
        sourceDocumentRef: 'WPI-PKG-2021',
        observationDate: '2021-08-01',
        originalValue: 128.4,
        originalUnit: 'INDEX_2011_12_BASE',
        convertedValue: 128.4,
        convertedUnit: 'INDEX_2011_12_BASE',
        licenseAccessRestrictions: 'PUBLIC_OFFICIAL_CIRCULAR'
      });

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('QUARANTINED_STALE');
      expect(result.reason).toContain('exceeds freshness window');
    });

    it('rejects observations with missing source provenance', () => {
      const result = Module3PcbiObservationService.validateObservation({
        benchmarkSeriesId: 'PCBI-IND-CHM-SDA-001',
        observationDate: '2026-08-01',
        originalValue: 28500,
        originalUnit: 'INR/MT',
        convertedValue: 28500,
        convertedUnit: 'INR/MT'
      });

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('QUARANTINED_UNPROVENANCED');
    });

    it('rejects observations with unauthorized or unverified commercial license', () => {
      const result = Module3PcbiObservationService.validateObservation({
        benchmarkSeriesId: 'PCBI-IND-CHM-SDA-001',
        publisherSource: 'Third-Party Web Scraping',
        sourceDocumentRef: 'Scraped-HTML-DOM',
        observationDate: '2026-08-01',
        originalValue: 29000,
        originalUnit: 'INR/MT',
        convertedValue: 29000,
        convertedUnit: 'INR/MT',
        licenseAccessRestrictions: 'UNAUTHORIZED_SCRAPE'
      });

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('QUARANTINED_UNAUTHORIZED_SOURCE');
    });

    it('rejects observations with invalid dates or non-positive values', () => {
      const invalidDate = Module3PcbiObservationService.validateObservation({
        benchmarkSeriesId: 'PCBI-IND-PET-LSHS-001',
        publisherSource: 'IOCL',
        sourceDocumentRef: 'CIRCULAR-123',
        observationDate: 'invalid-date',
        originalValue: 50000,
        originalUnit: 'INR/MT',
        convertedUnit: 'INR/MT'
      });
      expect(invalidDate.isValid).toBe(false);
      expect(invalidDate.status).toBe('REJECTED_UNTRACEABLE');

      const nonPositive = Module3PcbiObservationService.validateObservation({
        benchmarkSeriesId: 'PCBI-IND-PET-LSHS-001',
        publisherSource: 'IOCL',
        sourceDocumentRef: 'CIRCULAR-123',
        observationDate: '2026-08-01',
        originalValue: -10,
        originalUnit: 'INR/MT',
        convertedUnit: 'INR/MT'
      });
      expect(nonPositive.isValid).toBe(false);
      expect(nonPositive.status).toBe('REJECTED_UNTRACEABLE');
    });

    it('retrieves pre-populated quarantined observations with documented reasons', () => {
      const quarantined = Module3PcbiObservationService.getQuarantinedObservations();
      expect(quarantined.length).toBeGreaterThanOrEqual(3);

      const sandQuarantine = quarantined.find((q) => q.benchmarkSeriesId === 'PCBI-IND-MIN-SLS-001');
      expect(sandQuarantine).toBeDefined();
      expect(sandQuarantine?.validationStatus).toBe('QUARANTINED_GRADE_INCOMPATIBLE');

      const staleKraft = quarantined.find((q) => q.benchmarkSeriesId === 'PCBI-IND-PKG-KFT-001');
      expect(staleKraft).toBeDefined();
      expect(staleKraft?.validationStatus).toBe('QUARANTINED_STALE');

      const unprovenanced = quarantined.find((q) => q.validationStatus === 'QUARANTINED_UNPROVENANCED');
      expect(unprovenanced).toBeDefined();
    });
  });

  describe('3. Unit & Currency Conversion Traceability', () => {
    it('verifies unit conversion formula from INR/KL to INR/Litre for High Speed Diesel', () => {
      const hsdObs = Module3PcbiObservationService.getAcquiredObservations('PCBI-IND-PET-HSD-001');
      for (const obs of hsdObs) {
        expect(obs.originalUnit).toBe('INR/KL');
        expect(obs.convertedUnit).toBe('INR/L');
        expect(obs.conversionFormula).toContain('dividing by 1000.0');
        expect(Number((obs.originalValue / 1000).toFixed(2))).toBe(obs.convertedValue);
      }
    });

    it('verifies unit consistency for LSHS priced in INR/MT', () => {
      const lshsObs = Module3PcbiObservationService.getAcquiredObservations('PCBI-IND-PET-LSHS-001');
      for (const obs of lshsObs) {
        expect(obs.originalUnit).toBe('INR/MT');
        expect(obs.convertedUnit).toBe('INR/MT');
        expect(obs.originalValue).toBe(obs.convertedValue);
      }
    });
  });

  describe('4. Ingestion & Duplicate Observation Prevention', () => {
    it('successfully ingests a fresh, compliant observation', () => {
      const validCandidate: ObservationProvenanceRecord = {
        id: 'OBS-TEST-001',
        benchmarkSeriesId: 'PCBI-IND-PET-LSHS-001',
        observationDate: '2026-11-01',
        originalValue: 54100,
        originalUnit: 'INR/MT',
        convertedValue: 54100,
        convertedUnit: 'INR/MT',
        currency: 'INR',
        marketBasis: 'Ex-Koyali Refinery',
        publisherSource: 'Indian Oil Corporation Limited',
        sourceDocumentRef: 'IOCL-PRC-2026-11-01',
        acquisitionTimestamp: '2026-11-01T10:00:00Z',
        traceabilityHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        validationStatus: 'VALIDATED',
        licenseAccessRestrictions: 'PUBLIC_OFFICIAL_CIRCULAR'
      };

      const result = Module3PcbiObservationService.ingestObservation(validCandidate);
      expect(result.success).toBe(true);
      expect(result.record?.validationStatus).toBe('VALIDATED');
      expect(result.record?.isFresh).toBe(true);
    });

    it('prevents duplicate observations for the same series and date', () => {
      const duplicateCandidate: ObservationProvenanceRecord = {
        id: 'OBS-TEST-DUP-001',
        benchmarkSeriesId: 'PCBI-IND-PET-LSHS-001',
        observationDate: '2026-04-01', // Already exists in BOROSIL_ACQUIRED_BENCHMARK_OBSERVATIONS
        originalValue: 52000,
        originalUnit: 'INR/MT',
        convertedValue: 52000,
        convertedUnit: 'INR/MT',
        currency: 'INR',
        marketBasis: 'Ex-Koyali Refinery',
        publisherSource: 'Indian Oil Corporation Limited',
        sourceDocumentRef: 'IOCL-PRC-2026-04-01-DUP',
        acquisitionTimestamp: '2026-10-27T10:00:00Z',
        traceabilityHash: '0000000000000000000000000000000000000000000000000000000000000000',
        validationStatus: 'VALIDATED',
        licenseAccessRestrictions: 'PUBLIC_OFFICIAL_CIRCULAR'
      };

      const result = Module3PcbiObservationService.ingestObservation(duplicateCandidate);
      expect(result.success).toBe(false);
      expect(result.issues?.[0]).toContain('Duplicate observation already exists');
    });
  });

  describe('5. Coverage Reconciliation & Prevention of Double Counting', () => {
    it('reconciles all 7 non-overlapping categories strictly against canonical Borosil baseline', () => {
      const register = Module3PcbiObservationService.getReconciledCoverage('AIC-2026-0002');
      expect(register.buckets.length).toBe(7);

      // Denominator check
      expect(register.reconciledTransactions).toBe(27777);
      expect(register.authoritativeBaselineTransactions).toBe(27777);
      expect(register.reconciledTransactions - register.authoritativeBaselineTransactions).toBe(0);

      // Spend check
      expect(register.reconciledSpendCr).toBe(556.5346);
      expect(register.authoritativeBaselineSpendCr).toBe(556.5346);
      expect(register.reconciliationVarianceCr).toBe(0.0);
      expect(register.isFullyReconciled).toBe(true);

      // Percentage sum check
      const totalPct = register.buckets.reduce((acc, b) => acc + b.spendPct, 0);
      expect(Number(totalPct.toFixed(1))).toBe(100.0);
    });

    it('does not treat pending candidate mappings as approved coverage', () => {
      const register = Module3PcbiObservationService.getReconciledCoverage('AIC-2026-0002');
      const approvedBucket = register.buckets.find((b) => b.bucketKey === 'APPROVED_MAPPINGS');
      const pendingBucket = register.buckets.find((b) => b.bucketKey === 'PENDING_APPROVAL_MAPPINGS');

      expect(approvedBucket).toBeDefined();
      expect(approvedBucket?.spendCr).toBe(0.0);
      expect(approvedBucket?.spendPct).toBe(0.0);
      expect(approvedBucket?.transactionCount).toBe(0);

      expect(pendingBucket).toBeDefined();
      expect(pendingBucket?.spendCr).toBe(133.047);
      expect(pendingBucket?.spendPct).toBe(23.91);
      expect(pendingBucket?.transactionCount).toBe(43);
    });

    it('counts each transaction spend exactly once with zero double counting', () => {
      const register = Module3PcbiObservationService.getReconciledCoverage('AIC-2026-0002');
      const sumTransactions = register.buckets.reduce((acc, b) => acc + b.transactionCount, 0);
      const sumSpend = register.buckets.reduce((acc, b) => acc + b.spendCr, 0);

      expect(sumTransactions).toBe(27777);
      expect(Number(sumSpend.toFixed(4))).toBe(556.5346);
    });
  });

  describe('6. Calculation Safety, Baseline Preservation & Module 4 Isolation', () => {
    it('preserves the canonical Borosil baseline of ₹556.5346 Cr across 27,777 transactions', () => {
      const register = Module3PcbiObservationService.getReconciledCoverage('AIC-2026-0002');
      expect(register.authoritativeBaselineTransactions).toBe(27777);
      expect(register.authoritativeBaselineSpendCr).toBe(556.5346);
      expect(register.reconciliationVarianceCr).toBe(0.0);
    });

    it('maintains certified and realized savings strictly at ₹0.00 Cr', () => {
      const register = Module3PcbiObservationService.getReconciledCoverage('AIC-2026-0002');
      expect(register.certifiedSavingsCr).toBe(0);
      expect(register.realizedSavingsCr).toBe(0);
      expect(register.marketVarianceValueCr).toBe(0);
    });

    it('leaves Module 4 completely unexecuted during Phase 3', () => {
      const register = Module3PcbiObservationService.getReconciledCoverage('AIC-2026-0002');
      expect(register.module4Executed).toBe(false);
    });
  });

  describe('7. Controller HTTP Endpoints', () => {
    it('GET /coverage-reconciliation returns 200 with reconciled register for Borosil', async () => {
      const { res, jsonSpy, statusSpy } = createMockResponse();
      const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;

      await module3CanonicalController.getReconciledCoverage(req, res);
      expect(statusSpy).not.toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          register: expect.objectContaining({
            assessmentId: 'AIC-2026-0002',
            authoritativeBaselineSpendCr: 556.5346,
            authoritativeBaselineTransactions: 27777,
            isFullyReconciled: true,
            certifiedSavingsCr: 0,
            realizedSavingsCr: 0,
            module4Executed: false
          })
        })
      );
    });

    it('GET /coverage-reconciliation rejects invalid assessment ID with 400', async () => {
      const { res, jsonSpy, statusSpy } = createMockResponse();
      const req = { query: { assessmentId: 'AIC-UNKNOWN' } } as unknown as Request;

      await module3CanonicalController.getReconciledCoverage(req, res);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid assessment ID is required')
        })
      );
    });

    it('GET /observations returns acquired benchmark observations', async () => {
      const { res, jsonSpy } = createMockResponse();
      const req = { query: {} } as unknown as Request;

      await module3CanonicalController.getAcquiredObservations(req, res);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: expect.any(Number),
          observations: expect.any(Array)
        })
      );
    });

    it('GET /observations/quarantined returns quarantined observations', async () => {
      const { res, jsonSpy } = createMockResponse();
      const req = {} as unknown as Request;

      await module3CanonicalController.getQuarantinedObservations(req, res);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: expect.any(Number),
          quarantined: expect.any(Array)
        })
      );
    });

    it('POST /observations/validate evaluates candidate observation against gates', async () => {
      const { res, jsonSpy } = createMockResponse();
      const req = {
        body: {
          benchmarkSeriesId: 'PCBI-IND-MIN-SLS-001',
          originalValue: 800,
          originalUnit: 'INR/MT',
          convertedUnit: 'INR/MT',
          publisherSource: 'IBM',
          sourceDocumentRef: 'REF-1',
          observationDate: '2026-05-01'
        }
      } as unknown as Request;

      await module3CanonicalController.validateCandidateObservation(req, res);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          validation: expect.objectContaining({
            isValid: false,
            status: 'QUARANTINED_GRADE_INCOMPATIBLE'
          })
        })
      );
    });
  });
});
