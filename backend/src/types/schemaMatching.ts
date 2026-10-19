/**
 * Generic Column and Schema Matching Types
 * 
 * Defines data structures for matching source workbook headers to canonical procurement fields.
 */

export type CanonicalFieldName =
  | 'purchaseOrderNumber'
  | 'purchaseOrderLine'
  | 'documentNumber'
  | 'documentDate'
  | 'fiscalPeriod'
  | 'vendorName'
  | 'vendorCode'
  | 'materialCode'
  | 'materialDescription'
  | 'materialGroup'
  | 'procurementCategory'
  | 'quantity'
  | 'unitOfMeasure'
  | 'unitPrice'
  | 'netSpendAmount'
  | 'currency'
  | 'convertedSpendAmount'
  | 'plant'
  | 'deletionIndicator';

export type FieldCategory = 'IDENTIFICATION' | 'SUPPLIER' | 'MATERIAL' | 'TRANSACTION' | 'SYSTEM';

export type MatchingMethod = 'EXACT_ALIAS' | 'NORMALIZED_ALIAS' | 'HEURISTIC';

export type SchemaMatchStatus = 'VALID' | 'MISSING_MANDATORY' | 'AMBIGUOUS_COLUMNS';

export interface ColumnMapping {
  canonicalField: CanonicalFieldName;
  sourceColumn: string;
  columnIndex: number;
  matchingMethod: MatchingMethod;
  confidence: number; // 0.0 to 1.0
  isMandatory: boolean;
  requiresAnalystConfirmation: boolean;
  sampleValues: unknown[];
}

export interface AmbiguousColumnConflict {
  field: CanonicalFieldName;
  candidateColumns: string[];
  reason: string;
}

export interface SchemaMatchResult {
  mappings: ColumnMapping[];
  mappedFieldNames: CanonicalFieldName[];
  unmappedMandatoryFields: CanonicalFieldName[];
  ambiguousColumns: AmbiguousColumnConflict[];
  unmappedSourceColumns: string[];
  isValid: boolean;
  status: SchemaMatchStatus;
  reason: string;
}
