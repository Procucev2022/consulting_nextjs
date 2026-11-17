/**
 * Validation record key ranges (Backend)
 *
 * Validation rows are keyed as REC-{dataVersionId}-ROW-{rowNumber}. A half-open range on that primary key lets
 * SQLite seek the key index for one data version. A LIKE prefix pattern cannot do that, because SQLite's LIKE
 * ignores case by default and therefore scans the table.
 */
import { D1_VALIDATION_RECORD_ID_PREFIX, D1_VALIDATION_RECORD_ROW_SEGMENT } from '../constants/d1';
import type { ValidationRecordKeyRange } from '../types/db';

/**
 * Returns the bounds that select every record key starting with the data version's row prefix.
 * The upper bound replaces the trailing '-' with '.', the next character in binary order. Every key with the
 * prefix sorts below it, and no key without the prefix falls between the two bounds.
 */
export const validationRecordKeyRange = (dataVersionId: string): ValidationRecordKeyRange => {
  const rowPrefix = `${D1_VALIDATION_RECORD_ID_PREFIX}${dataVersionId}${D1_VALIDATION_RECORD_ROW_SEGMENT}`;
  return {
    lowerBound: `${rowPrefix}-`,
    upperBound: `${rowPrefix}.`
  };
};
