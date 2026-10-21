/**
 * Module 2 — Lever 8: Specification Rationalisation Matcher
 * Staged Normalisation, Attribute Extraction & Comparison Engine
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import type {
  TechnicalAttributeComparison,
  SpecificationMaterialItem,
  SpecificationIdentificationType,
  SpecificationRationalisationReviewStatus
} from '../types/module2SpecificationRationalisation';
import {
  SPECIFICATION_IDENTIFICATION_TYPES,
  SPECIFICATION_REVIEW_STATUSES
} from '../constants/module2SpecificationRationalisation';

export class Module2SpecificationRationalisationMatcher {
  public static normalizeDescription(rawDesc: string): string {
    if (!rawDesc) return '';
    return rawDesc
      .toLowerCase()
      .replace(/[^\w\s/.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(millimeters?|mms?)\b/g, 'mm')
      .replace(/\b(kilograms?|kgs?)\b/g, 'kg')
      .replace(/\b(pieces?|pcs?|nos?|numbers?)\b/g, 'pc')
      .replace(/\b(meters?|mtrs?)\b/g, 'm')
      .trim();
  }

  public static extractTechnicalAttributes(desc: string): Record<string, string> {
    const norm = this.normalizeDescription(desc);
    const attrs: Record<string, string> = {};

    const dimMatch = norm.match(/\b(\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|in))\b/);
    if (dimMatch?.[1]) attrs.dimension = dimMatch[1].replace(/\s+/g, '');

    const weightMatch = norm.match(/\b(\d+(?:\.\d+)?\s*(?:gsm|kg|gm|g|denier|d))\b/);
    if (weightMatch?.[1]) attrs.weightDensity = weightMatch[1].replace(/\s+/g, '');

    const gradeMatch = norm.match(
      /\b(ss\s*\d{3}|is\s*\d+|grade\s*[a-z0-9]+|din\s*\d+|opc\s*\d+|ppc|\d+\/\d+|dty|fdy|viscose|cotton)\b/
    );
    if (gradeMatch?.[1]) attrs.materialGrade = gradeMatch[1].replace(/\s+/g, '');

    const ratingMatch = norm.match(/\b(\d+\s*(?:kpa|mpa|bar|psi|v|kv|w|kw|hp|rpm|mesh))\b/);
    if (ratingMatch?.[1]) attrs.rating = ratingMatch[1].replace(/\s+/g, '');

    return attrs;
  }

  public static computeTokenSimilarity(strA: string, strB: string): number {
    const tokensA = new Set(strA.split(/\s+/).filter((t) => t.length >= 2));
    const tokensB = new Set(strB.split(/\s+/).filter((t) => t.length >= 2));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersectionCount = 0;
    tokensA.forEach((token) => {
      if (tokensB.has(token)) intersectionCount++;
    });

    const unionCount = new Set([...tokensA, ...tokensB]).size;
    return unionCount === 0 ? 0 : Math.round((intersectionCount / unionCount) * 100) / 100;
  }

  public static compareAttributes(
    attrsA: Record<string, string>,
    attrsB: Record<string, string>
  ): {
    comparisons: TechnicalAttributeComparison[];
    differences: string[];
    missingFields: string[];
  } {
    const comparisons: TechnicalAttributeComparison[] = [];
    const differences: string[] = [];
    const missingFields: string[] = [];

    const standardAttributes = [
      { key: 'dimension', name: 'Dimensions / Sizing', critical: true },
      { key: 'weightDensity', name: 'Weight / Density / Gauge', critical: true },
      { key: 'materialGrade', name: 'Material Grade / Spec', critical: true },
      { key: 'rating', name: 'Technical Rating / Tolerance', critical: false }
    ];

    for (const attr of standardAttributes) {
      const valA = attrsA[attr.key] || null;
      const valB = attrsB[attr.key] || null;

      if (!valA && !valB) {
        missingFields.push(`${attr.name} missing from both items.`);
        comparisons.push({
          attributeName: attr.name,
          sourceValue: null,
          candidateValue: null,
          matchStatus: 'BOTH_MISSING',
          isCritical: attr.critical
        });
      } else if (valA && !valB) {
        missingFields.push(`${attr.name} present in primary (${valA}) but missing in comparison item.`);
        comparisons.push({
          attributeName: attr.name,
          sourceValue: valA,
          candidateValue: null,
          matchStatus: 'CANDIDATE_MISSING',
          isCritical: attr.critical
        });
      } else if (!valA && valB) {
        missingFields.push(`${attr.name} missing in primary but present in comparison item (${valB}).`);
        comparisons.push({
          attributeName: attr.name,
          sourceValue: null,
          candidateValue: valB,
          matchStatus: 'SOURCE_MISSING',
          isCritical: attr.critical
        });
      } else if (valA === valB) {
        comparisons.push({
          attributeName: attr.name,
          sourceValue: valA,
          candidateValue: valB,
          matchStatus: 'MATCH',
          isCritical: attr.critical
        });
      } else {
        differences.push(`${attr.name} variance: ${valA} vs ${valB}.`);
        comparisons.push({
          attributeName: attr.name,
          sourceValue: valA,
          candidateValue: valB,
          matchStatus: 'DIFFERENT',
          isCritical: attr.critical
        });
      }
    }

    return { comparisons, differences, missingFields };
  }

  public static determineIdentificationType(
    itemA: SpecificationMaterialItem,
    itemB: SpecificationMaterialItem,
    differences: string[]
  ): {
    type: SpecificationIdentificationType;
    rationale: string;
    reviewStatus: SpecificationRationalisationReviewStatus;
  } {
    if (itemA.code && itemB.code && itemA.code === itemB.code && itemA.description !== itemB.description) {
      return {
        type: SPECIFICATION_IDENTIFICATION_TYPES.DUPLICATE_CODE,
        rationale: 'Identical material code used with differing text descriptions across records.',
        reviewStatus: SPECIFICATION_REVIEW_STATUSES.AWAITING_TECHNICAL_REVIEW
      };
    }

    if (itemA.plant && itemB.plant && itemA.plant !== itemB.plant) {
      return {
        type: SPECIFICATION_IDENTIFICATION_TYPES.CROSS_PLANT_VARIATION,
        rationale: `Specification variant procured across facilities (${itemA.plant} vs ${itemB.plant}).`,
        reviewStatus: SPECIFICATION_REVIEW_STATUSES.AWAITING_TECHNICAL_REVIEW
      };
    }

    if (differences.length === 0) {
      return {
        type: SPECIFICATION_IDENTIFICATION_TYPES.EQUIVALENT_SPECIFICATION,
        rationale: 'All extracted technical attributes are identical across distinct material codes.',
        reviewStatus: SPECIFICATION_REVIEW_STATUSES.AWAITING_TECHNICAL_REVIEW
      };
    }

    return {
      type: SPECIFICATION_IDENTIFICATION_TYPES.SIMILAR_DESCRIPTION,
      rationale: `Textual and category similarity identified with ${differences.length} attribute variance(s).`,
      reviewStatus: SPECIFICATION_REVIEW_STATUSES.POTENTIAL_MATCH
    };
  }
}
