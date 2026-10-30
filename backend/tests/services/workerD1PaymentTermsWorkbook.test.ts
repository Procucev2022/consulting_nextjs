import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { MODULE2_D1_PAYMENT_TERMS } from '../../src/constants/module2PaymentTermsD1';
import { buildPaymentTermsResult } from '../../src/services/workerD1PaymentTerms';
import { buildPaymentTermsWorkbook } from '../../src/services/workerD1PaymentTermsWorkbook';
import type { PaymentTermsD1SourceRow } from '../../src/types/module2PaymentTermsD1';

const row: PaymentTermsD1SourceRow = {
  record_id: 'TX-1', po_number: 'PO-1', po_date: '2026-01-01', supplier_code: 'SUP-1',
  supplier_name: 'Supplier One', spend_category: 'Resin', spend_inr: 100000,
  raw_json: JSON.stringify({ paymentTerms: 'Net 45 Days' })
};

describe('buildPaymentTermsWorkbook', () => {
  it('exports the eight auditable sheets with assessment-scoped payment coverage', () => {
    const result = buildPaymentTermsResult('ASSESSMENT-1', [row]);
    const workbook = XLSX.read(buildPaymentTermsWorkbook(result), { type: 'array' });
    expect(workbook.SheetNames).toEqual(MODULE2_D1_PAYMENT_TERMS.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Coverage Summary'])).toContainEqual({
      metric: 'totalSpendAnalysedInr', value: 100000
    });
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Transaction Coverage'])).toContainEqual(
      expect.objectContaining({ recordId: 'TX-1', parsedCreditDays: 45, coverageStatus: 'COMPLETE' })
    );
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Verified Terms'])).toHaveLength(1);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Reconciliation'])).toContainEqual({
      metric: 'reconciliationDeltaInr', value: 0
    });
  });

  it('keeps eight named sheets when the assessment contains no transaction evidence', () => {
    const workbook = XLSX.read(buildPaymentTermsWorkbook(buildPaymentTermsResult('EMPTY', [])), { type: 'array' });
    expect(workbook.SheetNames).toEqual(MODULE2_D1_PAYMENT_TERMS.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Opportunities)).toEqual([]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Transaction Coverage'])).toEqual([]);
  });
});
