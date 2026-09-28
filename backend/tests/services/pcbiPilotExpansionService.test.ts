import { describe, it, expect } from 'vitest';
import {
  pcbiPilotExpansionService,
  PCBIPilotExpansionService
} from '../../src/services/pcbiPilotExpansionService';

describe('PCBIPilotExpansionService (V1.6 Controlled Pilot & Dynamic Expansion)', () => {
  it('should return singleton instance', () => {
    const inst1 = PCBIPilotExpansionService.getInstance();
    const inst2 = PCBIPilotExpansionService.getInstance();
    expect(inst1).toBe(inst2);
    expect(pcbiPilotExpansionService).toBe(inst1);
  });

  it('should generate Live Customer Gap Matrix sorted primarily by customer spend descending', () => {
    const matrix = pcbiPilotExpansionService.getLiveCustomerGapMatrix();
    expect(matrix.length).toBe(13); // 12 customer families + 1 service exclusion

    // Check descending order of customer spend
    for (let i = 0; i < matrix.length - 1; i++) {
      expect(matrix[i].customerSpend).toBeGreaterThanOrEqual(matrix[i + 1].customerSpend);
    }

    // Verify critical items
    const ferroMoly = matrix.find((i) => i.materialCode === 'RM-FEMOLY-65');
    expect(ferroMoly).toBeDefined();
    expect(ferroMoly?.customerSpend).toBe(12500000);
    expect(ferroMoly?.pcbiStatus).toBe('PCBI_MISSING');
    expect(ferroMoly?.priority).toBe('P1_CRITICAL');
    expect(ferroMoly?.adminAction).toBe('CREATE_PCBI');

    const pumps = matrix.find((i) => i.materialCode === 'EQ-PUMP-SLURRY');
    expect(pumps).toBeDefined();
    expect(pumps?.customerSpend).toBe(10309200);
    expect(pumps?.pcbiStatus).toBe('PCBI_DEFINED_NO_HISTORY');
    expect(pumps?.priority).toBe('P1_CRITICAL');
    expect(pumps?.adminAction).toBe('UPLOAD_HISTORY');

    const kraft = matrix.find((i) => i.materialCode === 'PM-KRAFT-140');
    expect(kraft).toBeDefined();
    expect(kraft?.pcbiStatus).toBe('PRODUCTION_READY');
    expect(kraft?.blockReason).toBeNull();
  });

  it('should aggregate Pilot Dashboard metrics accurately', () => {
    const metrics = pcbiPilotExpansionService.getPilotDashboardMetrics();
    expect(metrics.totalCustomerSpend).toBe(86317055);
    expect(metrics.totalCustomerSpendCr).toBe('₹8.6317 Cr');
    expect(metrics.totalCommodities).toBe(13);
    expect(metrics.productionReady).toBe(6);
    expect(metrics.highImpactGaps).toBe(2); // Ferro Molybdenum (₹1.25 Cr) and Slurry Pumps (₹1.03 Cr)
    expect(metrics.top20MissingPcbiBySpend.length).toBeLessThanOrEqual(20);
    expect(metrics.top20MissingPcbiBySpend.length).toBeGreaterThan(0);
  });

  it('should generate analytical preview with normalized INR customer metrics and separated PCBI values', () => {
    const preview = pcbiPilotExpansionService.getNormalizedAnalyticalPreview();
    expect(preview.length).toBe(6);

    for (const item of preview) {
      expect(item.customerPurchasePrice).toBeGreaterThan(0);
      expect(item.customerCurrency).toBe('INR');
      expect(item.customerUnit).toBeDefined();
      expect(item.pcbiBaseValue).toBeGreaterThan(0);
      expect(item.pcbiCurrentValue).toBeGreaterThan(0);
      expect(item.pcbiCurrency).toBeDefined();
      expect(item.pcbiUnit).toBeDefined();
      expect(item.pcbiIndex).toBeGreaterThan(0);
      expect(item.disclaimer).toBe('ANALYTICAL PREVIEW — NOT SAVINGS');
      expect(item.savingsCalculated).toBe(0);
      expect(item.commercialOpportunity).toBe(0);
      expect(item.supplierPerformanceRanking).toBeNull();
    }
  });

  it('should detect uploaded file formats in preview mode without silent approval', () => {
    const supportedFormats = ['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT'] as const;

    for (const format of supportedFormats) {
      const detected = pcbiPilotExpansionService.detectUploadedFile(format, `benchmark_feed.${format.toLowerCase()}`);
      expect(detected.format).toBe(format);
      expect(detected.previewStatus).toBe('PREVIEW_READY');
      expect(detected.silentlyApproved).toBe(false);
      expect(detected.detectedPriceCol).toBe('Benchmark_Settlement_Price');
      expect(detected.detectedFrequency).toBe('MONTHLY');
      expect(detected.sampleRows.length).toBe(3);
    }

    // Invalid format should throw
    expect(() => {
      pcbiPilotExpansionService.detectUploadedFile('INVALID' as any, 'data.exe');
    }).toThrow('Unsupported upload format: INVALID');
  });

  it('should standardize raw observations into the complete 24-field schema', () => {
    const raw = [
      {
        pcbiId: 'PCBI-TEST-001',
        commodityId: 'COMM-TEST',
        seriesId: 'SERIES-01',
        sourceName: 'Official Feed',
        sourceDate: '2020-04-01',
        effectiveDate: '2020-04-01',
        rawValue: 50000,
        rawUnit: 'INR/MT',
        rawCurrency: 'INR',
        standardValue: 50000,
        standardUnit: 'INR/MT',
        standardCurrency: 'INR',
        sourceFrequency: 'MONTHLY',
        standardFrequency: 'MONTHLY',
        geography: 'India',
        grade: 'Test Grade',
        specification: 'IS 1000',
        transformationMethod: 'DIRECT',
        methodologyId: 'METH-01',
        ingestionBatchId: 'BATCH-01',
        checksum: 'abc12345',
        validationStatus: 'VALIDATED',
        version: '1.0',
        approvedBy: 'LEAD',
        approvedAt: '2026-09-28T00:00:00Z'
      },
      {} // default fallbacks
    ];

    const standardized = pcbiPilotExpansionService.standardizeObservations(raw);
    expect(standardized.length).toBe(2);

    expect(standardized[0].pcbiId).toBe('PCBI-TEST-001');
    expect(standardized[0].rawValue).toBe(50000);
    expect(standardized[0].approvedBy).toBe('LEAD');

    expect(standardized[1].pcbiId).toBe('PCBI-FEMOLY-001');
    expect(standardized[1].rawValue).toBe(1250000.0);
    expect(standardized[1].version).toBe('1.0');
  });

  it('should support dynamic catalog actions without requiring code deployments', () => {
    const actions = [
      'CREATE_PCBI',
      'UPLOAD_HISTORY',
      'APPEND_HISTORY',
      'ADD_SOURCE',
      'ADD_METHODOLOGY',
      'VALIDATE',
      'APPROVE',
      'REJECT',
      'VIEW_PROVENANCE',
      'VIEW_VERSION_HISTORY',
      'ADD_COMMODITY',
      'ADD_GRADE',
      'ADD_SERIES',
      'UPDATE_SOURCE',
      'VERSION_SERIES',
      'DEPRECATE_SERIES'
    ] as const;

    for (const action of actions) {
      const res = pcbiPilotExpansionService.manageCatalog(action, { commodityId: 'COMM-001' });
      expect(res.success).toBe(true);
      expect(res.action).toBe(action);
      expect(res.version).toBe('1.6.0');
      expect(res.auditLogId).toContain('AUDIT-CATALOG-');
    }
  });

  it('should recalculate isolated commodity without affecting other commodities or requiring full rerun', () => {
    const res = pcbiPilotExpansionService.recalculateTargetedCommodity('COMMODITY-FEMOLY-65');
    expect(res.recalculatedCommodity).toBe('COMMODITY-FEMOLY-65');
    expect(res.previousState).toBe('PARTIAL_HISTORY');
    expect(res.newState).toBe('PRODUCTION_READY');
    expect(res.isolationConfirmed).toBe(true);
    expect(res.otherCommoditiesAffected).toBe(false);
  });

  it('should execute all 20 Product Acceptance Tests and pass 100%', () => {
    const tests = pcbiPilotExpansionService.executeProductAcceptanceTests();
    expect(tests.length).toBe(20);

    for (const test of tests) {
      expect(test.passed).toBe(true);
      expect(test.testId).toMatch(/^TEST_\d{2}$/);
      expect(test.details.length).toBeGreaterThan(0);
      expect(Object.keys(test.evidence).length).toBeGreaterThan(0);
    }

    // Verify non-blocking test specifically
    const test15 = tests.find((t) => t.testId === 'TEST_15');
    expect(test15?.evidence.nonBlockingConfirmed).toBe(true);
    expect(test15?.evidence.steelCalculated).toBe(true);
    expect(test15?.evidence.ferroMolyBlocked).toBe(true);

    // Verify savings = zero
    const test19 = tests.find((t) => t.testId === 'TEST_19');
    expect(test19?.evidence.savingsCalculated).toBe(0);

    // Verify commercial purchases = zero
    const test20 = tests.find((t) => t.testId === 'TEST_20');
    expect(test20?.evidence.commercialPurchases).toBe(0);
  });

  it('should confirm controlled pilot readiness gate as PRODUCTION_READY_FOR_CONTROLLED_PILOT', () => {
    const summary = pcbiPilotExpansionService.getControlledPilotReadiness();
    expect(summary.module3Status).toBe('PRODUCTION_READY_FOR_CONTROLLED_PILOT');
    expect(summary.allTestsPassed).toBe(true);
    expect(summary.totalTests).toBe(20);
    expect(summary.passedTests).toBe(20);
    expect(summary.failedTests).toBe(0);
    expect(summary.module1Frozen).toBe(true);
    expect(summary.module2Frozen).toBe(true);
    expect(summary.pcbiMasterImmutable).toBe(true);
    expect(summary.module4Disconnected).toBe(true);
    expect(summary.savingsCalculated).toBe(0);
    expect(summary.commercialPurchases).toBe(0);
    expect(summary.controlledPilotMode).toBe(true);
  });
});
