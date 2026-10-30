import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { MODULE2_D1_SPECIFICATION_RATIONALISATION as CONFIG } from '../../src/constants/module2SpecificationRationalisationD1';
import { buildSpecificationRationalisationFromD1 } from '../../src/services/workerD1SpecificationRationalisation';
import { buildSpecificationRationalisationWorkbook } from '../../src/services/workerD1SpecificationRationalisationWorkbook';
import type { SpecificationRationalisationD1BuildInput } from '../../src/types/module2SpecificationRationalisationD1';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const transaction = (overrides: Partial<StrategicInputTransaction> = {}): StrategicInputTransaction => ({
  id: 'TX-1', vendor_name: 'Supplier A', vendor_code: 'SUP-A', material_code: 'MAT-A',
  material_desc: 'Bolt M12', spend_category: 'Hardware', uom: 'EA', quantity: 2,
  unit_price: 10, total_spend_inr: 20, plant: 'Plant 1', ...overrides
});

const build = (transactions: StrategicInputTransaction[], overrides: Partial<SpecificationRationalisationD1BuildInput> = {}) =>
  buildSpecificationRationalisationFromD1({
    assessmentId: 'A1', tenantId: 'T1', customerName: 'Customer One', transactions, calculatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  });

describe('D1 specification rationalisation evidence builder', () => {
  it('finds exact description, category, and unit matches without asserting technical equivalence or savings', () => {
    const result = build([
      transaction({ total_spend_inr: 25, vendor_code: '', vendor_name: 'Supplier A' }),
      transaction({ id: 'TX-2', total_spend_inr: 35, vendor_code: 'SUP-B', vendor_name: 'Supplier B', plant: 'Plant 2' }),
      transaction({
        id: 'TX-3', material_code: 'MAT-B', material_desc: '  BOLT   M12 ', spend_category: 'hardware',
        uom: 'ea', vendor_code: 'SUP-C', total_spend_inr: 30, quantity: 4
      })
    ]);

    expect(result).toMatchObject({
      assessmentId: 'A1', reviewWorkflowAvailable: false,
      summary: {
        tenantId: 'T1', totalMaterialsAssessedCount: 2,
        totalCandidatesIdentifiedCount: 1, potentialMatchCount: 1,
        totalExpenditureUnderReviewInr: 90, commercialSavingsQuantifiedInr: 0
      },
      candidates: [expect.objectContaining({
        candidateId: `${CONFIG.CANDIDATE_ID_PREFIX}-1`, identificationType: 'STANDARDIZATION_CANDIDATE',
        reviewStatus: 'POTENTIAL_MATCH', hasMissingTechnicalData: true,
        expenditureUnderReviewInr: 90, quantityUnderReview: 8,
        primaryItem: expect.objectContaining({ code: 'MAT-A', totalSpendInr: 60, suppliersCount: 2 }),
        comparisonItem: expect.objectContaining({ code: 'MAT-B', totalSpendInr: 30 })
      })]
    });
    expect(result.candidates[0].identificationRationale).toBe(CONFIG.IDENTIFICATION_RATIONALE);
    expect(result.candidates[0].missingAttributesDisclosed).toContain(CONFIG.MISSING_TECHNICAL_DATA);
    expect(result.candidates[0].reviewHistory).toEqual([]);
    expect(result.financialDisclaimer).toBe(CONFIG.FINANCIAL_DISCLAIMER);
  });

  it('excludes candidates when material identity, descriptions, category, or unit are incomplete', () => {
    const result = build([
      transaction({ id: 'MISSING-CODE', material_code: '' }),
      transaction({ id: 'MISSING-DESC', material_code: 'MAT-B', material_desc: '' }),
      transaction({ id: 'MISSING-CATEGORY', material_code: 'MAT-C', spend_category: '' }),
      transaction({ id: 'MISSING-UNIT', material_code: 'MAT-D', uom: '' }),
      transaction({ id: 'DIFFERENT-CATEGORY', material_code: 'MAT-E', spend_category: 'PPE' }),
      transaction({ id: 'DIFFERENT-UNIT', material_code: 'MAT-F', uom: 'BOX' })
    ]);

    expect(result.candidates).toEqual([]);
    expect(result.summary.totalCandidatesIdentifiedCount).toBe(0);
    expect(result.summary.totalMaterialsAssessedCount).toBe(5);
    expect(result.summary.totalExpenditureUnderReviewInr).toBe(0);
    expect(result.methodologyDisclosures).toContain(CONFIG.METHODOLOGY_DISCLOSURES[2]);
  });

  it('creates one comparison per additional material and counts matched spend only once', () => {
    const result = build([
      transaction({ material_code: 'MAT-C', total_spend_inr: 40 }),
      transaction({ id: 'TX-B', material_code: 'MAT-B', total_spend_inr: 20 }),
      transaction({ id: 'TX-A', material_code: 'MAT-A', total_spend_inr: 10 })
    ]);

    expect(result.candidates.map((candidate) => candidate.candidateId)).toEqual([
      `${CONFIG.CANDIDATE_ID_PREFIX}-1`, `${CONFIG.CANDIDATE_ID_PREFIX}-2`
    ]);
    expect(result.candidates.map((candidate) => candidate.primaryItem.code)).toEqual(['MAT-A', 'MAT-A']);
    expect(result.summary.totalExpenditureUnderReviewInr).toBe(70);
    expect(result.summary.candidatesWithMissingTechnicalDataCount).toBe(2);
  });

  it('handles empty assessments, invalid numeric evidence, and missing optional customer context', () => {
    const empty = build([], { customerName: '', calculatedAt: '' });
    const invalidAmounts = build([
      transaction({ total_spend_inr: Number.NaN, quantity: -1, vendor_code: '', vendor_name: '', plant: '' }),
      transaction({ id: 'TX-B', material_code: 'MAT-B', total_spend_inr: -1, quantity: 0, vendor_code: '' })
    ]);

    expect(empty).toMatchObject({
      customerName: CONFIG.CUSTOMER_UNAVAILABLE,
      summary: { totalMaterialsAssessedCount: 0, totalCandidatesIdentifiedCount: 0 }
    });
    expect(empty.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(invalidAmounts.candidates[0]).toMatchObject({
      expenditureUnderReviewInr: 0, quantityUnderReview: 0,
      primaryItem: { suppliersCount: 0 }
    });
    expect(invalidAmounts.summary.commercialSavingsQuantifiedInr).toBe(0);
  });

  it('exports summary, candidate evidence, and methodology without supplier-level rows', () => {
    const result = build([
      transaction({ total_spend_inr: 25 }),
      transaction({ id: 'TX-B', material_code: 'MAT-B', total_spend_inr: 35 })
    ]);
    const workbook = XLSX.read(buildSpecificationRationalisationWorkbook(result), { type: 'array' });

    expect(workbook.SheetNames).toEqual([...CONFIG.EXPORT.SHEETS]);
    const candidates = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Candidates);
    expect(candidates).toEqual([expect.objectContaining({
      primaryCode: 'MAT-A', comparisonCode: 'MAT-B', historicalExpenditureUnderReviewInr: 60
    })]);
    expect(JSON.stringify(workbook)).not.toContain('SUP-A');
  });
});
