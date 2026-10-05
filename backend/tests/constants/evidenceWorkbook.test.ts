/**
 * Unit Tests for Evidence Workbook Constants (Prompt 305)
 */

import { describe, it, expect } from 'vitest';
import {
  EVIDENCE_WORKBOOK_FILENAMES,
  EVIDENCE_PACKAGE_ZIP_FILENAME,
  EVIDENCE_STANDARD_SHEETS,
  EVIDENCE_CERTIFIED_BENCHMARKS,
  EVIDENCE_README_MANDATORY_NOTICE,
  EVIDENCE_README_WARNING,
  EVIDENCE_INVENTORY
} from '../../src/constants/evidenceWorkbook';

describe('Evidence Workbook Constants Unit Tests', () => {
  it('should define all 9 workbook filenames', () => {
    expect(Object.keys(EVIDENCE_WORKBOOK_FILENAMES).length).toBe(9);
    expect(EVIDENCE_WORKBOOK_FILENAMES.MODULE_1_EVIDENCE).toBe('01_Module_1_Evidence.xlsx');
    expect(EVIDENCE_WORKBOOK_FILENAMES.FINANCIAL_VALIDATION).toBe('05_Financial_Validation.xlsx');
    expect(EVIDENCE_PACKAGE_ZIP_FILENAME).toBe('Complete_Analysis_Evidence_Package.zip');
  });

  it('should define standard sheet names', () => {
    expect(EVIDENCE_STANDARD_SHEETS.README).toBe('01_README');
    expect(EVIDENCE_STANDARD_SHEETS.EXECUTIVE_SUMMARY).toBe('02_EXECUTIVE_SUMMARY');
    expect(EVIDENCE_STANDARD_SHEETS.CALCULATION_BRIDGE).toBe('03_CALCULATION_BRIDGE');
  });

  it('should define accurate certified benchmark constants', () => {
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.TOTAL_SPEND_CR).toBe(5920.35);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.GROSS_OPPORTUNITY_CR).toBe(173.12);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.OVERLAP_DEDUCTIONS_CR).toBe(62.80);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.EXCLUSIONS_CR).toBe(16.72);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.NET_DEFENSIBLE_PIPELINE_CR).toBe(93.60);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.STRATEGIC_MARKET_VALUE_CR).toBe(14.88);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.NET_DIRECT_SAVINGS_CR).toBe(78.72);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.MATHEMATICAL_VARIANCE_CR).toBe(0.00);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.REALIZED_SAVINGS_CR).toBe(68.00);
    expect(EVIDENCE_CERTIFIED_BENCHMARKS.COST_AVOIDANCE_SPEND_DERISKED_CR).toBe(420.00);
  });

  it('should include mandatory notice text in constants', () => {
    expect(EVIDENCE_README_MANDATORY_NOTICE).toContain('This workbook provides the calculation and evidence trail');
    expect(EVIDENCE_README_WARNING).toContain('WARNING:');
  });

  it('should have complete inventory of 9 evidence workbooks', () => {
    expect(EVIDENCE_INVENTORY.length).toBe(9);
    expect(EVIDENCE_INVENTORY.every(item => item.filename.endsWith('.xlsx'))).toBe(true);
  });
});
