import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PCBIPlatformIntegrationService } from '../../src/services/pcbiPlatformIntegrationService';

describe('PCBIPlatformIntegrationService (backend/src/services/pcbiPlatformIntegrationService.ts)', () => {
  let service: PCBIPlatformIntegrationService;

  beforeEach(() => {
    service = PCBIPlatformIntegrationService.getInstance();
  });

  it('should return singleton instance and verify pre-production audit and checklist', () => {
    expect(service).toBeDefined();
    const audit = service.getPreProductionAuditReport();
    expect(audit.length).toBe(12);

    const checklist = service.getDeploymentChecklist();
    expect(checklist.length).toBe(19);
  });

  it('should execute continuity reconciliation with zero variance across M1 to M4', () => {
    const rec = service.runContinuityReconciliation();
    expect(rec.isReconciliationPassed).toBe(true);
    expect(rec.varianceCount).toBe(0);
    expect(rec.inputTransactionsCount).toBe(468);
    expect(rec.module1OutputCount).toBe(468);
    expect(rec.module2ClassifiedCount).toBe(468);
    expect(rec.module3ProcessedCount).toBe(468);
    expect(rec.module4EvaluatedCount).toBe(468);
    expect(rec.discrepancyDetails).toEqual([]);
  });

  it('should evaluate Module 4 opportunity with strict governance block rules', () => {
    // 1. Valid opportunity
    const valid = service.evaluateModule4Opportunity({
      transactionId: 'TX-TEST-001',
      customerActualPrice: 100000,
      customerUnit: 'MT',
      customerCurrency: 'INR',
      customerDate: '2026-06-01',
      module2Classification: 'Copper Rods',
      unspsc: '30102100',
      pcbiId: 'PCBI-001',
      pcbiIndex: 120.0,
      pcbiBenchmarkValue: 90000,
      pcbiSource: 'Exchange',
      pcbiMethodology: 'WEIGHTED_AVG',
      pcbiEffectiveDate: '2026-06',
      pcbiStatus: 'PCBI_AVAILABLE',
      pcbiUnit: 'MT',
      pcbiCurrency: 'INR',
      pcbiGeography: 'INDIA_DOMESTIC',
      provenanceReference: 'REF-001'
    });
    expect(valid.outputCategory).toBe('OPPORTUNITY_ELIGIBLE');
    expect(valid.isOpportunityEligible).toBe(true);
    expect(valid.potentialOpportunityInr).toBe(10000);
    expect(valid.provenanceHash).toBeDefined();

    // 2. Not benchmarkable
    const notBench = service.evaluateModule4Opportunity({
      transactionId: 'TX-TEST-002',
      customerActualPrice: 50000,
      customerUnit: 'MONTH',
      customerCurrency: 'INR',
      customerDate: '2026-06-01',
      module2Classification: 'Catering Service',
      unspsc: '90101500',
      pcbiId: 'PCBI-SRV',
      pcbiIndex: null,
      pcbiBenchmarkValue: null,
      pcbiSource: 'NONE',
      pcbiMethodology: 'NONE',
      pcbiEffectiveDate: '2026-06',
      pcbiStatus: 'PCBI_NOT_BENCHMARKABLE',
      pcbiUnit: 'MONTH',
      pcbiCurrency: 'INR',
      pcbiGeography: 'INDIA_DOMESTIC',
      provenanceReference: 'REF-002'
    });
    expect(notBench.outputCategory).toBe('NOT_BENCHMARKABLE');
    expect(notBench.isOpportunityEligible).toBe(false);

    // 3. Gap / Missing PCBI
    const gap = service.evaluateModule4Opportunity({
      transactionId: 'TX-TEST-003',
      customerActualPrice: 120000,
      customerUnit: 'MT',
      customerCurrency: 'INR',
      customerDate: '2026-06-01',
      module2Classification: 'Ferro Moly',
      unspsc: '30102900',
      pcbiId: 'PCBI-FMO',
      pcbiIndex: null,
      pcbiBenchmarkValue: null,
      pcbiSource: 'UNVERIFIED',
      pcbiMethodology: 'PENDING',
      pcbiEffectiveDate: '2026-06',
      pcbiStatus: 'PCBI_MISSING',
      pcbiUnit: 'MT',
      pcbiCurrency: 'INR',
      pcbiGeography: 'INDIA_DOMESTIC',
      provenanceReference: 'REF-003'
    });
    expect(gap.outputCategory).toBe('OPPORTUNITY_BLOCKED_PCBI_GAP');
    expect(gap.isOpportunityEligible).toBe(false);
  });

  it('should evaluate controlled test portfolio across scenarios A through J', () => {
    const portfolio = service.runControlledTestPortfolio();
    expect(Object.keys(portfolio).length).toBe(10);
    expect(portfolio['Scenario A — Production-ready PCBI'].outputCategory).toBe('OPPORTUNITY_ELIGIBLE');
    expect(portfolio['Scenario B — Partial-history PCBI'].outputCategory).toBe('OPPORTUNITY_BLOCKED_PCBI_GAP');
    expect(portfolio['Scenario C — Missing PCBI commodity'].outputCategory).toBe('OPPORTUNITY_BLOCKED_PCBI_GAP');
    expect(portfolio['Scenario D — Specification mismatch'].outputCategory).toBe('OPPORTUNITY_BLOCKED_SPECIFICATION');
    expect(portfolio['Scenario E — Unit mismatch'].outputCategory).toBe('OPPORTUNITY_BLOCKED_UNIT');
    expect(portfolio['Scenario F — Currency mismatch'].outputCategory).toBe('OPPORTUNITY_BLOCKED_CURRENCY');
    expect(portfolio['Scenario G — Geography mismatch'].outputCategory).toBe('OPPORTUNITY_BLOCKED_GEOGRAPHY');
    expect(portfolio['Scenario H — Frequency mismatch'].outputCategory).toBe('OPPORTUNITY_BLOCKED_FREQUENCY');
    expect(portfolio['Scenario I — Not-benchmarkable service'].outputCategory).toBe('NOT_BENCHMARKABLE');
    expect(portfolio['Scenario J — Newly added dynamic PCBI'].outputCategory).toBe('OPPORTUNITY_ELIGIBLE');
  });

  it('should run and pass all 20 Platform Acceptance Tests (Section 14)', () => {
    const tests = service.runTwentyAcceptanceTests();
    expect(tests.length).toBe(20);
    expect(tests.every((t) => t.passed)).toBe(true);
  });

  it('should return platform management dashboard spend categories without misclassifying gaps as savings', () => {
    const dashboard = service.getPlatformManagementDashboardMetrics();
    expect(dashboard.totalCustomerSpendInr).toBe(86317055);
    expect(dashboard.pcbiCoveredSpendInr).toBe(32120405);
    expect(dashboard.pcbiUncoveredSpendInr).toBe(38459325);
    expect(dashboard.benchmarkEligibleSpendInr).toBe(32120405);
    expect(dashboard.opportunityEligibleSpendInr).toBe(28450000);
    expect(dashboard.opportunityBlockedSpendInr).toBe(3670405);
    expect(dashboard.coveragePct).toBe(45.51);
  });

  it('should generate machine-readable audit JSON PCBI_V1_7_FULL_PLATFORM_AUDIT.json', () => {
    const tempPath = path.resolve(process.cwd(), 'PCBI_V1_7_FULL_PLATFORM_AUDIT.json');
    const out = service.generateAuditJson(tempPath);
    expect(fs.existsSync(out)).toBe(true);
    const content = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(content.platformStatus).toBe('PRODUCTION_READY_WITH_CONTROLLED_GAPS');
    expect(content.acceptanceTests.length).toBe(20);
  });
});
