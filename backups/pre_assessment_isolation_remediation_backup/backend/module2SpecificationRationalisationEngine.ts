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
  SpecificationMaterialItem,
  SpecificationCandidateItem,
  SpecificationRationalisationSummary,
  SpecificationRationalisationResult,
  SpecificationRationalisationOptions,
  SpecificationRationalisationReviewStatus,
  TechnicalReviewRecord
} from '../types/module2SpecificationRationalisation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import { Module2SpecificationRationalisationMatcher } from './module2SpecificationRationalisationMatcher';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';

export class Module2SpecificationRationalisationEngine {
  private static readonly resultCache = new Map<string, SpecificationRationalisationResult>();
  private static readonly txsCache = new Map<string, StrategicInputTransaction[]>();
  private static readonly pairCache = new Map<string, SpecificationCandidateItem[]>();

  /** Clears all engine caches — used by tests to force recalculation */
  public static clearResultCache(): void {
    this.resultCache.clear();
    this.txsCache.clear();
    this.pairCache.clear();
  }

  private static applyReviewOverrides(
    base: SpecificationCandidateItem[],
    reviews: Record<string, TechnicalReviewRecord | TechnicalReviewRecord[]>
  ): SpecificationCandidateItem[] {
    const hasReviews = Object.keys(reviews).length > 0;
    if (!hasReviews) return base;
    return base.map((c) => {
      const raw = reviews[c.candidateId];
      if (!raw) return c;
      const defaultStatus = c.reviewStatus as SpecificationRationalisationReviewStatus;
      const { history, finalStatus } = this.resolveReviewState(raw as TechnicalReviewRecord, defaultStatus);
      return {
        ...c,
        reviewStatus: finalStatus,
        reviewHistory: history,
        nextRequiredAction: this.resolveNextAction(finalStatus)
      };
    });
  }

  private static createMaterialItem(
    t: StrategicInputTransaction,
    code: string,
    desc: string
  ): SpecificationMaterialItem & { category: string } {
    return {
      code,
      description: desc,
      normalizedDescription: Module2SpecificationRationalisationMatcher.normalizeDescription(desc),
      plant: t.plant,
      department: t.department,
      totalSpendInr: t.total_spend_inr || 0,
      totalQuantity: t.quantity || 0,
      uom: t.uom || 'units',
      transactionCount: 1,
      suppliersCount: t.vendor_name ? 1 : 0,
      category: resolveHumanReadableCategory(t.spend_category, code)
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
      return;
    }

    map.set(key, this.createMaterialItem(t, code, desc));
  }

  private static aggregateMaterials(
    transactions: StrategicInputTransaction[]
  ): Map<string, SpecificationMaterialItem & { category: string }> {
    const materialMap = new Map<string, SpecificationMaterialItem & { category: string }>();
    for (const t of transactions) {
      this.upsertMaterial(materialMap, t);
    }
    return materialMap;
  }

  private static resolveNextAction(finalStatus: SpecificationRationalisationReviewStatus): string {
    switch (finalStatus) {
      case SPECIFICATION_REVIEW_STATUSES.TECHNICALLY_VERIFIED:
        return 'Technical equivalence approved; prepare scope for Phase 2 commercial review';
      case SPECIFICATION_REVIEW_STATUSES.REJECTED:
        return 'Candidate rejected by technical reviewer; no further rationalisation action';
      case SPECIFICATION_REVIEW_STATUSES.POTENTIAL_MATCH:
        return 'Verify technical attributes and route for technical review';
      default:
        return 'Route candidate to authorised engineering/plant technical reviewer';
    }
  }

  private static resolveReviewState(
    overrideReviewRaw: TechnicalReviewRecord | TechnicalReviewRecord[] | undefined,
    defaultStatus: SpecificationRationalisationReviewStatus
  ): { history: TechnicalReviewRecord[]; finalStatus: SpecificationRationalisationReviewStatus } {
    if (!overrideReviewRaw) {
      return { history: [], finalStatus: defaultStatus };
    }
    const history = Array.isArray(overrideReviewRaw) ? overrideReviewRaw : [overrideReviewRaw];
    const latestReview = history[history.length - 1];
    return {
      history,
      finalStatus: latestReview ? latestReview.status : defaultStatus
    };
  }

  private static evaluatePair(
    itemA: SpecificationMaterialItem,
    itemB: SpecificationMaterialItem,
    category: string,
    pairIndex: number,
    options?: SpecificationRationalisationOptions
  ): SpecificationCandidateItem | null {
    const simScore = Module2SpecificationRationalisationMatcher.computeTokenSimilarity(
      itemA.normalizedDescription,
      itemB.normalizedDescription
    );
    const hasSameCode = Boolean(itemA.code && itemB.code && itemA.code === itemB.code);
    const threshold = options?.similarityThreshold ?? 0.6;

    if (simScore < threshold && !hasSameCode) {
      return null;
    }

    const attrsA = Module2SpecificationRationalisationMatcher.extractTechnicalAttributes(itemA.description);
    const attrsB = Module2SpecificationRationalisationMatcher.extractTechnicalAttributes(itemB.description);
    const { comparisons, differences, missingFields } =
      Module2SpecificationRationalisationMatcher.compareAttributes(attrsA, attrsB);

    const { type, rationale, reviewStatus } =
      Module2SpecificationRationalisationMatcher.determineIdentificationType(itemA, itemB, differences);

    const candidateId = `SPEC-RAT-${category.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}-${pairIndex + 1}`;
    const { history, finalStatus } = this.resolveReviewState(options?.reviews?.[candidateId], reviewStatus);

    const expenditureInr = Math.round((itemA.totalSpendInr + itemB.totalSpendInr) * 100) / 100;
    const expenditureCr = Number((expenditureInr / 10000000).toFixed(2));
    const totalQty = Math.round((itemA.totalQuantity + itemB.totalQuantity) * 100) / 100;
    const nextAction = this.resolveNextAction(finalStatus);

    return {
      candidateId,
      identificationType: type,
      identificationRationale: rationale,
      spendCategory: category,
      primaryItem: itemA,
      comparisonItem: itemB,
      similarityScore: simScore,
      technicalAttributes: comparisons,
      differencesIdentified: differences,
      missingAttributesDisclosed: missingFields,
      hasMissingTechnicalData: missingFields.length > 0,
      expenditureUnderReviewInr: expenditureInr,
      expenditureUnderReviewCr: expenditureCr,
      quantityUnderReview: totalQty,
      reviewStatus: finalStatus,
      reviewHistory: history,
      financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
      potentialRelatedLevers: ['LEVER_1', 'LEVER_3', 'LEVER_4', 'LEVER_6'],
      nextRequiredAction: nextAction
    };
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
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const itemA = items[i];
          const itemB = items[j];
          const candidate = this.evaluatePair(itemA, itemB, category, pairCounter, options);
          if (candidate) {
            candidates.push(candidate);
            pairCounter++;
          }
        }
      }
    }

    return candidates;
  }

  private static buildSummary(
    tenantId: string,
    customerName: string,
    totalMaterials: number,
    candidates: SpecificationCandidateItem[]
  ): SpecificationRationalisationSummary {
    let awaitingCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;
    let potentialMatchCount = 0;
    let missingDataCount = 0;
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
    const roundedCr = Number((roundedExpenditure / 10000000).toFixed(2));

    return {
      tenantId,
      customerName,
      totalMaterialsAssessedCount: totalMaterials,
      totalCandidatesIdentifiedCount: candidates.length,
      awaitingTechnicalReviewCount: awaitingCount,
      technicallyVerifiedCount: verifiedCount,
      rejectedCount,
      potentialMatchCount,
      candidatesWithMissingTechnicalDataCount: missingDataCount,
      totalExpenditureUnderReviewInr: roundedExpenditure,
      totalExpenditureUnderReviewCr: roundedCr,
      financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
      commercialSavingsQuantifiedInr: 0,
      commercialSavingsQuantifiedCr: 0
    };
  }

  public static async calculateSpecificationRationalisation(
    assessmentId: string,
    options?: SpecificationRationalisationOptions
  ): Promise<SpecificationRationalisationResult> {
    const threshold = options?.similarityThreshold;
    const reviews = options?.reviews ?? {};
    const hasReviews = Object.keys(reviews).length > 0;
    const pairCacheKey = `${assessmentId}:${threshold ?? 'default'}`;
    const noEffectiveOptions = !hasReviews && threshold === undefined;

    // Full result cache: only when no reviews and default threshold
    if (noEffectiveOptions && this.resultCache.has(assessmentId)) {
      return this.resultCache.get(assessmentId) as SpecificationRationalisationResult;
    }

    // Load transactions (cached to skip disk I/O on repeated calls)
    let txs = this.txsCache.get(assessmentId);
    if (!txs) {
      logger.info('Executing Module 2 Lever 8 Specification Rationalisation (Phase 1)', {
        assessmentId,
        hasOverrides: hasReviews
      });
      txs = await Module2CanonicalService.getCanonicalTransactions(assessmentId);
      this.txsCache.set(assessmentId, txs);
    }

    const customerName =
      assessmentId === 'AIC-2026-0002'
        ? 'ABC Textile Ltd'
        : assessmentId === 'AIC-2026-0003'
        ? 'PQR Cement Ltd'
        : `Enterprise Client (${assessmentId})`;

    const materialMap = this.aggregateMaterials(txs);

    // Pair identification cache: keyed on assessmentId + threshold
    let baseCandidates = this.pairCache.get(pairCacheKey);
    if (!baseCandidates) {
      baseCandidates = this.identifyCandidates(materialMap, { similarityThreshold: threshold });
      this.pairCache.set(pairCacheKey, baseCandidates);
    }

    // Apply review overrides in O(n) — no re-running O(n²) pair scan
    const candidates = hasReviews ? this.applyReviewOverrides(baseCandidates, reviews) : baseCandidates;
    const summary = this.buildSummary(assessmentId, customerName, materialMap.size, candidates);

    const result: SpecificationRationalisationResult = {
      assessmentId,
      customerName,
      calculatedAt: new Date().toISOString(),
      summary,
      candidates,
      methodologyDisclosures: SPECIFICATION_METHODOLOGY_DISCLOSURES,
      financialDisclaimer: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS
    };

    if (noEffectiveOptions) {
      this.resultCache.set(assessmentId, result);
    }
    return result;
  }
}
