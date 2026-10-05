import { describe, it, expect } from 'vitest';
import {
  ANALYSIS_JOB_STATUSES,
  EXCLUSION_REASONS,
  REANALYSIS_REASONS,
  DEFAULT_QUALITY_GATE_CHECKLIST,
  EMAIL_NOTIFICATION_CONSTANTS,
  INITIAL_PCBI_BENCHMARK_SERIES,
  DEFAULT_SLA_HOURS,
  MIN_SPEND_COVERAGE_FOR_REPORT_PCT
} from '../../src/constants/analysisOrchestration';
import {
  pcbiGapResolutionSchema,
  reanalysisUploadSchema,
  qualityGateChecklistSchema,
  customerAcknowledgementSchema,
  customerCorrectionRequestSchema
} from '../../src/constants/orchestrationValidation';

describe('Analysis Orchestration Constants and Validation Tests', () => {
  it('should have standard status definitions and thresholds', () => {
    expect(DEFAULT_SLA_HOURS).toBe(48);
    expect(MIN_SPEND_COVERAGE_FOR_REPORT_PCT).toBe(85.0);
    expect(ANALYSIS_JOB_STATUSES).toContain('UPLOADED');
    expect(ANALYSIS_JOB_STATUSES).toContain('MODULE_1_READY');
    expect(ANALYSIS_JOB_STATUSES).toContain('ANALYSIS_QUEUED');
    expect(ANALYSIS_JOB_STATUSES).toContain('PCBI_REVIEW_REQUIRED');
    expect(ANALYSIS_JOB_STATUSES).toContain('READY_FOR_GENERATION');
    expect(ANALYSIS_JOB_STATUSES).toContain('REPORT_GENERATED');
    expect(ANALYSIS_JOB_STATUSES).toContain('ADMIN_APPROVED');
    expect(ANALYSIS_JOB_STATUSES).toContain('SUBMITTED_TO_CUSTOMER');
    expect(ANALYSIS_JOB_STATUSES).toContain('CUSTOMER_ACKNOWLEDGED');
    expect(ANALYSIS_JOB_STATUSES).toContain('ANALYSIS_BLOCKED');
  });

  it('should validate exclusion reasons list', () => {
    expect(EXCLUSION_REASONS.length).toBeGreaterThanOrEqual(8);
    const other = EXCLUSION_REASONS.find(r => r.code === 'OTHER');
    expect(other?.requiresExplanation).toBe(true);
    const benchmarkable = EXCLUSION_REASONS.find(r => r.code === 'NOT_BENCHMARKABLE');
    expect(benchmarkable?.requiresExplanation).toBe(false);
  });

  it('should validate reanalysis reasons list', () => {
    expect(REANALYSIS_REASONS.length).toBeGreaterThanOrEqual(10);
    const other = REANALYSIS_REASONS.find(r => r.code === 'OTHER');
    expect(other?.requiresExplanation).toBe(true);
  });

  it('should provide complete default quality gate checklist', () => {
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.dataQuality.sourceDataValidated).toBe(false);
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.pcbi.requiredPcbiCategoriesResolved).toBe(false);
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.financial.savingsCalculationsValidated).toBe(false);
    expect(DEFAULT_QUALITY_GATE_CHECKLIST.report.executiveSummaryReviewed).toBe(false);
  });

  it('should expose email notification constants', () => {
    expect(EMAIL_NOTIFICATION_CONSTANTS.DEFAULT_SUBJECT).toBe('Your Procucev Procurement Analysis is Ready');
    expect(EMAIL_NOTIFICATION_CONSTANTS.WORKSPACE_REPORT_PATH).toBe('/#report-summary');
  });

  it('should validate initial benchmark series', () => {
    expect(INITIAL_PCBI_BENCHMARK_SERIES.length).toBeGreaterThanOrEqual(5);
    expect(INITIAL_PCBI_BENCHMARK_SERIES[0].seriesId).toBeDefined();
  });

  it('should validate pcbiGapResolutionSchema with valid and invalid inputs', () => {
    const validAdd = pcbiGapResolutionSchema.safeParse({
      action: 'ADD_MAP_PCBI',
      targetPcbiSeries: 'PCBI-SERIES-FE-MOLY-65'
    });
    expect(validAdd.success).toBe(true);

    const validExclude = pcbiGapResolutionSchema.safeParse({
      action: 'EXCLUDE',
      exclusionReason: 'SERVICE'
    });
    expect(validExclude.success).toBe(true);

    const invalidExcludeMissingReason = pcbiGapResolutionSchema.safeParse({
      action: 'EXCLUDE'
    });
    expect(invalidExcludeMissingReason.success).toBe(false);

    const invalidOtherWithoutNotes = pcbiGapResolutionSchema.safeParse({
      action: 'EXCLUDE',
      exclusionReason: 'OTHER',
      exclusionNotes: ''
    });
    expect(invalidOtherWithoutNotes.success).toBe(false);

    const validOtherWithNotes = pcbiGapResolutionSchema.safeParse({
      action: 'EXCLUDE',
      exclusionReason: 'OTHER',
      exclusionNotes: 'Specific non-standard material group'
    });
    expect(validOtherWithNotes.success).toBe(true);
  });

  it('should validate reanalysisUploadSchema with valid and invalid inputs', () => {
    const valid = reanalysisUploadSchema.safeParse({
      fileName: 'corrected.xlsx',
      reason: 'INCORRECT_CATEGORY_MAPPING'
    });
    expect(valid.success).toBe(true);

    const invalidOther = reanalysisUploadSchema.safeParse({
      fileName: 'corrected.xlsx',
      reason: 'OTHER',
      notes: '   '
    });
    expect(invalidOther.success).toBe(false);

    const validOther = reanalysisUploadSchema.safeParse({
      fileName: 'corrected.xlsx',
      reason: 'OTHER',
      notes: 'Customer provided corrected GSTIN and plant breakdown'
    });
    expect(validOther.success).toBe(true);
  });

  it('should validate qualityGateChecklistSchema', () => {
    const valid = qualityGateChecklistSchema.safeParse(DEFAULT_QUALITY_GATE_CHECKLIST);
    expect(valid.success).toBe(true);
  });

  it('should validate customerAcknowledgementSchema', () => {
    const valid = customerAcknowledgementSchema.safeParse({
      reportVersionId: 'REP-001',
      notes: 'Reviewed by Procurement Director'
    });
    expect(valid.success).toBe(true);

    const invalid = customerAcknowledgementSchema.safeParse({});
    expect(invalid.success).toBe(false);
  });

  it('should validate customerCorrectionRequestSchema', () => {
    const valid = customerCorrectionRequestSchema.safeParse({
      category: 'SUPPLIER_MAPPING',
      description: 'Supplier ABC was merged into Supplier XYZ in Q3',
      supportingFileName: 'merged_vendor_list.pdf'
    });
    expect(valid.success).toBe(true);

    const invalid = customerCorrectionRequestSchema.safeParse({
      category: '',
      description: ''
    });
    expect(invalid.success).toBe(false);
  });
});
