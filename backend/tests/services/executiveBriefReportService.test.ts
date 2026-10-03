import { describe, it, expect } from 'vitest';
import { executiveBriefReportService } from '../../src/services/executiveBriefReportService';

describe('ExecutiveBriefReportService', () => {
  it('should return 9 summary KPI cards', () => {
    const cards = executiveBriefReportService.getSummaryCards();
    expect(cards).toHaveLength(9);
    expect(cards[0].id).toBe('kpi-total-spend');
    expect(cards[1].id).toBe('kpi-addressable-spend');
    expect(cards[2].id).toBe('kpi-identified-opp');
    expect(cards[3].id).toBe('kpi-approved-savings');
    expect(cards[4].id).toBe('kpi-realized-savings');
    expect(cards[5].id).toBe('kpi-opp-count');
    expect(cards[6].id).toBe('kpi-transactions');
    expect(cards[7].id).toBe('kpi-suppliers');
    expect(cards[8].id).toBe('kpi-categories');
  });

  it('should return 8 slide groups covering all 30 slides', () => {
    const groups = executiveBriefReportService.getSlideGroups();
    expect(groups).toHaveLength(8);
    expect(groups[0].title).toBe('Executive Overview');
    expect(groups[1].title).toBe('Procucev & Client Context');
    expect(groups[2].title).toBe('Module 1: Spend Diagnostic');
    expect(groups[3].title).toBe('Module 2: Strategic Sourcing');
    expect(groups[4].title).toBe('Module 3: PCBI Benchmarking');
    expect(groups[5].title).toBe('Module 4: Savings Execution');
    expect(groups[6].title).toBe('Recommendations & Roadmap');
    expect(groups[7].title).toBe('Evidence & Audit');
  });

  it('should return full traceability lineage items', () => {
    const lineage = executiveBriefReportService.getTraceabilityLineage();
    expect(lineage.length).toBeGreaterThan(0);
    expect(lineage[0].findingId).toBe('FIND-01');
    expect(lineage[0].module).toBe('Module 1');
    expect(lineage[0].erpRecord).toBeDefined();
    expect(lineage[0].calculation).toBeDefined();
  });

  it('should assemble full report data bundle', () => {
    const report = executiveBriefReportService.assembleFullReport('UltraTech Cement Limited');
    expect(report.metadata.client).toBe('UltraTech Cement Limited');
    expect(report.summaryCards).toHaveLength(9);
    expect(report.sections).toHaveLength(8);
    expect(report.traceabilityLineage.length).toBeGreaterThan(0);
    expect(report.validationChecklist.module1Validated).toBe(true);
    expect(report.validationChecklist.financialReconciliation).toBe(true);
    expect(report.artifacts.length).toBeGreaterThanOrEqual(5);
  });
});
