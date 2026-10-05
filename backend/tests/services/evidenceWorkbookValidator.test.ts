/**
 * Unit Tests for EvidenceWorkbookValidator (Prompt 305)
 * Tests automated parity checks and verifies that intentional mismatches return FAIL.
 */

import { describe, it, expect } from 'vitest';
import { EvidenceWorkbookValidator } from '../../src/services/evidenceWorkbookValidator';

describe('EvidenceWorkbookValidator Unit Tests', () => {
  it('should return PASS across all 13 verification rules for certified benchmarks', () => {
    const summary = EvidenceWorkbookValidator.validateParity('job-init-default-001', 'v1');

    expect(summary).toBeDefined();
    expect(summary.overallStatus).toBe('PASS');
    expect(summary.totalChecks).toBe(13);
    expect(summary.passedChecks).toBe(13);
    expect(summary.failedChecks).toBe(0);
    expect(summary.discrepancies.length).toBe(0);

    const spendCheck = summary.checks.find(c => c.kpi.includes('Total Customer Baseline Spend'));
    expect(spendCheck?.status).toBe('PASS');
    expect(spendCheck?.variance).toBe(0);

    const bridgeCheck = summary.checks.find(c => c.kpi.includes('Financial Bridge Mathematical Integrity'));
    expect(bridgeCheck?.status).toBe('PASS');
  });

  it('should return FAIL and record discrepancy when an intentional mismatch is introduced', () => {
    // Intentionally inject an altered gross opportunity (190.00 instead of certified 173.12)
    const summary = EvidenceWorkbookValidator.validateParity(
      'job-init-default-001',
      'v1',
      'RPT-v1',
      undefined,
      { GROSS_OPPORTUNITY_CR: 190.00 }
    );

    expect(summary).toBeDefined();
    expect(summary.overallStatus).toBe('FAIL');
    expect(summary.failedChecks).toBeGreaterThan(0);
    expect(summary.discrepancies.length).toBeGreaterThan(0);

    const grossDiscrepancy = summary.discrepancies.find(d => d.kpi.includes('Gross Identified Opportunity'));
    expect(grossDiscrepancy).toBeDefined();
    expect(grossDiscrepancy?.variance).toBeGreaterThan(0);
  });
});
