/**
 * Coverage tests for Module2ItemAnalysisEngine.
 * Drives item grouping and blank-field fallbacks, price extremes and the credible-low selection,
 * the benefit levers, confidence grading, and the multi-category vendor summaries.
 */

import { describe, expect, it } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import { Module2ItemAnalysisEngine } from '../../src/services/module2ItemAnalysisEngine';

const CATEGORY_NAME = 'Fasteners';

function purchaseLine(
  vendorName: string,
  unitPrice: number,
  quantity: number,
  overrides: Partial<StrategicInputTransaction> = {}
): StrategicInputTransaction {
  return {
    vendor_name: vendorName,
    material_code: 'ITM-100',
    material_desc: 'M16 Hex Bolt High Tensile',
    quantity,
    uom: 'EA',
    unit_price: unitPrice,
    total_spend_inr: unitPrice * quantity,
    spend_category: CATEGORY_NAME,
    ...overrides
  };
}

function lineWithoutDescription(vendorName: string, unitPrice: number, quantity: number): StrategicInputTransaction {
  // material_desc is required by the row type, but legacy rows can arrive without it.
  const row: Partial<StrategicInputTransaction> = purchaseLine(vendorName, unitPrice, quantity, {
    material_desc: undefined
  });
  return row as StrategicInputTransaction;
}

function analyze(transactions: StrategicInputTransaction[]) {
  return Module2ItemAnalysisEngine.analyzeItems(CATEGORY_NAME, transactions, new Set());
}

describe('Module2ItemAnalysisEngine.analyzeItems grouping and fallbacks', () => {
  it('returns no items for an empty transaction list', () => {
    expect(analyze([])).toEqual([]);
  });

  it('groups lines by item code and normalised unit, sorted by annual spend', () => {
    const items = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Bharat Bolts', 110, 10, { uom: ' ea ' }),
      purchaseLine('Bharat Bolts', 90, 5, { uom: 'BOX' }),
      purchaseLine('Coastal Fixings', 50, 100, { material_code: 'ITM-200' })
    ]);

    expect(items.map(item => [item.itemCode, item.uom, item.transactionCount, item.annualSpendInr])).toEqual([
      ['ITM-200', 'EA', 1, 5000],
      ['ITM-100', 'EA', 2, 2100],
      ['ITM-100', 'BOX', 1, 450]
    ]);
  });

  it('uses the material description as the item code when the code is absent', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 25, 40, { material_code: undefined, material_desc: 'Steel Washer M8' })
    ]);

    expect(item.itemCode).toBe('Steel Washer M8');
    expect(item.itemDescription).toBe('Steel Washer M8');
    expect(item.annualSpendInr).toBe(1000);
  });

  it('keeps the description-based code for a line whose item code is blank', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 25, 40, { material_code: '', material_desc: 'Copy Paper A4' })
    ]);

    expect(item.itemCode).toBe('Copy Paper A4');
    expect(item.itemDescription).toBe('Copy Paper A4');
  });

  it('defaults a blank unit of measure to EA', () => {
    const [item] = analyze([purchaseLine('Alpha Fasteners Pvt Ltd', 25, 40, { uom: '' })]);

    expect(item.uom).toBe('EA');
  });

  it('groups lines with neither a code nor a description under the default item key', () => {
    const items = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 25, 40, { material_code: '', material_desc: '' }),
      purchaseLine('Bharat Bolts', 30, 10, { material_code: '', material_desc: '' })
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      itemCode: 'ITEM-DEFAULT',
      itemDescription: 'ITEM-DEFAULT',
      transactionCount: 2,
      annualSpendInr: 1300
    });
  });

  it('uses the item code as the description when the row has no description field', () => {
    const [item] = analyze([
      lineWithoutDescription('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Bharat Bolts', 100, 10)
    ]);

    expect(item.itemCode).toBe('ITM-100');
    expect(item.itemDescription).toBe('ITM-100');
  });

  it('derives spend from price times quantity when total spend is missing', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10, { total_spend_inr: 0 }),
      purchaseLine('Bharat Bolts', 100, 5),
      purchaseLine('Coastal Fixings', 0, 0, { total_spend_inr: 0 })
    ]);

    expect(item).toMatchObject({
      annualSpendInr: 1500,
      annualQuantity: 15,
      weightedAveragePrice: 100,
      transactionCount: 3
    });
  });

  it('reports zero value and price fields for an item with no spend or quantity', () => {
    const [item] = analyze([purchaseLine('Coastal Fixings', 0, 0, { total_spend_inr: 0 })]);

    expect(item).toMatchObject({
      annualSpendInr: 0,
      annualQuantity: 0,
      weightedAveragePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      lowestCrediblePrice: 0,
      priceDispersionPct: 0
    });
  });

  it('uses the weighted average as min and max when no line has a positive unit price', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 0, 10, { total_spend_inr: 1000 }),
      purchaseLine('Bharat Bolts', 0, 10, { total_spend_inr: 1000 })
    ]);

    expect(item).toMatchObject({
      weightedAveragePrice: 100,
      minPrice: 100,
      maxPrice: 100,
      lowestCrediblePrice: 100,
      medianPrice: 0,
      priceDispersionPct: 0
    });
  });

  it('keeps the lowest price as the credible low when it sits inside the median band', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 90, 10),
      purchaseLine('Bharat Bolts', 100, 10),
      purchaseLine('Coastal Fixings', 110, 10)
    ]);

    expect(item).toMatchObject({
      minPrice: 90,
      p25Price: 90,
      medianPrice: 100,
      p75Price: 110,
      maxPrice: 110,
      lowestCrediblePrice: 90,
      priceDispersionPct: 20
    });
  });

  it('uses the lower quartile as the credible low when the minimum is below 65 percent of the median', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 20, 10),
      purchaseLine('Bharat Bolts', 30, 10),
      purchaseLine('Coastal Fixings', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Bharat Bolts', 100, 10)
    ]);

    expect(item.minPrice).toBe(20);
    expect(item.lowestCrediblePrice).toBe(30);
  });

  it('uses the single-line weighted price as the credible low when only one price exists', () => {
    const [item] = analyze([purchaseLine('Alpha Fasteners Pvt Ltd', 80, 10, { total_spend_inr: 850 })]);

    expect(item.minPrice).toBe(80);
    expect(item.lowestCrediblePrice).toBe(85);
  });
});

describe('Module2ItemAnalysisEngine.analyzeItems benefits, confidence and sub-category', () => {
  it('reports no e-auction benefit for a single-supplier item even when its prices vary', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 120, 10)
    ]);

    expect(item).toMatchObject({
      supplierCount: 1,
      eAuctionBenefitInr: 0,
      netDefensibleBenefitInr: 0,
      primaryLever: 'NO_QUANTIFIABLE_BENEFIT',
      status: 'NOT_ELIGIBLE'
    });
  });

  it('reports no e-auction benefit when the weighted price does not exceed the credible low', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Bharat Bolts', 100, 10)
    ]);

    expect(item).toMatchObject({
      eAuctionBenefitInr: 0,
      primaryLever: 'NO_QUANTIFIABLE_BENEFIT',
      status: 'IDENTIFIED_NOT_QUANTIFIABLE'
    });
    expect(item.explanation).toContain('not quantifiable');
  });

  it('quantifies an e-auction benefit against the credible low price across suppliers', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 1000),
      purchaseLine('Bharat Bolts', 80, 1000)
    ]);

    expect(item).toMatchObject({
      weightedAveragePrice: 90,
      eAuctionBenefitInr: 20000,
      primaryLever: 'E_AUCTION',
      status: 'QUANTIFIABLE',
      netDefensibleBenefitInr: 20000
    });
    expect(item.explanation).toContain('Defensible historical benefit');
  });

  it('attributes the benefit to volume bundling when a larger batch shows a lower unit price', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 10, 100),
      purchaseLine('Bharat Bolts', 9, 200),
      purchaseLine('Coastal Fixings', 8, 500)
    ]);

    expect(item).toMatchObject({
      hasVolumeTierEvidence: true,
      volumeTierSlopePct: 20,
      eAuctionBenefitInr: 400,
      vendorConsolidationBenefitInr: 400,
      volumeBundlingBenefitInr: 1360,
      primaryLever: 'VOLUME_BUNDLING',
      netDefensibleBenefitInr: 1360
    });
  });

  it('grades an item HIGH with five or more lines across at least two suppliers', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Bharat Bolts', 100, 10),
      purchaseLine('Bharat Bolts', 100, 10)
    ]);

    expect(item.confidence).toBe('HIGH');
  });

  it('grades an item MEDIUM when five lines all come from one supplier', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10)
    ]);

    expect(item.confidence).toBe('MEDIUM');
  });

  it('grades an item MEDIUM with fewer than five lines', () => {
    const [item] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10),
      purchaseLine('Bharat Bolts', 100, 10),
      purchaseLine('Bharat Bolts', 100, 10)
    ]);

    expect(item.confidence).toBe('MEDIUM');
  });

  it('takes the sub-category from the UNSPSC class, then the commodity, then the category', () => {
    const [byClass] = analyze([purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10, { unspsc_class: 'Hex Bolts' })]);
    const [byCommodity] = analyze([
      purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10, { unspsc_commodity: 'Bolts and Studs' })
    ]);
    const [byCategory] = analyze([purchaseLine('Alpha Fasteners Pvt Ltd', 100, 10)]);

    expect(byClass.subCategory).toBe('Hex Bolts');
    expect(byCommodity.subCategory).toBe('Bolts and Studs');
    expect(byCategory.subCategory).toBe(CATEGORY_NAME);
  });
});

describe('Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers', () => {
  it('returns no vendor rows for an empty transaction list', () => {
    expect(Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers([])).toEqual([]);
  });

  it('separates multi-category suppliers from single-category specialists and sorts by spend', () => {
    const vendors = Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers([
      {
        vendor_name: 'Omni Supplier',
        spend_category: 'Packaging',
        material_desc: 'Corrugated Box',
        quantity: 100,
        unit_price: 40,
        total_spend_inr: 4000
      },
      {
        vendor_name: 'Omni Supplier',
        spend_category: 'Safety',
        material_desc: 'Safety Helmets',
        quantity: 50,
        unit_price: 300,
        total_spend_inr: 15000
      },
      {
        vendor_name: 'Pure Vendor',
        spend_category: 'Packaging',
        material_desc: 'Stretch Film',
        quantity: 200,
        unit_price: 150,
        total_spend_inr: 30000
      }
    ]);
    const [pure, omni] = vendors;

    expect(vendors.map(vendor => vendor.vendorName)).toEqual(['Pure Vendor', 'Omni Supplier']);
    expect(omni).toMatchObject({
      total3YearSpendInr: 19000,
      annualSpendInr: 6333,
      categoriesSuppliedCount: 2,
      itemsSuppliedCount: 2,
      classification: 'MULTI_CATEGORY_SUPPLIER',
      primaryCategory: 'Safety',
      riskIndicators: ['MULTI_CATEGORY_EXPOSURE']
    });
    expect(omni.categories.map(category => category.categoryName)).toEqual(['Safety', 'Packaging']);
    expect(omni.categoryDependencyMap?.map(entry => entry.otherSuppliersCount)).toEqual([3, 3]);
    expect(omni.categoryDependencyMap?.map(entry => entry.specialistAvailable)).toEqual([true, true]);
    expect(pure).toMatchObject({
      total3YearSpendInr: 30000,
      classification: 'CATEGORY_SPECIALIST',
      categoriesSuppliedCount: 1,
      primaryCategory: 'Packaging',
      riskIndicators: []
    });
    expect(pure.categoryDependencyMap?.map(entry => [entry.otherSuppliersCount, entry.specialistAvailable])).toEqual([
      [1, false]
    ]);
  });

  it('labels a blank vendor as Vendor and a missing category as General Spend', () => {
    const [vendor] = Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers([
      { vendor_name: '', material_desc: 'Steel Washer M8', quantity: 40, unit_price: 25, total_spend_inr: 1000 }
    ]);

    expect(vendor).toMatchObject({ vendorName: 'Vendor', primaryCategory: 'General Spend', annualSpendInr: 333 });
    expect(vendor.categories[0].categoryName).toBe('General Spend');
  });

  it('derives vendor spend from price times quantity and counts a zero-quantity line as zero', () => {
    const [vendor] = Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers([
      {
        vendor_name: 'Omni Supplier',
        spend_category: 'Packaging',
        material_desc: 'Corrugated Box',
        quantity: 100,
        unit_price: 40,
        total_spend_inr: 0
      },
      {
        vendor_name: 'Omni Supplier',
        spend_category: 'Packaging',
        material_desc: 'Corrugated Box',
        quantity: 0,
        unit_price: 0,
        total_spend_inr: 0
      }
    ]);

    expect(vendor.total3YearSpendInr).toBe(4000);
    expect(vendor.categories[0]).toMatchObject({ spendInr: 4000, quantity: 100, itemCount: 2 });
    expect(vendor.annualSpendInr).toBe(1333);
  });

  it('reports zero annual spend for a vendor whose lines carry no value', () => {
    const [vendor] = Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers([
      {
        vendor_name: 'Dormant Supplier',
        spend_category: 'Packaging',
        material_desc: 'Dormant Item',
        quantity: 0,
        unit_price: 0,
        total_spend_inr: 0
      }
    ]);

    expect(vendor).toMatchObject({ total3YearSpendInr: 0, annualSpendInr: 0 });
  });

  it('reports General as the primary category when the category name is whitespace only', () => {
    const [vendor] = Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers([
      {
        vendor_name: 'Omni Supplier',
        spend_category: '   ',
        material_desc: 'Shim Pack',
        quantity: 10,
        unit_price: 40,
        total_spend_inr: 400
      }
    ]);

    expect(vendor.primaryCategory).toBe('General');
  });
});
