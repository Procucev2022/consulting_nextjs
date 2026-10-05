/**
 * Unit Tests for Frontend Evidence Workbook Constants (Prompt 305)
 */

import { describe, it, expect } from 'vitest';
import {
  EVIDENCE_WORKBOOK_FILENAMES,
  EVIDENCE_INVENTORY
} from '../../src/constants/evidenceWorkbook';

describe('Frontend Evidence Workbook Constants Unit Tests', () => {
  it('should define all 9 workbook filenames', () => {
    expect(Object.keys(EVIDENCE_WORKBOOK_FILENAMES).length).toBe(9);
    expect(EVIDENCE_WORKBOOK_FILENAMES.MODULE_1_EVIDENCE).toBe('01_Module_1_Evidence.xlsx');
    expect(EVIDENCE_WORKBOOK_FILENAMES.FINANCIAL_VALIDATION).toBe('05_Financial_Validation.xlsx');
  });

  it('should define inventory containing all 9 items', () => {
    expect(EVIDENCE_INVENTORY.length).toBe(9);
    expect(EVIDENCE_INVENTORY.every(item => item.filename.endsWith('.xlsx'))).toBe(true);
    expect(EVIDENCE_INVENTORY.every(item => item.sheetCount >= 5)).toBe(true);
  });

  it('should define all 7 dedicated savings type filenames', async () => {
    const { SAVINGS_TYPE_FILENAMES, SAVINGS_TYPES_INVENTORY } = await import('../../src/constants/evidenceWorkbook');
    expect(Object.keys(SAVINGS_TYPE_FILENAMES).length).toBe(7);
    expect(SAVINGS_TYPE_FILENAMES.VENDOR_CONSOLIDATION).toBe('04A_Vendor_Consolidation_Evidence.xlsx');
    expect(SAVINGS_TYPE_FILENAMES.REALIZED_SAVINGS).toBe('04G_Realized_Savings_Evidence.xlsx');

    expect(SAVINGS_TYPES_INVENTORY.length).toBe(7);
    expect(SAVINGS_TYPES_INVENTORY.every(item => item.filename.endsWith('.xlsx'))).toBe(true);
  });
});
