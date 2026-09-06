import { describe, it, expect } from 'vitest';
import { searchTaxonomy, lookupTaxonomy, getAllTaxonomyRecords } from '../../src/services/taxonomyService';

describe('taxonomyService', () => {
  it('should search taxonomy with query', () => {
    const results = searchTaxonomy('boxwood');
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should search taxonomy with category filter', () => {
    const results = searchTaxonomy('', 'Packaging Materials');
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should lookup taxonomy by description or code', () => {
    const item = lookupTaxonomy('boxwood');
    expect(item).toBeDefined();
    expect(item?.commodityTitle).toBeDefined();
  });

  it('should return sample taxonomy records', () => {
    const records = getAllTaxonomyRecords(10);
    expect(records.length).toBe(10);
  });

  it('should use default limit of 100 if omitted', () => {
    const records = getAllTaxonomyRecords();
    expect(records.length).toBe(100);
  });
});
