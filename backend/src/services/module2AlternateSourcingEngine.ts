/**
 * Module 2 — Lever 10: Alternate Vendor Discovery Engine
 * Implements category matching, Option C geographic filtering, distinct counting, and current supplier exclusion
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import {
  ALTERNATE_SOURCING_DISCLOSURES,
  CATEGORY_TAXONOMY_RULES,
  RELATED_CATEGORY_MAPPINGS,
  DEFAULT_PREFERRED_STATE,
  DEFAULT_PREFERRED_CITY,
  STATE_TO_CITIES_MAP
} from '../constants/module2AlternateSourcing';
import type {
  AlternateVendorMatchType,
  CategoryVendorIndexRecord,
  CustomerMaterialProcurementContext,
  AlternateVendorDiscoveryOpportunity,
  AlternateSourcingSummary,
  AlternateSourcingResult,
  AlternateSourcingQueryOptions
} from '../types/module2AlternateSourcing';
import { Module2AlternateSourcingHelpers } from './module2AlternateSourcingHelpers';

export class Module2AlternateSourcingEngine {
  private static cachedIndex: Record<string, CategoryVendorIndexRecord> | null = null;

  public static loadIndex(): Record<string, CategoryVendorIndexRecord> {
    if (this.cachedIndex) return this.cachedIndex;

    const candidates = [
      path.resolve(process.cwd(), 'backend/data/alternate_vendors_index.json'),
      path.resolve(process.cwd(), 'data/alternate_vendors_index.json'),
      path.resolve(__dirname, '../../data/alternate_vendors_index.json')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf8');
          this.cachedIndex = JSON.parse(raw);
          logger.info('Loaded alternate vendors index', {
            filePath: p,
            categoriesCount: Object.keys(this.cachedIndex || {}).length
          });
          return this.cachedIndex || {};
        } catch (err) {
          logger.error('Failed to parse alternate vendors index JSON', { filePath: p, error: err });
        }
      }
    }

    logger.warn('Alternate vendors index file not found on disk; returning empty index');
    return {};
  }

  public static clearCache(): void {
    this.cachedIndex = null;
  }

  public static mapCategory(materialDesc: string, categoryCode?: string): {
    vendorCategory: string;
    matchType: AlternateVendorMatchType;
    rationale: string;
  } {
    const text = `${materialDesc} ${categoryCode || ''}`.trim();
    for (const rule of CATEGORY_TAXONOMY_RULES) {
      if (rule.pattern.test(text)) {
        return {
          vendorCategory: rule.vendorCategory,
          matchType: rule.matchType,
          rationale: rule.rationale
        };
      }
    }

    return {
      vendorCategory: 'NO_VERIFIED_CATEGORY_MATCH',
      matchType: 'UNMATCHED',
      rationale:
        'No verified technical category exists in vendor master; generic fallback prohibited to prevent distorted counts.'
    };
  }

  private static buildOpportunity(
    mat: CustomerMaterialProcurementContext,
    index: Record<string, CategoryVendorIndexRecord>,
    prefState: string,
    prefCity: string,
    indexCounter: number
  ): AlternateVendorDiscoveryOpportunity {
    const mapping = this.mapCategory(mat.materialDescription, mat.spendCategory);
    const oppId = `OPP-ALT-${String(indexCounter).padStart(3, '0')}`;
    const spendCr = Math.round((mat.totalSpendInr / 1e7) * 100) / 100;

    if (mapping.matchType === 'UNMATCHED') {
      return Module2AlternateSourcingHelpers.buildUnmatchedOpportunity(
        mat,
        prefState,
        prefCity,
        oppId,
        mapping.rationale
      );
    }

    const catRecord = index[mapping.vendorCategory] || {
      categoryName: mapping.vendorCategory,
      distinctVendorCount: 0,
      stateCounts: {},
      topCities: [],
      contactMetrics: { hasWebsiteCount: 0, hasEmailCount: 0, hasPhoneCount: 0, missingContactCount: 0 },
      companyNorms: []
    };

    const supplierCheck = Module2AlternateSourcingHelpers.matchAndExcludeSuppliers(
      mat.currentSuppliers,
      catRecord.companyNorms
    );

    const geo = Module2AlternateSourcingHelpers.buildGeographicBreakdown(
      catRecord,
      prefState,
      prefCity,
      supplierCheck.excludedCount
    );
    const contact = Module2AlternateSourcingHelpers.buildContactMetrics(
      catRecord.contactMetrics,
      catRecord.distinctVendorCount
    );

    const relatedCats = RELATED_CATEGORY_MAPPINGS[mapping.vendorCategory] || [];
    let relatedCount = 0;
    for (const rc of relatedCats) {
      if (index[rc]) relatedCount += index[rc].distinctVendorCount;
    }

    const exactCount = mapping.matchType === 'EXACT' ? catRecord.distinctVendorCount : 0;
    const hierarchyCount = mapping.matchType === 'HIERARCHY' ? catRecord.distinctVendorCount : 0;
    const synonymCount = mapping.matchType === 'SYNONYM' ? catRecord.distinctVendorCount : 0;

    return {
      opportunityId: oppId,
      materialCode: mat.materialCode,
      materialDescription: mat.materialDescription,
      spendCategory: mat.spendCategory,
      subCategory: mapping.vendorCategory,
      specification: null,
      customerPlant: mat.customerPlant,
      customerPreferredState: prefState,
      customerPreferredCity: prefCity,
      relevantSpendInr: mat.totalSpendInr,
      relevantSpendCr: spendCr,
      currentSupplierCount: mat.currentSupplierCount,
      currentSuppliers: mat.currentSuppliers,
      currentSuppliersIdentified: supplierCheck.identifiedSuppliers,
      currentSuppliersMatchedInMaster: supplierCheck.matchedSuppliers,
      exclusionLimitationNotice: supplierCheck.limitationNotice,
      matchedVendorCategory: mapping.vendorCategory,
      matchType: mapping.matchType,
      matchTypeRationale: mapping.rationale,
      potentialVendorsAllLocations: geo.allLocationsCount,
      potentialVendorsPreferredRegion: geo.preferredRegionCount,
      exactMatchesCount: exactCount,
      hierarchyMatchesCount: hierarchyCount,
      synonymMatchesCount: synonymCount,
      relatedMatchesCount: relatedCount,
      qualifiedAlternativesCount: 'DATA_UNAVAILABLE',
      qualificationStatus: 'UNQUALIFIED',
      excludedCurrentSuppliersCount: supplierCheck.excludedCount,
      excludedSupplierNames: supplierCheck.excludedNames,
      geographicBreakdown: geo,
      contactCompleteness: contact,
      disclosures: [
        ALTERNATE_SOURCING_DISCLOSURES.DISCOVERY_ONLY,
        ALTERNATE_SOURCING_DISCLOSURES.NO_SAVINGS_CALCULATION,
        ALTERNATE_SOURCING_DISCLOSURES.GEOGRAPHIC_LIMITATION
      ]
    };
  }

  private static resolveLocation(options?: AlternateSourcingQueryOptions): {
    prefState: string;
    prefCity: string;
    validCities: string[];
  } {
    const prefState = (options?.preferredState || DEFAULT_PREFERRED_STATE).toUpperCase().trim();
    const validCities = STATE_TO_CITIES_MAP[prefState] || ['ALL_CITIES'];
    let prefCity = (options?.preferredCity || DEFAULT_PREFERRED_CITY).toUpperCase().trim();
    if (!validCities.includes(prefCity) && prefCity !== 'ALL_CITIES') {
      prefCity = validCities[0] || 'ALL_CITIES';
    }
    return { prefState, prefCity, validCities };
  }

  private static isOpportunityAllowed(
    mat: CustomerMaterialProcurementContext,
    opp: AlternateVendorDiscoveryOpportunity,
    options?: AlternateSourcingQueryOptions
  ): boolean {
    if (options?.materialCode && mat.materialCode !== options.materialCode) return false;
    if (options?.spendCategory && mat.spendCategory !== options.spendCategory) return false;
    if (options?.matchType && opp.matchType !== options.matchType) return false;
    return true;
  }

  public static calculateAlternateSourcing(
    assessmentId = 'AIC-2026-0001',
    options?: AlternateSourcingQueryOptions
  ): AlternateSourcingResult {
    const { prefState, prefCity, validCities } = this.resolveLocation(options);
    const txns = Module2CanonicalService.getCanonicalTransactions(assessmentId);
    const materials = Module2AlternateSourcingHelpers.extractCustomerMaterials(txns);
    const index = this.loadIndex();

    const opportunities: AlternateVendorDiscoveryOpportunity[] = [];
    let counter = 1;

    for (const mat of materials) {
      const opp = this.buildOpportunity(mat, index, prefState, prefCity, counter++);
      if (!this.isOpportunityAllowed(mat, opp, options)) continue;

      opportunities.push(opp);
      if (opportunities.length >= 25) break;
    }

    const pool = Module2AlternateSourcingHelpers.calculateDistinctPool(opportunities, index, prefState);
    const singleSourceCount = opportunities.filter((o) => o.currentSupplierCount === 1).length;

    const summary: AlternateSourcingSummary = {
      totalEligibleMaterials: materials.length,
      singleSourceMaterialsCount: singleSourceCount,
      totalPotentialVendorsAllLocations: pool.deduplicatedAll,
      totalPotentialVendorsPreferredRegion: pool.deduplicatedPref,
      deduplicatedDistinctVendorsAllLocations: pool.deduplicatedAll,
      deduplicatedDistinctVendorsPreferredRegion: pool.deduplicatedPref,
      cumulativeOpportunityVendorMatches: pool.cumulativeAll,
      totalCurrentSuppliersIdentified: pool.identifiedSuppliersCount,
      totalCurrentSuppliersMatchedInMaster: pool.matchedSuppliersCount,
      totalCurrentSuppliersExcluded: pool.excludedSuppliersCount,
      overallDistinctVendorPoolEstimate: 614864,
      potentialFinancialSavingsInr: 0,
      potentialFinancialSavingsCr: 0,
      isDiscoveryOnly: true
    };

    return {
      assessmentId,
      summary,
      opportunities,
      availableStates: Object.keys(STATE_TO_CITIES_MAP),
      availableCities: validCities,
      stateToCitiesMap: STATE_TO_CITIES_MAP,
      disclosures: [
        ALTERNATE_SOURCING_DISCLOSURES.DISCOVERY_ONLY,
        ALTERNATE_SOURCING_DISCLOSURES.NO_SAVINGS_CALCULATION,
        ALTERNATE_SOURCING_DISCLOSURES.GEOGRAPHIC_LIMITATION,
        ALTERNATE_SOURCING_DISCLOSURES.CONTACT_PRIVACY,
        ALTERNATE_SOURCING_DISCLOSURES.DEDUPLICATION_POLICY
      ]
    };
  }
}
