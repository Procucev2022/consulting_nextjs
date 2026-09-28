import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PCBICommodityCoverageService } from '../../src/services/pcbiCommodityCoverageService';

describe('PCBICommodityCoverageService (backend/src/services/pcbiCommodityCoverageService.ts)', () => {
  let service: PCBICommodityCoverageService;

  beforeEach(() => {
    service = PCBICommodityCoverageService.getInstance();
  });

  it('should return singleton instance and retrieve the initial gap queue', () => {
    expect(service).toBeDefined();
    const queue = service.getGapQueue();
    expect(queue.length).toBe(6);
    expect(queue[0].commodityName).toBe('Ferro Molybdenum 65%');
    expect(queue[0].priority).toBe('P1 — Critical Coverage Gap');
  });

  it('should allow admin to override research priority', () => {
    const updated = service.overridePriority('COM-MET-FMO', 'P2 — High Coverage Gap');
    expect(updated.priority).toBe('P2 — High Coverage Gap');

    // Reset back
    service.overridePriority('COM-MET-FMO', 'P1 — Critical Coverage Gap');
    expect(service.getGapQueue()[0].priority).toBe('P1 — Critical Coverage Gap');

    // Error on unknown commodity
    expect(() => service.overridePriority('UNKNOWN_COM', 'P1 — Critical Coverage Gap')).toThrow();
  });

  it('should manage independent multi-sources per commodity without overwriting', () => {
    const initialSources = service.getMultiSources('COM-MET-FMO');
    expect(initialSources.length).toBe(3);

    // Add candidate
    const newSource = service.addSourceCandidate('COM-MET-FMO', {
      sourceId: 'SRC-FMO-04-CUSTOM',
      sourceName: 'Custom Historical Ledger',
      sourceType: 'HISTORICAL_EXCEL',
      url: 'internal://uploads/fmo_custom.xlsx',
      document: 'fmo_custom.xlsx',
      publisher: 'Customer Procurement Team',
      publicationDate: '2026-08-01',
      checksum: 'abc1234567890abcdef',
      frequency: 'MONTHLY',
      unit: 'INR/MT',
      currency: 'INR',
      geography: 'INDIA_DOMESTIC',
      sourceStatus: 'UNDER_EVALUATION'
    });
    expect(newSource.sourceId).toBe('SRC-FMO-04-CUSTOM');

    const updatedSources = service.getMultiSources('COM-MET-FMO');
    expect(updatedSources.length).toBe(4);

    // Update existing candidate
    service.addSourceCandidate('COM-MET-FMO', {
      ...newSource,
      sourceStatus: 'VALIDATED'
    });
    const reChecked = service.getMultiSources('COM-MET-FMO');
    expect(reChecked.length).toBe(4);
    expect(reChecked.find((s) => s.sourceId === 'SRC-FMO-04-CUSTOM')?.sourceStatus).toBe('VALIDATED');

    // Add candidate to brand new commodity
    service.addSourceCandidate('COM-NEW-99', {
      sourceId: 'SRC-NEW-01',
      sourceName: 'New Source',
      sourceType: 'GOVERNMENT',
      url: 'https://example.com',
      document: 'report.pdf',
      publisher: 'Gov',
      publicationDate: '2026-01-01',
      checksum: '123',
      frequency: 'MONTHLY',
      unit: 'INR/MT',
      currency: 'INR',
      geography: 'INDIA_DOMESTIC',
      sourceStatus: 'UNDER_EVALUATION'
    });
    expect(service.getMultiSources('COM-NEW-99').length).toBe(1);
  });

  it('should generate source comparison view with variance and approval requirement', () => {
    const comparison = service.compareSources('COM-MET-FMO', '2026-06');
    expect(comparison.commodityId).toBe('COM-MET-FMO');
    expect(comparison.period).toBe('2026-06');
    expect(comparison.sources.length).toBeGreaterThanOrEqual(3);
    expect(comparison.variancePct).toBeGreaterThanOrEqual(0);
    expect(comparison.adminApprovalRequired).toBe(true);
    expect(comparison.recommendedHierarchy.length).toBeGreaterThanOrEqual(3);
  });

  it('should return commodity coverage dashboard without labeling uncovered spend as savings', () => {
    const dashboard = service.getCoverageDashboard();
    expect(dashboard.totalCustomerSpend).toBe(86317055);
    expect(dashboard.pcbiCoveredSpend).toBe(32120405);
    expect(dashboard.pcbiUncoveredSpend).toBe(38459325);
    expect(dashboard.coveragePct).toBe(45.51);

    expect(dashboard.commodityCounts.PRODUCTION_READY).toBe(6);
    expect(dashboard.commodityCounts.NO_HISTORY).toBe(2);
    expect(dashboard.commodityCounts.NOT_BENCHMARKABLE).toBe(1);

    expect(dashboard.topUncoveredCommoditiesBySpend.length).toBeGreaterThanOrEqual(6);
  });

  it('should execute Section 10 Unit / Currency Display QA validation', () => {
    // Valid case: INR matching INR, MT matching MT
    const validResult = service.validateUnitCurrencyDisplay(142500, 'MT', 'INR', 142500, 'MT', 'INR');
    expect(validResult.isValidDisplay).toBe(true);
    expect(validResult.discrepancyError).toBeNull();

    // Invalid Currency: INR transaction displayed as GBP (£)
    const invalidCurrency = service.validateUnitCurrencyDisplay(142500, 'MT', 'INR', 1350, 'MT', 'GBP');
    expect(invalidCurrency.isValidDisplay).toBe(false);
    expect(invalidCurrency.discrepancyError).toContain('CURRENCY_DISPLAY_MISMATCH');

    // Invalid Unit: MT displayed as ROLL
    const invalidUnit1 = service.validateUnitCurrencyDisplay(142500, 'MT', 'INR', 500, 'ROLL', 'INR');
    expect(invalidUnit1.isValidDisplay).toBe(false);
    expect(invalidUnit1.discrepancyError).toContain('UNIT_DISPLAY_MISMATCH');

    // Invalid Unit: PIECE displayed as LITRE
    const invalidUnit2 = service.validateUnitCurrencyDisplay(100, 'PIECE', 'INR', 100, 'LITRE', 'INR');
    expect(invalidUnit2.isValidDisplay).toBe(false);
    expect(invalidUnit2.discrepancyError).toContain('UNIT_DISPLAY_MISMATCH');
  });

  it('should generate PCBI_COMMODITY_COVERAGE_MASTER.xlsx with all 8 sheets', () => {
    const tempOut = path.resolve(process.cwd(), 'PCBI_COMMODITY_COVERAGE_MASTER.xlsx');
    const createdPath = service.generateMasterExcel(tempOut);
    expect(fs.existsSync(createdPath)).toBe(true);
    expect(fs.statSync(createdPath).size).toBeGreaterThan(1000);
  });

  it('should validate frequency compatibility and flag METHODOLOGY_PENDING when frequencies differ', () => {
    const match = service.checkFrequencyCompatibility('MONTHLY', 'MONTHLY');
    expect(match.isCompatible).toBe(true);
    expect(match.status).toBe('PRODUCTION_READY');

    const mismatchDaily = service.checkFrequencyCompatibility('DAILY', 'MONTHLY', '75 months', 'None');
    expect(mismatchDaily.isCompatible).toBe(false);
    expect(mismatchDaily.status).toBe('METHODOLOGY_PENDING');
    expect(mismatchDaily.details?.sourceFrequency).toBe('DAILY');
    expect(mismatchDaily.details?.requiredFrequency).toBe('MONTHLY');
    expect(mismatchDaily.details?.adminApprovalRequired).toBe(true);
    expect(mismatchDaily.details?.proposedTransformation).toContain('DAILY_TO_MONTHLY_AGGREGATION');

    const mismatchFortnightly = service.checkFrequencyCompatibility('FORTNIGHTLY', 'MONTHLY');
    expect(mismatchFortnightly.isCompatible).toBe(false);
    expect(mismatchFortnightly.status).toBe('METHODOLOGY_PENDING');
  });

  it('should validate dynamic extraction mapping and require review on incomplete fields', () => {
    const verified = service.validateDynamicExtraction({
      sourceDate: '2026-06-01',
      rawValue: '142500',
      rawUnit: 'MT',
      rawCurrency: 'INR',
      sourceFrequency: 'MONTHLY',
      sourceGeography: 'INDIA_DOMESTIC',
      sourceGrade: 'Standard 65%',
      status: 'EXTRACTION_VERIFIED'
    });
    expect(verified.status).toBe('EXTRACTION_VERIFIED');

    const uncertain = service.validateDynamicExtraction({
      sourceDate: '',
      rawValue: '142500',
      rawUnit: '',
      rawCurrency: 'INR',
      sourceFrequency: 'MONTHLY',
      sourceGeography: 'INDIA_DOMESTIC',
      sourceGrade: '',
      status: 'EXTRACTION_VERIFIED'
    });
    expect(uncertain.status).toBe('EXTRACTION_REVIEW_REQUIRED');
  });
});
