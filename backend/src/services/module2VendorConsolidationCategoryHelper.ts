/**
 * Module 2 — Lever 3: Category Classification & Opportunity Evaluation Helpers
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10, line <= 120
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  CategoryClassificationType,
  ConsolidationOpportunityStatus
} from '../types/module2VendorConsolidation';
import {
  VENDOR_CONSOLIDATION_CONFIG,
  CONSOLIDATION_STATUS_LABELS,
  CATEGORY_CLASSIFICATION_LABELS
} from '../constants/module2VendorConsolidation';

import type { MaterialMappingEntry } from '../types/module2MaterialMapping';
import { getStrategicTransactionMaterialId } from './module2MaterialMappingRegister';

export interface CategoryClassificationResult {
  unspscCode: string;
  unspscCategory: string;
  classificationType: CategoryClassificationType;
  classificationLabel: string;
}

function checkCategoryMaterialStatus(
  catTxs: StrategicInputTransaction[],
  materialMappingMap?: Map<string, MaterialMappingEntry>
): { hasPending: boolean } {
  if (!materialMappingMap || materialMappingMap.size === 0) {
    return { hasPending: true };
  }
  let checkedMaterials = 0;
  for (const t of catTxs) {
    const matId = getStrategicTransactionMaterialId(t);
    const mapping = materialMappingMap.get(matId);
    const isVer = Boolean(
      mapping &&
      (mapping.reviewStatus === 'TAXONOMY_VERIFIED' ||
       mapping.reviewStatus === 'CLIENT_APPROVED' ||
       mapping.reviewStatus === 'APPROVED')
    );
    if (!isVer) {
      return { hasPending: true };
    }
    checkedMaterials++;
  }
  return { hasPending: checkedMaterials === 0 };
}

export function determineCategoryClassification(
  catName: string,
  catTxs: StrategicInputTransaction[],
  forcedUnspscCode?: string,
  materialMappingMap?: Map<string, MaterialMappingEntry>
): CategoryClassificationResult {
  const code = forcedUnspscCode ?? catTxs[0]?.unspsc_code?.trim() ?? '';
  const isVerified = code.length === 8 && code !== '00000000' && /^\d{8}$/.test(code);

  if (isVerified) {
    const unspscCommodity = catTxs[0]?.unspsc_commodity?.trim();
    const catDesc = unspscCommodity && unspscCommodity.length > 0 ? unspscCommodity : catName;
    const { hasPending } = checkCategoryMaterialStatus(catTxs, materialMappingMap);
    const classificationType: CategoryClassificationType = hasPending ? 'PROVISIONAL_UNSPSC' : 'VERIFIED_UNSPSC';

    return {
      unspscCode: code,
      unspscCategory: `${catDesc} (${code})`,
      classificationType,
      classificationLabel: CATEGORY_CLASSIFICATION_LABELS[classificationType]
    };
  }

  const isNamedSource = Boolean(catName && catName !== 'General' && catName !== 'Unclassified');
  const classificationType: CategoryClassificationType = isNamedSource ? 'SOURCE_SPEND_CATEGORY' : 'UNMAPPED';

  return {
    unspscCode: VENDOR_CONSOLIDATION_CONFIG.UNMAPPED_UNSPSC_CODE,
    unspscCategory: `Source Category: ${catName} [UNSPSC Unmapped]`,
    classificationType,
    classificationLabel: CATEGORY_CLASSIFICATION_LABELS[classificationType]
  };
}

export interface CategoryOpportunityAssessment {
  status: ConsolidationOpportunityStatus;
  reason: string;
  candidateStatus: 'IDENTIFIED' | 'NOT_APPLICABLE';
  candidateReason: string;
}

export function evaluateCategoryStatus(
  sameMatCount: number,
  suppliersCount: number,
  compMatCount: number,
  distinctMatsCount: number
): CategoryOpportunityAssessment {
  const isCategoryCandidate = suppliersCount >= 2 && distinctMatsCount >= 2;
  const candidateStatus = isCategoryCandidate ? 'IDENTIFIED' : 'NOT_APPLICABLE';
  const candidateReason = isCategoryCandidate
    ? `Category served by ${suppliersCount} suppliers across ${distinctMatsCount} materials. ` +
      'Multi-material rationalisation candidate.'
    : 'Single supplier or single material configuration; category-level consolidation not applicable.';

  if (sameMatCount > 0) {
    return {
      status: CONSOLIDATION_STATUS_LABELS.OPPORTUNITY_IDENTIFIED,
      reason: `${sameMatCount} materials multi-sourced across suppliers. Volume reallocation potential.`,
      candidateStatus,
      candidateReason
    };
  }

  if (suppliersCount >= 2 || compMatCount > 0) {
    return {
      status: CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY,
      reason: `Category served by ${suppliersCount} suppliers. Review potential for vendor rationalisation.`,
      candidateStatus,
      candidateReason
    };
  }

  return {
    status: CONSOLIDATION_STATUS_LABELS.NO_CLEAR_OPPORTUNITY,
    reason: 'Single-supplier configuration or low spend consolidation potential.',
    candidateStatus,
    candidateReason
  };
}
