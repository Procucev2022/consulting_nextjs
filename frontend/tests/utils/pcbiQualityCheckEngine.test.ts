import { describe, it, expect } from 'vitest';
import {
  detectObservationCadence,
  calculateMissingPeriods,
  calculateDuplicateDates,
  auditObservationQuality,
  computeSha256Hex,
  detectStepChanges,
  evaluateSpecificationGovernance
} from '../../src/utils/pcbiQualityCheckEngine';
import type { ExtractedObservationRecord } from '../../src/types/pcbiWorkbookParser';

describe('pcbiQualityCheckEngine', () => {
  it('detects weekly, monthly, daily, and annual cadences accurately', () => {
    // Insufficient dates
    expect(detectObservationCadence(['2026-01-01']).frequency).toBe('NONE');
    expect(detectObservationCadence([]).frequency).toBe('NONE');

    // Weekly dates (7-day interval)
    const weeklyDates = ['2026-01-04', '2026-01-11', '2026-01-18', '2026-01-25'];
    expect(detectObservationCadence(weeklyDates).frequency).toBe('WEEKLY');

    // Monthly dates (approx 30-day interval)
    const monthlyDates = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01'];
    expect(detectObservationCadence(monthlyDates).frequency).toBe('MONTHLY');

    // Daily dates (1-day interval)
    const dailyDates = ['2026-01-01', '2026-01-02', '2026-01-03'];
    expect(detectObservationCadence(dailyDates).frequency).toBe('DAILY');

    // Annual dates (365-day interval)
    const annualDates = ['2024-01-01', '2025-01-01', '2026-01-01'];
    expect(detectObservationCadence(annualDates).frequency).toBe('ANNUAL');

    // Irregular cadence (e.g. 50-day gap)
    const irregularDates = ['2026-01-01', '2026-02-20', '2026-04-15'];
    expect(detectObservationCadence(irregularDates).frequency).toBe('NONE');
  });

  it('calculates missing periods correctly for weekly, monthly, and daily series', () => {
    // 0 missing on continuous weekly series
    const continuousWeekly = ['2026-01-04', '2026-01-11', '2026-01-18', '2026-01-25'];
    expect(calculateMissingPeriods(continuousWeekly, 'WEEKLY')).toBe(0);

    // 1 week missing (gap between Jan 4 and Jan 18)
    const oneWeekMissing = ['2026-01-04', '2026-01-18', '2026-01-25'];
    expect(calculateMissingPeriods(oneWeekMissing, 'WEEKLY')).toBe(1);

    // 2 weeks missing (gap between Jan 4 and Jan 25)
    const twoWeeksMissing = ['2026-01-04', '2026-01-25'];
    expect(calculateMissingPeriods(twoWeeksMissing, 'WEEKLY')).toBe(2);

    // Monthly with 1 month missing
    const oneMonthMissing = ['2026-01-01', '2026-03-01'];
    expect(calculateMissingPeriods(oneMonthMissing, 'MONTHLY')).toBe(1);

    // Daily with 2 days missing
    const twoDaysMissing = ['2026-01-01', '2026-01-04'];
    expect(calculateMissingPeriods(twoDaysMissing, 'DAILY')).toBe(2);

    // Insufficient or NONE frequency
    expect(calculateMissingPeriods(['2026-01-01'], 'WEEKLY')).toBe(0);
    expect(calculateMissingPeriods(continuousWeekly, 'NONE')).toBe(0);
  });

  it('calculates duplicate dates accurately', () => {
    const obsWithDuplicates: ExtractedObservationRecord[] = [
      { date: '2026-01-04', value: 100, unit: 'INDEX_POINTS' },
      { date: '2026-01-04', value: 101, unit: 'INDEX_POINTS' },
      { date: '2026-01-11', value: 102, unit: 'INDEX_POINTS' }
    ];
    expect(calculateDuplicateDates(obsWithDuplicates)).toBe(1);

    const obsWithoutDuplicates: ExtractedObservationRecord[] = [
      { date: '2026-01-04', value: 100, unit: 'INDEX_POINTS' },
      { date: '2026-01-11', value: 101, unit: 'INDEX_POINTS' }
    ];
    expect(calculateDuplicateDates(obsWithoutDuplicates)).toBe(0);
  });

  it('audits empty observations returning insufficient data report', () => {
    const report = auditObservationQuality([]);
    expect(report.totalObservations).toBe(0);
    expect(report.frequencyStatus).toBe('INSUFFICIENT_DATA');
    expect(report.detectedFrequency).toBe('NONE');
    expect(report.missingPeriodsCount).toBe(0);
    expect(report.duplicateDatesCount).toBe(0);
  });

  it('audits weekly index observations matching WEEKLY specification', () => {
    const weeklyObs: ExtractedObservationRecord[] = [
      { date: '2026-01-04', value: 100, unit: 'INDEX_POINTS', underlyingPriceUnit: 'INR/MT' },
      { date: '2026-01-11', value: 100.5, unit: 'INDEX_POINTS', underlyingPriceUnit: 'INR/MT' },
      { date: '2026-01-18', value: 101, unit: 'INDEX_POINTS', underlyingPriceUnit: 'INR/MT' }
    ];

    const report = auditObservationQuality(weeklyObs, 'WEEKLY');
    expect(report.totalObservations).toBe(3);
    expect(report.detectedFrequency).toBe('WEEKLY');
    expect(report.frequencyStatus).toBe('VALIDATED');
    expect(report.frequencyLabel).toBe('Validated (WEEKLY)');
    expect(report.hasFrequencyConflict).toBe(false);
    expect(report.missingPeriodsCount).toBe(0);
    expect(report.duplicateDatesCount).toBe(0);
    expect(report.unitConsistency).toBe('Uniform (INDEX_POINTS)');
    expect(report.isUnitUniform).toBe(true);
    expect(report.detectedMetricType).toBe('INDEX_POINTS');
    expect(report.underlyingPriceUnit).toBe('INR/MT');
  });

  it('detects and reports frequency conflict when uploaded series differs from required specification', () => {
    const weeklyObs: ExtractedObservationRecord[] = [
      { date: '2026-01-04', value: 100, unit: 'INDEX_POINTS' },
      { date: '2026-01-11', value: 100.5, unit: 'INDEX_POINTS' }
    ];

    // Uploaded is WEEKLY, but requirement is MONTHLY
    const report = auditObservationQuality(weeklyObs, 'MONTHLY');
    expect(report.detectedFrequency).toBe('WEEKLY');
    expect(report.hasFrequencyConflict).toBe(true);
    expect(report.frequencyStatus).toBe('MISMATCH');
    expect(report.frequencyLabel).toContain('Conflict');
    expect(report.conflictMessage).toContain('Frequency Mismatch: Uploaded series is WEEKLY but series specification requires MONTHLY');
  });

  it('handles mixed observation units correctly', () => {
    const mixedObs: ExtractedObservationRecord[] = [
      { date: '2026-01-04', value: 100, unit: 'INDEX_POINTS' },
      { date: '2026-01-11', value: 32000, unit: 'INR/MT' }
    ];

    const report = auditObservationQuality(mixedObs);
    expect(report.isUnitUniform).toBe(false);
    expect(report.unitConsistency).toContain('Mixed');
  });

  it('handles invalid dates, annual missing periods, and price metric detection', () => {
    // calculateMissingPeriods with unparseable dates
    expect(calculateMissingPeriods(['not-a-date-a', 'not-a-date-b'], 'WEEKLY')).toBe(0);

    // calculateMissingPeriods with ANNUAL frequency
    expect(calculateMissingPeriods(['2024-01-01', '2026-01-01'], 'ANNUAL')).toBe(0);

    // DAILY with 1-day step (0 missing)
    expect(calculateMissingPeriods(['2026-01-01', '2026-01-02'], 'DAILY')).toBe(0);

    // auditObservationQuality with standard price metric
    const priceObs: ExtractedObservationRecord[] = [
      { date: '2026-01-04', value: 26000, unit: 'INR/MT' }
    ];
    const priceReport = auditObservationQuality(priceObs);
    expect(priceReport.detectedMetricType).toBe('PRICE');
    expect(priceReport.isUnitUniform).toBe(true);
  });

  it('computes 64-character SHA-256 hexadecimal digest accurately', async () => {
    const data = new TextEncoder().encode('Borosil Soda Ash Dense Upload Candidate');
    const hash = await computeSha256Hex(data);
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it('detects step changes in time series and verifies April and June revisions with effective dates', () => {
    const obsWithSteps: ExtractedObservationRecord[] = [
      { date: '2026-01-05', value: 100, unit: 'INDEX_POINTS' },
      { date: '2026-03-30', value: 100, unit: 'INDEX_POINTS' },
      { date: '2026-04-06', value: 103.8462, unit: 'INDEX_POINTS', effectiveDate: '2026-04-01' },
      { date: '2026-05-25', value: 103.8462, unit: 'INDEX_POINTS', effectiveDate: '2026-04-01' },
      { date: '2026-06-01', value: 105.7692, unit: 'INDEX_POINTS', effectiveDate: '2026-06-01' },
      { date: '2026-10-26', value: 105.7692, unit: 'INDEX_POINTS', effectiveDate: '2026-06-01' }
    ];

    const stepChanges = detectStepChanges(obsWithSteps);
    expect(stepChanges).toHaveLength(2);
    expect(stepChanges[0].date).toBe('2026-04-06');
    expect(stepChanges[0].effectiveDate).toBe('2026-04-01');
    expect(stepChanges[0].delta).toBeCloseTo(3.8462, 3);
    expect(stepChanges[1].date).toBe('2026-06-01');
    expect(stepChanges[1].effectiveDate).toBe('2026-06-01');
    expect(stepChanges[1].delta).toBeCloseTo(1.923, 3);
  });

  it('computes exact 64-char SHA-256 hash from candidate workbook file fixture', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const fixturePath = path.resolve(__dirname, '../fixtures/Borosil_Soda_Ash_Dense_Existing_Series_Upload_Candidate.xlsx');
    const fileBuf = fs.readFileSync(fixturePath);
    const hash = await computeSha256Hex(new Uint8Array(fileBuf));
    expect(hash).toBe('72e4765d36483431968852add4f7a9fa98278b02b95014ab252d31e329af6127');
    expect(hash).toHaveLength(64);
  });

  it('evaluates specification governance and marks Tata proxy for GHCL as PENDING_VERIFICATION', () => {
    // Borosil GHCL with Tata Chemicals circular note
    const borosilPending = evaluateSpecificationGovernance(
      '100SA02G',
      'Soda Ash Dense - GHCL',
      'Tata Chemicals circular proxy; confirm GHCL Dense requirement/specification comparability before approval.'
    );
    expect(borosilPending.status).toBe('PENDING_VERIFICATION');
    expect(borosilPending.rationale).toContain('Tata Chemicals Mithapur proxy circulars');

    // Confirmed specification when source matches directly
    const directConfirmed = evaluateSpecificationGovernance(
      '100SA02G',
      'Soda Ash Dense - GHCL',
      'Official GHCL Direct Contract Price Circular'
    );
    expect(directConfirmed.status).toBe('CONFIRMED');
  });
});
