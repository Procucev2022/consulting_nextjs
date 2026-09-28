import { describe, it, expect, beforeEach } from 'vitest';
import { PCBIProductionReadyService } from '../../src/services/pcbiProductionReadyService';
import { FINAL_MODULE_3_STATUS } from '../../src/constants/pcbiProductionReady';

describe('PCBIProductionReadyService (backend/src/services/pcbiProductionReadyService.ts)', () => {
  let service: PCBIProductionReadyService;

  beforeEach(() => {
    service = PCBIProductionReadyService.getInstance();
    service.setMaterialityThreshold(10000000);
  });

  it('should return singleton instance and manage materiality threshold', () => {
    expect(service).toBeDefined();
    expect(service.getMaterialityThreshold()).toBe(10000000);

    service.setMaterialityThreshold(15000000);
    expect(service.getMaterialityThreshold()).toBe(15000000);

    // Negative/zero fallback
    service.setMaterialityThreshold(-500);
    expect(service.getMaterialityThreshold()).toBe(10000000);
  });

  it('should audit customer data mismatches across 12 categories with 16 attributes', () => {
    const mismatches = service.getCustomerDataMismatches();
    expect(mismatches.length).toBeGreaterThanOrEqual(6);

    const ferroMoly = mismatches.find((m) => m.commodity.includes('Ferro Molybdenum'));
    expect(ferroMoly).toBeDefined();
    expect(ferroMoly?.customerSpend).toBe(12500000);
    expect(ferroMoly?.requiredHistory).toContain('75 months');
    expect(ferroMoly?.mismatchType).toBe('HISTORICAL_DATA_MISSING');

    const carbide = mismatches.find((m) => m.commodity.includes('Tungsten Carbide'));
    expect(carbide).toBeDefined();
    expect(carbide?.availableHistory).toContain('42 months');
    expect(carbide?.mismatchType).toBe('HISTORICAL_DATA_INCOMPLETE');

    const scrap = mismatches.find((m) => m.commodity.includes('Stainless Steel 304 Scrap'));
    expect(scrap?.mismatchType).toBe('SOURCE_UNVERIFIED');

    const oil = mismatches.find((m) => m.commodity.includes('Industrial Hydraulic Oil'));
    expect(oil?.mismatchType).toBe('SPECIFICATION_MISMATCH');
  });

  it('should trigger high impact gap alerts for spend above materiality threshold', () => {
    service.setMaterialityThreshold(10000000); // ₹1.00 Cr
    const alerts = service.getHighImpactGapAlerts();

    expect(alerts.length).toBe(2);
    expect(alerts.map((a) => a.commodity)).toContain('Ferro Molybdenum 65%');
    expect(alerts.map((a) => a.commodity)).toContain('Heavy Duty Slurry Pumps');
    expect(alerts[0].alertType).toBe('HIGH_IMPACT_PCBI_GAP');
    expect(alerts[0].actions).toContain('CREATE PCBI');
  });

  it('should normalize arbitrary upload formats into internal standard observations', () => {
    const pdfRes = service.uploadAndNormalize({
      fileName: 'market_report.pdf',
      fileContent: '%PDF-1.4...',
      format: 'PDF'
    });
    expect(pdfRes.normalizedObservations.length).toBe(2);
    expect(pdfRes.qualityReport.frequencyDetected).toBe('MONTHLY');
    expect(pdfRes.qualityReport.validationStatus).toBe('VALIDATED');

    const xlsxRes = service.uploadAndNormalize({
      fileName: 'benchmark.xlsx',
      fileContent: 'binary...',
      format: 'XLSX'
    });
    expect(xlsxRes.qualityReport.frequencyDetected).toBe('MONTHLY');

    const csvRes = service.uploadAndNormalize({
      fileName: 'series.csv',
      fileContent: 'date,price...',
      format: 'CSV'
    });
    expect(csvRes.qualityReport.frequencyDetected).toBe('MONTHLY');

    const txtRes = service.uploadAndNormalize({
      fileName: 'raw.txt',
      fileContent: 'text data...',
      format: 'TXT'
    });
    expect(txtRes.qualityReport.frequencyDetected).toBe('UNKNOWN');
  });

  it('should manage immutable version history and support rollback', () => {
    const initialHistory = service.getVersionHistory();
    expect(initialHistory.length).toBeGreaterThanOrEqual(1);

    const addRes = service.executeVersionControl({
      operation: 'UPDATE',
      pcbiId: 'PCBI-IND-STL-HRC-001',
      newVersion: '1.1.0',
      approvedBy: 'COMMODITY_LEAD',
      changeReason: 'Updated specification guidelines'
    });
    expect(addRes.success).toBe(true);
    expect(addRes.activeVersion).toBe('1.1.0');

    // Rollback to prior version
    const rollbackRes = service.executeVersionControl({
      operation: 'ROLLBACK',
      pcbiId: 'PCBI-IND-STL-HRC-001',
      approvedBy: 'ADMIN_CHIEF',
      changeReason: 'Rollback to certified baseline'
    });
    expect(rollbackRes.success).toBe(true);
    expect(rollbackRes.activeVersion).toBe('1.0.0');

    const specificHistory = service.getVersionHistory('PCBI-IND-STL-HRC-001');
    expect(specificHistory.length).toBeGreaterThanOrEqual(3);

    // Rollback failure case on non-existent PCBI
    expect(() =>
      service.executeVersionControl({
        operation: 'ROLLBACK',
        pcbiId: 'NON_EXISTENT_PCBI',
        approvedBy: 'ADMIN',
        changeReason: 'Invalid'
      })
    ).toThrow();
  });

  it('should execute governed Admin approval and targeted customer rerun', () => {
    const rerun = service.approveAndRerun({
      pcbiId: 'PCBI-IND-MET-FMO-001',
      approvedBy: 'ADMIN_CHIEF',
      approvalId: 'APP-FMO-001'
    });

    expect(rerun.statusBefore.readiness).toBe('BLOCKED');
    expect(rerun.statusAfter.readiness).toBe('PRODUCTION_READY');
    expect(rerun.recalculatedTransactions).toBe(65);
    expect(rerun.resolvedAlertsCount).toBe(1);
  });

  it('should return complete management dashboard with uncovered spend', () => {
    const dashboard = service.getDashboardV16();
    expect(dashboard.totalPcbiCommodities).toBe(12);
    expect(dashboard.productionReady).toBe(6);
    expect(dashboard.customerSpendCovered).toBe(32120405);
    expect(dashboard.customerSpendNotCovered).toBe(38459325);
    expect(dashboard.coveragePct).toBe(45.51);
  });

  it('should pass all 20 acceptance tests A through T', () => {
    const tests = service.runAcceptanceTests();
    expect(tests.length).toBe(20);
    expect(tests.every((t) => t.passed)).toBe(true);

    const testKeys = tests.map((t) => t.testKey);
    const expectedKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    expect(testKeys).toEqual(expectedKeys);
  });

  it('should evaluate full production-readiness summary with 10 questions', () => {
    const summary = service.getProductionReadySummary();
    expect(summary.module3Status).toBe(FINAL_MODULE_3_STATUS);
    expect(summary.allTestsPassed).toBe(true);
    expect(summary.totalTests).toBe(20);
    expect(summary.failedTests).toBe(0);

    const answers = summary.tenQuestionsEvaluation;
    expect(answers.testsPassedCount).toBe(20);
    expect(answers.testsFailedCount).toBe(0);
    expect(answers.remainingBlockersCount).toBe(0);
    expect(answers.canAddCommodityWithoutCodeChanges).toBe(true);
    expect(answers.canConvertArbitraryFormatWithoutManualSchema).toBe(true);
    expect(answers.approvedPcbiTriggersCustomerReprocessing).toBe(true);
    expect(answers.rollbackAndVersioningWorks).toBe(true);
    expect(answers.finalProductionReadinessDecision).toBe(FINAL_MODULE_3_STATUS);
  });
});
