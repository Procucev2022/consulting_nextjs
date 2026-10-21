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
  DEFAULT_PREFERRED_CITY
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
import type { StrategicInputTransaction } from '../types/strategicSourcing';
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
      vendorCategory: 'General Procurement',
      matchType: 'RELATED',
      rationale: 'No exact category mapping found; routed to general discovery.'
    };
  }

  private static upsertMaterialTransaction(
    map: Map<string, CustomerMaterialProcurementContext>,
    t: StrategicInputTransaction
  ): void {
    const code = (t.material_code || 'UNCODED').trim();
    const desc = (t.material_desc || 'Unknown Material').trim();
    const key = `${code}:::${desc}`;

    let item = map.get(key);
    if (!item) {
      item = {
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
      map.set(key, item);
    }

    item.totalSpendInr += t.total_spend_inr || 0;
    item.totalQuantity += t.quantity || 0;
    item.transactionCount += 1;

    const vendor = (t.vendor_name || '').trim();
    if (vendor && !item.currentSuppliers.includes(vendor)) {
      item.currentSuppliers.push(vendor);
    }
  }

  private static extractCustomerMaterials(
    txns: StrategicInputTransaction[]
  ): CustomerMaterialProcurementContext[] {
    const map = new Map<string, CustomerMaterialProcurementContext>();
    for (const t of txns) {
      this.upsertMaterialTransaction(map, t);
    }

    for (const item of map.values()) {
      item.currentSupplierCount = item.currentSuppliers.length;
      item.singleSourceDependency = item.currentSupplierCount === 1;
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpendInr - a.totalSpendInr);
  }

  private static buildOpportunity(
    mat: CustomerMaterialProcurementContext,
    index: Record<string, CategoryVendorIndexRecord>,
    prefState: string,
    prefCity: string,
    indexCounter: number
  ): AlternateVendorDiscoveryOpportunity {
    const mapping = this.mapCategory(mat.materialDescription, mat.spendCategory);
    const catRecord = index[mapping.vendorCategory] || {
      categoryName: mapping.vendorCategory,
      distinctVendorCount: 0,
      stateCounts: {},
      topCities: [],
      contactMetrics: { hasWebsiteCount: 0, hasEmailCount: 0, hasPhoneCount: 0, missingContactCount: 0 },
      companyNorms: []
    };

    const { excludedCount, excludedNames } = Module2AlternateSourcingHelpers.matchAndExcludeSuppliers(
      mat.currentSuppliers,
      catRecord.companyNorms
    );

    const geo = Module2AlternateSourcingHelpers.buildGeographicBreakdown(
      catRecord,
      prefState,
      prefCity,
      excludedCount
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
      opportunityId: `OPP-ALT-${String(indexCounter).padStart(3, '0')}`,
      materialCode: mat.materialCode,
      materialDescription: mat.materialDescription,
      spendCategory: mat.spendCategory,
      subCategory: mapping.vendorCategory,
      specification: null,
      customerPlant: mat.customerPlant,
      customerPreferredState: prefState,
      customerPreferredCity: prefCity,
      relevantSpendInr: mat.totalSpendInr,
      relevantSpendCr: Math.round((mat.totalSpendInr / 1e7) * 100) / 100,
      currentSupplierCount: mat.currentSupplierCount,
      currentSuppliers: mat.currentSuppliers,
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
      excludedCurrentSuppliersCount: excludedCount,
      excludedSupplierNames: excludedNames,
      geographicBreakdown: geo,
      contactCompleteness: contact,
      disclosures: [
        ALTERNATE_SOURCING_DISCLOSURES.DISCOVERY_ONLY,
        ALTERNATE_SOURCING_DISCLOSURES.NO_SAVINGS_CALCULATION,
        ALTERNATE_SOURCING_DISCLOSURES.GEOGRAPHIC_LIMITATION
      ]
    };
  }

  public static calculateAlternateSourcing(
    assessmentId = 'AIC-2026-0001',
    options?: AlternateSourcingQueryOptions
  ): AlternateSourcingResult {
    const prefState = (options?.preferredState || DEFAULT_PREFERRED_STATE).toUpperCase().trim();
    const prefCity = (options?.preferredCity || DEFAULT_PREFERRED_CITY).toUpperCase().trim();

    const txns = Module2CanonicalService.getCanonicalTransactions(assessmentId);
    const materials = this.extractCustomerMaterials(txns);
    const index = this.loadIndex();

    const opportunities: AlternateVendorDiscoveryOpportunity[] = [];
    let counter = 1;

    for (const mat of materials) {
      if (options?.materialCode && mat.materialCode !== options.materialCode) continue;
      if (options?.spendCategory && mat.spendCategory !== options.spendCategory) continue;

      const opp = this.buildOpportunity(mat, index, prefState, prefCity, counter++);
      if (options?.matchType && opp.matchType !== options.matchType) continue;

      opportunities.push(opp);
      if (opportunities.length >= 25) break;
    }

    const totalPotentialAll = opportunities.reduce((acc, o) => acc + o.potentialVendorsAllLocations, 0);
    const totalPotentialPref = opportunities.reduce((acc, o) => acc + o.potentialVendorsPreferredRegion, 0);
    const totalExcluded = opportunities.reduce((acc, o) => acc + o.excludedCurrentSuppliersCount, 0);
    const singleSourceCount = opportunities.filter((o) => o.currentSupplierCount === 1).length;

    const summary: AlternateSourcingSummary = {
      totalEligibleMaterials: materials.length,
      singleSourceMaterialsCount: singleSourceCount,
      totalPotentialVendorsAllLocations: totalPotentialAll,
      totalPotentialVendorsPreferredRegion: totalPotentialPref,
      totalCurrentSuppliersExcluded: totalExcluded,
      overallDistinctVendorPoolEstimate: 614864,
      potentialFinancialSavingsInr: 0,
      potentialFinancialSavingsCr: 0,
      isDiscoveryOnly: true
    };

    return {
      assessmentId,
      summary,
      opportunities,
      availableStates: ['MAHARASHTRA', 'GUJARAT', 'TAMIL NADU', 'KARNATAKA', 'DELHI', 'HARYANA', 'RAJASTHAN'],
      availableCities: ['MUMBAI', 'PUNE', 'AHMEDABAD', 'CHENNAI', 'BENGALURU', 'DELHI', 'HYDERABAD'],
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
