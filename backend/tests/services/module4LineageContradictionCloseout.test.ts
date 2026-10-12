import { describe, it, expect, beforeAll } from 'vitest';
import { Module4SavingsForensicEngine } from '../../src/services/module4SavingsForensicEngine';
import { Module4LineageSetReconciliationHelper } from '../../src/services/module4LineageSetReconciliationHelper';
import { Module4SavingsWorkbookBuilder } from '../../src/services/module4SavingsWorkbookBuilder';
import { MODULE_4_FROZEN_BASELINES } from '../../src/constants/module4SavingsForensic';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

describe('Module 4 Lineage Contradiction & Set Reconciliation Closeout (M4-LC-001 to M4-LC-012)', () => {
  beforeAll(async () => {
    Module4SavingsForensicEngine.clearCache();
    Module4SavingsForensicEngine.getLineageSetReconciliation();
  }, 60000);

  it('M4-LC-001: Opportunity assignment count reconciliation', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.totalAssignments).toBe(20241);
    expect(summary.rows).toHaveLength(16);

    const opp1 = summary.rows.find((r) => r.opportunityId === 'OPP-001');
    expect(opp1?.assignmentCount).toBe(1266);

    const remainingOpps = summary.rows.filter((r) => r.opportunityId !== 'OPP-001');
    expect(remainingOpps).toHaveLength(15);
    for (const r of remainingOpps) {
      expect(r.assignmentCount).toBe(1265);
    }

    const calculatedSum = (opp1?.assignmentCount ?? 0) + remainingOpps.reduce((s, r) => s + r.assignmentCount, 0);
    expect(calculatedSum).toBe(20241);
  });

  it('M4-LC-002: Unique transaction union reconciliation', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.uniqueTransactionUnion).toBe(20241);
    expect(summary.module1ValidatedTransactions).toBe(20241);
    expect(summary.unionVariance).toBe(0);
  });

  it('M4-LC-003: Duplicate assignment detection', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.duplicateAssignments).toBe(0);
    for (const r of summary.rows) {
      expect(r.duplicateTransactionCount).toBe(0);
      expect(r.assignmentCount).toBe(r.uniqueTransactionCount);
    }
  });

  it('M4-LC-004: Multi-lever transaction identification and partition status', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.is1To1PartitionConfirmed).toBe(true);
    expect(summary.multiLeverDuplicateCount).toBe(0);

    const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();
    expect(lineage).toHaveLength(20241);
    for (const row of lineage) {
      expect(row.assignmentType).toBe('PRIMARY_CANONICAL');
      expect(row.multiLeverFlag).toBe(false);
    }
  });

  it('M4-LC-005: Line-spend reconstruction directly from transactions', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    const expectedSpend = MODULE_4_FROZEN_BASELINES.MODULE_1_VALIDATED_SPEND_CR;
    expect(Math.abs(summary.totalLineSpendCr - expectedSpend)).toBeLessThan(0.001);

    for (const r of summary.rows) {
      expect(r.lineSpendInr).toBeGreaterThan(0);
      expect(r.lineSpendCr).toBeGreaterThan(0);
    }
  });

  it('M4-LC-006: Opportunity-to-transaction reconciliation', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    const opps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();

    for (const opp of opps) {
      const sRow = summary.rows.find((r) => r.opportunityId === opp.opportunityId);
      expect(sRow).toBeDefined();
      expect(sRow?.grossContributionInr).toBe(opp.grossOpportunity);
      expect(sRow?.overlapContributionInr).toBe(opp.overlapAmount);
      expect(sRow?.netContributionInr).toBe(opp.netOpportunity);
      expect(sRow?.provenContributionInr).toBe(opp.provenOpportunity);
    }
  });

  it('M4-LC-007: Transaction-to-opportunity reverse reconciliation', () => {
    const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();
    const opps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();
    const oppIdSet = new Set(opps.map((o) => o.opportunityId));

    for (const r of lineage) {
      expect(oppIdSet.has(r.opportunityId)).toBe(true);
      expect(r.lever).toBeDefined();
      expect(r.evidenceType).toBeDefined();
      expect(r.lineageStatus).toBe('COMPLETE_AUDITED');
    }
  });

  it('M4-LC-008: Gross financial reconciliation', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.totalGrossOpportunityCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_GROSS_OPPORTUNITY_CR);
  });

  it('M4-LC-009: Overlap financial reconciliation', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.totalOverlapContributionCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_OVERLAP_CR);
  });

  it('M4-LC-010: Net financial reconciliation', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.totalNetContributionCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_NET_OPPORTUNITY_CR);
  });

  it('M4-LC-011: Proven financial reconciliation', () => {
    const summary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    expect(summary.totalProvenContributionCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_PROVEN_OPPORTUNITY_CR);
  });

  it('M4-LC-012: Module 1 regression', () => {
    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    expect(bridge.totalValidatedSpendCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_1_VALIDATED_SPEND_CR);
    expect(bridge.varianceVsModule2NetCr).toBe(0.00);

    const tests = Module4SavingsForensicEngine.getLineageContradictionTests();
    expect(tests).toHaveLength(12);
    expect(tests.every((t) => t.status === 'PASSED')).toBe(true);
  });

  it('verifies Sheet 28 in the generated evidence workbook', () => {
    const scratchDir = path.resolve(__dirname, '../../scratch');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    const testWbPath = path.resolve(scratchDir, 'test_wb_sheet28.xlsx');
    const { filePath, sha256 } = Module4SavingsWorkbookBuilder.buildWorkbook(testWbPath);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(sha256).toBeDefined();

    const wb = XLSX.readFile(filePath);
    expect(wb.SheetNames).toContain('27_COMPLETE_TRANSACTION_LINEAGE');
    expect(wb.SheetNames).toContain('28_LINEAGE_SET_RECONCILIATION');
    expect(wb.SheetNames).toHaveLength(28);

    const s28 = XLSX.utils.sheet_to_json(wb.Sheets['28_LINEAGE_SET_RECONCILIATION'], { header: 1 }) as unknown[][];
    expect(s28.length).toBeGreaterThan(16);

    const header = s28[0] as string[];
    expect(header).toContain('Opportunity ID');
    expect(header).toContain('Assignment Count');
    expect(header).toContain('Unique Transaction Count');
  });

  it('handles negative branch when partition is not 1:1 in reconciliation helper', () => {
    const mockOpp = {
      opportunityId: 'OPP-001',
      sourceTransactionIds: ['TX-01'],
      supplierIds: ['SUP-1'],
      materialGroup: 'Direct',
      itemShortText: 'Item',
      plant: 'Plant 1',
      lever: 'Bundling',
      subLever: 'Tier',
      eligibleSpend: 100,
      eligibleSpendCr: 0.01,
      denominator: 0.01,
      denominatorType: 'VOLUME',
      formula: 'Rate',
      calculationFormula: 'Rate',
      grossOpportunity: 10,
      grossOpportunityCr: 0.001,
      overlapAmount: 2,
      overlapAmountCr: 0.0002,
      excludedAmount: 0,
      excludedAmountCr: 0,
      netOpportunity: 8,
      netOpportunityCr: 0.0008,
      provenOpportunity: 7,
      provenOpportunityCr: 0.0007,
      deliveryLow: 1,
      deliveryLowCr: 0.0001,
      deliveryHigh: 2,
      deliveryHighCr: 0.0002,
      ratePercentage: 5,
      evidenceType: 'EV',
      evidenceReference: 'REF',
      confidence: 'HIGH',
      status: 'PROVEN' as const,
      classification: 'DIRECT_SAVINGS' as const,
      overlapGroupId: 'OG-1',
      sourceTransactionCount: 1
    };

    const duplicateLineageRow = {
      opportunityId: 'OPP-001',
      lever: 'Bundling',
      subLever: 'Tier',
      transactionId: 'TX-DUP',
      supplier: 'SUP',
      materialGroup: 'Direct',
      plant: 'Plant 1',
      transactionDate: '2021-06-15',
      transactionAmount: 100,
      eligibleAmount: 100,
      denominatorType: 'VOLUME',
      grossContribution: 10,
      overlapContribution: 2,
      exclusionAmount: 0,
      netContribution: 8,
      provenContribution: 7,
      evidenceType: 'EV',
      evidenceReference: 'REF',
      lineageStatus: 'COMPLETE',
      assignmentType: 'PRIMARY_CANONICAL',
      multiLeverFlag: true
    };

    const summary = Module4LineageSetReconciliationHelper.buildReconciliationSummary(
      [mockOpp],
      [duplicateLineageRow, { ...duplicateLineageRow }]
    );
    expect(summary.is1To1PartitionConfirmed).toBe(false);
    expect(summary.duplicateAssignments).toBe(1);
    expect(summary.reconciliationNotes).toContain('Outcome B/C');
  });
});
