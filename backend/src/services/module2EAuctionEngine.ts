/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Candidate Identification Engine
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  EAuctionResult,
  EAuctionCategoryCandidate,
  EAuctionMaterialCandidate,
  EAuctionFySummary,
  EAuctionQueryOptions,
  EAuctionSavingsRange
} from '../types/module2EAuction';
import {
  EAUCTION_CONFIG,
  AUCTION_SUITABILITY_LABELS
} from '../constants/module2EAuction';
import { parseIndianFinancialYear } from './module2DirectPriceImprovementHelpers';
import {
  buildMaterialCandidate,
  rollUpCategoryCandidate
} from './module2EAuctionHelpers';
import { Module2EAuctionAssumptionStore } from './module2EAuctionAssumptionStore';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';
import { resolveAssessmentCustomerName } from '../utils/assessmentContextResolver';

interface ItemTxGroup {
  financialYear: string;
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  uom: string;
  txs: StrategicInputTransaction[];
}

function groupTransactionsByFyAndItem(
  transactions: StrategicInputTransaction[]
): Map<string, ItemTxGroup> {
  const map = new Map<string, ItemTxGroup>();

  for (const t of transactions) {
    const fy = parseIndianFinancialYear(t.po_date);
    const mat = (t.material_code || 'UNKNOWN_MAT').trim();
    const uom = (t.uom || 'UNKNOWN').trim().toUpperCase();
    const key = `${fy}::${mat}::${uom}`;

    let g = map.get(key);
    if (!g) {
      g = {
        financialYear: fy,
        materialCode: mat,
        materialDesc: (t.material_desc || '').trim(),
        spendCategory: resolveHumanReadableCategory(t.spend_category, mat),
        uom,
        txs: []
      };
      map.set(key, g);
    }
    g.txs.push(t);
  }

  return map;
}

function filterMaterials(
  materials: EAuctionMaterialCandidate[],
  selectedFy: string,
  options?: EAuctionQueryOptions
): EAuctionMaterialCandidate[] {
  return materials.filter((m) => {
    if (selectedFy !== EAUCTION_CONFIG.ALL_FINANCIAL_YEARS && m.financialYear !== selectedFy) {
      return false;
    }
    if (options?.category && !m.spendCategory.toLowerCase().includes(options.category.toLowerCase())) {
      return false;
    }
    if (options?.materialCode && !m.materialCode.toLowerCase().includes(options.materialCode.toLowerCase())) {
      return false;
    }
    if (options?.suitability && m.suitability !== options.suitability) {
      return false;
    }
    return true;
  });
}

function buildFySummaries(
  allMaterials: EAuctionMaterialCandidate[],
  availableFys: string[]
): EAuctionFySummary[] {
  return availableFys.map((fy) => {
    const fyMats = allMaterials.filter((m) => m.financialYear === fy);
    const totalSpend = Math.round(fyMats.reduce((sum, m) => sum + m.totalSpendInr, 0) * 100) / 100;
    const totalQty = Math.round(fyMats.reduce((sum, m) => sum + m.totalQuantity, 0) * 1000) / 1000;
    const pos = fyMats.reduce((sum, m) => sum + m.poCount, 0);
    const candidateMats = fyMats.filter((m) => m.suitability === AUCTION_SUITABILITY_LABELS.CANDIDATE);
    const candidateMatsCount = candidateMats.length;
    const addressableSpendInr = candidateMats.reduce((sum, m) => sum + m.addressableSpendInr, 0);

    const minSavingsInr = candidateMats.reduce((sum, m) => sum + (m.savingsRange.minEstimatedSavingsInr || 0), 0);
    const expSavingsInr = candidateMats.reduce((sum, m) => sum + (m.savingsRange.expectedEstimatedSavingsInr || 0), 0);
    const maxSavingsInr = candidateMats.reduce((sum, m) => sum + (m.savingsRange.maxEstimatedSavingsInr || 0), 0);

    const catMap = new Map<string, EAuctionMaterialCandidate[]>();
    for (const m of fyMats) {
      let list = catMap.get(m.spendCategory);
      if (!list) {
        list = [];
        catMap.set(m.spendCategory, list);
      }
      list.push(m);
    }
    let candCats = 0;
    for (const list of catMap.values()) {
      if (list.some((m) => m.suitability === AUCTION_SUITABILITY_LABELS.CANDIDATE)) {
        candCats++;
      }
    }

    return {
      financialYear: fy,
      totalSpendInr: totalSpend,
      totalSpendCr: Number((totalSpend / 10000000).toFixed(4)),
      addressableSpendInr,
      addressableSpendCr: Number((addressableSpendInr / 10000000).toFixed(4)),
      totalQuantity: totalQty,
      poCount: pos,
      candidateMaterialsCount: candidateMatsCount,
      candidateCategoriesCount: candCats,
      minEstimatedSavingsCr: Number((minSavingsInr / 10000000).toFixed(4)),
      expectedEstimatedSavingsCr: Number((expSavingsInr / 10000000).toFixed(4)),
      maxEstimatedSavingsCr: Number((maxSavingsInr / 10000000).toFixed(4))
    };
  });
}

function buildSummarySavingsRange(
  candidateCategories: EAuctionCategoryCandidate[]
): { totalAddressableInr: number; totalAddressableCr: number; range: EAuctionSavingsRange } {
  const totalAddressableInr = candidateCategories.reduce((sum, c) => sum + c.addressableSpendInr, 0);
  const totalAddressableCr = Number((totalAddressableInr / 10000000).toFixed(4));

  const totalMinSavingsInr = candidateCategories.reduce(
    (sum, c) => sum + (c.savingsRange.minEstimatedSavingsInr || 0),
    0
  );
  const totalExpSavingsInr = candidateCategories.reduce(
    (sum, c) => sum + (c.savingsRange.expectedEstimatedSavingsInr || 0),
    0
  );
  const totalMaxSavingsInr = candidateCategories.reduce(
    (sum, c) => sum + (c.savingsRange.maxEstimatedSavingsInr || 0),
    0
  );

  const range: EAuctionSavingsRange = {
    savingsRangeStatus: candidateCategories.length > 0 ? 'ESTIMATED' : 'NOT_YET_QUANTIFIABLE',
    addressableSpendInr: totalAddressableInr,
    addressableSpendCr: totalAddressableCr,
    minEstimatedSavingsInr: totalMinSavingsInr,
    minEstimatedSavingsCr: Number((totalMinSavingsInr / 10000000).toFixed(4)),
    expectedEstimatedSavingsInr: totalExpSavingsInr,
    expectedEstimatedSavingsCr: Number((totalExpSavingsInr / 10000000).toFixed(4)),
    maxEstimatedSavingsInr: totalMaxSavingsInr,
    maxEstimatedSavingsCr: Number((totalMaxSavingsInr / 10000000).toFixed(4)),
    minSavingsRate: totalAddressableInr > 0 ? totalMinSavingsInr / totalAddressableInr : 0,
    expectedSavingsRate: totalAddressableInr > 0 ? totalExpSavingsInr / totalAddressableInr : 0,
    maxSavingsRate: totalAddressableInr > 0 ? totalMaxSavingsInr / totalAddressableInr : 0,
    rateSource: 'Portfolio Proposed Planning Assumptions',
    referencePeriod: '2023-2025 Dynamic Bidding Benchmarks',
    approvalStatus: 'Proposed Planning Assumption — Approval Required',
    confidence: 'MEDIUM',
    isPlanningAssumptionOnly: true,
    notes:
      'Total indicative dynamic bidding savings range across candidate categories based on proposed planning ' +
      'assumptions. Provisional and editable by authorised user.'
  };

  return { totalAddressableInr, totalAddressableCr, range };
}

export class Module2EAuctionEngine {
  public static async calculate(
    assessmentId: string,
    options?: EAuctionQueryOptions
  ): Promise<EAuctionResult> {
    const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const groupsMap = groupTransactionsByFyAndItem(canonical.transactions);

    const allMaterials: EAuctionMaterialCandidate[] = [];
    const fySet = new Set<string>();

    const effectiveAssumptions =
      options?.configuredAssumptions || Module2EAuctionAssumptionStore.getAssumptions(assessmentId);

    for (const g of groupsMap.values()) {
      fySet.add(g.financialYear);
      const mat = buildMaterialCandidate({
        ...g,
        configuredAssumptions: effectiveAssumptions
      });
      allMaterials.push(mat);
    }

    const availableFys = Array.from(fySet).sort();
    const selectedFy = options?.financialYear || EAUCTION_CONFIG.ALL_FINANCIAL_YEARS;
    const filteredMaterials = filterMaterials(allMaterials, selectedFy, options);

    const categoryMap = new Map<string, EAuctionMaterialCandidate[]>();
    for (const m of filteredMaterials) {
      let list = categoryMap.get(m.spendCategory);
      if (!list) {
        list = [];
        categoryMap.set(m.spendCategory, list);
      }
      list.push(m);
    }

    const categories: EAuctionCategoryCandidate[] = [];
    for (const [catName, mats] of categoryMap.entries()) {
      const cat = rollUpCategoryCandidate(catName, mats);
      categories.push(cat);
    }
    categories.sort((a, b) => b.totalSpendInr - a.totalSpendInr);

    const totalSpendReviewedInr = Math.round(categories.reduce((s, c) => s + c.totalSpendInr, 0) * 100) / 100;
    const candidateCategories = categories.filter(
      (c) => c.auctionSuitability === AUCTION_SUITABILITY_LABELS.CANDIDATE
    );
    const candidateCategoriesCount = candidateCategories.length;
    const candidateMaterialsCount = filteredMaterials.filter(
      (m) => m.suitability === AUCTION_SUITABILITY_LABELS.CANDIDATE
    ).length;
    const recordsRequiringReviewCount = categories.filter(
      (c) =>
        c.auctionSuitability === AUCTION_SUITABILITY_LABELS.FURTHER_DATA ||
        c.auctionSuitability === AUCTION_SUITABILITY_LABELS.NOT_ASSESSED
    ).length;

    const { totalAddressableInr, totalAddressableCr, range: summarySavingsRange } =
      buildSummarySavingsRange(candidateCategories);

    logger.info('Module2EAuctionEngine candidate identification completed', {
      assessmentId,
      selectedFy,
      categoriesCount: categories.length,
      candidateCategoriesCount,
      candidateMaterialsCount,
      totalAddressableCr
    });

    return {
      assessmentId,
      customerName: resolveAssessmentCustomerName(assessmentId),
      totalSpendReviewedInr,
      totalSpendReviewedCr: Number((totalSpendReviewedInr / 10000000).toFixed(4)),
      totalAddressableSpendInr: totalAddressableInr,
      totalAddressableSpendCr: totalAddressableCr,
      categoriesReviewedCount: categories.length,
      candidateCategoriesCount,
      candidateMaterialsCount,
      recordsRequiringDataReviewCount: recordsRequiringReviewCount,
      commerciallyValidatedSavingsInr: 0,
      commerciallyValidatedSavingsCr: 0,
      availableFinancialYears: [EAUCTION_CONFIG.ALL_FINANCIAL_YEARS, ...availableFys],
      selectedFinancialYear: selectedFy,
      certificationNotice: EAUCTION_CONFIG.CERTIFICATION_NOTICE,
      importantLimitations: [...EAUCTION_CONFIG.IMPORTANT_LIMITATIONS],
      fySummaries: buildFySummaries(allMaterials, availableFys),
      summarySavingsRange,
      planningAssumptions: effectiveAssumptions,
      categories
    };
  }
}
