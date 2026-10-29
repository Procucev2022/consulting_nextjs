import { describe, expect, it } from 'vitest';
import { alternateSourcingQuerySchema } from '../../src/constants/validation';
import type { ParsedAlternateVendorCategory } from '../../src/types/module2AlternateSourcingD1';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import {
  buildAlternateSourcingResult, selectAlternateVendorCategoryKeys
} from '../../src/services/workerD1AlternateSourcingProfiles';

const transaction = (
  id: string, spend: number, category: string, material: string, supplier: string, plant = 'P1'
): StrategicInputTransaction => ({
  id, total_spend_inr: spend, spend_category: category, unspsc_category: category,
  material_code: material, material_desc: `${material} description`, quantity: 1, uom: 'KG',
  vendor_code: supplier, vendor_name: supplier, unit_price: spend, plant
});

const category = (overrides: Partial<ParsedAlternateVendorCategory> = {}): ParsedAlternateVendorCategory => ({
  categoryKey: 'resin', categoryName: 'Resin', distinctVendorCount: 8,
  stateCounts: { MAHARASHTRA: 5, GUJARAT: 3 },
  topCities: [{ city: 'MUMBAI', count: 2 }, { city: 'AHMEDABAD', count: 3 }],
  contactMetrics: { hasWebsiteCount: 2, hasEmailCount: 4, hasPhoneCount: 6, missingContactCount: 2 },
  ...overrides
});

const query = (input: Record<string, string> = {}) => alternateSourcingQuerySchema.parse(input);

describe('D1 alternate sourcing category profiles', () => {
  const rows = [
    transaction('1', 100, ' Resin ', 'MAT-1', 'SUP-A'),
    transaction('2', 200, 'Resin', 'MAT-1', 'SUP-B'),
    transaction('3', 50, 'Resin', 'MAT-1', 'SUP-A', 'P2'),
    transaction('4', 30, 'Unknown category', 'MAT-2', 'SUP-C'),
    transaction('5', -10, 'Resin', 'MAT-3', 'SUP-D')
  ];

  it('builds material and plant opportunities from exact category evidence without asserting savings', () => {
    const result = buildAlternateSourcingResult('A1', rows, [category()], 7, query());
    expect(result.opportunities).toHaveLength(3);
    expect(result.opportunities[0]).toMatchObject({
      matchType: 'EXACT', materialCode: 'MAT-1', currentSupplierCount: 2,
      potentialVendorsAllLocations: 8, potentialVendorsPreferredRegion: 8,
      qualificationStatus: 'DATA_UNAVAILABLE', excludedCurrentSuppliersCount: null,
      relevantSpendInr: 300, relevantSpendCr: 0.00003
    });
    expect(result.opportunities[0].contactCompleteness).toMatchObject({ hasWebsiteRatioPct: 25, hasEmailRatioPct: 50 });
    expect(result.opportunities[0].currentSuppliers).toEqual(['SUP-A', 'SUP-B']);
    expect(result.opportunities[2]).toMatchObject({
      matchType: 'UNMATCHED', potentialVendorsAllLocations: 0, qualifiedAlternativesCount: 'DATA_UNAVAILABLE'
    });
    expect(result.summary).toMatchObject({
      totalEligibleMaterials: 2, singleSourceMaterialsCount: 1, totalPotentialVendorsAllLocations: 16,
      totalPotentialVendorsPreferredRegion: 16, deduplicatedDistinctVendorsAllLocations: 7,
      deduplicatedDistinctVendorsPreferredRegion: null, totalCurrentSuppliersMatchedInMaster: null,
      totalCurrentSuppliersExcluded: null, potentialFinancialSavingsInr: 0, potentialFinancialSavingsCr: 0,
      isDiscoveryOnly: true
    });
    expect(result.disclosures).toEqual(expect.arrayContaining([
      expect.stringContaining('Excluded 1 transaction rows')
    ]));
    expect(result.availableStates).toEqual(['GUJARAT', 'MAHARASHTRA']);
    expect(result.availableCities).toEqual(['AHMEDABAD', 'MUMBAI']);
  });

  it('uses state, other-state, and city aggregate counts for the selected preference', () => {
    const sameState = buildAlternateSourcingResult('A1', rows, [category()], 7,
      query({ geographicPreference: 'SAME_STATE', preferredState: 'maharashtra' }));
    expect(sameState.opportunities[0].geographicBreakdown).toMatchObject({
      sameStateCount: 5, otherStatesCount: 3, preferredRegionCount: 5
    });
    const otherStates = buildAlternateSourcingResult('A1', rows, [category()], 7,
      query({ geographicPreference: 'OTHER_STATES', preferredState: 'Maharashtra' }));
    expect(otherStates.opportunities[0].potentialVendorsPreferredRegion).toBe(3);
    const sameCity = buildAlternateSourcingResult('A1', rows, [category()], 7,
      query({ geographicPreference: 'SAME_CITY', preferredCity: 'mumbai' }));
    expect(sameCity.opportunities[0].potentialVendorsPreferredRegion).toBe(2);
    const allCities = buildAlternateSourcingResult('A1', rows, [category()], 7,
      query({ preferredCity: 'ALL_CITIES' }));
    expect(allCities.opportunities[0].customerPreferredCity).toBe('');
  });

  it('applies material, category, and supported match filters after stable opportunity IDs are assigned', () => {
    const matched = buildAlternateSourcingResult('A1', rows, [category()], 7,
      query({ materialCode: 'MAT-2', matchType: 'UNMATCHED' }));
    expect(matched.opportunities).toHaveLength(1);
    expect(matched.opportunities[0]).toMatchObject({ materialCode: 'MAT-2', opportunityId: 'ALT-A1-0003' });
    const noResult = buildAlternateSourcingResult('A1', rows, [category()], 7,
      query({ spendCategory: 'not present' }));
    expect(noResult.opportunities).toEqual([]);
    expect(noResult.summary.totalEligibleMaterials).toBe(0);
  });

  it('does not match duplicate category names or count categories absent from transaction evidence', () => {
    const duplicate = category({ categoryKey: 'resin-2' });
    const result = buildAlternateSourcingResult('A1', [rows[0]], [category(), duplicate,
      category({ categoryKey: 'other', categoryName: 'Steel' })], null, query());
    expect(result.opportunities[0]).toMatchObject({ matchType: 'UNMATCHED', potentialVendorsAllLocations: 0 });
    expect(result.availableStates).toEqual([]);
    expect(selectAlternateVendorCategoryKeys(rows, [category(), duplicate])).toEqual([]);
    expect(selectAlternateVendorCategoryKeys([rows[4]], [category()])).toEqual([]);
  });

  it('handles missing material identity and empty transaction sets', () => {
    const noIdentity = { ...transaction('6', 0, 'Resin', '', 'SUP-A'), material_desc: '' };
    const result = buildAlternateSourcingResult('A1', [noIdentity], [category()], 0, query());
    expect(result.opportunities).toEqual([]);
    expect(result.summary).toMatchObject({ totalEligibleMaterials: 0, overallDistinctVendorPoolEstimate: 0 });
    const empty = buildAlternateSourcingResult('A1', [], [], null, query());
    expect(empty).toMatchObject({
      opportunities: [], availableStates: [], availableCities: [],
      summary: { deduplicatedDistinctVendorsAllLocations: null, overallDistinctVendorPoolEstimate: null }
    });
  });
});
