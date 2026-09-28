import { describe, it, expect } from 'vitest';
import {
  pcbiProductionPilotService,
  PCBIProductionPilotService
} from '../../src/services/pcbiProductionPilotService';

describe('PCBIProductionPilotService (V1.7 Production Pilot & Dynamic Library)', () => {
  it('should return singleton instance', () => {
    const inst1 = PCBIProductionPilotService.getInstance();
    const inst2 = PCBIProductionPilotService.getInstance();
    expect(inst1).toBe(inst2);
    expect(pcbiProductionPilotService).toBe(inst1);
  });

  it('should aggregate Coverage Dashboard metrics accurately with spend breakdown', () => {
    const metrics = pcbiProductionPilotService.getCoverageDashboardMetrics();
    expect(metrics.totalPcbiCommodities).toBe(13);
    expect(metrics.productionReady).toBe(6);
    expect(metrics.customerSpendCovered).toBe(32120405);
    expect(metrics.customerSpendCoveredCr).toBe('₹3.2120 Cr');
    expect(metrics.customerSpendGap).toBe(38459325);
    expect(metrics.customerSpendGapCr).toBe('₹3.8459 Cr');
    expect(metrics.pctSpendCovered).toBe(37.21);
    expect(metrics.pctSpendGap).toBe(44.56);
  });

  it('should generate High-Impact Gap Alerts for commodities exceeding spend threshold', () => {
    const defaultAlerts = pcbiProductionPilotService.getHighImpactGapAlerts();
    expect(defaultAlerts.length).toBe(2); // Ferro Moly (₹1.25 Cr) and Slurry Pumps (₹1.03 Cr)

    const ferroMoly = defaultAlerts.find((a) => a.materialCode === 'RM-FEMOLY-65');
    expect(ferroMoly).toBeDefined();
    expect(ferroMoly?.customerSpend).toBe(12500000);
    expect(ferroMoly?.alertLevel).toBe('PCBI COVERAGE GAP — HIGH IMPACT');
    expect(ferroMoly?.recommendedActions).toContain('CREATE PCBI');

    const pumps = defaultAlerts.find((a) => a.materialCode === 'EQ-PUMP-SLURRY');
    expect(pumps).toBeDefined();
    expect(pumps?.customerSpend).toBe(10309200);
    expect(pumps?.alertLevel).toBe('PCBI COVERAGE GAP — HIGH IMPACT');
    expect(pumps?.recommendedActions).toContain('UPLOAD HISTORY');

    // With lower threshold, includes Carbide Inserts (₹7.72M)
    const lowerThresholdAlerts = pcbiProductionPilotService.getHighImpactGapAlerts(5000000);
    expect(lowerThresholdAlerts.length).toBe(3);
  });

  it('should perform Section 16 Data Consistency Check and confirm exact mathematical reconciliation', () => {
    const consistency = pcbiProductionPilotService.performDataConsistencyCheck();
    expect(consistency.isConsistent).toBe(true);
    expect(consistency.customerCommodityCount).toBe(13);
    expect(consistency.materialCommodityCount).toBe(12);
    expect(consistency.excludedServiceCount).toBe(1);
    expect(consistency.productionReadyCount).toBe(6);
    expect(consistency.researchQueueCount).toBe(6);
    expect(consistency.partialHistoryCount).toBe(2);
    expect(consistency.noHistoryCount).toBe(2);
    expect(consistency.pcbiCatalogCount).toBe(290);
    expect(consistency.auditDetails).toContain('Reconciliation verified');
  });

  it('should process universal file detection and flag ambiguous columns for manual mapping', () => {
    // High confidence
    const highConf = pcbiProductionPilotService.detectUniversalFile('XLSX', 'settlement_feed.xlsx');
    expect(highConf.status).toBe('MAPPING_CONFIRMED');
    expect(highConf.confidenceScore).toBeGreaterThan(90);
    expect(highConf.unmappedColumns).toHaveLength(0);

    // Ambiguous headers requiring manual review
    const ambiguous = pcbiProductionPilotService.detectUniversalFile('CSV', 'custom_report.csv', [
      'Col_A',
      'Unrecognized_Metric'
    ]);
    expect(ambiguous.status).toBe('DATA_MAPPING_REVIEW_REQUIRED');
    expect(ambiguous.confidenceScore).toBeLessThan(80);
    expect(ambiguous.unmappedColumns).toContain('Col_A');
  });

  it('should audit duplicate observation dates and support admin review resolution', () => {
    const obs = [
      { date: '2020-04-01', value: 1250000 },
      { date: '2020-07-01', value: 1280000 }
    ];

    const duplicates = pcbiProductionPilotService.checkDuplicateObservations(
      'SERIES-FEMOLY-M1',
      obs,
      'RETAIN_EXISTING'
    );
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].observationDate).toBe('2020-04-01');
    expect(duplicates[0].status).toBe('DUPLICATE_OBSERVATION_REVIEW');
    expect(duplicates[0].resolution).toBe('RETAIN_EXISTING');
  });

  it('should manage dynamic catalog expansion and generate dynamic PCBI IDs without code deployment', () => {
    const res = pcbiProductionPilotService.manageDynamicCatalog('ADD_PCBI_DEFINITION', {
      commodityCode: 'NICKEL'
    });
    expect(res.success).toBe(true);
    expect(res.generatedId).toMatch(/^PCBI-NICKEL-\d{4}$/);
    expect(res.version).toBe('1.7.0');
  });

  it('should recalculate targeted impact for isolated series without global dataset disruption', () => {
    const res = pcbiProductionPilotService.recalculateTargetedImpact('SERIES-FEMOLY-M1');
    expect(res.recalculatedSeries).toBe('SERIES-FEMOLY-M1');
    expect(res.affectedCommodity).toBe('Ferro Molybdenum 65%');
    expect(res.affectedTransactionsCount).toBe(6);
    expect(res.otherCommoditiesAffected).toBe(false);
  });

  it('should execute all 24 Final Acceptance Tests and pass 100%', () => {
    const tests = pcbiProductionPilotService.executeAcceptanceTests();
    expect(tests).toHaveLength(24);

    for (const t of tests) {
      expect(t.passed).toBe(true);
      expect(t.testId).toMatch(/^TEST_\d{2}$/);
      expect(t.details.length).toBeGreaterThan(0);
      expect(Object.keys(t.evidence).length).toBeGreaterThan(0);
    }

    // Verify critical tests
    const test01 = tests.find((t) => t.testId === 'TEST_01');
    expect(test01?.evidence.eligibleCalculatedCount).toBe(6);

    const test07 = tests.find((t) => t.testId === 'TEST_07');
    expect(test07?.evidence.manualMappingSupported).toBe(true);

    const test09 = tests.find((t) => t.testId === 'TEST_09');
    expect(test09?.evidence.duplicateDetected).toBe(true);

    const test16 = tests.find((t) => t.testId === 'TEST_16');
    expect(test16?.evidence.otherCommoditiesAffected).toBe(false);

    const test22 = tests.find((t) => t.testId === 'TEST_22');
    expect(test22?.evidence.savingsCalculated).toBe(0);

    const test23 = tests.find((t) => t.testId === 'TEST_23');
    expect(test23?.evidence.dynamicCommodityAdded).toBe(true);
  });

  it('should generate Production Pilot Release Report confirming status PRODUCTION_PILOT_READY', () => {
    const report = pcbiProductionPilotService.getProductionPilotReleaseReport();
    expect(report.module3Status).toBe('PRODUCTION_PILOT_READY');
    expect(report.allTestsPassed).toBe(true);
    expect(report.totalTests).toBe(24);
    expect(report.passedTests).toBe(24);
    expect(report.failedTests).toBe(0);
    expect(report.consistencyCheck.isConsistent).toBe(true);
    expect(report.coverageDashboard.productionReady).toBe(6);
    expect(report.highImpactGaps).toHaveLength(2);
    expect(report.releaseTimestamp).toBeDefined();
  });
});
