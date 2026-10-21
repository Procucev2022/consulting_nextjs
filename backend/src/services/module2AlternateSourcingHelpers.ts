/**
 * Module 2 — Lever 10: Alternate Sourcing Helpers
 * Geographic breakdown, contact completeness metrics, and current supplier exclusion helpers
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import type {
  CategoryVendorIndexRecord,
  GeographicVendorBreakdown,
  ContactCompletenessMetrics,
  CustomerMaterialProcurementContext,
  AlternateVendorDiscoveryOpportunity
} from '../types/module2AlternateSourcing';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import { ALTERNATE_SOURCING_DISCLOSURES } from '../constants/module2AlternateSourcing';

export class Module2AlternateSourcingHelpers {
  private static initCustomerMaterial(
    t: StrategicInputTransaction,
    code: string,
    desc: string
  ): CustomerMaterialProcurementContext {
    return {
      materialCode: code,
      materialDescription: desc,
      spendCategory: (t.spend_category || 'General').trim(),
      customerPlant: (t.plant || 'Main Plant').trim(),
      totalSpendInr: 0,
      totalQuantity: 0,
      uom: t.uom || 'units',
      transactionCount: 0,
      currentSupplierCount: 0,
      currentSuppliers: [],
      singleSourceDependency: false
    };
  }

  private static accumulateTxn(
    item: CustomerMaterialProcurementContext,
    t: StrategicInputTransaction
  ): void {
    item.totalSpendInr += t.total_spend_inr || 0;
    item.totalQuantity += t.quantity || 0;
    item.transactionCount += 1;
    const vendor = (t.vendor_name || '').trim();
    if (vendor && !item.currentSuppliers.includes(vendor)) {
      item.currentSuppliers.push(vendor);
    }
  }

  public static extractCustomerMaterials(
    txns: StrategicInputTransaction[]
  ): CustomerMaterialProcurementContext[] {
    const map = new Map<string, CustomerMaterialProcurementContext>();
    for (const t of txns) {
      const code = (t.material_code || 'UNCODED').trim();
      const desc = (t.material_desc || 'Unknown Material').trim();
      const key = `${code}:::${desc}`;

      let item = map.get(key);
      if (!item) {
        item = this.initCustomerMaterial(t, code, desc);
        map.set(key, item);
      }
      this.accumulateTxn(item, t);
    }

    for (const item of map.values()) {
      item.currentSupplierCount = item.currentSuppliers.length;
      item.singleSourceDependency = item.currentSupplierCount === 1;
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpendInr - a.totalSpendInr);
  }

  public static buildUnmatchedOpportunity(
    mat: CustomerMaterialProcurementContext,
    prefState: string,
    prefCity: string,
    oppId: string,
    rationale: string
  ): AlternateVendorDiscoveryOpportunity {
    const limitNotice = mat.currentSuppliers.length > 0
      ? `Current supplier (${mat.currentSuppliers.join(', ')}) identified in assessment, but no category match exists in vendor master.`
      : undefined;

    return {
      opportunityId: oppId,
      materialCode: mat.materialCode,
      materialDescription: mat.materialDescription,
      spendCategory: mat.spendCategory,
      subCategory: 'NO_VERIFIED_CATEGORY_MATCH',
      specification: null,
      customerPlant: mat.customerPlant,
      customerPreferredState: prefState,
      customerPreferredCity: prefCity,
      relevantSpendInr: mat.totalSpendInr,
      relevantSpendCr: Math.round((mat.totalSpendInr / 1e7) * 100) / 100,
      currentSupplierCount: mat.currentSupplierCount,
      currentSuppliers: mat.currentSuppliers,
      currentSuppliersIdentified: mat.currentSuppliers,
      currentSuppliersMatchedInMaster: [],
      exclusionLimitationNotice: limitNotice,
      matchedVendorCategory: 'NO_VERIFIED_CATEGORY_MATCH',
      matchType: 'UNMATCHED',
      matchTypeRationale: rationale,
      potentialVendorsAllLocations: 0,
      potentialVendorsPreferredRegion: 0,
      exactMatchesCount: 0,
      hierarchyMatchesCount: 0,
      synonymMatchesCount: 0,
      relatedMatchesCount: 0,
      qualifiedAlternativesCount: 'DATA_UNAVAILABLE',
      qualificationStatus: 'UNQUALIFIED',
      excludedCurrentSuppliersCount: 0,
      excludedSupplierNames: [],
      geographicBreakdown: {
        preferredCity: prefCity,
        sameCityCount: 0, sameStateCount: 0, otherStatesCount: 0,
        allLocationsCount: 0, preferredRegionCount: 0, topStates: [], topCities: []
      },
      contactCompleteness: {
        hasWebsiteCount: 0, hasEmailCount: 0, hasPhoneCount: 0,
        missingContactCount: 0, hasWebsiteRatioPct: 0, hasEmailRatioPct: 0
      },
      disclosures: [
        ALTERNATE_SOURCING_DISCLOSURES.DISCOVERY_ONLY,
        ALTERNATE_SOURCING_DISCLOSURES.NO_SAVINGS_CALCULATION,
        ALTERNATE_SOURCING_DISCLOSURES.GEOGRAPHIC_LIMITATION
      ]
    };
  }
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

  private static aggregateOpportunityVendors(
    opp: AlternateVendorDiscoveryOpportunity,
    index: Record<string, CategoryVendorIndexRecord>,
    distinctAll: Set<string>,
    identified: Set<string>,
    matched: Set<string>,
    excluded: Set<string>
  ): void {
    for (const s of opp.currentSuppliers || []) identified.add(s);
    for (const s of opp.currentSuppliersMatchedInMaster || []) matched.add(s);
    for (const s of opp.excludedSupplierNames || []) excluded.add(s);

    if (opp.matchType !== 'UNMATCHED' && index[opp.matchedVendorCategory]) {
      for (const norm of index[opp.matchedVendorCategory].companyNorms || []) {
        distinctAll.add(norm);
      }
    }
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
      this.aggregateOpportunityVendors(
        opp, index, distinctAll, identifiedSuppliers, matchedSuppliers, excludedSuppliers
      );
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
