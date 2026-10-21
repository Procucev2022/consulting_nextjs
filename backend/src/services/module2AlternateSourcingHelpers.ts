/**
 * Module 2 — Lever 10: Alternate Sourcing Helpers
 * Geographic breakdown, contact completeness metrics, and current supplier exclusion helpers
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import type {
  CategoryVendorIndexRecord,
  GeographicVendorBreakdown,
  ContactCompletenessMetrics
} from '../types/module2AlternateSourcing';

export class Module2AlternateSourcingHelpers {
  public static matchAndExcludeSuppliers(
    currentSuppliers: string[],
    vendorCompanyNorms: string[]
  ): {
    excludedCount: number;
    excludedNames: string[];
    identifiedSuppliers: string[];
    matchedSuppliers: string[];
    limitationNotice?: string;
  } {
    if (!currentSuppliers.length || !vendorCompanyNorms.length) {
      const notice = currentSuppliers.length
        ? 'Incumbent supplier(s) identified in customer data, but not found in vendor master category.'
        : undefined;
      return {
        excludedCount: 0,
        excludedNames: [],
        identifiedSuppliers: currentSuppliers,
        matchedSuppliers: [],
        limitationNotice: notice
      };
    }

    const normSet = new Set(vendorCompanyNorms);
    const matchedSuppliers: string[] = [];

    for (const s of currentSuppliers) {
      const sNorm = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normSet.has(sNorm)) {
        matchedSuppliers.push(s);
      }
    }

    const limitationNotice =
      currentSuppliers.length > 0 && matchedSuppliers.length === 0
        ? `Incumbent supplier(s) (${currentSuppliers.join(', ')}) not found in this category index; no deduction applied.`
        : undefined;

    return {
      excludedCount: matchedSuppliers.length,
      excludedNames: matchedSuppliers,
      identifiedSuppliers: currentSuppliers,
      matchedSuppliers,
      limitationNotice
    };
  }

  public static buildGeographicBreakdown(
    record: CategoryVendorIndexRecord,
    prefState: string,
    prefCity: string,
    excludedCount: number
  ): GeographicVendorBreakdown {
    const normPrefState = prefState.toUpperCase().trim();
    const normPrefCity = prefCity.toUpperCase().trim();

    const sameStateTotal = record.stateCounts[normPrefState] || 0;
    const sameCityTotal =
      normPrefCity === 'ALL_CITIES'
        ? sameStateTotal
        : (record.topCities.find((c) => c.city === normPrefCity)?.count || 0);

    const allLocationsTotal = Math.max(0, record.distinctVendorCount - excludedCount);
    const sameStateNet = Math.max(0, sameStateTotal - Math.min(sameStateTotal, excludedCount));
    const sameCityNet = Math.max(0, sameCityTotal - Math.min(sameCityTotal, excludedCount));
    const otherStatesNet = Math.max(0, allLocationsTotal - sameStateNet);

    const topStates = Object.entries(record.stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state, count]) => ({ state, count }));

    return {
      preferredCity: normPrefCity,
      sameCityCount: sameCityNet,
      sameStateCount: sameStateNet,
      otherStatesCount: otherStatesNet,
      allLocationsCount: allLocationsTotal,
      preferredRegionCount: sameStateNet > 0 ? sameStateNet : allLocationsTotal,
      topStates,
      topCities: record.topCities.slice(0, 5)
    };
  }

  public static buildContactMetrics(
    metrics: CategoryVendorIndexRecord['contactMetrics'],
    totalDistinct: number
  ): ContactCompletenessMetrics {
    const denom = Math.max(1, totalDistinct);
    return {
      hasWebsiteCount: metrics.hasWebsiteCount,
      hasEmailCount: metrics.hasEmailCount,
      hasPhoneCount: metrics.hasPhoneCount,
      missingContactCount: metrics.missingContactCount,
      hasWebsiteRatioPct: Math.round((metrics.hasWebsiteCount / denom) * 1000) / 10,
      hasEmailRatioPct: Math.round((metrics.hasEmailCount / denom) * 1000) / 10
    };
  }

  public static calculateDistinctPool(
    opportunities: AlternateVendorDiscoveryOpportunity[],
    index: Record<string, CategoryVendorIndexRecord>,
    _prefState: string
  ): {
    deduplicatedAll: number;
    deduplicatedPref: number;
    cumulativeAll: number;
    cumulativePref: number;
    identifiedSuppliersCount: number;
    matchedSuppliersCount: number;
    excludedSuppliersCount: number;
  } {
    const distinctAll = new Set<string>();
    const identifiedSuppliers = new Set<string>();
    const matchedSuppliers = new Set<string>();
    const excludedSuppliers = new Set<string>();

    let cumulativeAll = 0;
    let cumulativePref = 0;

    for (const opp of opportunities) {
      cumulativeAll += opp.potentialVendorsAllLocations;
      cumulativePref += opp.potentialVendorsPreferredRegion;

      for (const s of opp.currentSuppliers || []) identifiedSuppliers.add(s);
      for (const s of opp.currentSuppliersMatchedInMaster || []) matchedSuppliers.add(s);
      for (const s of opp.excludedSupplierNames || []) excludedSuppliers.add(s);

      if (opp.matchType !== 'UNMATCHED' && index[opp.matchedVendorCategory]) {
        for (const norm of index[opp.matchedVendorCategory].companyNorms || []) {
          distinctAll.add(norm);
        }
      }
    }

    const ratio = cumulativeAll > 0 ? Math.min(1, cumulativePref / cumulativeAll) : 0;
    const deduplicatedPref = Math.round(distinctAll.size * ratio);

    return {
      deduplicatedAll: distinctAll.size,
      deduplicatedPref,
      cumulativeAll,
      cumulativePref,
      identifiedSuppliersCount: identifiedSuppliers.size,
      matchedSuppliersCount: matchedSuppliers.size,
      excludedSuppliersCount: excludedSuppliers.size
    };
  }
}
