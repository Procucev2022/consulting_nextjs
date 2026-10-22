/**
 * Procurement Category Resolver Utility
 * Maps internal material group codes to human-readable procurement categories
 * Compliant with Rule 7, 8, 9, line <= 120, max lines <= 300, complexity <= 10
 */

import {
  AUTHORITATIVE_MATERIAL_GROUP_TO_CATEGORY,
  UNMAPPED_CATEGORY_LABEL,
  APPROVED_PROCUREMENT_CATEGORIES
} from '../constants/procurementCategoryMapping';

export { UNMAPPED_CATEGORY_LABEL, APPROVED_PROCUREMENT_CATEGORIES };

const APPROVED_UPPER_SET = new Set(
  APPROVED_PROCUREMENT_CATEGORIES.map((c) => c.toUpperCase())
);

const CODE_LIKE_PATTERN = /^[A-Z]{1,6}\d+[A-Z0-9_-]*$/i;

/**
 * Checks if a string represents an internal material group code rather than an approved category name.
 */
export function isInternalCategoryCode(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (APPROVED_UPPER_SET.has(trimmed.toUpperCase())) {
    return false;
  }
  if (AUTHORITATIVE_MATERIAL_GROUP_TO_CATEGORY[trimmed]) {
    return true;
  }
  return CODE_LIKE_PATTERN.test(trimmed);
}

function matchApprovedOrAuthoritative(val: string): string | null {
  if (!val) return null;
  const mapped = AUTHORITATIVE_MATERIAL_GROUP_TO_CATEGORY[val];
  if (mapped) return mapped;
  if (APPROVED_UPPER_SET.has(val.toUpperCase())) {
    return APPROVED_PROCUREMENT_CATEGORIES.find(
      (c) => c.toUpperCase() === val.toUpperCase()
    ) || val;
  }
  return null;
}

/**
 * Resolves a raw category name or material group code to the authoritative human-readable procurement category name.
 * Returns "Unmapped Category" if no valid mapping exists.
 */
export function resolveHumanReadableCategory(
  rawCategoryOrCode?: string | null,
  rawMaterialGroup?: string | null
): string {
  const catTrimmed = (rawCategoryOrCode || '').trim();
  const groupTrimmed = (rawMaterialGroup || '').trim();

  const directMatch = matchApprovedOrAuthoritative(catTrimmed);
  if (directMatch) {
    return directMatch;
  }

  const groupMatch = matchApprovedOrAuthoritative(groupTrimmed);
  if (groupMatch) {
    return groupMatch;
  }

  if (catTrimmed && catTrimmed !== UNMAPPED_CATEGORY_LABEL && !isInternalCategoryCode(catTrimmed)) {
    return catTrimmed;
  }

  return UNMAPPED_CATEGORY_LABEL;
}
