import { describe, it, expect } from 'vitest';
import { pcbiCustomerDataLoader } from '../../src/services/pcbiCustomerDataLoader';

describe('PCBICustomerDataLoader Service (Phases 1 & 2)', () => {
  it('should return all certified customer commodities', () => {
    const commodities = pcbiCustomerDataLoader.getCustomerCommodities();
    expect(commodities.length).toBeGreaterThanOrEqual(11);
    const ferroMoly = commodities.find((c) => c.commodity.includes('Ferro Molybdenum'));
    expect(ferroMoly).toBeDefined();
    expect(ferroMoly?.spendCr).toBe('1.2500');
    expect(ferroMoly?.definitionStatus).toBe('MISSING');
    expect(ferroMoly?.dataStatus).toBe('NO_HISTORY');
  });

  it('should generate complete customer gap matrix with all required fields', () => {
    const matrix = pcbiCustomerDataLoader.generateCustomerGapMatrix();
    expect(matrix.length).toBeGreaterThanOrEqual(11);

    for (const row of matrix) {
      expect(row.material).toBeTruthy();
      expect(row.module2Commodity).toBeTruthy();
      expect(row.unspsc).toBeTruthy();
      expect(row.spend).toBeGreaterThan(0);
      expect(row.transactions).toBeGreaterThan(0);
      expect(row.historicalStartRequired).toBe('2020-04-01');
      expect(row.historicalEndRequired).toBe('2026-06-30');
      expect(row.frequencyRequired).toBeTruthy();
      expect(row.actionRequired).toBeTruthy();
      expect(row.readinessStatus).toBeTruthy();
    }
  });

  it('should flag high-impact gap when spend > 1 Cr and NO_HISTORY', () => {
    const matrix = pcbiCustomerDataLoader.generateCustomerGapMatrix();
    const highImpact = matrix.find(
      (r) => r.spend > 10000000 && r.dataStatus === 'NO_HISTORY' && r.readinessStatus !== 'NOT_BENCHMARKABLE'
    );
    expect(highImpact).toBeDefined();
    expect(highImpact?.actionRequired).toContain('CRITICAL HIGH-IMPACT GAP');
  });

  it('should correctly handle service commodities as NOT_BENCHMARKABLE', () => {
    const matrix = pcbiCustomerDataLoader.generateCustomerGapMatrix();
    const serviceRow = matrix.find((r) => r.module2Commodity === 'EXCLUDED_SERVICE');
    expect(serviceRow).toBeDefined();
    expect(serviceRow?.readinessStatus).toBe('NOT_BENCHMARKABLE');
    expect(serviceRow?.actionRequired).toContain('Service category excluded');
  });

  it('should generate structured gap alerts for all commodities with gaps', () => {
    const alerts = pcbiCustomerDataLoader.generateGapAlerts();
    expect(alerts.length).toBeGreaterThan(0);

    const ferroAlert = alerts.find((a) => a.commodity.includes('Ferro Molybdenum'));
    expect(ferroAlert).toBeDefined();
    expect(ferroAlert?.dataGap).toBe('PCBI Definition Missing');
    expect(ferroAlert?.requiredFrequency).toBe('WEEKLY');
    expect(ferroAlert?.requiredUnit).toBe('INR/MT');
    expect(ferroAlert?.requiredCurrency).toBe('INR');
    expect(ferroAlert?.requiredAction).toContain('Upload PCBI source data');
  });
});
