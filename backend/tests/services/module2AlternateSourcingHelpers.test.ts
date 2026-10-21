import { describe, it, expect } from 'vitest';
import { Module2AlternateSourcingHelpers } from '../../src/services/module2AlternateSourcingHelpers';
import type {
  CategoryVendorIndexRecord,
  CustomerMaterialProcurementContext,
  AlternateVendorDiscoveryOpportunity
} from '../../src/types/module2AlternateSourcing';

describe('Module2AlternateSourcingHelpers', () => {
  const mockCatRecord: CategoryVendorIndexRecord = {
    categoryName: 'Fasteners',
    distinctVendorCount: 150,
    stateCounts: { MAHARASHTRA: 50, GUJARAT: 30, TAMILNADU: 20 },
    topCities: [
      { city: 'MUMBAI', count: 30 },
      { city: 'PUNE', count: 20 },
      { city: 'AHMEDABAD', count: 25 }
    ],
    contactMetrics: {
      hasWebsiteCount: 90,
      hasEmailCount: 80,
      hasPhoneCount: 140,
      missingContactCount: 10
    },
    companyNorms: ['acmefastenersltd', 'apexbolts', 'precisionnuts']
  };

  it('buildGeographicBreakdown computes correct counts for state, city, and exclusions', () => {
    const geoSpecific = Module2AlternateSourcingHelpers.buildGeographicBreakdown(
      mockCatRecord,
      'MAHARASHTRA',
      'MUMBAI',
      0
    );
    expect(geoSpecific.sameStateCount).toBe(50);
    expect(geoSpecific.sameCityCount).toBe(30);
    expect(geoSpecific.otherStatesCount).toBe(100);
    expect(geoSpecific.preferredCity).toBe('MUMBAI');

    const geoWithExclusion = Module2AlternateSourcingHelpers.buildGeographicBreakdown(
      mockCatRecord,
      'MAHARASHTRA',
      'MUMBAI',
      5
    );
    expect(geoWithExclusion.allLocationsCount).toBe(145);
    expect(geoWithExclusion.sameStateCount).toBe(45);
    expect(geoWithExclusion.sameCityCount).toBe(25);

    const geoAllCities = Module2AlternateSourcingHelpers.buildGeographicBreakdown(
      mockCatRecord,
      'MAHARASHTRA',
      'ALL_CITIES',
      0
    );
    expect(geoAllCities.sameCityCount).toBe(50);

    const geoUnknown = Module2AlternateSourcingHelpers.buildGeographicBreakdown(
      mockCatRecord,
      'KERALA',
      'KOCHI',
      0
    );
    expect(geoUnknown.sameStateCount).toBe(0);
    expect(geoUnknown.sameCityCount).toBe(0);
    expect(geoUnknown.otherStatesCount).toBe(150);
  });

  it('matchAndExcludeSuppliers handles matches, exclusions, limitations, and empty norms', () => {
    // 1. Matched incumbent
    const matched = Module2AlternateSourcingHelpers.matchAndExcludeSuppliers(
      ['Acme Fasteners Ltd', 'Unknown Vendor'],
      mockCatRecord.companyNorms
    );
    expect(matched.excludedCount).toBe(1);
    expect(matched.excludedNames).toEqual(['Acme Fasteners Ltd']);
    expect(matched.identifiedSuppliers).toEqual(['Acme Fasteners Ltd', 'Unknown Vendor']);
    expect(matched.matchedSuppliers).toEqual(['Acme Fasteners Ltd']);
    expect(matched.limitationNotice).toBeUndefined();

    // 2. Unmatched incumbent (limitation notice rendered)
    const unmatched = Module2AlternateSourcingHelpers.matchAndExcludeSuppliers(
      ['Western Coal Fields Ltd'],
      mockCatRecord.companyNorms
    );
    expect(unmatched.excludedCount).toBe(0);
    expect(unmatched.limitationNotice).toContain('not found in this category index');

    // 3. Empty company norms
    const emptyNorms = Module2AlternateSourcingHelpers.matchAndExcludeSuppliers(
      ['Some Supplier'],
      []
    );
    expect(emptyNorms.excludedCount).toBe(0);
    expect(emptyNorms.limitationNotice).toContain('not found in vendor master category');

    // 4. Empty current suppliers
    const emptySuppliers = Module2AlternateSourcingHelpers.matchAndExcludeSuppliers([], mockCatRecord.companyNorms);
    expect(emptySuppliers.excludedCount).toBe(0);
    expect(emptySuppliers.limitationNotice).toBeUndefined();

    // 5. Empty suppliers and empty norms
    const bothEmpty = Module2AlternateSourcingHelpers.matchAndExcludeSuppliers([], []);
    expect(bothEmpty.excludedCount).toBe(0);
    expect(bothEmpty.limitationNotice).toBeUndefined();
  });

  it('buildContactMetrics computes accurate completeness ratios', () => {
    const completeness = Module2AlternateSourcingHelpers.buildContactMetrics(mockCatRecord.contactMetrics, 150);
    expect(completeness.hasEmailRatioPct).toBe(53.3);
    expect(completeness.hasWebsiteRatioPct).toBe(60);

    const zeroCompleteness = Module2AlternateSourcingHelpers.buildContactMetrics(
      { hasWebsiteCount: 0, hasEmailCount: 0, hasPhoneCount: 0, missingContactCount: 0 },
      0
    );
    expect(zeroCompleteness.hasEmailRatioPct).toBe(0);
  });

  it('extractCustomerMaterials aggregates transactions correctly', () => {
    const rawTxns = [
      {
        material_code: 'M01',
        material_desc: 'Hex Bolt',
        spend_category: 'Fasteners',
        vendor_name: 'Vendor A',
        total_spend_inr: 500000,
        quantity: 100,
        uom: 'NOS',
        plant: 'Plant 1'
      },
      {
        material_code: 'M01',
        material_desc: 'Hex Bolt',
        spend_category: 'Fasteners',
        vendor_name: 'Vendor B',
        total_spend_inr: 300000,
        quantity: 50,
        uom: 'NOS',
        plant: 'Plant 1'
      },
      {
        material_code: 'M02',
        material_desc: 'Ball Valve',
        spend_category: 'Valves',
        vendor_name: 'Vendor C',
        total_spend_inr: 1000000,
        quantity: 10,
        uom: 'PCS',
        plant: 'Plant 2'
      }
    ];

    const mats = Module2AlternateSourcingHelpers.extractCustomerMaterials(rawTxns as any);
    expect(mats.length).toBe(2);
    expect(mats[0].materialCode).toBe('M02'); // Sorted descending by spend
    expect(mats[1].materialCode).toBe('M01');
    expect(mats[1].currentSuppliers).toContain('Vendor A');
    expect(mats[1].currentSuppliers).toContain('Vendor B');
    expect(mats[1].singleSourceDependency).toBe(false);
  });

  it('buildUnmatchedOpportunity creates valid zero-vendor opportunity with limitations', () => {
    const mat: CustomerMaterialProcurementContext = {
      materialCode: '4010',
      materialDescription: 'Coal E-Auction',
      spendCategory: 'Energy & Fuels',
      currentSuppliers: ['Western Coal Fields Ltd'],
      customerPlant: 'Main Plant',
      totalSpendInr: 373700000,
      totalQuantity: 1000,
      uom: 'TON',
      transactionCount: 42,
      currentSupplierCount: 1,
      singleSourceDependency: true
    };

    const opp = Module2AlternateSourcingHelpers.buildUnmatchedOpportunity(
      mat,
      'GUJARAT',
      'AHMEDABAD',
      'OPP-ALT-001',
      'No verified category in vendor master'
    );

    expect(opp.potentialVendorsAllLocations).toBe(0);
    expect(opp.potentialVendorsPreferredRegion).toBe(0);
    expect(opp.matchedVendorCategory).toBe('NO_VERIFIED_CATEGORY_MATCH');
    expect(opp.matchType).toBe('UNMATCHED');
    expect(opp.currentSuppliersIdentified).toEqual(['Western Coal Fields Ltd']);
    expect(opp.exclusionLimitationNotice).toBeDefined();

    const oppNoSuppliers = Module2AlternateSourcingHelpers.buildUnmatchedOpportunity(
      { ...mat, currentSuppliers: [] },
      'GUJARAT',
      'AHMEDABAD',
      'OPP-ALT-002',
      'No verified category'
    );
    expect(oppNoSuppliers.exclusionLimitationNotice).toBeUndefined();
  });

  it('calculateDistinctPool deduplicates vendors across opportunities', () => {
    const opps: Partial<AlternateVendorDiscoveryOpportunity>[] = [
      {
        matchedVendorCategory: 'Fasteners',
        potentialVendorsAllLocations: 150,
        potentialVendorsPreferredRegion: 50,
        matchType: 'EXACT',
        currentSuppliers: ['Vendor A'],
        currentSuppliersMatchedInMaster: ['Vendor A'],
        excludedSupplierNames: ['Vendor A']
      },
      {
        matchedVendorCategory: 'Fasteners', // Repeated category
        potentialVendorsAllLocations: 150,
        potentialVendorsPreferredRegion: 50,
        matchType: 'EXACT',
        currentSuppliers: ['Vendor B'],
        currentSuppliersMatchedInMaster: [],
        excludedSupplierNames: []
      },
      {
        matchedVendorCategory: 'NO_VERIFIED_CATEGORY_MATCH',
        potentialVendorsAllLocations: 0,
        potentialVendorsPreferredRegion: 0,
        matchType: 'UNMATCHED',
        currentSuppliers: ['Western Coal'],
        currentSuppliersMatchedInMaster: [],
        excludedSupplierNames: []
      }
    ];

    const index = { Fasteners: mockCatRecord };
    const pool = Module2AlternateSourcingHelpers.calculateDistinctPool(
      opps as AlternateVendorDiscoveryOpportunity[],
      index,
      'MAHARASHTRA'
    );

    expect(pool.cumulativeAll).toBe(300);
    expect(pool.cumulativePref).toBe(100);
    expect(pool.deduplicatedAll).toBe(3); // From companyNorms
    expect(pool.identifiedSuppliersCount).toBe(3);
    expect(pool.matchedSuppliersCount).toBe(1);
    expect(pool.excludedSuppliersCount).toBe(1);
  });
});
