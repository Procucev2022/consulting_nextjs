import { beforeEach, describe, expect, it } from 'vitest';
import { taxonomyRecords } from '../fixtures/taxonomy';
import {
  lookupUNSPSCByDescription,
  lookupUNSPSCDetails,
  searchUNSPSCTaxonomy,
  unspscOfficialDictionary
} from '../../src/data/unspscTaxonomy';
import { UNCLASSIFIED_COMMODITY_CODE, UNCLASSIFIED_COMMODITY_TITLE } from '../../src/constants/taxonomy';

describe('D1-backed UNSPSC lookup helpers', () => {
  beforeEach(() => {
    unspscOfficialDictionary.splice(0, unspscOfficialDictionary.length, ...taxonomyRecords);
  });

  it('returns a D1 match and marks an unknown value as unclassified without inventing a commodity code', () => {
    expect(lookupUNSPSCDetails('14121506')).toMatchObject({
      commodityCode: '14121506',
      commodityTitle: 'Corrugated fiberboard or container board CCM'
    });
    expect(lookupUNSPSCDetails('unknown private code', 'Packaging Materials')).toMatchObject({
      commodityCode: UNCLASSIFIED_COMMODITY_CODE,
      commodityTitle: UNCLASSIFIED_COMMODITY_TITLE,
      classTitle: 'Packaging Materials',
      coreBucket: 'Packaging Materials'
    });
  });

  it('uses the neutral unclassified record when a query is absent or the D1 dictionary has no match', () => {
    expect(lookupUNSPSCDetails('')).toMatchObject({
      commodityCode: UNCLASSIFIED_COMMODITY_CODE,
      commodityTitle: UNCLASSIFIED_COMMODITY_TITLE
    });
    expect(lookupUNSPSCByDescription('')).toBeUndefined();
    expect(lookupUNSPSCByDescription('corrugated fiberboard')?.commodityCode).toBe('14121506');
    expect(lookupUNSPSCByDescription('not a dictionary term')).toMatchObject({
      commodityCode: UNCLASSIFIED_COMMODITY_CODE,
      commodityTitle: UNCLASSIFIED_COMMODITY_TITLE,
      classificationStatus: 'UNCLASSIFIED'
    });
  });

  it('searches all rows by default and applies category and text filters', () => {
    expect(searchUNSPSCTaxonomy('').length).toBeGreaterThan(0);
    expect(searchUNSPSCTaxonomy('corrugated', 'Packaging Materials').map((row) => row.commodityCode))
      .toContain('14121506');
    expect(searchUNSPSCTaxonomy('corrugated', 'Direct Materials')).toEqual([]);
  });
});
