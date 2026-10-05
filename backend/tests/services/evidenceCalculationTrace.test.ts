/**
 * Unit Tests for EvidenceCalculationTrace (Prompt 305)
 */

import { describe, it, expect } from 'vitest';
import { EvidenceCalculationTrace } from '../../src/services/evidenceCalculationTrace';
import { EVIDENCE_CERTIFIED_BENCHMARKS } from '../../src/constants/evidenceWorkbook';

describe('EvidenceCalculationTrace Unit Tests', () => {
  it('should generate standard Executive Summary rows with certified benchmark figures', () => {
    const rows = EvidenceCalculationTrace.getExecutiveSummaryRows('Module 1', '04_SUPPLIER_ANALYSIS');
    expect(rows).toBeDefined();
    expect(rows.length).toBe(10);

    const spendRow = rows.find(r => r['KPI Metric'] === 'Total Customer Baseline Spend');
    expect(spendRow).toBeDefined();
    expect(spendRow?.['UI Value']).toBe(`₹${EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_SPEND_CR.toFixed(2)} Cr`);
    expect(spendRow?.['Evidence Value']).toBe(`₹${EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_SPEND_CR.toFixed(2)} Cr`);
    expect(spendRow?.['Reconciliation Status']).toBe('PASS');
    expect(spendRow?.Variance).toBe('₹0.00 Cr');

    const netDirectRow = rows.find(r => r['KPI Metric'] === 'Net Direct Savings Opportunity');
    expect(netDirectRow?.['UI Value']).toBe(`₹${EVIDENCE_CERTIFIED_BENCHMARKS.NET_DIRECT_SAVINGS_CR.toFixed(2)} Cr`);
    expect(netDirectRow?.['Reconciliation Status']).toBe('PASS');
  });

  it('should prove the exact mathematical bridge with zero variance', () => {
    const bridge = EvidenceCalculationTrace.getCalculationBridgeRows();
    expect(bridge).toBeDefined();
    expect(bridge.length).toBe(5);

    // Step 1: OPP-001
    const opp001 = bridge.find(r => r['Initiative / Component'].includes('OPP-001'));
    expect(opp001?.['Gross Opportunity (₹ Cr)']).toBe(6.17);
    expect(opp001?.['Net Pipeline (₹ Cr)']).toBe(6.17);

    // Step 2: OPP-003 Price Gap
    const opp003 = bridge.find(r => r['Initiative / Component'].includes('OPP-003'));
    expect(opp003?.['Gross Opportunity (₹ Cr)']).toBe(80.67);
    expect(opp003?.['Overlap Deductions (₹ Cr)']).toBe(40.20);
    expect(opp003?.['Net Pipeline (₹ Cr)']).toBe(40.47);
    expect(opp003?.['Net Direct Opportunity (₹ Cr)']).toBe(29.73);

    // Step 3: OPP-004 Strategic Sourcing
    const opp004 = bridge.find(r => r['Initiative / Component'].includes('OPP-004'));
    expect(opp004?.['Gross Opportunity (₹ Cr)']).toBe(71.40);
    expect(opp004?.['Overlap Deductions (₹ Cr)']).toBe(22.60);
    expect(opp004?.['Net Pipeline (₹ Cr)']).toBe(48.80);
    expect(opp004?.['Net Direct Opportunity (₹ Cr)']).toBe(42.82);

    // Step 4: OPP-006 Strategic Market Value
    const opp006 = bridge.find(r => r['Initiative / Component'].includes('OPP-006'));
    expect(opp006?.['Gross Opportunity (₹ Cr)']).toBe(14.88);
    expect(opp006?.['Strategic Market Value (₹ Cr)']).toBe(14.88);
    expect(opp006?.['Net Direct Opportunity (₹ Cr)']).toBe(0.00);

    // Step 5: Totals
    const totals = bridge.find(r => r['Initiative / Component'].includes('TOTALS'));
    expect(totals?.['Gross Opportunity (₹ Cr)']).toBe(173.12);
    expect(totals?.['Overlap Deductions (₹ Cr)']).toBe(62.80);
    expect(totals?.['Exclusions (₹ Cr)']).toBe(16.72);
    expect(totals?.['Net Pipeline (₹ Cr)']).toBe(93.60);
    expect(totals?.['Strategic Market Value (₹ Cr)']).toBe(14.88);
    expect(totals?.['Net Direct Opportunity (₹ Cr)']).toBe(78.72);

    // Verification: 173.12 - 62.80 - 16.72 = 93.60; 93.60 - 14.88 = 78.72
    const netDefensible = Number((173.12 - 62.80 - 16.72).toFixed(2));
    expect(netDefensible).toBe(93.60);
    const netDirect = Number((netDefensible - 14.88).toFixed(2));
    expect(netDirect).toBe(78.72);
  });

  it('should return 9 mandatory automated checks all with status PASS', () => {
    const checks = EvidenceCalculationTrace.getFinancialCheckRows();
    expect(checks).toBeDefined();
    expect(checks.length).toBe(9);

    checks.forEach(check => {
      expect(check.Status).toBe('PASS');
    });

    const check8 = checks.find(c => c['Check #'] === 'CHECK 8');
    expect(check8?.['Validation Rule']).toContain('Realized savings (₹68.00 Cr) is NOT added');
    expect(check8?.Status).toBe('PASS');

    const check9 = checks.find(c => c['Check #'] === 'CHECK 9');
    expect(check9?.['Validation Rule']).toContain('₹420 Cr risk/de-risked spend is NOT monetized');
    expect(check9?.Status).toBe('PASS');
  });
});
