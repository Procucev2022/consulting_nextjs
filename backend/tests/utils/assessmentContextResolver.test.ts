import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveAssessmentCustomerName,
  resolveAuthoritativeAssessment
} from '../../src/utils/assessmentContextResolver';
import { AssessmentStore } from '../../src/services/assessmentStore';
import * as assessmentPersistence from '../../src/services/assessmentPersistence';

describe('assessmentContextResolver Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveAssessmentCustomerName', () => {
    it('returns Enterprise Client for undefined, null, non-string, or blank ID', () => {
      expect(resolveAssessmentCustomerName(undefined)).toBe('Enterprise Client');
      expect(resolveAssessmentCustomerName(null as unknown as string)).toBe('Enterprise Client');
      expect(resolveAssessmentCustomerName(123 as unknown as string)).toBe('Enterprise Client');
      expect(resolveAssessmentCustomerName('')).toBe('Enterprise Client');
      expect(resolveAssessmentCustomerName('   ')).toBe('Enterprise Client');
    });

    it('resolves customer name from dev persistence store when record exists', () => {
      const name = resolveAssessmentCustomerName('AIC-2026-0002');
      expect(name).toBe('Borosil Ltd');
    });

    it('falls back to AssessmentStore when dev store does not contain the assessment', () => {
      vi.spyOn(assessmentPersistence, 'getDevelopmentDataDir').mockReturnValue(path.resolve(__dirname, 'nonexistent'));
      const mockStore = {
        getAssessmentById: vi.fn().mockReturnValue({ assessmentId: 'AIC-MEM-001', customerName: 'Memory Client Corp' })
      };
      vi.spyOn(AssessmentStore, 'getInstance').mockReturnValue(mockStore as unknown as AssessmentStore);

      const name = resolveAssessmentCustomerName('AIC-MEM-001');
      expect(name).toBe('Memory Client Corp');
    });

    it('falls back to formatted string when not found in dev store or AssessmentStore', () => {
      vi.spyOn(assessmentPersistence, 'getDevelopmentDataDir').mockReturnValue(path.resolve(__dirname, 'nonexistent'));
      const mockStore = {
        getAssessmentById: vi.fn().mockReturnValue(undefined)
      };
      vi.spyOn(AssessmentStore, 'getInstance').mockReturnValue(mockStore as unknown as AssessmentStore);

      const name = resolveAssessmentCustomerName('AIC-NONEXISTENT-999');
      expect(name).toBe('Enterprise Client (AIC-NONEXISTENT-999)');
    });

    it('handles JSON parse or filesystem errors in dev store lookup gracefully', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('Disk read failure');
      });
      const mockStore = {
        getAssessmentById: vi.fn().mockReturnValue({ assessmentId: 'AIC-FALLBACK-01', customerName: 'Resilient Co' })
      };
      vi.spyOn(AssessmentStore, 'getInstance').mockReturnValue(mockStore as unknown as AssessmentStore);

      const name = resolveAssessmentCustomerName('AIC-FALLBACK-01');
      expect(name).toBe('Resilient Co');
    });

    it('handles store lookup exceptions gracefully and returns formatted fallback', () => {
      vi.spyOn(assessmentPersistence, 'getDevelopmentDataDir').mockReturnValue(path.resolve(__dirname, 'nonexistent'));
      vi.spyOn(AssessmentStore, 'getInstance').mockImplementation(() => {
        throw new Error('Store failure');
      });

      const name = resolveAssessmentCustomerName('AIC-ERR-001');
      expect(name).toBe('Enterprise Client (AIC-ERR-001)');
    });
  });

  describe('resolveAuthoritativeAssessment', () => {
    it('throws error when assessment ID is blank or missing', () => {
      expect(() => resolveAuthoritativeAssessment('')).toThrow('Assessment identifier is required.');
      expect(() => resolveAuthoritativeAssessment('   ')).toThrow('Assessment identifier is required.');
    });

    it('resolves authoritative assessment from dev store', () => {
      const record = resolveAuthoritativeAssessment('AIC-2026-0002');
      expect(record.assessmentId).toBe('AIC-2026-0002');
      expect(record.customerName).toBe('Borosil Ltd');
    });

    it('resolves authoritative assessment from AssessmentStore when dev store lacks it', () => {
      vi.spyOn(assessmentPersistence, 'getDevelopmentDataDir').mockReturnValue(path.resolve(__dirname, 'nonexistent'));
      const mockStore = {
        getAssessmentById: vi.fn().mockReturnValue({ assessmentId: 'AIC-MEM-002', customerName: 'Store Assessment' })
      };
      vi.spyOn(AssessmentStore, 'getInstance').mockReturnValue(mockStore as unknown as AssessmentStore);

      const record = resolveAuthoritativeAssessment('AIC-MEM-002');
      expect(record.assessmentId).toBe('AIC-MEM-002');
      expect(record.customerName).toBe('Store Assessment');
    });

    it('throws when assessment is not found anywhere', () => {
      vi.spyOn(assessmentPersistence, 'getDevelopmentDataDir').mockReturnValue(path.resolve(__dirname, 'nonexistent'));
      const mockStore = {
        getAssessmentById: vi.fn().mockReturnValue(undefined)
      };
      vi.spyOn(AssessmentStore, 'getInstance').mockReturnValue(mockStore as unknown as AssessmentStore);

      expect(() => resolveAuthoritativeAssessment('AIC-MISSING-001')).toThrow(
        "Assessment 'AIC-MISSING-001' was not found in assessment store / persistence store."
      );
    });

    it('handles filesystem error in dev store and resolves from AssessmentStore', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File read error');
      });
      const mockStore = {
        getAssessmentById: vi.fn().mockReturnValue({ assessmentId: 'AIC-MEM-003', customerName: 'Fallback Co' })
      };
      vi.spyOn(AssessmentStore, 'getInstance').mockReturnValue(mockStore as unknown as AssessmentStore);

      const record = resolveAuthoritativeAssessment('AIC-MEM-003');
      expect(record.assessmentId).toBe('AIC-MEM-003');
      expect(record.customerName).toBe('Fallback Co');
    });

    it('handles store lookup exception in resolveAuthoritativeAssessment and throws missing error', () => {
      vi.spyOn(assessmentPersistence, 'getDevelopmentDataDir').mockReturnValue(path.resolve(__dirname, 'nonexistent'));
      vi.spyOn(AssessmentStore, 'getInstance').mockImplementation(() => {
        throw new Error('Store failure');
      });

      expect(() => resolveAuthoritativeAssessment('AIC-ERR-002')).toThrow(
        "Assessment 'AIC-ERR-002' was not found in assessment store / persistence store."
      );
    });
  });
});
