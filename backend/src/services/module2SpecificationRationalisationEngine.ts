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

export class Module2SpecificationRationalisationEngine {
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
      category: (t.spend_category || 'General Procurement').trim()
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
    logger.info('Executing Module 2 Lever 8 Specification Rationalisation (Phase 1)', {
      assessmentId,
      hasOverrides: Boolean(options?.reviews)
    });

    const txs = await Module2CanonicalService.getCanonicalTransactions(assessmentId);
    const customerName =
      assessmentId === 'AIC-2026-0002'
        ? 'ABC Textile Ltd'
        : assessmentId === 'AIC-2026-0003'
        ? 'PQR Cement Ltd'
        : `Enterprise Client (${assessmentId})`;
    const materialMap = this.aggregateMaterials(txs);
    const candidates = this.identifyCandidates(materialMap, options);
    const summary = this.buildSummary(assessmentId, customerName, materialMap.size, candidates);

    return {
      assessmentId,
      customerName,
      calculatedAt: new Date().toISOString(),
      summary,
      candidates,
      methodologyDisclosures: SPECIFICATION_METHODOLOGY_DISCLOSURES,
      financialDisclaimer: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS
    };
  }
}
