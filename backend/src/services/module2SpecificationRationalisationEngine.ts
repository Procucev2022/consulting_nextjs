/**
 * Module 2 — Lever 8: Specification Rationalisation Engine (Phase 1)
 * Identification and Technical Review Engine
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import {
  SPECIFICATION_FINANCIAL_DISCLOSURES,
  SPECIFICATION_METHODOLOGY_DISCLOSURES,
  SPECIFICATION_REVIEW_STATUSES
} from '../constants/module2SpecificationRationalisation';
import type {
  SpecificationMaterialItem, SpecificationCandidateItem, SpecificationRationalisationSummary,
  SpecificationRationalisationResult, SpecificationRationalisationOptions,
  SpecificationRationalisationReviewStatus, TechnicalReviewRecord
} from '../types/module2SpecificationRationalisation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import { Module2SpecificationRationalisationMatcher } from './module2SpecificationRationalisationMatcher';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';
import { resolveAssessmentCustomerName } from '../utils/assessmentContextResolver';

export class Module2SpecificationRationalisationEngine {
  private static readonly resultCache = new Map<string, SpecificationRationalisationResult>();
  private static readonly txsCache = new Map<string, StrategicInputTransaction[]>();
  private static readonly pairCache = new Map<string, SpecificationCandidateItem[]>();

  public static clearResultCache(): void {
    this.resultCache.clear();
    this.txsCache.clear();
    this.pairCache.clear();
  }

  private static applyReviewOverrides(
    base: SpecificationCandidateItem[],
    reviews: Record<string, TechnicalReviewRecord | TechnicalReviewRecord[]>
  ): SpecificationCandidateItem[] {
    if (Object.keys(reviews).length === 0) return base;
    return base.map((c) => {
      const raw = reviews[c.candidateId];
      if (!raw) return c;
      const defStatus = c.reviewStatus as SpecificationRationalisationReviewStatus;
      const { history, finalStatus } = Module2SpecificationRationalisationMatcher.resolveReviewState(
        raw as TechnicalReviewRecord, defStatus
      );
      return {
        ...c, reviewStatus: finalStatus, reviewHistory: history,
        nextRequiredAction: Module2SpecificationRationalisationMatcher.resolveNextAction(finalStatus)
      };
    });
  }

  private static createMaterialItem(
    t: StrategicInputTransaction, code: string, desc: string
  ): SpecificationMaterialItem & { category: string } {
    return {
      code, description: desc,
      normalizedDescription: Module2SpecificationRationalisationMatcher.normalizeDescription(desc),
      plant: t.plant, department: t.department, totalSpendInr: t.total_spend_inr || 0,
      totalQuantity: t.quantity || 0, uom: t.uom || 'units', transactionCount: 1,
      suppliersCount: t.vendor_name ? 1 : 0, category: resolveHumanReadableCategory(t.spend_category, code)
    };
  }

  private static upsertMaterial(
    map: Map<string, SpecificationMaterialItem & { category: string }>,
    t: StrategicInputTransaction
  ): void {
    const code = (t.material_code || '').trim();
    const desc = (t.material_desc || '').trim();
    const key = `${code || 'NO_CODE'}:::${desc}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalSpendInr += t.total_spend_inr || 0;
      existing.totalQuantity += t.quantity || 0;
      existing.transactionCount += 1;
      if (t.vendor_name) existing.suppliersCount += 1;
    } else {
      map.set(key, this.createMaterialItem(t, code, desc));
    }
  }

  private static aggregateMaterials(
    transactions: StrategicInputTransaction[]
  ): Map<string, SpecificationMaterialItem & { category: string }> {
    const materialMap = new Map<string, SpecificationMaterialItem & { category: string }>();
    for (const t of transactions) this.upsertMaterial(materialMap, t);
    return materialMap;
  }

  private static evaluatePair(
    itemA: SpecificationMaterialItem, itemB: SpecificationMaterialItem,
    category: string, pairIndex: number, options?: SpecificationRationalisationOptions
  ): SpecificationCandidateItem | null {
    const simScore = Module2SpecificationRationalisationMatcher.computeTokenSimilarity(
      itemA.normalizedDescription, itemB.normalizedDescription
    );
    const hasSameCode = Boolean(itemA.code && itemB.code && itemA.code === itemB.code);
    const threshold = options?.similarityThreshold ?? 0.6;
    if (simScore < threshold && !hasSameCode) return null;

    const attrsA = Module2SpecificationRationalisationMatcher.extractTechnicalAttributes(itemA.description);
    const attrsB = Module2SpecificationRationalisationMatcher.extractTechnicalAttributes(itemB.description);
    const { comparisons, differences, missingFields } =
      Module2SpecificationRationalisationMatcher.compareAttributes(attrsA, attrsB);
    const { type, rationale, reviewStatus } =
      Module2SpecificationRationalisationMatcher.determineIdentificationType(itemA, itemB, differences);

    const candidateId = `SPEC-RAT-${category.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}-${pairIndex + 1}`;
    const { history, finalStatus } = Module2SpecificationRationalisationMatcher.resolveReviewState(
      options?.reviews?.[candidateId], reviewStatus
    );
    const expInr = Math.round((itemA.totalSpendInr + itemB.totalSpendInr) * 100) / 100;
    const expCr = Number((expInr / 10000000).toFixed(2));
    const totalQty = Math.round((itemA.totalQuantity + itemB.totalQuantity) * 100) / 100;

    return {
      candidateId, identificationType: type, identificationRationale: rationale,
      spendCategory: category, primaryItem: itemA, comparisonItem: itemB, similarityScore: simScore,
      technicalAttributes: comparisons, differencesIdentified: differences,
      missingAttributesDisclosed: missingFields, hasMissingTechnicalData: missingFields.length > 0,
      expenditureUnderReviewInr: expInr, expenditureUnderReviewCr: expCr, quantityUnderReview: totalQty,
      reviewStatus: finalStatus, reviewHistory: history,
      financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
      potentialRelatedLevers: ['LEVER_1', 'LEVER_3', 'LEVER_4', 'LEVER_6'],
      nextRequiredAction: Module2SpecificationRationalisationMatcher.resolveNextAction(finalStatus)
    };
  }

  private static findCandidatePairs(items: SpecificationMaterialItem[]): [number, number][] {
    const pairs = new Set<string>();
    const tokMap = new Map<string, number[]>();
    const codeMap = new Map<string, number[]>();
    items.forEach((item, i) => {
      if (item.code) {
        const cl = codeMap.get(item.code) || [];
        cl.push(i);
        codeMap.set(item.code, cl);
      }
      item.normalizedDescription.split(/\s+/).forEach((t) => {
        if (t.length >= 2) {
          const tl = tokMap.get(t) || [];
          tl.push(i);
          tokMap.set(t, tl);
        }
      });
    });
    const addPairs = (m: Map<string, number[]>): void => {
      for (const idxs of m.values()) {
        for (let a = 0; a < idxs.length; a++) {
          for (let b = a + 1; b < idxs.length; b++) pairs.add(`${idxs[a]}:${idxs[b]}`);
        }
      }
    };
    addPairs(codeMap);
    addPairs(tokMap);
    return Array.from(pairs).map((p) => p.split(':').map(Number) as [number, number]);
  }

  public static identifyCandidates(
    materialMap: Map<string, SpecificationMaterialItem & { category: string }>,
    options?: SpecificationRationalisationOptions
  ): SpecificationCandidateItem[] {
    const categoryGroups = new Map<string, SpecificationMaterialItem[]>();
    for (const mat of materialMap.values()) {
      const list = categoryGroups.get(mat.category) || [];
      list.push(mat);
      categoryGroups.set(mat.category, list);
    }
    const candidates: SpecificationCandidateItem[] = [];
    let pairCounter = 0;
    for (const [category, items] of categoryGroups.entries()) {
      const candidatePairs = this.findCandidatePairs(items);
      for (const [i, j] of candidatePairs) {
        const candidate = this.evaluatePair(items[i], items[j], category, pairCounter, options);
        if (candidate) {
          candidates.push(candidate);
          pairCounter++;
        }
      }
    }
    return candidates;
  }

  private static buildSummary(
    tenantId: string, customerName: string, totalMaterials: number,
    candidates: SpecificationCandidateItem[]
  ): SpecificationRationalisationSummary {
    let awaitingCount = 0, verifiedCount = 0, rejectedCount = 0, potentialMatchCount = 0, missingDataCount = 0;
    const reviewedMaterials = new Set<string>();
    let totalExpenditureInr = 0;

    for (const c of candidates) {
      if (c.reviewStatus === SPECIFICATION_REVIEW_STATUSES.AWAITING_TECHNICAL_REVIEW) awaitingCount++;
      else if (c.reviewStatus === SPECIFICATION_REVIEW_STATUSES.TECHNICALLY_VERIFIED) verifiedCount++;
      else if (c.reviewStatus === SPECIFICATION_REVIEW_STATUSES.REJECTED) rejectedCount++;
      else potentialMatchCount++;

      if (c.hasMissingTechnicalData) missingDataCount++;
      const keyA = `${c.primaryItem.code || 'NO_CODE'}:::${c.primaryItem.description}`;
      if (!reviewedMaterials.has(keyA)) {
        reviewedMaterials.add(keyA);
        totalExpenditureInr += c.primaryItem.totalSpendInr;
      }
      const keyB = `${c.comparisonItem.code || 'NO_CODE'}:::${c.comparisonItem.description}`;
      if (!reviewedMaterials.has(keyB)) {
        reviewedMaterials.add(keyB);
        totalExpenditureInr += c.comparisonItem.totalSpendInr;
      }
    }

    const roundedExpenditure = Math.round(totalExpenditureInr * 100) / 100;
    return {
      tenantId, customerName, totalMaterialsAssessedCount: totalMaterials,
      totalCandidatesIdentifiedCount: candidates.length, awaitingTechnicalReviewCount: awaitingCount,
      technicallyVerifiedCount: verifiedCount, rejectedCount, potentialMatchCount,
      candidatesWithMissingTechnicalDataCount: missingDataCount,
      totalExpenditureUnderReviewInr: roundedExpenditure,
      totalExpenditureUnderReviewCr: Number((roundedExpenditure / 10000000).toFixed(2)),
      financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
      commercialSavingsQuantifiedInr: 0, commercialSavingsQuantifiedCr: 0
    };
  }

  public static async calculateSpecificationRationalisation(
    assessmentId: string, options?: SpecificationRationalisationOptions
  ): Promise<SpecificationRationalisationResult> {
    const threshold = options?.similarityThreshold;
    const reviews = options?.reviews ?? {};
    const hasReviews = Object.keys(reviews).length > 0;
    const pairCacheKey = `${assessmentId}:${threshold ?? 'default'}`;
    const noEffectiveOptions = !hasReviews && threshold === undefined;

    if (noEffectiveOptions && this.resultCache.has(assessmentId)) {
      return this.resultCache.get(assessmentId) as SpecificationRationalisationResult;
    }

    let txs = this.txsCache.get(assessmentId);
    if (!txs) {
      logger.info('Executing Module 2 Lever 8 Specification Rationalisation (Phase 1)', {
        assessmentId, hasOverrides: hasReviews
      });
      txs = await Module2CanonicalService.getCanonicalTransactions(assessmentId);
      this.txsCache.set(assessmentId, txs);
    }

    const customerName = resolveAssessmentCustomerName(assessmentId);
    const materialMap = this.aggregateMaterials(txs);
    let baseCandidates = this.pairCache.get(pairCacheKey);
    if (!baseCandidates) {
      baseCandidates = this.identifyCandidates(materialMap, { similarityThreshold: threshold });
      this.pairCache.set(pairCacheKey, baseCandidates);
    }

    const candidates = hasReviews ? this.applyReviewOverrides(baseCandidates, reviews) : baseCandidates;
    const summary = this.buildSummary(assessmentId, customerName, materialMap.size, candidates);

    const result: SpecificationRationalisationResult = {
      assessmentId, customerName, calculatedAt: new Date().toISOString(), summary, candidates,
      methodologyDisclosures: SPECIFICATION_METHODOLOGY_DISCLOSURES,
      financialDisclaimer: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS
    };

    if (noEffectiveOptions) this.resultCache.set(assessmentId, result);
    return result;
  }

  public static async calculate(
    assessmentId: string, options?: SpecificationRationalisationOptions
  ): Promise<SpecificationRationalisationResult> {
    return this.calculateSpecificationRationalisation(assessmentId, options);
  }
}
