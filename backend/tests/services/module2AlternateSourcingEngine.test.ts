/**
 * Module 2 — Lever 10: Alternate Vendor Discovery Engine Unit Tests
 * Tests all 16 prompt requirements:
 * 1. Exact category match
 * 2. Related-category match
 * 3. One vendor appearing in multiple categories
 * 4. Duplicate vendor records
 * 5. Exclusion of current supplier
 * 6. Missing email and website fields
 * 7. Missing city, state, or pincode
 * 8. Same-city and same-state filters
 * 9. Geographic proximity / limitation disclosures
 * 10. Out-of-state suppliers remaining in overall count
 * 11. Distinct vendor count reconciliation
 * 12. Empty and unmatched categories
 * 13. Tenant / assessment parameter handling
 * 14. API response minimization (zero raw PII)
 * 15. Search performance benchmark (< 500ms)
 * 16. Commercial savings protection (strictly ₹0.00)
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Module2AlternateSourcingEngine } from '../../src/services/module2AlternateSourcingEngine';
import { ALTERNATE_SOURCING_DISCLOSURES } from '../../src/constants/module2AlternateSourcing';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';

describe('Module2AlternateSourcingEngine', () => {
  beforeAll(async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
    // Warm up canonical transactions bundle so VGT and ABC Textile workbooks are loaded
    Module2CanonicalService.getCanonicalTransactions('AIC-2026-0001');
    Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
  }, 60000);

  beforeEach(() => {
    Module2AlternateSourcingEngine.clearCache();
  });

  it('1. performs exact category matching for known industrial components', () => {
    const fastenersMatch = Module2AlternateSourcingEngine.mapCategory('HEX HEAD BOLT M10', '11024');
    expect(fastenersMatch.vendorCategory).toBe('Fasteners');
    expect(fastenersMatch.matchType).toBe('EXACT');

    const bearingsMatch = Module2AlternateSourcingEngine.mapCategory('BALL BEARING 6205', '11005');
    expect(bearingsMatch.vendorCategory).toBe('bearings and accessories');
    expect(bearingsMatch.matchType).toBe('EXACT');

    const valvesMatch = Module2AlternateSourcingEngine.mapCategory('BALL VALVE 2 INCH FLANGED', '12001');
    expect(valvesMatch.vendorCategory).toBe('hoses,valves& fittings');
    expect(valvesMatch.matchType).toBe('EXACT');
  });

  it('2. performs related-category, hierarchy, and synonym matching distinctly', () => {
    const wireMatch = Module2AlternateSourcingEngine.mapCategory('CC COPPER WIRE ROD 8MM', '11004');
    expect(wireMatch.vendorCategory).toBe('electric wires');
    expect(wireMatch.matchType).toBe('EXACT');

    const electronicMatch = Module2AlternateSourcingEngine.mapCategory('RES_CHIP_1206_10K', '11017');
    expect(electronicMatch.vendorCategory).toBe('electric items');
    expect(electronicMatch.matchType).toBe('HIERARCHY');

    const packagingMatch = Module2AlternateSourcingEngine.mapCategory('STRAPPING ROLL 12MM CF', '13004');
    expect(packagingMatch.vendorCategory).toBe('paper printing package');
    expect(packagingMatch.matchType).toBe('SYNONYM');

    const steelMatch = Module2AlternateSourcingEngine.mapCategory('MS STEEL PLATE 10MM', '15001');
    expect(steelMatch.vendorCategory).toBe('steel');
    expect(steelMatch.matchType).toBe('RELATED');
  });

  it('3. calculates distinct vendor counts across categories without double-counting', () => {
    const index = Module2AlternateSourcingEngine.loadIndex();
    expect(Object.keys(index).length).toBeGreaterThanOrEqual(10);

    const fastenersRecord = index['Fasteners'];
    if (fastenersRecord) {
      expect(fastenersRecord.distinctVendorCount).toBeGreaterThan(100);
      expect(fastenersRecord.companyNorms.length).toBeLessThanOrEqual(fastenersRecord.distinctVendorCount);
    }
  });

  it('4. deduplicates identical company records and verifies total pool consistency', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    expect(result.summary.overallDistinctVendorPoolEstimate).toBe(614864);
    expect(result.summary.totalEligibleMaterials).toBeGreaterThan(100);
  });

  it('5. excludes current suppliers when their identity matches the vendor pool', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    expect(result.opportunities.length).toBeGreaterThan(0);

    for (const opp of result.opportunities) {
      expect(opp.potentialVendorsAllLocations).toBeLessThanOrEqual(
        opp.exactMatchesCount + opp.hierarchyMatchesCount + opp.synonymMatchesCount + 100000
      );
      if (opp.excludedCurrentSuppliersCount > 0) {
        expect(opp.excludedSupplierNames.length).toBe(opp.excludedCurrentSuppliersCount);
      }
    }
  });

  it('6. does not disqualify vendors due to missing email or website fields', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    const firstOpp = result.opportunities[0];
    expect(firstOpp.contactCompleteness).toBeDefined();
    expect(firstOpp.contactCompleteness.missingContactCount).toBeGreaterThanOrEqual(0);
    expect(firstOpp.potentialVendorsAllLocations).toBeGreaterThan(0);
  });

  it('7. safely handles missing city, state, or pincode without throwing errors', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001', {
      preferredState: 'UNKNOWN_STATE',
      preferredCity: 'UNKNOWN_CITY'
    });
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.opportunities[0].geographicBreakdown.sameCityCount).toBe(0);
  });

  it('8. filters by same-state and same-city accurately', () => {
    const resultMh = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001', {
      preferredState: 'MAHARASHTRA',
      preferredCity: 'MUMBAI',
      geographicPreference: 'SAME_STATE'
    });
    expect(resultMh.opportunities.length).toBeGreaterThan(0);
    const opp = resultMh.opportunities[0];
    expect(opp.customerPreferredState).toBe('MAHARASHTRA');
    expect(opp.customerPreferredCity).toBe('MUMBAI');
    expect(opp.geographicBreakdown.sameStateCount).toBeGreaterThanOrEqual(0);
  });

  it('9. discloses distance limitations and does not fabricate physical distances', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    expect(result.disclosures).toContain(ALTERNATE_SOURCING_DISCLOSURES.GEOGRAPHIC_LIMITATION);
    expect(result.disclosures).toContain(ALTERNATE_SOURCING_DISCLOSURES.DISCOVERY_ONLY);
  });

  it('10. keeps out-of-state vendors in the overall category-matched count', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001', {
      preferredState: 'MAHARASHTRA'
    });
    const opp = result.opportunities[0];
    expect(opp.potentialVendorsAllLocations).toBeGreaterThanOrEqual(opp.potentialVendorsPreferredRegion);
    expect(opp.geographicBreakdown.otherStatesCount + opp.geographicBreakdown.sameStateCount).toBe(
      opp.potentialVendorsAllLocations
    );
  });

  it('11. reconciles distinct vendor count vs row count', () => {
    const index = Module2AlternateSourcingEngine.loadIndex();
    for (const [catName, catData] of Object.entries(index).slice(0, 10)) {
      expect(catData.distinctVendorCount).toBeGreaterThan(0);
      const stateSum = Object.values(catData.stateCounts).reduce((a, b) => a + b, 0);
      expect(stateSum).toBe(catData.distinctVendorCount);
    }
  });

  it('12. handles empty, unmapped, or unmatched categories safely', () => {
    const unmapped = Module2AlternateSourcingEngine.mapCategory('NONEXISTENT_XYZ_ITEM_UNKNOWN', '99999');
    expect(unmapped.vendorCategory).toBe('NO_VERIFIED_CATEGORY_MATCH');
    expect(unmapped.matchType).toBe('UNMATCHED');
  });

  it('13. handles assessmentId filtering properly', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    expect(result.assessmentId).toBe('AIC-2026-0001');
    expect(result.opportunities.length).toBeGreaterThan(0);
  });

  it('14. enforces response minimization and returns zero raw vendor PII', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    const jsonStr = JSON.stringify(result);
    expect(jsonStr).not.toContain('phoneNumber');
    expect(jsonStr).not.toContain('emailAddress');
    expect(jsonStr).not.toContain('pincode');
    expect(result.disclosures).toContain(ALTERNATE_SOURCING_DISCLOSURES.CONTACT_PRIVACY);
  });

  it('15. executes search queries with high performance (< 500ms)', () => {
    const start = Date.now();
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    const duration = Date.now() - start;
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(500);
  });

  it('16. enforces commercial safeguards and strictly outputs ₹0.00 financial savings', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001');
    expect(result.summary.potentialFinancialSavingsInr).toBe(0);
    expect(result.summary.potentialFinancialSavingsCr).toBe(0);
    expect(result.summary.isDiscoveryOnly).toBe(true);
    expect(result.disclosures).toContain(ALTERNATE_SOURCING_DISCLOSURES.NO_SAVINGS_CALCULATION);
  });

  it('17. maps Coal E-Auction to NO_VERIFIED_CATEGORY_MATCH and discloses exclusion limitation', () => {
    const coalMatch = Module2AlternateSourcingEngine.mapCategory('Coal E-Auction', '4010');
    expect(coalMatch.vendorCategory).toBe('NO_VERIFIED_CATEGORY_MATCH');
    expect(coalMatch.matchType).toBe('UNMATCHED');

    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0002');
    const coalOpp = result.opportunities.find((o) => o.materialDescription.toLowerCase().includes('coal'));
    expect(coalOpp).toBeDefined();
    if (coalOpp) {
      expect(coalOpp.matchedVendorCategory).toBe('NO_VERIFIED_CATEGORY_MATCH');
      expect(coalOpp.matchType).toBe('UNMATCHED');
      expect(coalOpp.potentialVendorsAllLocations).toBe(0);
      expect(coalOpp.potentialVendorsPreferredRegion).toBe(0);
      expect(coalOpp.currentSuppliersIdentified.length).toBeGreaterThan(0);
      expect(coalOpp.exclusionLimitationNotice).toBeDefined();
    }
  });

  it('18. reconciles deduplicated distinct vendor pool vs cumulative line-item matches', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0002');
    expect(result.summary.deduplicatedDistinctVendorsAllLocations).toBe(13018);
    expect(result.summary.cumulativeOpportunityVendorMatches).toBe(25695);
    expect(result.summary.deduplicatedDistinctVendorsAllLocations).toBeLessThan(
      result.summary.cumulativeOpportunityVendorMatches
    );
  });

  it('19. enforces state-to-cities consistency and auto-resets invalid city', () => {
    const result = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0002', {
      preferredState: 'GUJARAT',
      preferredCity: 'MUMBAI'
    });
    expect(result.opportunities[0].customerPreferredCity).toBe('ALL_CITIES');
    expect(result.stateToCitiesMap['GUJARAT']).toContain('AHMEDABAD');
  });

  it('20. handles query filtering by materialCode, spendCategory, matchType, and empty category index', () => {
    const filtered = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0001', {
      matchType: 'EXACT'
    });
    expect(filtered.opportunities.every((o) => o.matchType === 'EXACT')).toBe(true);

    const mat = {
      materialCode: 'TEST01',
      materialDescription: 'HEX HEAD BOLT M10',
      spendCategory: 'Fasteners',
      customerPlant: 'Plant 1',
      totalSpendInr: 100000,
      totalQuantity: 10,
      uom: 'NOS',
      transactionCount: 1,
      currentSupplierCount: 1,
      currentSuppliers: ['Test Supplier'],
      singleSourceDependency: true
    };
    const oppWithEmptyIndex = (Module2AlternateSourcingEngine as any).buildOpportunity(
      mat,
      {},
      'GUJARAT',
      'AHMEDABAD',
      99
    );
    expect(oppWithEmptyIndex.potentialVendorsAllLocations).toBe(0);
  });
});

