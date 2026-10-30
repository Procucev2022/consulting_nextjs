import { describe, expect, it, vi } from 'vitest';
import { MODULE2_D1_COMPLIANCE } from '../../src/constants/module2ProcurementComplianceD1';
import {
  buildProcurementComplianceResult, loadProcurementComplianceReviewHistory
} from '../../src/services/workerD1ProcurementCompliance';
import { buildProcurementComplianceWorkbook } from '../../src/services/workerD1ProcurementComplianceWorkbook';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import * as XLSX from 'xlsx';

const transaction = (
  id: string, overrides: Partial<StrategicInputTransaction> = {}
): StrategicInputTransaction => ({
  id,
  po_number: 'PO-1',
  po_line: '10',
  po_date: '2026-04-01',
  vendor_code: 'SUP-1',
  vendor_name: 'Supplier One',
  material_code: 'MAT-1',
  material_desc: 'Resin Grade A',
  quantity: 10,
  uom: 'KG',
  unit_price: 100,
  total_spend_inr: 1000,
  currency: 'INR',
  plant: 'Pune',
  spend_category: 'Chemicals',
  ...overrides
});

describe('D1 procurement compliance report', () => {
  it('screens assessment transaction evidence for price, repeated PO line, and missing identifiers', () => {
    const rows = [
      transaction('TX-1'),
      transaction('TX-2', { po_number: 'PO-2', po_line: '20', vendor_code: 'SUP-2',
        vendor_name: 'Supplier Two', unit_price: 140, total_spend_inr: 1400 }),
      transaction('TX-5', { po_number: 'PO-5', po_line: '50', vendor_code: 'SUP-3',
        vendor_name: 'Supplier Three', unit_price: 160, total_spend_inr: 1600 }),
      transaction('TX-4', { material_code: 'MAT-DUP', material_desc: 'Different item', total_spend_inr: 500 }),
      transaction('TX-3', { po_number: '', po_line: '', material_code: '', uom: '' })
    ];
    const report = buildProcurementComplianceResult('A-1', 'T-1', 'Acme', rows);

    expect(report).toMatchObject({
      assessmentId: 'A-1', customerName: 'Acme', summary: {
        totalTransactionsReviewedCount: 5,
        totalExceptionsIdentifiedCount: 3,
        totalPotentialFinancialExposureInr: 700,
        quantifiedDefensibleExposureInr: 0,
        verifiedFinancialImpactInr: 0,
        dataInsufficientCount: 1,
        contractComplianceStatus: MODULE2_D1_COMPLIANCE.CONTRACT_STATUS
      },
      exceptions: expect.arrayContaining([
        expect.objectContaining({ checkType: 'PRICE_INCONSISTENCY', potentialFinancialExposureInr: 200 }),
        expect.objectContaining({ checkType: 'PO_TRANSACTION_EXCEPTION', reviewStatus: 'POTENTIAL_EXCEPTION',
          financialExposureStatus: 'POTENTIAL_PO_SCHEDULE_DUPLICATE', potentialFinancialExposureInr: 500 }),
        expect.objectContaining({ checkType: 'PO_TRANSACTION_EXCEPTION', reviewStatus: 'DATA_INSUFFICIENT',
          financialExposureStatus: 'NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED',
          dataGapsDisclosed: expect.arrayContaining(['Purchase order number is missing.']) })
      ])
    });
    expect(report.controlChecks).toHaveLength(6);
    expect(report.controlChecks.find((item) => item.checkType === 'CONTRACT_COMPLIANCE_DISCLOSURE'))
      .toMatchObject({ eligibleTransactionsCount: 0, primaryDataGapNotice: MODULE2_D1_COMPLIANCE.REQUIRED_SOURCE_FIELDS_GAP });
    expect(report.methodologySafeguards).toContain(MODULE2_D1_COMPLIANCE.METHODOLOGY_SAFEGUARDS[0]);
  });

  it('does not flag price spreads below the screening threshold or groups with one supplier', () => {
    const rows = [
      transaction('TX-1', { unit_price: 100 }),
      transaction('TX-2', { po_number: 'PO-2', po_line: '20', unit_price: 120, vendor_code: 'SUP-2' }),
      transaction('TX-3', { po_number: 'PO-3', po_line: '30', material_code: 'MAT-2', unit_price: 500 })
    ];
    const report = buildProcurementComplianceResult('A-1', '', 'A-1', rows);

    expect(report.exceptions.filter((item) => item.checkType === 'PRICE_INCONSISTENCY')).toEqual([]);
    expect(report.summary.totalPotentialFinancialExposureInr).toBe(0);
    expect(report.controlChecks.find((item) => item.checkType === 'SOURCING_APPROVAL_GAP'))
      .toMatchObject({ eligibleTransactionsCount: 0, exceptionsIdentifiedCount: 0 });
  });

  it('uses safe fallbacks for sparse source evidence and handles odd price medians', () => {
    const rows = [
      transaction('FALLBACK-LOW', { vendor_code: 'SUP-A', material_code: '', material_desc: 'Fallback material' }),
      transaction('FALLBACK-HIGH', { id: undefined, po_number: '', po_line: '', po_date: '', vendor_code: '',
        vendor_name: 'Supplier B', material_code: '', material_desc: 'Fallback material', spend_category: '',
        plant: '', quantity: 0, total_spend_inr: 0, unit_price: 150, currency: '' }),
      transaction('MAT2-LOW', { po_number: 'PO-2', po_line: '2', material_code: 'MAT-2', unit_price: 100 }),
      transaction('MAT2-HIGH', { po_number: 'PO-3', po_line: '3', vendor_code: 'SUP-2', vendor_name: '',
        material_code: 'MAT-2', material_desc: '', spend_category: '', plant: '', unit_price: 160 }),
      transaction('DUP-1', { po_number: 'PO-D', po_line: '1', vendor_code: '', vendor_name: '',
        material_code: '', material_desc: '', spend_category: '', plant: '', uom: '' }),
      transaction('DUP-2', { po_number: 'PO-D', po_line: '1', vendor_code: '', vendor_name: '',
        material_code: '', material_desc: '', spend_category: '', plant: '', uom: '' })
    ];
    const report = buildProcurementComplianceResult('A-1', '', 'A-1', rows);
    const fallbackPrice = report.exceptions.find((item) => item.materialDesc === 'Fallback material');
    const sparsePrice = report.exceptions.find((item) => item.materialCode === 'MAT-2');
    const duplicate = report.exceptions.find((item) => item.checkTitle === MODULE2_D1_COMPLIANCE.DUPLICATE_SCHEDULE_TITLE);

    expect(fallbackPrice).toMatchObject({ vendorName: 'Supplier B', potentialFinancialExposureInr: 0 });
    expect(fallbackPrice).not.toHaveProperty('vendorCode');
    expect(fallbackPrice).not.toHaveProperty('materialCode');
    expect(fallbackPrice).not.toHaveProperty('plant');
    expect(fallbackPrice?.supportingTransactions.find((row) => !row.transactionId)).toMatchObject({
      poNumber: 'Unavailable', poDate: 'Unavailable', vendorCode: '', materialCode: '',
      uom: 'KG', unitPrice: 150, totalSpendInr: 0, currency: 'INR'
    });
    expect(sparsePrice).toMatchObject({ spendCategory: 'Unclassified', vendorName: 'Multiple suppliers',
      materialDesc: 'Unavailable' });
    expect(sparsePrice).not.toHaveProperty('plant');
    expect(duplicate).toMatchObject({ spendCategory: 'Unclassified', vendorName: 'Unavailable',
      materialDesc: 'Unavailable' });
    expect(duplicate).not.toHaveProperty('vendorCode');
    expect(duplicate).not.toHaveProperty('plant');
  });

  it('records review history and uses its latest human decision without asserting verified impact', () => {
    const rows = [transaction('TX-1'), transaction('TX-2', {
      po_number: 'PO-2', po_line: '20', vendor_code: 'SUP-2', unit_price: 140
    })];
    const initial = buildProcurementComplianceResult('A-1', 'T-1', 'Acme', rows);
    const priceId = initial.exceptions.find((item) => item.checkType === 'PRICE_INCONSISTENCY')?.exceptionId || '';
    const report = buildProcurementComplianceResult('A-1', 'T-1', 'Acme', rows, { reviews: {
      [priceId]: [
        { reviewId: 'R-1', reviewerName: 'Reviewer', reviewDate: '2026-10-01', status: 'AWAITING_REVIEW',
          technicalJustification: 'Gathered comparable market quotes.' },
        { reviewId: 'R-2', reviewerName: 'Reviewer', reviewDate: '2026-10-02', status: 'VERIFIED_EXCEPTION',
          technicalJustification: 'Matched price and specification evidence.' }
      ]
    } });

    expect(report.exceptions.find((item) => item.exceptionId === priceId)).toMatchObject({
      reviewStatus: 'VERIFIED_EXCEPTION', reviewHistory: [
        expect.objectContaining({ reviewId: 'R-1' }), expect.objectContaining({ reviewId: 'R-2' })
      ]
    });
    expect(report.summary.verifiedExceptionsCount).toBe(1);
    expect(report.summary.verifiedFinancialImpactInr).toBe(0);
  });

  it('accepts a single stored review record as well as a review history array', () => {
    const rows = [transaction('TX-1'), transaction('TX-2', {
      po_number: 'PO-2', po_line: '20', vendor_code: 'SUP-2', unit_price: 140
    })];
    const initial = buildProcurementComplianceResult('A-1', 'T-1', 'Acme', rows);
    const priceId = initial.exceptions.find((item) => item.checkType === 'PRICE_INCONSISTENCY')?.exceptionId || '';
    const report = buildProcurementComplianceResult('A-1', 'T-1', 'Acme', rows, { reviews: {
      [priceId]: { reviewId: 'R-SINGLE', reviewerName: 'Reviewer', reviewDate: '2026-10-03',
        status: 'NOT_AN_EXCEPTION', technicalJustification: 'Reviewed original commercial terms.',
        dismissalReason: 'Contract price explains the difference.' }
    } });

    expect(report.exceptions.find((item) => item.exceptionId === priceId)).toMatchObject({
      reviewStatus: 'NOT_AN_EXCEPTION', reviewHistory: [expect.objectContaining({
        reviewId: 'R-SINGLE', dismissalReason: 'Contract price explains the difference.'
      })]
    });
    expect(report.summary.dismissedCount).toBe(1);
  });

  it('loads ordered persisted review records and tolerates an empty D1 result', async () => {
    const records = [
      { review_id: 'R-1', assessment_id: 'A-1', exception_id: 'CMP-1', reviewer_name: 'Asha',
        reviewer_role: 'USER', review_date: '2026-10-01', status: 'AWAITING_REVIEW',
        technical_justification: 'Waiting for source records.', corrective_action_plan: null, dismissal_reason: null },
      { review_id: 'R-2', assessment_id: 'A-1', exception_id: 'CMP-1', reviewer_name: 'Asha',
        reviewer_role: null, review_date: '2026-10-02', status: 'VERIFIED_EXCEPTION',
        technical_justification: 'Reviewed the source PO.', corrective_action_plan: 'Audit invoice.',
        dismissal_reason: 'Terms explain this specific control flag.' }
    ];
    const all = vi.fn().mockResolvedValue({ results: records });
    const db = { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ all })) })) } as unknown as CloudflareD1Database;

    const history = await loadProcurementComplianceReviewHistory(db, 'A-1');
    expect(history['CMP-1']).toMatchObject([
      { reviewId: 'R-1', status: 'AWAITING_REVIEW' },
      { reviewId: 'R-2', status: 'VERIFIED_EXCEPTION', correctiveActionPlan: 'Audit invoice.' }
    ]);
    expect(all).toHaveBeenCalledOnce();

    all.mockResolvedValueOnce({ results: undefined });
    expect(await loadProcurementComplianceReviewHistory(db, 'A-1')).toEqual({});
  });

  it('exports summary, exception, control, and methodology sheets including empty exception sets', () => {
    const report = buildProcurementComplianceResult('A-1', 'T-1', 'Acme', [
      transaction('TX-1'), transaction('TX-2', { po_number: 'PO-2', po_line: '20',
        vendor_code: 'SUP-2', unit_price: 140 })
    ]);
    const workbook = XLSX.read(buildProcurementComplianceWorkbook(report), { type: 'array' });
    expect(workbook.SheetNames).toEqual(MODULE2_D1_COMPLIANCE.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Summary)).toContainEqual({
      metric: 'verifiedFinancialImpactInr', value: 0
    });
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Control Checks'])).toHaveLength(6);

    const empty = buildProcurementComplianceResult('EMPTY', '', 'EMPTY', []);
    const emptyWorkbook = XLSX.read(buildProcurementComplianceWorkbook(empty), { type: 'array' });
    expect(emptyWorkbook.SheetNames).toEqual(MODULE2_D1_COMPLIANCE.EXPORT.SHEETS);
    expect(XLSX.utils.sheet_to_json(emptyWorkbook.Sheets.Exceptions)).toEqual([]);

    const sparseReport = { ...report, exceptions: [{ ...report.exceptions[0], materialCode: undefined }] };
    const sparseWorkbook = XLSX.read(buildProcurementComplianceWorkbook(sparseReport), { type: 'array' });
    expect(XLSX.utils.sheet_to_json(sparseWorkbook.Sheets.Exceptions)[0]).toMatchObject({ materialCode: '' });
  });
});
