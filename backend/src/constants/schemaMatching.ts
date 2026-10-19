/**
 * Generic Column and Schema Matching Constants
 * 
 * Rules, aliases, and classification patterns for procurement dataset ingestion.
 */

import type { CanonicalFieldName } from '../types/schemaMatching';
import {
  IDENTIFICATION_AND_SUPPLIER_FIELDS,
  type CanonicalFieldDefinition
} from './schemaMatchingFieldsA';
import { MATERIAL_FIELDS } from './schemaMatchingFieldsB';
import { TRANSACTION_AND_SYSTEM_FIELDS } from './schemaMatchingFieldsC';

export type { CanonicalFieldDefinition };

export const MANDATORY_CANONICAL_FIELDS: CanonicalFieldName[] = [
  'vendorName',
  'documentDate',
  'netSpendAmount'
];

export const CANONICAL_FIELD_DEFINITIONS: CanonicalFieldDefinition[] = [
  ...IDENTIFICATION_AND_SUPPLIER_FIELDS,
  ...MATERIAL_FIELDS,
  ...TRANSACTION_AND_SYSTEM_FIELDS
];

export const NON_TRANSACTION_SHEET_KEYWORDS: string[] = [
  'cover',
  'readme',
  'instruction',
  'metadata',
  'note',
  'notes',
  'lookup',
  'mapping',
  'dictionary',
  'summary',
  'dashboard',
  'pivot',
  'kpi',
  'index',
  'toc',
  'documentation'
];

export const CONFIDENCE_THRESHOLDS = {
  MIN_TRANSACTION_CONFIDENCE: 0.40,
  AUTO_SELECT_CLEAR_WINNER_DIFF: 0.25,
  DOMINANT_ROW_COUNT_RATIO: 5.0
};
