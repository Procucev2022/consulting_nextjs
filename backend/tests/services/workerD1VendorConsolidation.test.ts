import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { MODULE2_D1_VENDOR_CONSOLIDATION } from '../../src/constants/module2VendorConsolidationD1';
import { buildVendorConsolidationWorkbook } from '../../src/services/workerD1VendorConsolidationWorkbook';
import { buildVendorConsolidationResult } from '../../src/services/workerD1VendorConsolidation';
import { buildCategoryProfiles } from '../../src/services/workerD1VendorConsolidationProfiles';
import {
  amount, categoryKeyFor, classificationLabel, crores, distinct, groupTransactions, mappingEntry,
  mappingStatus, materialIdentity, materialPrice, materialQuantity, materialSpend, normalized, poCount,
  quantityOf, sourceCategory, sourceMaterials, spendOf, supplierIdentity, supplierProfiles, suppliersIn,
  taxonomyCode, taxonomyTitle
} from '../../src/services/workerD1VendorConsolidationShared';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const transaction = (
  overrides: Partial<StrategicInputTransaction> = {}
): StrategicInputTransaction => ({
  id: 'TX-1', po_number: 'PO-1', po_line: '1', po_date: '2026-01-01', vendor_code: 'SUP-1',
  vendor_name: 'Supplier One', material_code: 'MAT-1', material_desc: 'Resin grade A', quantity: 10,
  uom: 'KG', unit_price: 10, total_spend_inr: 100, currency: 'INR', plant: 'PLANT-1',
  spend_category: 'Resin', unspsc_code: '12345678', unspsc_category: 'Resins', ...overrides
});

const representativeTransactions = (): StrategicInputTransaction[] => [
  transaction(),
  transaction({ id: 'TX-2', po_number: 'PO-2', vendor_code: 'SUP-2', vendor_name: 'Supplier Two',
    quantity: 20, unit_price: 15, total_spend_inr: 300, plant: 'PLANT-2' }),
  transaction({ id: 'TX-3', po_number: 'PO-3', material_code: 'MAT-2', material_desc: 'Resin grade B',
    vendor_name: 'Supplier One', vendor_code: 'SUP-1', quantity: 5, unit_price: 10, total_spend_inr: 50 }),
  transaction({ id: 'TX-4', material_code: 'MAT-3', material_desc: 'Bolt', vendor_code: 'SUP-3',
    vendor_name: 'Supplier Three', spend_category: 'MRO', unspsc_code: undefined, unspsc_category: undefined,
    plant: 'PLANT-3', quantity: 2, unit_price: 10, total_spend_inr: 20 }),
  transaction({ id: 'TX-5', material_code: 'MAT-4', material_desc: 'Washer', vendor_code: 'SUP-4',
    vendor_name: 'Supplier Four', spend_category: 'MRO', unspsc_code: undefined, unspsc_category: undefined,
    plant: 'PLANT-3', quantity: 5, unit_price: 10, total_spend_inr: 50 }),
  transaction({ id: 'TX-6', material_code: 'MAT-5', material_desc: 'Fixture', vendor_code: 'SUP-5',
    vendor_name: 'Supplier Five', spend_category: 'Capital', quantity: 0, unit_price: 0, total_spend_inr: 30 }),
  transaction({ id: 'TX-7', material_code: 'MAT-5', material_desc: 'Fixture', vendor_code: 'SUP-6',
    vendor_name: 'Supplier Six', spend_category: 'Capital', quantity: 10, unit_price: 2, total_spend_inr: 20 }),
  transaction({ id: undefined, po_number: undefined, po_line: undefined, po_date: undefined, material_code: undefined,
    material_desc: '', vendor_code: undefined, vendor_name: '', spend_category: undefined, unspsc_code: undefined,
    unspsc_category: undefined, uom: undefined, quantity: Number.NaN, unit_price: 0,
    total_spend_inr: 0, plant: undefined }),
  transaction({ id: 'TX-9', material_code: 'BAD-1', spend_category: 'Bad', total_spend_inr: -10 }),
  transaction({ id: 'TX-10', material_code: 'BAD-2', spend_category: 'Bad', total_spend_inr: Number.NaN }),
  transaction({ id: 'TX-11', material_code: 'MAT-6', material_desc: 'No quantity item', vendor_code: 'SUP-7',
    vendor_name: 'Supplier Seven', spend_category: 'No Qty', unspsc_code: undefined, unspsc_category: undefined,
    uom: undefined, quantity: 0, unit_price: 0, total_spend_inr: 10, plant: undefined }),
  transaction({ id: 'TX-12', material_code: 'MAT-6', material_desc: 'No quantity item', vendor_code: 'SUP-8',
    vendor_name: 'Supplier Eight', spend_category: 'No Qty', unspsc_code: undefined, unspsc_category: undefined,
    uom: undefined, quantity: 0, unit_price: 0, total_spend_inr: 15, plant: undefined }),
  transaction({ id: 'TX-13', material_code: undefined, material_desc: 'Uncoded blend', vendor_code: 'SUP-9',
    vendor_name: 'Supplier Nine', spend_category: 'Other', unspsc_code: undefined, unspsc_category: undefined,
    plant: 'PLANT-5', total_spend_inr: 12 }),
  transaction({ id: 'TX-14', material_code: undefined, material_desc: 'Uncoded blend', vendor_code: 'SUP-10',
    vendor_name: 'Supplier Ten', spend_category: 'Other', unspsc_code: undefined, unspsc_category: undefined,
    plant: 'PLANT-6', total_spend_inr: 8 }),
  ...[100, 100, 100, 100, 100, 1].map((spend, index) => transaction({
    id: `TAIL-${index}`, material_code: `TAIL-MAT-${index}`, material_desc: `Tail item ${index}`,
    vendor_code: `TAIL-SUP-${index}`, vendor_name: `Tail Supplier ${index}`, spend_category: 'Long Tail',
    unspsc_code: undefined, unspsc_category: undefined, plant: 'PLANT-4', total_spend_inr: spend
  })),
  ...[1, 2, 3].map((index) => transaction({
    id: `MED-${index}`, material_code: `MED-MAT-${index}`, material_desc: `Medium item ${index}`,
    vendor_code: `MED-SUP-${index}`, vendor_name: `Medium Supplier ${index}`, spend_category: 'Medium',
    unspsc_code: undefined, unspsc_category: undefined, total_spend_inr: 10, plant: undefined
  }))
];

describe('D1 vendor consolidation report builder', () => {
  it('summarizes observed assessment spend and separates review signals from savings claims', () => {
    const result = buildVendorConsolidationResult('ASSESSMENT-1', 'Example Ltd', representativeTransactions());
    expect(result).toMatchObject({
      assessmentId: 'ASSESSMENT-1', customerName: 'Example Ltd', totalAssessmentSpendInr: 1146,
      distinctSuppliersCount: 19, distinctPlantsCount: 6, estimatedSavingsInr: null,
      estimatedSavingsCr: null, actualSavingsCr: 0, validatedSavingsCr: 0,
      savingsStatus: 'NOT_YET_QUANTIFIABLE', allTransactionsCount: 21, allTransactionsSpendInr: 1146
    });
    expect(result.dataQualityExclusions).toEqual([expect.objectContaining({
      affectedCount: 2, affectedSpendInr: 10
    })]);
    expect(result.sameMaterialOpportunities).toEqual(expect.arrayContaining([
      expect.objectContaining({ materialCode: 'MAT-1', supplierCount: 2, isComparableUomAndCurrency: true }),
      expect.objectContaining({ materialCode: 'MAT-5', supplierCount: 2, isComparableUomAndCurrency: false }),
      expect.objectContaining({ materialCode: 'MAT-6', supplierCount: 2, isComparableUomAndCurrency: false })
    ]));
    expect(result.crossPlantOpportunities).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MAT-1', distinctPlantsCount: 2 })
    ]));
    expect(result.comparableMaterialOpportunities).toEqual([
      expect.objectContaining({ materials: expect.arrayContaining([
        expect.objectContaining({ materialCode: 'MAT-1' }), expect.objectContaining({ materialCode: 'MAT-2' })
      ]) })
    ]);
    expect(result.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ spendCategory: 'MRO', categoryOpportunityStatus: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL }),
      expect.objectContaining({ classificationType: 'PROVISIONAL_UNSPSC' })
    ]));
    expect(result.mappingExceptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceMaterialId: 'MAT-3', reviewStatus: 'AWAITING_REVIEW' })
    ]));
    expect(result.transactionsSample).toHaveLength(21);
    expect(result.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ spendCategory: 'Long Tail', fragmentationLevel: 'HIGH' }),
      expect.objectContaining({ spendCategory: 'Medium', fragmentationLevel: 'MEDIUM' })
    ]));
  });

  it('scopes source dimensions and opportunity status filters to the selected result', () => {
    const rows = representativeTransactions();
    const category = buildVendorConsolidationResult('A1', 'Example', rows, { category: 'resin' });
    expect(category.allTransactionsCount).toBe(3);
    expect(category.totalAssessmentSpendInr).toBe(450);
    expect(category.categories).toHaveLength(1);
    const materialAndSupplier = buildVendorConsolidationResult('A1', 'Example', rows, {
      materialCode: 'mat-1', supplierCode: 'sup-1'
    });
    expect(materialAndSupplier.allTransactionsCount).toBe(1);
    expect(materialAndSupplier.sameMaterialOpportunities).toEqual([]);
    const status = buildVendorConsolidationResult('A1', 'Example', rows, {
      status: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL
    });
    expect(status.categories.every((item) => item.categoryOpportunityStatus ===
      MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL)).toBe(true);
    expect(status.sameMaterialOpportunities.every((item) => item.status ===
      MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL)).toBe(true);
    expect(buildVendorConsolidationResult('A1', 'Example', rows, { category: 'missing' }).allTransactionsCount)
      .toBe(0);
  });

  it('handles empty evidence without fabricated coverage and exports auditable workbook sheets', () => {
    const empty = buildVendorConsolidationResult('EMPTY', '', []);
    expect(empty.totalAssessmentSpendInr).toBe(0);
    expect(empty.coverageSummary).toMatchObject({
      totalMaterialsCount: 0, provisionalMaterialPct: 0, awaitingReviewSpendPct: 0
    });
    const result = buildVendorConsolidationResult('A1', 'Example', representativeTransactions());
    const workbook = XLSX.read(buildVendorConsolidationWorkbook(result), { type: 'array' });
    expect(workbook.SheetNames).toEqual([...MODULE2_D1_VENDOR_CONSOLIDATION.EXPORT.SHEETS]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Summary!)).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: 'estimatedSavingsInr', value: 'NOT_YET_QUANTIFIABLE' })
    ]));
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Transaction Sample']!)).toHaveLength(21);
    const missingQueue = buildVendorConsolidationWorkbook({ ...result, mappingExceptions: undefined });
    expect(XLSX.read(missingQueue, { type: 'array' }).SheetNames).toHaveLength(8);
    expect(XLSX.read(buildVendorConsolidationWorkbook(empty), { type: 'array' }).SheetNames).toHaveLength(8);
  });
});

describe('vendor consolidation data-quality helpers', () => {
  it('normalizes missing identities, values, category keys, and mapping statuses', () => {
    const blank = transaction({
      vendor_code: undefined, vendor_name: '', material_code: undefined, material_desc: '',
      spend_category: undefined, unspsc_code: undefined, unspsc_category: undefined, uom: undefined,
      po_number: undefined, quantity: Number.NaN, total_spend_inr: 0, plant: undefined
    });
    expect(normalized()).toBe('');
    expect(amount(10)).toBe(10);
    expect(amount(-5)).toBe(0);
    expect(amount(Number.NaN)).toBe(0);
    expect(spendOf(blank)).toBe(0);
    expect(quantityOf(blank)).toBe(0);
    expect(crores(10000000)).toBe(1);
    expect(distinct(['', 'Supplier', 'Supplier'])).toEqual(['Supplier']);
    expect(supplierIdentity(blank)).toBe('');
    expect(materialIdentity(blank)).toBe('DESCRIPTION:');
    expect(sourceCategory(blank)).toBe(MODULE2_D1_VENDOR_CONSOLIDATION.UNKNOWN_VALUE);
    expect(taxonomyCode(blank)).toBe(MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE);
    expect(taxonomyTitle(blank)).toBe(MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_TITLE);
    expect(categoryKeyFor(blank, false)).toBe('SOURCE:unavailable');
    expect(categoryKeyFor(blank, true)).toBe('SOURCE:unavailable');
    expect(groupTransactions([blank])[0]).toMatchObject({ materialCode: '', materialDesc: '', uom: '' });
    expect(suppliersIn([blank])).toEqual([]);
    expect(poCount([blank])).toBe(0);
    expect(materialPrice(blank)).toBe(0);
    expect(materialSpend(groupTransactions([blank])[0])).toBe(0);
    expect(materialQuantity(groupTransactions([blank])[0])).toBe(0);
    const source = sourceMaterials([blank]);
    expect(source[0]).toMatchObject({ id: 'UNMAPPED-0', supplierCount: 0 });
    const mapping = mappingEntry(source[0]);
    expect(mapping).toMatchObject({ reviewStatus: 'AWAITING_REVIEW', mappingMethod: 'MANUAL_REVIEW_REQUIRED' });
    expect(mappingStatus(mapping)).toBe('SOURCE_SPEND_CATEGORY');
    expect(mappingStatus({ ...mapping, sourceCategory: '' })).toBe('UNMAPPED');
    expect(mappingStatus({ ...mapping, reviewStatus: 'PROVISIONAL' })).toBe('PROVISIONAL_UNSPSC');
    for (const reviewStatus of ['APPROVED', 'TAXONOMY_VERIFIED', 'CLIENT_APPROVED'] as const) {
      expect(mappingStatus({ ...mapping, reviewStatus })).toBe('VERIFIED_UNSPSC');
    }
    expect(classificationLabel('UNMAPPED')).toBe(
      MODULE2_D1_VENDOR_CONSOLIDATION.CATEGORY_CLASSIFICATION_LABELS.UNMAPPED
    );
  });

  it('covers missing and incomplete mappings, zero-spend supplier profiles, and source-level categories', () => {
    const row = transaction({
      material_code: undefined, material_desc: '', vendor_code: 'SUP-ZERO', vendor_name: 'Zero Supplier',
      spend_category: undefined, unspsc_code: undefined, unspsc_category: undefined, total_spend_inr: 0
    });
    const groups = groupTransactions([row]);
    const withoutMapping = buildCategoryProfiles([row], groups, [], true)[0];
    expect(withoutMapping).toMatchObject({
      classificationType: 'UNMAPPED',
      unspscCode: MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE,
      unspscCategory: MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_TITLE,
      categoryOpportunityStatus: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.NO_OPPORTUNITY
    });
    const incompleteMapping = {
      ...mappingEntry(sourceMaterials([row])[0]), assignedUnspscCode: '', assignedUnspscTitle: '',
      sourceCategory: ''
    };
    const fallbackMapping = buildCategoryProfiles([row], groups, [incompleteMapping], true)[0];
    expect(fallbackMapping).toMatchObject({
      classificationType: 'UNMAPPED',
      unspscCode: MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE,
      unspscCategory: MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_TITLE
    });
    expect(supplierProfiles([row], 0)).toEqual([expect.objectContaining({
      spendSharePct: 0, isTailSupplier: false, distinctMaterialsCount: 1, distinctPlantsCount: 1
    })]);
  });
});
