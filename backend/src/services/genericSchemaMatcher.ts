/**
 * Generic Column and Schema Matching Engine
 * 
 * Provides deterministic, explainable mapping from heterogeneous procurement
 * workbook headers to canonical spend analysis data fields.
 */

import {
  CANONICAL_FIELD_DEFINITIONS,
  MANDATORY_CANONICAL_FIELDS,
  type CanonicalFieldDefinition
} from '../constants/schemaMatching';
import type {
  CanonicalFieldName,
  ColumnMapping,
  MatchingMethod,
  SchemaMatchResult,
  AmbiguousColumnConflict
} from '../types/schemaMatching';

export function normalizeHeaderString(header: string): string {
  if (!header || typeof header !== 'string') return '';
  return header
    .trim()
    .toLowerCase()
    .replace(/[\r\n\t_.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toAlphanumeric(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface ColumnCandidateMatch {
  canonicalField: CanonicalFieldName;
  sourceColumn: string;
  columnIndex: number;
  matchingMethod: MatchingMethod;
  confidence: number;
  definition: CanonicalFieldDefinition;
}

function isDisallowedHeader(
  def: CanonicalFieldDefinition,
  normClean: string,
  alphaClean: string
): boolean {
  if (!def.disallowedKeywords || def.disallowedKeywords.length === 0) {
    return false;
  }
  return def.disallowedKeywords.some((dk) => {
    const dkAlpha = toAlphanumeric(dk);
    return normClean.includes(dk.toLowerCase()) || alphaClean.includes(dkAlpha);
  });
}

function matchHeaderToField(
  def: CanonicalFieldDefinition,
  cleanHeader: string,
  normClean: string,
  alphaClean: string
): { method: MatchingMethod; confidence: number } | null {
  if (isDisallowedHeader(def, normClean, alphaClean)) {
    return null;
  }

  // Tier 1: Exact alias match
  const exactMatch = def.exactAliases.some(
    (alias) => alias.trim().toLowerCase() === cleanHeader.toLowerCase()
  );
  if (exactMatch) {
    return { method: 'EXACT_ALIAS', confidence: 1.0 };
  }

  // Tier 2: Normalized alphanumeric match
  const normMatch = def.normalizedAliases.some(
    (alias) => toAlphanumeric(alias) === alphaClean
  );
  if (normMatch) {
    return { method: 'NORMALIZED_ALIAS', confidence: 0.95 };
  }

  // Tier 3: Heuristic keyword match
  const keywordMatch = def.normalizedAliases.some((alias) => {
    const a = toAlphanumeric(alias);
    return a.length >= 4 && alphaClean.includes(a);
  });
  if (keywordMatch) {
    return { method: 'HEURISTIC', confidence: 0.75 };
  }

  return null;
}

function findColumnCandidateMatches(
  rawHeaders: string[]
): ColumnCandidateMatch[] {
  const allCandidateMatches: ColumnCandidateMatch[] = [];

  rawHeaders.forEach((rawHeader, colIdx) => {
    const cleanHeader = rawHeader.trim();
    if (!cleanHeader) return;

    const normClean = normalizeHeaderString(cleanHeader);
    const alphaClean = toAlphanumeric(cleanHeader);

    for (const def of CANONICAL_FIELD_DEFINITIONS) {
      const match = matchHeaderToField(def, cleanHeader, normClean, alphaClean);
      if (match) {
        allCandidateMatches.push({
          canonicalField: def.field,
          sourceColumn: rawHeader,
          columnIndex: colIdx,
          matchingMethod: match.method,
          confidence: match.confidence,
          definition: def
        });
      }
    }
  });

  return allCandidateMatches;
}

function extractSampleValues(
  sampleRows: Record<string, unknown>[],
  columnName: string
): unknown[] {
  const samples: unknown[] = [];
  for (const row of sampleRows) {
    const val = row[columnName];
    if (val !== undefined && val !== null && val !== '') {
      samples.push(val);
      if (samples.length >= 3) break;
    }
  }
  return samples;
}

interface MappingResolutionResult {
  finalMappings: ColumnMapping[];
  ambiguousColumns: AmbiguousColumnConflict[];
}

function resolveMappings(
  candidatesByField: Map<CanonicalFieldName, ColumnCandidateMatch[]>,
  sampleRows: Record<string, unknown>[]
): MappingResolutionResult {
  const finalMappings: ColumnMapping[] = [];
  const ambiguousColumns: AmbiguousColumnConflict[] = [];
  const assignedColumns = new Set<number>();

  for (const def of CANONICAL_FIELD_DEFINITIONS) {
    const candidates = candidatesByField.get(def.field) || [];
    const unassigned = candidates.filter((c) => !assignedColumns.has(c.columnIndex));
    if (unassigned.length === 0) continue;

    unassigned.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.sourceColumn.length - a.sourceColumn.length;
    });

    const topMatch = unassigned[0];
    const equallyPlausible = unassigned.filter(
      (c) => c.confidence === topMatch.confidence && c.columnIndex !== topMatch.columnIndex
    );

    const requiresAnalystConfirmation = equallyPlausible.length > 0;
    if (requiresAnalystConfirmation) {
      ambiguousColumns.push({
        field: def.field,
        candidateColumns: [topMatch.sourceColumn, ...equallyPlausible.map((e) => e.sourceColumn)],
        reason: `Multiple columns match canonical field '${def.label}' with equal confidence (${topMatch.confidence})`
      });
    }

    finalMappings.push({
      canonicalField: def.field,
      sourceColumn: topMatch.sourceColumn,
      columnIndex: topMatch.columnIndex,
      matchingMethod: topMatch.matchingMethod,
      confidence: topMatch.confidence,
      isMandatory: def.isMandatory,
      requiresAnalystConfirmation,
      sampleValues: extractSampleValues(sampleRows, topMatch.sourceColumn)
    });

    assignedColumns.add(topMatch.columnIndex);
  }

  return { finalMappings, ambiguousColumns };
}

export class GenericSchemaMatcher {
  /**
   * Matches an array of source column headers to canonical procurement fields.
   */
  public static matchSchema(
    headers: string[],
    sampleRows: Record<string, unknown>[] = []
  ): SchemaMatchResult {
    const rawHeaders = headers.map((h) => (h == null ? '' : String(h)));
    const allCandidates = findColumnCandidateMatches(rawHeaders);

    const candidatesByField = new Map<CanonicalFieldName, ColumnCandidateMatch[]>();
    for (const c of allCandidates) {
      const list = candidatesByField.get(c.canonicalField) || [];
      list.push(c);
      candidatesByField.set(c.canonicalField, list);
    }

    const { finalMappings, ambiguousColumns } = resolveMappings(candidatesByField, sampleRows);

    const mappedFields = new Set(finalMappings.map((m) => m.canonicalField));
    const unmappedMandatory = MANDATORY_CANONICAL_FIELDS.filter((req) => !mappedFields.has(req));

    const mappedColIndices = new Set(finalMappings.map((m) => m.columnIndex));
    const unmappedSourceColumns = rawHeaders.filter((_, idx) => !mappedColIndices.has(idx) && _ !== '');

    let isValid = true;
    let status: SchemaMatchResult['status'] = 'VALID';
    let reason = 'Schema mapped successfully.';

    if (unmappedMandatory.length > 0) {
      isValid = false;
      status = 'MISSING_MANDATORY';
      reason = `Missing mandatory procurement fields: ${unmappedMandatory.join(', ')}.`;
    } else if (ambiguousColumns.some((ac) => MANDATORY_CANONICAL_FIELDS.includes(ac.field))) {
      isValid = false;
      status = 'AMBIGUOUS_COLUMNS';
      reason = `Ambiguous column mappings detected for mandatory fields: ${ambiguousColumns.map((a) => a.field).join(', ')}. Analyst confirmation required.`;
    }

    return {
      mappings: finalMappings,
      mappedFieldNames: Array.from(mappedFields),
      unmappedMandatoryFields: unmappedMandatory,
      ambiguousColumns,
      unmappedSourceColumns,
      isValid,
      status,
      reason
    };
  }

  /**
   * Helper to extract a mapped field's value from a source data row.
   */
  public static extractMappedValue(
    row: Record<string, unknown>,
    mappings: ColumnMapping[],
    field: CanonicalFieldName
  ): unknown {
    const mapping = mappings.find((m) => m.canonicalField === field);
    if (!mapping) return undefined;
    return row[mapping.sourceColumn];
  }
}
