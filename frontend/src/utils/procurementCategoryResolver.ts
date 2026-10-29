/**
 * Procurement Category Resolver Utility (Frontend)
 * Maps internal material group codes to human-readable procurement categories
 * Compliant with Rule 7, 8, 9, line <= 120, max lines <= 300, complexity <= 10
 */

import {
  UNMAPPED_CATEGORY_LABEL
} from '../constants/procurementCategoryMapping';

export { UNMAPPED_CATEGORY_LABEL };

let authoritativeMap: Record<string, string> = {};
let authoritativeUpperMap: Record<string, string> = {};
let approvedUpperMap: Record<string, string> = {};

export function setProcurementCategoryMappings(mappings: Record<string, string>): void {
  authoritativeMap = { ...mappings };
  authoritativeUpperMap = {};
  approvedUpperMap = {};
  for (const [key, value] of Object.entries(authoritativeMap)) {
    authoritativeUpperMap[key.toUpperCase()] = value;
    approvedUpperMap[value.toUpperCase()] = value;
  }
}

const UNMAPPED_PLACEHOLDER_SET = new Set([
  'UNKNOWN',
  'UNKNOWN_CATEGORY',
  'UNKNOWN CATEGORY',
  'UNCATEGORIZED',
  'N/A',
  'NA',
  'NONE',
  'NULL',
  'UNDEFINED'
]);

const CODE_LIKE_PATTERN = /^[A-Z]{1,6}\d+[A-Z0-9_-]*$/i;

/**
 * Checks if a string represents an internal material group code rather than an approved category name.
 */
export function isInternalCategoryCode(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  const upper = trimmed.toUpperCase();
  if (authoritativeMap[trimmed] || authoritativeUpperMap[upper]) {
    return true;
  }
  if (approvedUpperMap[upper]) return false;
  return CODE_LIKE_PATTERN.test(trimmed);
}

function matchApprovedOrAuthoritative(val: string): string | null {
  if (!val) return null;
  const upper = val.toUpperCase();
  if (UNMAPPED_PLACEHOLDER_SET.has(upper)) {
    return null;
  }
  const mapped = authoritativeMap[val] || authoritativeUpperMap[upper] || approvedUpperMap[upper];
  if (mapped) return mapped;
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

  if (
    catTrimmed &&
    catTrimmed !== UNMAPPED_CATEGORY_LABEL &&
    !UNMAPPED_PLACEHOLDER_SET.has(catTrimmed.toUpperCase()) &&
    !isInternalCategoryCode(catTrimmed)
  ) {
    return catTrimmed;
  }

  return UNMAPPED_CATEGORY_LABEL;
}
