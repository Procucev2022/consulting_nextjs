import { describe, it, expect } from 'vitest';
import {
  UNCLASSIFIED_COMMODITY_CODE,
  UNCLASSIFIED_COMMODITY_TITLE,
  UNCLASSIFIED_CLASS_CODE,
  UNCLASSIFIED_CLASS_TITLE,
  UNCLASSIFIED_FAMILY_CODE,
  UNCLASSIFIED_FAMILY_TITLE,
  UNCLASSIFIED_SEGMENT_CODE,
  UNCLASSIFIED_SEGMENT_TITLE,
  UNCLASSIFIED_COMMODITY_RECORD
} from '../../src/constants/taxonomy';

describe('UNSPSC Taxonomy Constants (Backend)', () => {
  it('should define unclassified commodity constants correctly', () => {
    expect(UNCLASSIFIED_COMMODITY_CODE).toBe('00000000');
    expect(UNCLASSIFIED_COMMODITY_TITLE).toBe('Unclassified Commodity');
    expect(UNCLASSIFIED_CLASS_CODE).toBe('00000000');
    expect(UNCLASSIFIED_CLASS_TITLE).toBe('Unclassified Class');
    expect(UNCLASSIFIED_FAMILY_CODE).toBe('00000000');
    expect(UNCLASSIFIED_FAMILY_TITLE).toBe('Unclassified Family');
    expect(UNCLASSIFIED_SEGMENT_CODE).toBe('00000000');
    expect(UNCLASSIFIED_SEGMENT_TITLE).toBe('Unclassified Segment');
  });

  it('should define an immutable UNCLASSIFIED_COMMODITY_RECORD with UNCLASSIFIED status', () => {
    expect(UNCLASSIFIED_COMMODITY_RECORD.commodityCode).toBe('00000000');
    expect(UNCLASSIFIED_COMMODITY_RECORD.commodityTitle).toBe('Unclassified Commodity');
    expect(UNCLASSIFIED_COMMODITY_RECORD.classCode).toBe('00000000');
    expect(UNCLASSIFIED_COMMODITY_RECORD.classTitle).toBe('Unclassified Class');
    expect(UNCLASSIFIED_COMMODITY_RECORD.familyCode).toBe('00000000');
    expect(UNCLASSIFIED_COMMODITY_RECORD.familyTitle).toBe('Unclassified Family');
    expect(UNCLASSIFIED_COMMODITY_RECORD.segmentCode).toBe('00000000');
    expect(UNCLASSIFIED_COMMODITY_RECORD.segmentTitle).toBe('Unclassified Segment');
    expect(UNCLASSIFIED_COMMODITY_RECORD.coreBucket).toBeUndefined();
    expect(UNCLASSIFIED_COMMODITY_RECORD.classificationStatus).toBe('UNCLASSIFIED');
    expect(Object.isFrozen(UNCLASSIFIED_COMMODITY_RECORD)).toBe(true);
  });
});
