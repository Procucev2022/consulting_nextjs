/**
 * Unit Tests for SavingsTypeEvidenceWorkbookBuilder (Prompt 306)
 * Validates dedicated XLSX evidence workbooks for all 7 canonical savings types:
 * VENDOR_CONSOLIDATION, BENCHMARK_PRICE_GAP, STRATEGIC_SOURCING, STRATEGIC_MARKET_VALUE,
 * PROCESS_PRODUCTIVITY, COST_AVOIDANCE_RISK, REALIZED_SAVINGS.
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { SavingsTypeEvidenceWorkbookBuilder } from '../../src/services/savingsTypeEvidenceWorkbookBuilder';
import {
  SAVINGS_TYPE_FILENAMES,
  SAVINGS_TYPES_INVENTORY,
  EVIDENCE_CERTIFIED_BENCHMARKS
} from '../../src/constants/evidenceWorkbook';
import type { CanonicalSavingsType, WorkbookReadmeMeta } from '../../src/types/evidenceWorkbook';

describe('SavingsTypeEvidenceWorkbookBuilder Unit Tests', () => {
  const sampleMeta: WorkbookReadmeMeta = {
    customerName: 'UltraTech Cement Limited',
    analysisRunId: 'job-init-default-001',
    dataVersionId: 'v1',
    reportVersionId: 'RPT-TNT-GLOBAL-8902-v1',
    moduleName: 'Savings Engine',
    workbookType: 'VENDOR_CONSOLIDATION',
    generatedAt: '2026-10-04T12:00:00Z',
    generatedBy: 'admin@procucev.com',
    calculationVersion: 'aiCEV-Engine-v2.4-Certified',
    sourceRecordCount: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_TRANSACTIONS,
    totalSourceSpendCr: EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_SPEND_CR,
    purpose: 'Granular evidence backup',
    validationInstructions: 'Trace calculations against source records',
    importantDefinitions: {},
    disclaimer: 'Generated from backend single source of truth.'
  };

  const savingsTypes = Object.keys(SAVINGS_TYPE_FILENAMES) as CanonicalSavingsType[];

  it.each(savingsTypes)('should build valid XLSX buffer for %s with required sheets', (type) => {
    const meta = { ...sampleMeta, workbookType: type };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook(type, meta);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames).toBeDefined();
    expect(wb.SheetNames).toContain('01_README');
    expect(wb.SheetNames).toContain('02_EXECUTIVE_SUMMARY');
    expect(wb.SheetNames).toContain('04_RECONCILIATION' in wb.Sheets ? '04_RECONCILIATION' : '05_RECONCILIATION');

    // Verify no formula errors across all sheets
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      for (const cellKey of Object.keys(sheet)) {
        if (cellKey.startsWith('!')) continue;
        const cell = sheet[cellKey];
        if (typeof cell.v === 'string') {
          expect(cell.v).not.toContain('#REF!');
          expect(cell.v).not.toContain('#VALUE!');
          expect(cell.v).not.toContain('#DIV/0!');
          expect(cell.v).not.toContain('#N/A');
        }
      }
    }
  });

  it('should verify VENDOR_CONSOLIDATION calculation bridge and modelling assumption note', () => {
    const meta = { ...sampleMeta, workbookType: 'VENDOR_CONSOLIDATION' };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('VENDOR_CONSOLIDATION', meta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const summarySheet = wb.Sheets['02_EXECUTIVE_SUMMARY'];
    const summaryRows = XLSX.utils.sheet_to_json<any>(summarySheet);
    const ruleRow = summaryRows.find((r) => r.KPI === 'Modelling Rule');
    expect(ruleRow?.Value).toContain('5% indicative modelling assumption');

    const bridgeSheet = wb.Sheets['03_CALCULATION_BRIDGE'];
    const rows = XLSX.utils.sheet_to_json<any>(bridgeSheet);
    const netRow = rows.find((r) => r.Stage.includes('Net Direct Opportunity'));
    expect(netRow['Amount (₹ Cr)']).toBe(6.17);
  });

  it('should verify BENCHMARK_PRICE_GAP bridge and parity across 4 key stages', () => {
    const meta = { ...sampleMeta, workbookType: 'BENCHMARK_PRICE_GAP' };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('BENCHMARK_PRICE_GAP', meta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const bridgeSheet = wb.Sheets['03_CALCULATION_BRIDGE'];
    const rows = XLSX.utils.sheet_to_json<any>(bridgeSheet);

    const gross = rows.find((r) => r['Bridge Stage'].includes('Gross Price Gap'));
    const overlap = rows.find((r) => r['Bridge Stage'].includes('Overlap'));
    const netOverlap = rows.find((r) => r['Bridge Stage'].includes('Net after Overlap'));
    const finalNet = rows.find((r) => r['Bridge Stage'].includes('Final Net Direct'));

    expect(gross['Value (₹ Cr)']).toBe(80.67);
    expect(overlap['Value (₹ Cr)']).toBe(-40.20);
    expect(netOverlap['Value (₹ Cr)']).toBe(40.47);
    expect(finalNet['Value (₹ Cr)']).toBe(29.73);
  });

  it('should verify STRATEGIC_SOURCING calculation bridge and isolation', () => {
    const meta = { ...sampleMeta, workbookType: 'STRATEGIC_SOURCING' };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('STRATEGIC_SOURCING', meta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const bridgeSheet = wb.Sheets['03_CALCULATION_BRIDGE'];
    const rows = XLSX.utils.sheet_to_json<any>(bridgeSheet);

    const gross = rows.find((r) => r.Stage.includes('Gross Sourcing Opportunity'));
    const overlap = rows.find((r) => r.Stage.includes('Overlap Deductions'));
    const netOverlap = rows.find((r) => r.Stage.includes('Net after Overlap'));
    const finalNet = rows.find((r) => r.Stage.includes('Final Net Direct'));

    expect(gross['Value (₹ Cr)']).toBe(71.40);
    expect(overlap['Value (₹ Cr)']).toBe(-22.60);
    expect(netOverlap['Value (₹ Cr)']).toBe(48.80);
    expect(finalNet['Value (₹ Cr)']).toBe(42.82);
  });

  it('should verify STRATEGIC_MARKET_VALUE non-direct savings isolation', () => {
    const meta = { ...sampleMeta, workbookType: 'STRATEGIC_MARKET_VALUE' };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('STRATEGIC_MARKET_VALUE', meta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const summarySheet = wb.Sheets['02_EXECUTIVE_SUMMARY'];
    const summaryRows = XLSX.utils.sheet_to_json<any>(summarySheet);

    const smvRow = summaryRows.find((r) => r.Metric.includes('Strategic Market Value'));
    expect(smvRow['Value (₹ Cr)']).toBe(14.88);

    const directRow = summaryRows.find((r) => r.Metric.includes('Net Direct Savings'));
    expect(directRow['Value (₹ Cr)']).toBe(78.72);
  });

  it('should verify PROCESS_PRODUCTIVITY maintains zero direct savings without baseline', () => {
    const meta = { ...sampleMeta, workbookType: 'PROCESS_PRODUCTIVITY' };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('PROCESS_PRODUCTIVITY', meta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const summarySheet = wb.Sheets['02_EXECUTIVE_SUMMARY'];
    const summaryRows = XLSX.utils.sheet_to_json<any>(summarySheet);

    const directSavings = summaryRows.find((r) => r.Metric.includes('Direct Monetary Savings'));
    expect(directSavings.Value).toContain('0.00 Cr');

    const policyRow = summaryRows.find((r) => r.Metric.includes('Mandatory Policy'));
    expect(policyRow.Value).toContain('time-motion baseline validated');
  });

  it('should verify COST_AVOIDANCE_RISK spend de-risked is not monetized as savings', () => {
    const meta = { ...sampleMeta, workbookType: 'COST_AVOIDANCE_RISK' };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('COST_AVOIDANCE_RISK', meta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const summarySheet = wb.Sheets['02_EXECUTIVE_SUMMARY'];
    const summaryRows = XLSX.utils.sheet_to_json<any>(summarySheet);

    const spendRow = summaryRows.find((r) => r.Metric.includes('Spend De-Risked'));
    expect(spendRow['Value (₹ Cr)']).toBe(420.00);

    const savingRow = summaryRows.find((r) => r.Metric.includes('Monetized Savings Recognized'));
    expect(savingRow.Value).toContain('Not Monetized as Savings');
  });

  it('should verify REALIZED_SAVINGS is strictly separated from Wave-1 pipeline', () => {
    const meta = { ...sampleMeta, workbookType: 'REALIZED_SAVINGS' };
    const buffer = SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('REALIZED_SAVINGS', meta);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const summarySheet = wb.Sheets['02_EXECUTIVE_SUMMARY'];
    const summaryRows = XLSX.utils.sheet_to_json<any>(summarySheet);

    const realizedRow = summaryRows.find((r) => r.Metric.includes('Historical Audited Realized Savings'));
    expect(realizedRow['Value (₹ Cr)']).toBe(68.00);

    const classificationRow = summaryRows.find((r) => r.Metric.includes('P&L Classification'));
    expect(classificationRow.Value).toContain('Non-Additive');
  });

  it('should throw error when building workbook with unknown savings type', () => {
    const meta = { ...sampleMeta, workbookType: 'UNKNOWN_TYPE' as any };
    expect(() =>
      SavingsTypeEvidenceWorkbookBuilder.buildWorkbook('UNKNOWN_TYPE' as any, meta)
    ).toThrow('Unsupported savings type');
  });

  it('should verify all 7 items are represented in SAVINGS_TYPES_INVENTORY', () => {
    expect(SAVINGS_TYPES_INVENTORY.length).toBe(7);
    const types = SAVINGS_TYPES_INVENTORY.map((item) => item.savingsType);
    expect(types).toContain('VENDOR_CONSOLIDATION');
    expect(types).toContain('BENCHMARK_PRICE_GAP');
    expect(types).toContain('STRATEGIC_SOURCING');
    expect(types).toContain('STRATEGIC_MARKET_VALUE');
    expect(types).toContain('PROCESS_PRODUCTIVITY');
    expect(types).toContain('COST_AVOIDANCE_RISK');
    expect(types).toContain('REALIZED_SAVINGS');
  });
});
