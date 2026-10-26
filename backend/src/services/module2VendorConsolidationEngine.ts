/**
 * Module 2 — Lever 3: Vendor Base Consolidation Engine
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10, line <= 120
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import { resolveAssessmentCustomerName } from '../utils/assessmentContextResolver';
import {
  Module2MaterialMappingRegister,
  getStrategicTransactionMaterialId
} from './module2MaterialMappingRegister';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  PriceDispersionMetrics,
  CategorySupplierStructureItem
} from '../types/module2StrategicSourcing';
import type { MaterialMappingEntry } from '../types/module2MaterialMapping';
import type {
  VendorConsolidationResult,
  CategoryConsolidationProfile,
  SameMaterialOpportunity,
  ComparableMaterialOpportunity,
  CrossPlantOpportunity,
  VendorConsolidationQueryOptions,
  VendorConsolidationBenefitEvaluation
} from '../types/module2VendorConsolidation';
import {
  VENDOR_CONSOLIDATION_CONFIG,
  VENDOR_CONSOLIDATION_DISCLOSURES,
  METHODOLOGY_DISCLOSURES
} from '../constants/module2VendorConsolidation';
import {
  calculateSupplierProfiles,
  evaluateSameMaterialOpportunities,
  evaluateComparableMaterialOpportunities,
  evaluateCrossPlantOpportunities,
  buildVendorConsolidationDataQualityExclusions
} from './module2VendorConsolidationHelpers';
import {
  determineCategoryClassification,
  evaluateCategoryStatus
} from './module2VendorConsolidationCategoryHelper';
import {
  Module2VendorConsolidationStrategyHelper
} from './module2VendorConsolidationStrategyHelper';

export type { VendorConsolidationBenefitEvaluation };

interface CategoryBuildOutput {
  profile: CategoryConsolidationProfile;
  sameMatOpps: SameMaterialOpportunity[];
  compMatOpps: ComparableMaterialOpportunity[];
  crossPlantOpps: CrossPlantOpportunity[];
}

export class Module2VendorConsolidationEngine {
  public static evaluate(
    isRecurring: boolean,
    suppliers: CategorySupplierStructureItem[],
    addressableQuantity: number,
    dispersion: PriceDispersionMetrics | null,
    activeMonthsCount: number,
    customerCostPerPoInr: number | null = null
  ): VendorConsolidationBenefitEvaluation {
    return Module2VendorConsolidationStrategyHelper.evaluate(
      isRecurring,
      suppliers,
      addressableQuantity,
      dispersion,
      activeMonthsCount,
      customerCostPerPoInr
    );
  }

  public static async calculate(
    assessmentId: string,
    options?: VendorConsolidationQueryOptions
  ): Promise<VendorConsolidationResult> {
    logger.info('Evaluating Lever 3 Vendor Base Consolidation', { assessmentId, options });

    const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const transactions: StrategicInputTransaction[] =
      canonical?.transactions ??
      (canonical as unknown as { spendProfile?: { transactions?: StrategicInputTransaction[] } })?.spendProfile
        ?.transactions ??
      [];

    const { register, coverage, exceptions, materialCodeToMapping } =
      Module2MaterialMappingRegister.classifyMaterials(transactions, assessmentId);

    const unspscGroupMap = this.groupTransactionsByUnspsc(transactions, materialCodeToMapping);
    const categories: CategoryConsolidationProfile[] = [];
    const allSameMatOpps: SameMaterialOpportunity[] = [];
    const allCompMatOpps: ComparableMaterialOpportunity[] = [];
    const allCrossPlantOpps: CrossPlantOpportunity[] = [];
    const addressableTxIds = new Set<string>();

    for (const [, group] of unspscGroupMap.entries()) {
      const out = this.buildCategoryProfile(
        group.title,
        group.txs,
        addressableTxIds,
        group.code,
        materialCodeToMapping
      );
      categories.push(out.profile);
      allSameMatOpps.push(...out.sameMatOpps);
      allCompMatOpps.push(...out.compMatOpps);
      allCrossPlantOpps.push(...out.crossPlantOpps);
    }

    const sourceGroupCategories = this.buildSourceGroupCategories(transactions, materialCodeToMapping);
    const filtered = this.filterCategories(categories, options);
    const addressableTxs = transactions.filter(t => t.id && addressableTxIds.has(t.id));
    const addrSpendInr = Math.round(addressableTxs.reduce((sum, t) => sum + (t.total_spend_inr ?? 0), 0) * 100) / 100;
    const totalSpendInr = Math.round(transactions.reduce((sum, t) => sum + (t.total_spend_inr ?? 0), 0) * 100) / 100;

    const allSuppliers = new Set(transactions.map(t => (t.vendor_code ?? t.vendor_name ?? '').trim()).filter(Boolean));
    const allMaterials = new Set(transactions.map(t => getStrategicTransactionMaterialId(t)));
    const allPlants = new Set(transactions.map(t => (t.plant ?? '').trim()).filter(Boolean));
    const categoryConsolidationCount = categories.filter(
      c => c.categoryConsolidationCandidateStatus === 'IDENTIFIED'
    ).length;

    return {
      assessmentId,
      customerName: resolveAssessmentCustomerName(assessmentId),
      reportDate: new Date().toISOString(),
      leverId: VENDOR_CONSOLIDATION_CONFIG.LEVER_ID,
      leverCode: VENDOR_CONSOLIDATION_CONFIG.LEVER_CODE,
      leverName: VENDOR_CONSOLIDATION_CONFIG.LEVER_NAME,
      totalAssessmentSpendInr: totalSpendInr,
      totalAssessmentSpendCr: Math.round((totalSpendInr / 10000000) * 10000) / 10000,
      sameMaterialMultiSourcingSpendInr: addrSpendInr,
      sameMaterialMultiSourcingSpendCr: Math.round((addrSpendInr / 10000000) * 10000) / 10000,
      addressableSpendInr: addrSpendInr,
      addressableSpendCr: Math.round((addrSpendInr / 10000000) * 10000) / 10000,
      categoryConsolidationOpportunitiesCount: categoryConsolidationCount,
      categoryConsolidationCandidateSpendCr: null,
      categoryConsolidationCandidateSpendStatus: 'NOT_YET_QUANTIFIABLE',
      categoryConsolidationDisclosure: VENDOR_CONSOLIDATION_DISCLOSURES.CATEGORY_CONSOLIDATION_CANDIDATE_DISCLOSURE,
      estimatedSavingsInr: null,
      estimatedSavingsCr: null,
      actualSavingsCr: 0.00,
      validatedSavingsCr: 0.00,
      savingsStatus: 'NOT_YET_QUANTIFIABLE',
      savingsDisclosure: VENDOR_CONSOLIDATION_DISCLOSURES.SAVINGS_NOT_QUANTIFIABLE,
      transactionAuditTrailNotice: VENDOR_CONSOLIDATION_DISCLOSURES.TRANSACTION_AUDIT_TRAIL_NOTICE,
      categoriesAnalysedCount: filtered.length,
      distinctSuppliersCount: allSuppliers.size,
      distinctMaterialsCount: allMaterials.size,
      distinctPlantsCount: allPlants.size,
      multiSourcedMaterialsCount: allSameMatOpps.length,
      categories: filtered.sort((a, b) => b.totalSpendInr - a.totalSpendInr),
      sourceGroupCategories: sourceGroupCategories.sort((a, b) => b.totalSpendInr - a.totalSpendInr),
      sameMaterialOpportunities: allSameMatOpps.sort((a, b) => b.totalSpendInr - a.totalSpendInr),
      comparableMaterialOpportunities: allCompMatOpps.sort((a, b) => b.addressableSpendInr - a.addressableSpendInr),
      crossPlantOpportunities: allCrossPlantOpps.sort((a, b) => b.totalSpendInr - a.totalSpendInr),
      coverageSummary: coverage,
      mappingRegister: register,
      mappingExceptions: exceptions,
      allTransactionsCount: transactions.length,
      allTransactionsSpendInr: totalSpendInr,
      transactionsSample: transactions.slice(0, 100),
      methodologyDisclosures: METHODOLOGY_DISCLOSURES,
      dataQualityExclusions: buildVendorConsolidationDataQualityExclusions(transactions)
    };
  }

  private static groupTransactionsByUnspsc(
    txs: StrategicInputTransaction[],
    mappingMap: Map<string, MaterialMappingEntry>
  ): Map<string, { txs: StrategicInputTransaction[]; code: string; title: string }> {
    const map = new Map<string, { txs: StrategicInputTransaction[]; code: string; title: string }>();
    for (const t of txs) {
      const matId = getStrategicTransactionMaterialId(t);
      const mapping = mappingMap.get(matId);
      const isMapped = mapping && mapping.reviewStatus !== 'AWAITING_REVIEW';
      const code = isMapped ? mapping.assignedUnspscCode : '00000000';
      const title = isMapped ? mapping.assignedUnspscTitle : 'Unclassified Materials (Review Queued)';
      const key = `${title} [${code}]`;
      let group = map.get(key);
      if (!group) {
        group = { txs: [], code, title };
        map.set(key, group);
      }
      group.txs.push(t);
    }
    return map;
  }

  private static buildSourceGroupCategories(
    txs: StrategicInputTransaction[],
    mappingMap: Map<string, MaterialMappingEntry>
  ): CategoryConsolidationProfile[] {
    const map = new Map<string, StrategicInputTransaction[]>();
    for (const t of txs) {
      const cat = (t.spend_category ?? 'General').trim();
      let list = map.get(cat);
      if (!list) {
        list = [];
        map.set(cat, list);
      }
      list.push(t);
    }
    const result: CategoryConsolidationProfile[] = [];
    const dummySet = new Set<string>();
    for (const [catName, catTxs] of map.entries()) {
      const out = this.buildCategoryProfile(catName, catTxs, dummySet, undefined, mappingMap);
      result.push(out.profile);
    }
    return result;
  }

  private static buildCategoryProfile(
    catName: string,
    catTxs: StrategicInputTransaction[],
    addressableTxIds: Set<string>,
    forcedUnspscCode?: string,
    materialMappingMap?: Map<string, MaterialMappingEntry>
  ): CategoryBuildOutput {
    const totalSpendInr = Math.round(catTxs.reduce((sum, t) => sum + (t.total_spend_inr ?? 0), 0) * 100) / 100;
    const { unspscCode, unspscCategory, classificationType, classificationLabel } =
      determineCategoryClassification(catName, catTxs, forcedUnspscCode, materialMappingMap);

    const { suppliers, top1SharePct, top3SharePct, hhiIndex, fragmentation } =
      calculateSupplierProfiles(catTxs, totalSpendInr);

    const sameMatOpps = evaluateSameMaterialOpportunities(
      catTxs,
      catName,
      unspscCode,
      unspscCategory,
      materialMappingMap
    );
    const compMatOpps = evaluateComparableMaterialOpportunities(catTxs, catName);
    const crossPlantOpps = evaluateCrossPlantOpportunities(catTxs, catName);

    for (const smo of sameMatOpps) {
      if (smo.transactions) {
        for (const tx of smo.transactions) {
          if (tx.id) addressableTxIds.add(tx.id);
        }
      }
    }

    const sameMatInr = sameMatOpps.reduce((sum, o) => sum + o.addressableSpendInr, 0);
    const sameMatCr = Math.round((sameMatInr / 10000000) * 10000) / 10000;
    const distinctPlants = new Set(catTxs.map(t => (t.plant ?? '').trim()).filter(Boolean));
    const distinctMats = new Set(catTxs.map(t => getStrategicTransactionMaterialId(t)));
    const { status, reason, candidateStatus, candidateReason } = evaluateCategoryStatus(
      sameMatOpps.length, suppliers.length, compMatOpps.length, distinctMats.size
    );
    const missingVendors = catTxs.filter(t => !t.vendor_code && !t.vendor_name).length;
    const warnings = missingVendors > 0 ? [`${missingVendors} lines missing supplier identification`] : [];
    const sourceCategories = Array.from(new Set(catTxs.map(t => (t.spend_category ?? '').trim()).filter(Boolean)));

    const profile: CategoryConsolidationProfile = {
      unspscCode, unspscCategory, spendCategory: catName, sourceCategories,
      classificationType, classificationLabel,
      totalSpendInr, totalSpendCr: Math.round((totalSpendInr / 10000000) * 10000) / 10000,
      sameMaterialMultiSourcingSpendInr: sameMatInr, sameMaterialMultiSourcingSpendCr: sameMatCr,
      addressableSpendInr: sameMatInr, addressableSpendCr: sameMatCr,
      categoryConsolidationCandidateSpendInr: null, categoryConsolidationCandidateSpendCr: null,
      categoryConsolidationCandidateStatus: candidateStatus, categoryConsolidationCandidateReason: candidateReason,
      distinctSuppliersCount: suppliers.length, distinctMaterialsCount: distinctMats.size,
      distinctPlantsCount: distinctPlants.size, plantsServed: Array.from(distinctPlants),
      suppliers, top1SharePct, top3SharePct, hhiIndex, fragmentationLevel: fragmentation,
      multiSourcedMaterialsCount: sameMatOpps.length, sameMaterialOpportunitiesCount: sameMatOpps.length,
      comparableMaterialOpportunitiesCount: compMatOpps.length, crossPlantOpportunitiesCount: crossPlantOpps.length,
      categoryOpportunityStatus: status, categoryOpportunityReason: reason,
      estimatedSavingsInr: null, estimatedSavingsCr: null, actualSavingsCr: 0.00, validatedSavingsCr: 0.00,
      savingsStatus: 'NOT_YET_QUANTIFIABLE', dataQualityWarnings: warnings
    };

    return { profile, sameMatOpps, compMatOpps, crossPlantOpps };
  }

  private static filterCategories(
    categories: CategoryConsolidationProfile[],
    options?: VendorConsolidationQueryOptions
  ): CategoryConsolidationProfile[] {
    if (!options) return categories;
    return categories.filter(c => {
      const q = options.category?.toLowerCase();
      if (q) {
        const m1 = c.spendCategory.toLowerCase().includes(q);
        const m2 = c.unspscCategory.toLowerCase().includes(q);
        const m3 = c.sourceCategories?.some(sc => sc.toLowerCase().includes(q));
        if (!m1 && !m2 && !m3) return false;
      }
      if (options.status && c.categoryOpportunityStatus !== options.status) return false;
      if (options.supplierCode && !c.suppliers.some(s => s.vendorCode === options.supplierCode)) return false;
      return true;
    });
  }
}
