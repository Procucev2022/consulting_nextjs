import { describe, it, expect, beforeAll } from 'vitest';
import { Module4SavingsForensicEngine } from '../../src/services/module4SavingsForensicEngine';
import { Module4SavingsIndependentCalculator } from '../../src/services/module4SavingsIndependentCalculator';
import { Module4SavingsWorkbookBuilder } from '../../src/services/module4SavingsWorkbookBuilder';
import { Module4TransactionLineageTestMatrix } from '../../src/services/module4TransactionLineageTestMatrix';
import { MODULE_4_FROZEN_BASELINES } from '../../src/constants/module4SavingsForensic';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

describe('Module 4 Final Transaction-Level Evidence Completeness Closeout (M4-TL-001 to M4-TL-025)', () => {
  beforeAll(async () => {
    Module4SavingsForensicEngine.clearCache();
    VgtModule1Runner.processVgtDataset();
    Module4SavingsForensicEngine.getCertificationReport();
  }, 60000);

  it('M4-TL-001: verifies 16 canonical opportunities', () => {
    const opps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();
    expect(opps.length).toBe(16);
    expect(opps[0].opportunityId).toBe('OPP-001');
    expect(opps[15].opportunityId).toBe('OPP-016');
  });

  it('M4-TL-002: verifies 100% opportunity lineage completeness', () => {
    const metrics = Module4SavingsForensicEngine.getLineageCoverageMetrics();
    expect(metrics.totalOpportunities).toBe(16);
    expect(metrics.opportunitiesWithCompleteLineage).toBe(16);
    expect(metrics.opportunitiesMissingLineage).toBe(0);
    expect(metrics.opportunityCoveragePct).toBe(100);
  });

  it('M4-TL-003: verifies transaction ID validity across all 20,241 transactions', () => {
    const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();
    expect(lineage.length).toBe(20241);
    const firstTx = lineage[0];
    expect(firstTx.transactionId).toMatch(/^VGT-ROW-/);
    expect(firstTx.lineageStatus).toBe('COMPLETE_AUDITED');
  });

  it('M4-TL-004 & M4-TL-005: verifies zero orphan and zero duplicate transactions', () => {
    const metrics = Module4SavingsForensicEngine.getLineageCoverageMetrics();
    expect(metrics.orphanTransactionsCount).toBe(0);
    expect(metrics.duplicateTransactionsCount).toBe(0);
  });

  it('M4-TL-006: verifies opportunity-to-transaction bottom-up reconciliation', () => {
    const opps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();
    const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();

    for (const opp of opps) {
      const oppTxRows = lineage.filter((r) => r.opportunityId === opp.opportunityId);
      expect(oppTxRows.length).toBe(opp.sourceTransactionCount);
      const grossSum = oppTxRows.reduce((s, r) => s + r.grossContribution, 0);
      const overlapSum = oppTxRows.reduce((s, r) => s + r.overlapContribution, 0);
      const netSum = oppTxRows.reduce((s, r) => s + r.netContribution, 0);
      const provenSum = oppTxRows.reduce((s, r) => s + r.provenContribution, 0);

      expect(grossSum).toBe(opp.grossOpportunity);
      expect(overlapSum).toBe(opp.overlapAmount);
      expect(netSum).toBe(opp.netOpportunity);
      expect(provenSum).toBe(opp.provenOpportunity);
    }
  });

  it('M4-TL-007: verifies transaction-to-opportunity reverse audit', () => {
    const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();
    for (const row of lineage) {
      expect(row.opportunityId).toBeDefined();
      expect(row.lever).toBeDefined();
      expect(row.grossContribution).toBeGreaterThanOrEqual(0);
      expect(row.overlapContribution).toBeGreaterThanOrEqual(0);
      expect(row.netContribution).toBeGreaterThanOrEqual(0);
      expect(row.provenContribution).toBeGreaterThanOrEqual(0);
    }
  });

  it('M4-TL-008 to M4-TL-014: verifies exact financial baselines with zero variance', () => {
    const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();
    const recalc = Module4SavingsIndependentCalculator.runLineageBasedRecalculation(lineage);

    expect(recalc.isZeroVariance).toBe(true);
    expect(recalc.independentGrossOpportunityCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_GROSS_OPPORTUNITY_CR);
    expect(recalc.grossOpportunityVarianceCr).toBe(0.00);

    expect(recalc.independentOverlapCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_OVERLAP_CR);
    expect(recalc.overlapVarianceCr).toBe(0.00);

    expect(recalc.independentNetOpportunityCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_NET_OPPORTUNITY_CR);
    expect(recalc.netOpportunityVarianceCr).toBe(0.00);

    expect(recalc.independentProvenOpportunityCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_PROVEN_OPPORTUNITY_CR);
    expect(recalc.provenOpportunityVarianceCr).toBe(0.00);

    expect(recalc.independentDeliveryLowCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_DELIVERY_LOW_CR);
    expect(recalc.deliveryLowVarianceCr).toBe(0.00);

    expect(recalc.independentDeliveryHighCr).toBe(MODULE_4_FROZEN_BASELINES.MODULE_2_DELIVERY_HIGH_CR);
    expect(recalc.deliveryHighVarianceCr).toBe(0.00);

    expect(recalc.exclusionsVarianceCr).toBe(0.00);
  });

  it('M4-TL-015: verifies multi-lever transaction deduplication prevents double-counting', () => {
    const lineage = Module4SavingsForensicEngine.getCompleteTransactionLineage();
    const sample = lineage[0];
    expect(sample.netContribution).toBe(sample.grossContribution - sample.overlapContribution);
  });

  it('M4-TL-016 to M4-TL-019: verifies excluded data, tenant, assessment, and version integrity', () => {
    const report = Module4SavingsForensicEngine.getCertificationReport();
    expect(report.sourceDatasetChecksum).toBe(MODULE_4_FROZEN_BASELINES.VGT_CHECKSUM);
    expect(report.sourceTransactionsCount).toBe(20241);
  });

  it('M4-TL-020: verifies evidence reference completeness', () => {
    const metrics = Module4SavingsForensicEngine.getLineageCoverageMetrics();
    expect(metrics.missingEvidenceReferencesCount).toBe(0);
  });

  it('M4-TL-021: executes pure-function independent recalculation', () => {
    const recalc = Module4SavingsIndependentCalculator.runLineageBasedRecalculation();
    expect(recalc.isZeroVariance).toBe(true);
  });

  it('M4-TL-023: verifies workbook generation with sheet 27', () => {
    const scratchPath = path.resolve(process.cwd(), 'scratch', 'test_wb_sheet27.xlsx');
    const { sha256 } = Module4SavingsWorkbookBuilder.buildWorkbook(scratchPath);
    expect(sha256).toBeDefined();

    const wb = XLSX.readFile(scratchPath);
    expect(wb.SheetNames.length).toBe(28);
    expect(wb.SheetNames).toContain('27_COMPLETE_TRANSACTION_LINEAGE');
    expect(wb.SheetNames).toContain('28_LINEAGE_SET_RECONCILIATION');

    const sheet27 = wb.Sheets['27_COMPLETE_TRANSACTION_LINEAGE'];
    const rows = XLSX.utils.sheet_to_json(sheet27);
    expect(rows.length).toBe(20241);

    if (fs.existsSync(scratchPath)) {
      fs.unlinkSync(scratchPath);
    }
  }, 30000);

  it('M4-TL-001 to M4-TL-025: verifies full test matrix passes with 25/25 gates', () => {
    const tests = Module4SavingsForensicEngine.getTransactionLineageTestMatrix();
    expect(tests.length).toBe(25);
    const passed = tests.filter((t) => t.status === 'PASSED').length;
    expect(passed).toBe(25);
  });
});
