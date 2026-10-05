import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SLA_HOURS,
  MIN_SPEND_COVERAGE_FOR_REPORT_PCT,
  ANALYSIS_JOB_STATUSES,
  EXCLUSION_REASONS,
  REANALYSIS_REASONS,
  DEFAULT_QUALITY_GATE_CHECKLIST,
  INITIAL_PCBI_BENCHMARK_SERIES
} from '../../src/constants/analysisOrchestration';

describe('Frontend Analysis Orchestration Constants Unit Tests', () => {
  it('should export correct default SLA and coverage thresholds', () => {
    expect(DEFAULT_SLA_HOURS).toBe(48);
    expect(MIN_SPEND_COVERAGE_FOR_REPORT_PCT).toBe(85.0);
  });

  it('should export all 13 analysis job statuses', () => {
    expect(ANALYSIS_JOB_STATUSES.length).toBe(13);
    expect(ANALYSIS_JOB_STATUSES).toContain('UPLOADED');
    expect(ANALYSIS_JOB_STATUSES).toContain('SUBMITTED_TO_CUSTOMER');
    expect(ANALYSIS_JOB_STATUSES).toContain('CUSTOMER_ACKNOWLEDGED');
    expect(ANALYSIS_JOB_STATUSES).toContain('ANALYSIS_BLOCKED');
  });

  it('should export exclusion reasons with explanation requirements', () => {
    expect(EXCLUSION_REASONS.length).toBeGreaterThanOrEqual(8);
    const other = EXCLUSION_REASONS.find(r => r.code === 'OTHER');
    expect(other?.requiresExplanation).toBe(true);
    const service = EXCLUSION_REASONS.find(r => r.code === 'SERVICE');
    expect(service?.requiresExplanation).toBe(false);
  });

  it('should export reanalysis reasons with explanation requirements', () => {
    expect(REANALYSIS_REASONS.length).toBeGreaterThanOrEqual(10);
    const other = REANALYSIS_REASONS.find(r => r.code === 'OTHER');
    expect(other?.requiresExplanation).toBe(true);
  });

  it('should export default quality gate checklist with all false flags', () => {
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.dataQuality.sourceDataValidated).toBe(false);
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.pcbi.requiredPcbiCategoriesResolved).toBe(false);
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.financial.savingsCalculationsValidated).toBe(false);
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.report.module1Reviewed).toBe(false);
  });

  it('should export initial PCBI benchmark series', () => {
    expect(INITIAL_PCBI_BENCHMARK_SERIES.length).toBeGreaterThanOrEqual(5);
    expect(INITIAL_PCBI_BENCHMARK_SERIES[0].seriesId).toBeDefined();
    expect(INITIAL_PCBI_BENCHMARK_SERIES[0].quality).toBeDefined();
  });
});
