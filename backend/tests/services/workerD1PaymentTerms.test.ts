import { describe, expect, it, vi } from 'vitest';
import {
  buildPaymentTermsResult, extractPaymentTermsEvidence,
  parsePaymentTermsEvidence
} from '../../src/services/workerD1PaymentTerms';
import { loadPaymentTermsResultFromD1 } from '../../src/services/workerD1PaymentTermsD1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import type { PaymentTermsD1SourceRow } from '../../src/types/module2PaymentTermsD1';

const row = (overrides: Partial<PaymentTermsD1SourceRow> = {}): PaymentTermsD1SourceRow => ({
  record_id: 'TX-1', po_number: 'PO-1', po_date: '2026-01-01', supplier_code: 'SUP-1',
  supplier_name: 'Supplier One', spend_category: 'Resin', spend_inr: 100000,
  raw_json: JSON.stringify({ 'Terms of Payment': 'Net 45 Days' }), ...overrides
});

describe('payment-term evidence parsing', () => {
  it('extracts payment-term fields regardless of header punctuation and preserves explicit discount data', () => {
    const evidence = extractPaymentTermsEvidence(JSON.stringify({
      'Payment Terms': 'Net 45 Days', Discount_Percent: '2.5', CashDiscountDays: 10
    }));
    expect(evidence).toMatchObject({
      fieldPresent: true, rawPaymentTerms: 'Net 45 Days', discountPercent: 2.5, discountDays: 10
    });
    expect(parsePaymentTermsEvidence(evidence)).toEqual({ creditDays: 45, nonCreditTerms: false });
  });

  it('accepts direct credit-day fields and recognizes explicit non-credit terms', () => {
    const creditDays = extractPaymentTermsEvidence({ credit_days: 30 });
    expect(parsePaymentTermsEvidence(creditDays)).toEqual({ creditDays: 30, nonCreditTerms: false });
    const dueOnReceipt = extractPaymentTermsEvidence({ payment_terms: 'Due on receipt' });
    expect(parsePaymentTermsEvidence(dueOnReceipt)).toEqual({ creditDays: 0, nonCreditTerms: true });
    expect(parsePaymentTermsEvidence(extractPaymentTermsEvidence({
      payment_terms: 'Net 0'
    }))).toEqual({ creditDays: 0, nonCreditTerms: true });
    const blankCreditDays = extractPaymentTermsEvidence({ credit_days: ' ' });
    expect(blankCreditDays.directCreditDays).toBeUndefined();
    expect(parsePaymentTermsEvidence(blankCreditDays)).toEqual({ nonCreditTerms: false });
  });

  it('leaves absent, malformed, ambiguous and overlong term evidence unparsed', () => {
    expect(extractPaymentTermsEvidence(null)).toMatchObject({ fieldPresent: false, sourceParseFailed: false });
    expect(extractPaymentTermsEvidence('{')).toMatchObject({ fieldPresent: false, sourceParseFailed: true });
    expect(extractPaymentTermsEvidence('[]')).toMatchObject({ fieldPresent: false, sourceParseFailed: true });
    expect(parsePaymentTermsEvidence({ fieldPresent: true, sourceParseFailed: false, rawPaymentTerms: 'EOM + 45 days' }))
      .toEqual({ nonCreditTerms: false });
    expect(parsePaymentTermsEvidence({
      fieldPresent: true, sourceParseFailed: false, rawPaymentTerms: 'Net 30 or 45 days'
    })).toEqual({ nonCreditTerms: false });
    expect(parsePaymentTermsEvidence({
      fieldPresent: true, sourceParseFailed: false, rawPaymentTerms: 'Net 9999'
    })).toEqual({ nonCreditTerms: false });
    expect(parsePaymentTermsEvidence({
      fieldPresent: true, sourceParseFailed: false, rawPaymentTerms: '45 days after invoice'
    })).toEqual({ creditDays: 45, nonCreditTerms: false });
    expect(parsePaymentTermsEvidence({
      fieldPresent: true, sourceParseFailed: false, directCreditDays: 12.5
    })).toEqual({ nonCreditTerms: false });
  });
});

describe('buildPaymentTermsResult', () => {
  it('reconciles D1 spend and keeps financing benefits unquantified without target and approval evidence', () => {
    const result = buildPaymentTermsResult('ASSESSMENT-1', [
      row(),
      row({ record_id: 'TX-2', po_number: 'PO-2', supplier_code: 'SUP-2', supplier_name: 'Supplier Two',
        spend_inr: 100000, raw_json: JSON.stringify({ creditDays: 30, discountPercent: 2, discountDays: 10 }) }),
      row({ record_id: 'TX-0', po_number: 'PO-0', supplier_code: 'SUP-0', supplier_name: 'Supplier Zero',
        spend_inr: 5000, raw_json: JSON.stringify({ paymentTerms: 'Due on receipt' }) }),
      row({ record_id: 'TX-3', spend_inr: 50000, raw_json: JSON.stringify({ invoiceDate: '2026-02-01' }) }),
      row({ record_id: 'TX-4', spend_inr: 20000, raw_json: JSON.stringify({ payment_terms: 'EOM + 45' }) })
    ]);
    expect(result.coverageSummary).toMatchObject({
      totalSpendAnalysedInr: 275000, verifiedSpendInr: 205000, missingSpendInr: 70000,
      totalRecordsCount: 5, completeRecordsCount: 3, partialRecordsCount: 1, missingRecordsCount: 1,
      recordsRequiringValidationCount: 2, reconciliationDeltaInr: 0,
      overallDataAvailabilityStatus: 'DATA_PARTIALLY_AVAILABLE', totalWorkingCapitalReleasedCr: 0,
      totalFinancingBenefitCr: 0, totalEarlyPaymentDiscountsCr: 0
    });
    expect(result.coverageRecords[3]).toMatchObject({
      coverageStatus: 'MISSING', gapReason: 'FIELD_NOT_IN_SOURCE_ERP', requiresValidation: true
    });
    expect(result.coverageRecords[4]).toMatchObject({
      coverageStatus: 'PARTIAL', gapReason: 'UNPARSEABLE_PAYMENT_TERM_FORMAT'
    });
    expect(result.supplierProfiles).toEqual(expect.arrayContaining([
      expect.objectContaining({ supplierCode: 'SUP-1', weightedAvgCreditDays: 45, indicativeFinancingBenefitCr: 0 }),
      expect.objectContaining({ supplierCode: 'SUP-2', observedPaymentTerms: ['30'], requiresValidation: false }),
      expect.objectContaining({ supplierCode: 'SUP-0', weightedAvgCreditDays: 0 })
    ]));
    expect(result.opportunities).toEqual([]);
    expect(result.methodologyDisclosures).toHaveLength(3);
  });

  it('reports malformed source JSON and empty datasets without inventing payment terms', () => {
    const malformed = buildPaymentTermsResult('BROKEN-JSON', [row({ raw_json: '{' })]);
    expect(malformed.coverageRecords[0]).toMatchObject({
      coverageStatus: 'PARTIAL', gapReason: 'UNPARSEABLE_PAYMENT_TERM_FORMAT',
      gapDetails: expect.stringContaining('not valid JSON')
    });
    expect(malformed.coverageSummary.gapReasonCounts).toEqual({ UNPARSEABLE_PAYMENT_TERM_FORMAT: 1 });
    const empty = buildPaymentTermsResult('EMPTY', []);
    expect(empty.coverageSummary).toMatchObject({
      totalRecordsCount: 0, overallDataAvailabilityStatus: 'DATA_UNAVAILABLE',
      verifiedSpendPct: 0, missingSpendPct: 0, reconciliationDeltaInr: 0
    });
    expect(empty.supplierProfiles).toEqual([]);
  });

  it('loads only the selected assessment and tenant payment evidence from D1', async () => {
    const statement = {
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [row()] })
    };
    const db = { prepare: vi.fn().mockReturnValue(statement) } as unknown as CloudflareD1Database;
    const result = await loadPaymentTermsResultFromD1(db, {
      assessmentId: 'ASSESSMENT-2', tenantId: 'TENANT-2', limit: 50
    }, 'request-2');
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining(
      'FROM ProcurementTransaction WHERE assessment_id = ? AND COALESCE(json_extract'
    ));
    expect(statement.bind).toHaveBeenCalledWith('ASSESSMENT-2', 'TENANT-2');
    expect(result.assessmentId).toBe('ASSESSMENT-2');
    expect(result.coverageSummary.completeRecordsCount).toBe(1);
    const unscopedTenant = await loadPaymentTermsResultFromD1(db, {
      assessmentId: 'ASSESSMENT-3', tenantId: undefined, limit: 50
    }, 'request-3');
    expect(unscopedTenant.assessmentId).toBe('ASSESSMENT-3');
    expect(statement.bind).toHaveBeenCalledWith('ASSESSMENT-3');
    await expect(loadPaymentTermsResultFromD1(db, { assessmentId: undefined, limit: 50 }, 'request-4'))
      .rejects.toThrow('An assessment scope is required');
  });
});
